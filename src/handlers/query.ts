import { QueryRequest, RowSet } from "@hasura/ndc-sdk-typescript";
import { ConfigurationSchema, State } from "..";
import { planQuery } from "../query/plan";
import { performQuery } from "../query/perform";
import { transformResult } from "../query/transform-results";

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
  config,
  variables,
}: {
  query: QueryRequest;
  state: State;
  config: ConfigurationSchema;
  variables?: Record<string, unknown>;
}): Promise<RowSet> {
  const queryPlan = await planQuery(query, config, variables);
  const neo4jResults = await performQuery({
    queryPlan,
    state,
    variables,
  });
  const resultingRows = transformResult(query, neo4jResults || {});
  return resultingRows;
  // return {
  //   rows: [{ name: "Keanu", __hasura_phantom_field__car: { rows: [] } }],
  // };
}
