import { BadRequest } from "@hasura/ndc-sdk-typescript";
import { Configuration, State } from "..";
import { graphql, GraphQLSchema } from "graphql";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { QueryPlan } from "../query/plan";

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
export async function performQuery({
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
