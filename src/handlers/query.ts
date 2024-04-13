import { QueryRequest, BadRequest, RowSet } from "@hasura/ndc-sdk-typescript";
import { Configuration, State } from "..";
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
  configuration,
  variables,
}: {
  query: QueryRequest;
  state: State;
  configuration: Configuration;
  variables?: Record<string, unknown>;
}): Promise<RowSet> {
  console.log("got query", JSON.stringify(query, null, 2));
  if (!configuration.config) {
    throw new BadRequest("Config is not configured", {});
  }
  const queryPlan = await planQuery(query, configuration.config, variables);
  const neo4jResults = await performQuery({
    queryPlan,
    state,
    variables,
  });
  const resultingRows = transformResult(query, neo4jResults || {});
  console.log("resulting rows", resultingRows);
  return resultingRows;
  // return {
  //   rows: [{ name: "Keanu", __hasura_phantom_field__car: { rows: [] } }],
  // };
}
