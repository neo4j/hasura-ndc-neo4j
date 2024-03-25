import {
  QueryRequest,
  Expression,
  QueryResponse,
  ComparisonTarget,
  BadRequest,
  Field,
  OrderBy,
  OrderByElement,
  Query,
  BinaryComparisonOperator,
  ComparisonValue,
  PathElement,
  // @ts-ignore
} from "@hasura/ndc-sdk-typescript";
import { Configuration, ConfigurationSchema, State } from "..";
import { graphql, GraphQLSchema } from "graphql";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { asArray, lowerFirst, mapToGQLString } from "../utilities";

export type QueryPlan = {
  collectionName: string;
  neo4jGraphQLQuery: string;
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

  const neo4jGraphQLQuery = `
    query { 
      ${makeGQLQuery({
        query: query.query,
        collectionName: query.collection,
        fieldThatQueryIsAttachedTo: lowerFirst(query.collection),
        config,
        initialQuery: query,
      })} 
    }
  `;

  console.log("QUERY IS", neo4jGraphQLQuery);

  return {
    collectionName: query.collection,
    neo4jGraphQLQuery,
  };
}

// TODO
function makeGQLQuery({
  query,
  collectionName,
  fieldThatQueryIsAttachedTo,
  config,
  initialQuery,
}: {
  query: Query;
  collectionName: string;
  fieldThatQueryIsAttachedTo: string;
  config: ConfigurationSchema;
  initialQuery: QueryRequest;
}): string {
  // Assert that the collection is registered in the schema
  if (!config.collection_names.includes(collectionName)) {
    throw new BadRequest(`Collection ${collectionName} not found in schema!`, {
      collectionNames: config.collection_names,
    });
  }

  // TODO: support aggregations (tests are commented-out)
  const { limit, offset, where, order_by: orderBy, fields } = query;

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
        return makeGQLQuery({
          query: f.query,
          collectionName: targetCollection,
          fieldThatQueryIsAttachedTo: fieldName,
          config,
          initialQuery,
        });
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

  return composeQLQueryLevel(fieldThatQueryIsAttachedTo, requestedFields, {
    limit,
    offset,
    where,
    orderBy,
  });
}

function composeQLQueryLevel(
  fieldThatQueryIsAttachedTo: string,
  requestedFields: string[],
  args: {
    limit?: number | null;
    offset?: number | null;
    where?: Expression | null;
    orderBy?: OrderBy | null;
  }
): string {
  const filtersStr =
    args.where &&
    `where: ${mapToGQLString(predicateToWhereFilter(args.where))}`;

  const hasSortOption = args.orderBy && args.orderBy.elements.length;
  const options = {
    ...(args.limit && { limit: args.limit }),
    ...(args.offset && { offset: args.offset }),
    ...(hasSortOption && { sort: orderByToSort(args.orderBy) }),
  };
  const optionsStr =
    Object.entries(options).length && `options: ${mapToGQLString(options)}`;

  const queryArgs = [filtersStr, optionsStr].filter((x) => Boolean(x));
  const queryArgsStr = queryArgs.length ? `(${queryArgs.join(", ")})` : "";

  return `
    ${fieldThatQueryIsAttachedTo}${queryArgsStr} {
        ${requestedFields.join("\n")}
      }
  `;
}

function predicateToWhereFilter(
  predicateExpression: Expression
): Record<string, any> {
  switch (predicateExpression.type) {
    case "and":
    case "or": {
      const innerPredicates = predicateExpression.expressions.map(
        predicateToWhereFilter
      );
      return {
        [predicateExpression.type.toUpperCase()]: innerPredicates,
      };
    }
    case "not": {
      const innerPredicate = predicateToWhereFilter(
        predicateExpression.expression
      );
      return { NOT: innerPredicate };
    }
    case "unary_comparison_operator": {
      if (predicateExpression.operator !== "is_null") {
        throw new Error("Operator is not supported");
      }
      const makeFilter = withResolvedTarget(predicateExpression.column);
      return makeFilter("null", "");
    }
    case "binary_comparison_operator": {
      const makeFilter = withResolvedTarget(predicateExpression.column);
      const operator = resolveBinaryComparisonOperator(
        predicateExpression.operator
      );
      const value = resolveComparisonValue(predicateExpression.value);
      return makeFilter(value, operator);
    }
    case "binary_array_comparison_operator": {
      if (predicateExpression.operator !== "in") {
        throw new Error("Operator is not supported");
      }
      const makeFilter = withResolvedTarget(predicateExpression.column);
      const values = predicateExpression.values.map(resolveComparisonValue);
      return makeFilter(values, "in");
    }
    case "exists":
      // in_collection: ExistsInCollection;
      // where: Expression;
      // TODO: implement
      throw Error("Exists operator is not supported");
    default:
      throw Error("Operator is not supported");
  }
}

function resolveComparisonValue(comparisonValue: ComparisonValue) {
  switch (comparisonValue.type) {
    case "column":
      throw new Error("Comparing against columns is not supported");
    case "scalar":
      if (typeof comparisonValue.value === "string") {
        return `"${comparisonValue.value}"`;
      }
      return comparisonValue.value;
    case "variable":
      return comparisonValue.name;
  }
}

function resolveBinaryComparisonOperator(operator: BinaryComparisonOperator) {
  switch (operator.type) {
    case "equal":
      return "";
    case "other":
      return `_${operator.name.toUpperCase()}`;
    default:
      throw Error("Operator not supported");
  }
}

// TODO
function withResolvedTarget(
  column: ComparisonTarget
): (value: unknown, operation: string) => Record<string, any> {
  switch (column.type) {
    case "column": {
      return function createComparison(value: unknown, operator: string) {
        return resolveTarget(
          [
            ...(column.path || []).map(
              (p: PathElement) => JSON.parse(p.relationship)[1]
            ),
            column.name,
          ],
          value,
          operator
        );
      };
    }
    // case "root_collection_column":
    //   TODO
    //   return function createComparison(value: unknown, operator: string) {
    //     return resolveTarget([column.name], value, operator);
    //   };
    default:
      throw new Error("Invalid comparison target");
  }
}

function resolveTarget(
  pathToTarget: string[],
  value: any,
  operator: string
): Record<string, any> {
  if (pathToTarget.length === 1) {
    return { [`${pathToTarget[0]}${operator}`]: value };
  }
  const [current, ...restOfPath] = pathToTarget;
  return { [current]: resolveTarget(restOfPath, value, operator) };
}

function orderByToSort(orderBy: OrderBy): Record<string, string>[] {
  const sortEntries = orderBy.elements.map((element: OrderByElement) => {
    switch (element.target.type) {
      case "column": {
        if (element.target.path.length) {
          throw Error("Order by relationships not supported");
        }
        const field = element.target.name;
        return { [field]: element.order_direction.toUpperCase() };
      }
      // TODO: Aggregates
      case "single_column_aggregate":
      case "star_count_aggregate":
        throw Error("Order by aggregates not supported");
    }
  });
  return sortEntries;
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
async function performQuery({
  queryPlan,
  state,
  configuration,
  variables,
}: {
  queryPlan: QueryPlan;
  state: State;
  configuration: Configuration;
  variables?: Record<string, unknown>;
}): Promise<Record<string, any> | undefined | null> {
  if (configuration.neoSchema) {
    return executeQuery({
      neoSchema: configuration.neoSchema,
      queryPlan,
      state,
      variables,
    });
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
    return executeQuery({ neoSchema, queryPlan, state, variables });
  } catch (err) {
    throw new BadRequest("Code errors when executing query", {
      err,
      query: queryPlan.neo4jGraphQLQuery,
    });
  }
}

async function executeQuery({
  neoSchema,
  queryPlan,
  state,
  variables,
}: {
  neoSchema: GraphQLSchema;
  queryPlan: QueryPlan;
  state: State;
  variables?: Record<string, unknown>;
}): Promise<Record<string, any> | undefined | null> {
  const result = await graphql({
    schema: neoSchema,
    source: queryPlan.neo4jGraphQLQuery,
    contextValue: { executionContext: state.neo4j_driver },
    variableValues: variables,
  });
  if (result.errors) {
    throw new BadRequest("Errors when executing query ", {
      err: result.errors,
      query: queryPlan.neo4jGraphQLQuery,
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
export async function doQuery({
  query,
  state,
  configuration,
  variables,
}: {
  query: QueryRequest;
  state: State;
  configuration: Configuration;
  variables?: Record<string, unknown>;
}): Promise<QueryResponse> {
  console.log("got query", JSON.stringify(query, null, 2));
  if (!configuration.config) {
    throw new BadRequest("Config is not configured", {});
  }
  const queryPlan = await planQuery(query, configuration.config);
  const neo4jResults = await performQuery({
    queryPlan,
    state,
    configuration,
    variables,
  });
  const resultingRows = transformResult(query, neo4jResults || {});
  return resultingRows;
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
