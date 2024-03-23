import {
  QueryRequest,
  Expression,
  QueryResponse,
  ComparisonTarget,
  BadRequest,
  Field,
  OrderBy,
  Query,
  BinaryComparisonOperator,
  ComparisonValue,
  PathElement,
  // @ts-ignore
} from "@hasura/ndc-sdk-typescript";
import { Configuration, ConfigurationSchema, State } from "..";
import { graphql, GraphQLSchema } from "graphql";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { asArray, lowerFirst } from "../utilities";

export type QueryPlan = {
  collectionName: string;
  simpleQuery: string;
};

/**
 * Generates the GQL query to be forwarded to the library for execution.
 *
 * This function checks various conditions in the query and throws an Error if the library does not support the query in the request.
 *
 * @async
 * @param {QueryRequest} query - The main query request that specifies what data needs to be fetched.
 * @param {ConfigurationSchema} config
 * @returns {Promise<QueryPlan>} - A promise that resolves to a query plan. The plan contains the raw GQL query to be forwarded to the library.
 * @throws {Error} Various errors can be thrown if the provided query does not match the expected criteria such as if the collection is not found, if querying with relationships is attempted, if fields are null or not part of the collection, if the library does not support the query in the request.
 */
export async function planQuery(
  query: QueryRequest,
  config: ConfigurationSchema
): Promise<QueryPlan> {
  console.log("query to plan:", JSON.stringify(query, null, 2));

  const simpleQuery = `
    query { ${makeQuery(
      query.query,
      query.collection,
      lowerFirst(query.collection),
      config,
      query
    )} }
  `;

  console.log("QUERY IS", simpleQuery);

  return {
    collectionName: query.collection,
    simpleQuery,
  };
}

function makeQuery(
  query: Query,
  collectionName: string,
  fieldThatQueryIsAttachedTo: string,
  config: ConfigurationSchema,
  initialQuery: QueryRequest
): string {
  // Assert that the collection is registered in the schema
  if (!config.collection_names.includes(collectionName)) {
    throw new BadRequest(`Collection ${collectionName} not found in schema!`, {
      collectionNames: config.collection_names,
    });
  }

  // TODO: support aggregations (tests are commented-out)
  const { limit, offset, where: predicate, order_by: orderBy, fields } = query;

  const individualCollectionName: string = collectionName.slice(0, -1);
  if (!fields) {
    throw new BadRequest("Fields must be requested", { query });
  }
  Object.keys(fields).forEach((field) => {
    if (
      !config.object_fields[individualCollectionName].includes(field) &&
      !Object.keys(config.foreign_keys[individualCollectionName]).includes(
        field
      )
    ) {
      throw new BadRequest("Requested field not in schema!", {
        field,
        collectionName: individualCollectionName,
      });
    }
  });

  const requestedFields = Object.entries(fields).map<string>(
    ([fieldName, f]: [string, Field]) => {
      if (f.type === "column") {
        return fieldName;
      }
      if (f.type === "relationship") {
        const relationshipMapping = Object.entries(
          initialQuery.collection_relationships
        ).find(([k, _]) => {
          const parsedKey = JSON.parse(k); // eg. [ { subgraph: 'default', name: 'Actor' }, 'actedInMovies' ]
          if (parsedKey[1] === fieldName) {
            return true;
          }
          return false;
        });
        if (!relationshipMapping) {
          throw BadRequest(
            "Attempting to resolve relationship field without relationship in collection",
            { fieldName }
          );
        }
        const targetCollection = (
          relationshipMapping[1] as { target_collection: string }
        ).target_collection;
        return makeQuery(
          f.query,
          targetCollection,
          fieldName,
          config,
          initialQuery
        );
      }
      return "";
    }
  );

  // TODO:
  // the following code throws on behavior that is not supported by the library
  // filter instead of throw to make tests PASS depending on what we want
  orderBy?.elements.forEach((element: any) => {
    if (element.target.type !== "column") {
      throw new BadRequest("Sorting is only supported on own fields!", {
        target: element.target,
      });
    }
    const fieldName = element.target.name;
    const fieldType =
      config.object_types[individualCollectionName].fields[fieldName].type;
    const isArrayField =
      fieldType?.type === "array" ||
      (fieldType?.type === "nullable" &&
        fieldType.underlying_type.type === "array");

    if (isArrayField) {
      throw new BadRequest("Sorting is not supported on array fields!", {
        target: element.target,
      });
    }
  });

  return composeGQLQuery(fieldThatQueryIsAttachedTo, requestedFields, {
    limit,
    offset,
    predicate,
    orderBy,
  });
}

function composeGQLQuery(
  fieldThatQueryIsAttachedTo: string,
  requestedFields: string[],
  args: {
    limit?: number | null;
    offset?: number | null;
    predicate?: Expression | null;
    orderBy?: OrderBy | null;
  }
): string {
  const limitStr = args.limit ? `limit: ${args.limit},` : "";
  const offsetStr = args.offset ? `offset: ${args.offset},` : "";
  const sort = args.orderBy && orderByToSort(args.orderBy);
  const sortStr = sort ? `sort: ${sort}` : "";
  const optionsArg =
    args.limit || args.offset
      ? `options: { ${limitStr} ${offsetStr} ${sortStr} }`
      : "";
  const whereStr = args.predicate && predicateToWhereFilter(args.predicate);
  console.log("whereStr", whereStr);
  const whereArg = `where: { ${whereStr} }`;
  const queryArgs =
    whereStr || optionsArg ? `(${[whereArg, optionsArg].join(", ")})` : "";
  //   TODO: make queryArgs fn + transform predicateToWhereFilter fn

  return `
    ${fieldThatQueryIsAttachedTo}${queryArgs} {
      ${requestedFields.join("\n")}
    }
`;
}

function predicateToWhereFilter(predicateExpression: Expression): string {
  console.log("predicate", predicateExpression);
  switch (predicateExpression.type) {
    case "and":
    case "or": {
      const innerPredicates = predicateExpression.expressions.map(
        predicateToWhereFilter
      );
      return `${predicateExpression.type.toUpperCase()}: [${innerPredicates.map(
        (p: string) => `{${p}}`
      )}]`;
    }
    case "not": {
      const innerPredicate = predicateToWhereFilter(
        predicateExpression.expression
      );
      return `NOT: {${innerPredicate}}`;
    }
    case "unary_comparison_operator": {
      if (predicateExpression.operator !== "is_null") {
        throw new Error("unary_comparison_operator not supported yet");
      }
      const target = resolveComparisonTarget(predicateExpression.column);
      if (!target) {
        // err
        return "";
      }
      const [fieldNamePrefix, suffix] = target;
      return `${fieldNamePrefix}: null${suffix}`;
    }
    case "binary_comparison_operator": {
      // column: ComparisonTarget;
      // operator: BinaryComparisonOperator;
      // value: ComparisonValue;

      const target = resolveComparisonTarget(predicateExpression.column);
      if (!target) {
        // err
        return "";
      }
      const [fieldNamePrefix, suffix] = target;
      const operator = resolveBinaryComparisonOperator(
        predicateExpression.operator
      );
      const value = resolveComparisonValue(predicateExpression.value);
      return `${fieldNamePrefix}${operator}: ${value}${suffix}`;
    }
    case "binary_array_comparison_operator": {
      // column: ComparisonTarget;
      // operator: BinaryArrayComparisonOperator;
      // values: ComparisonValue[];
      if (predicateExpression.operator !== "in") {
        throw new Error("binary_array_comparison_operator not supported yet");
      }
      const target = resolveComparisonTarget(predicateExpression.column);
      if (!target) {
        // err
        return "";
      }
      const values = predicateExpression.values.map(resolveComparisonValue);
      const [fieldNamePrefix, suffix] = target;
      return `${fieldNamePrefix}_IN: ${values}${suffix}`;
    }
    case "exists":
      // in_collection: ExistsInCollection;
      // where: Expression;
      break;
  }
  return "";
}

// TODO
function resolveComparisonValue(comparisonValue: ComparisonValue) {
  switch (comparisonValue.type) {
    case "column":
      //   column: ComparisonTarget;
      return resolveComparisonTarget(comparisonValue.column)?.[0]; // can this have path? (reference a relationship)
    case "scalar":
      // value: unknown;
      console.log("scalar?", typeof comparisonValue.value);
      if (typeof comparisonValue.value === "string") {
        return `"${comparisonValue.value}"`;
      }
      return comparisonValue.value;
    case "variable":
      // name: string;
      return `$${comparisonValue.name}`; // ????
  }
}

function resolveBinaryComparisonOperator(operator: BinaryComparisonOperator) {
  switch (operator.type) {
    case "equal":
      return "";
    case "other":
      // name: string;
      return `_${operator.name.toUpperCase()}`;
  }
}

// TODO
function resolveComparisonTarget(
  column: ComparisonTarget
): [string, string] | undefined {
  switch (column.type) {
    case "column":
      /**
       * The name of the column
       */
      // name: string;
      /**
       * Any relationships to traverse to reach this column
       */
      // path: PathElement[];
      console.log("path??", column.name, column.path);
      if (column.path.length) {
        return blabal([
          ...column.path.map((p: PathElement) => JSON.parse(p.relationship)[1]),
          column.name,
        ]);
      }
      return [column.name, ""];
    case "root_collection_column":
      // name: string;
      return [column.name, ""];
  }
}

function blabal(layers: string[], suffix: string = ""): [string, string] {
  console.log("> layers:", layers, suffix);
  if (layers.length === 1) {
    return [layers[0], suffix];
  }
  const layer = layers.shift();
  suffix += "}";
  const [nested, s] = blabal(layers, suffix);
  return [`${layer}: {${nested}`, s];
}

function orderByToSort(orderBy: OrderBy | null): string | undefined {
  const sortEntries = orderBy?.elements.map((element: any) => {
    const dir = element.order_direction;
    if (element.target.type !== "column") {
      // skip field as it's not supported
      return "";
    }
    const field = element.target.name;
    return `{${field}: ${dir.toUpperCase()}}`;
  });
  if (!sortEntries?.length) {
    return;
  }
  return `[${sortEntries.join(", ")}]`;
}

/**
 * Executes the planned query (the Cypher query that the library query generated) against the Neo4j DB and returns the resulting rows.
 *
 * @async
 * @param {QueryPlan} queryPlan - The (Cypher) query plan
 * @param {State} state - The connector state which contains the neo4j driver instance and the Neo4jGraphQL Schema
 * @param {Configuration} configuration - The configuration object which contains the collection config and the typeDefs for the Neo4jGraphQL Schema in case it is not present in the state.
 * @returns {Promise<RowSet[]>} - A promise that resolves to an array of row sets. Each row set contains
 *                                the rows of data retrieved from the query
 * @throws {Error} If the typeDefinitions have not been constructed or there was any error when executing against the DB.
 */
async function performQuery(
  queryPlan: QueryPlan,
  state: State,
  configuration: Configuration
): Promise<Record<string, any> | undefined | null> {
  if (configuration.neoSchema) {
    return executeQuery(configuration.neoSchema, queryPlan, state);
  }
  const typeDefs = configuration.typedefs;
  if (!typeDefs) {
    throw new BadRequest("Typedefs not defined.", {});
  }
  try {
    const neo4jGQL = new Neo4jGraphQL({
      typeDefs,
      driver: state.neo4j_driver,
    });
    const neoSchema = await neo4jGQL.getSchema();
    return executeQuery(neoSchema, queryPlan, state);
  } catch (err) {
    throw new BadRequest("Code errors when executing query", {
      err,
      query: queryPlan.simpleQuery,
    });
  }
}

async function executeQuery(
  neoSchema: GraphQLSchema,
  queryPlan: QueryPlan,
  state: State
): Promise<Record<string, any> | undefined | null> {
  const result = await graphql({
    schema: neoSchema,
    source: queryPlan.simpleQuery,
    contextValue: { executionContext: state.neo4j_driver },
    // TODO: variables
    // variableValues: { b1, b2 },
  });
  if (result.errors) {
    throw new BadRequest("Errors when executing query ", {
      err: result.errors,
      query: queryPlan.simpleQuery,
    });
  }
  return result.data;
}

/**
 * Forwards the query to the library, executes the generated Cypher and retrieves the corresponding response.
 *
 * @async
 * @param {QueryRequest} query - The query request object to process.
 * @param {State} state - The connector state which contains the neo4j driver instance and the Neo4jGraphQL Schema
 * @param {Configuration} configuration - The configuration object which contains the collection config and the typeDefs for the Neo4jGraphQL Schema in case it is not present in the state.
 * @returns {Promise<QueryResponse>} - A promise resolving to the query response.
 */
export async function doQuery(
  query: QueryRequest,
  state: State,
  configuration: Configuration
): Promise<QueryResponse> {
  console.log("got query", JSON.stringify(query, null, 2));
  if (!configuration.config) {
    throw new BadRequest("Config is not configured", {});
  }
  const queryPlan = await planQuery(query, configuration.config);
  const neo4jResults = await performQuery(queryPlan, state, configuration);
  const resultingRows = transformResult(query, neo4jResults || {});
  return [resultingRows];
}

function transformResult(
  query: Query,
  result: Record<string, any> // {name: "Keanu", actedInMovie: {}},
): Record<string, any> {
  const transformed: Record<string, any> = {};
  if ("collection" in query) {
    const topLevelQueryResult = result[lowerFirst(query.collection)];
    return toRows(topLevelQueryResult, query);
  }
  for (const fieldName in result) {
    const fieldDefinition = query.fields[fieldName];
    if (fieldDefinition.type === "column") {
      transformed[fieldName] = result[fieldName];
    }
    if (fieldDefinition.type === "relationship") {
      const innerQuery = query.fields[fieldName];
      transformed[fieldName] = toRows(result[fieldName], innerQuery);
    }
  }
  return transformed;
}

function toRows(resultAsObjectOrArray: any, engineQuery: Query) {
  return {
    rows: asArray(resultAsObjectOrArray).map((result) =>
      transformResult(engineQuery.query, result)
    ),
  };
}
