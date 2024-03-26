import {
  QueryRequest,
  Field,
  Query,
  RowFieldValue,
  RowSet,
  // @ts-ignore
} from "@hasura/ndc-sdk-typescript";
import { asArray, lowerFirst } from "../utilities";

export function transformResult(
  query: Query | QueryRequest,
  result: Record<string, unknown> // {name: "Keanu", actedInMovie: {}},
): RowSet {
  const transformed: {
    [k: string]: RowFieldValue;
  } = {};
  if ("collection" in query) {
    const topLevelQueryResult = result[lowerFirst(query.collection)];
    return toRows(topLevelQueryResult, query);
  }
  if (!query.fields) {
    return {};
  }
  for (const fieldName in result) {
    const fieldDefinition = query.fields[fieldName];
    if (fieldDefinition.type === "column") {
      transformed[fieldName] = result[fieldName];
    }
    if (fieldDefinition.type === "relationship") {
      const innerQuery = query.fields[fieldName] as Field & { query: Query };
      transformed[fieldName] = toRows(result[fieldName], innerQuery);
    }
  }
  return transformed;
}

function toRows(
  resultAsObjectOrArray: any,
  engineQuery: QueryRequest | (Field & { query: Query })
): Record<string, unknown> {
  return {
    rows: asArray(resultAsObjectOrArray).map((result) =>
      transformResult(engineQuery.query, result)
    ),
  };
}
