import { ExplainResponse, QueryRequest } from "@hasura/ndc-sdk-typescript";
import { ConfigurationSchema } from "..";
import { QueryPlan, planQuery } from "../query/plan";

export async function doExplain(
  query: QueryRequest,
  config: ConfigurationSchema
): Promise<ExplainResponse> {
  try {
    let queryPlan: QueryPlan = await planQuery(query, config);
    return {
      details: {
        queryRequest: JSON.stringify(query),
        queryPlan: queryPlan.neo4jGraphQLQuery,
      },
    };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return {
      details: {
        queryRequest: JSON.stringify(query),
        queryPlan: `Query failed to plan with message: ${errorMessage}`,
      },
    };
  }
}
