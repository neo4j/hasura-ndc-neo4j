import {
  QueryRequest,
  Expression,
  QueryResponse,
  RowSet,
  BadRequest,
  Field,
  OrderBy,
  Query,
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
  const { limit, offset, predicate, order_by: orderBy, fields } = query;

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
  const queryArgs =
    args.limit || args.offset
      ? `(options: { ${limitStr} ${offsetStr} ${sortStr} })`
      : "";
  //   TODO: make queryArgs fn + transform predicateToWhereFilter fn
  return `
    ${fieldThatQueryIsAttachedTo}${queryArgs} {
      ${requestedFields.join("\n")}
    }
`;
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
