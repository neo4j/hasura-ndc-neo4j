import {
  BadRequest,
  ExplainResponse,
  QueryRequest,
} from "@hasura/ndc-sdk-typescript";
import { Configuration } from "..";
import { QueryPlan, planQuery } from "./query";

export async function doExplain(
  query: QueryRequest,
  configuration: Configuration
): Promise<ExplainResponse> {
  try {
    if (!configuration.config) {
      throw new BadRequest("Config is not configured", {});
    }
    let queryPlan: QueryPlan = await planQuery(query, configuration.config);
    return {
      details: {
        queryRequest: JSON.stringify(query),
        queryPlan: queryPlan.simpleQuery,
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
