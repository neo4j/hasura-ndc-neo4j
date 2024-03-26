// @ts-ignore
import { SchemaResponse, CollectionInfo } from "@hasura/ndc-sdk-typescript";
import { ConfigurationSchema } from "..";
import { SCALAR_TYPES } from "../constants";
import { toPlural } from "../utilities";

export function doGetSchema(config: ConfigurationSchema): SchemaResponse {
  let collectionInfos: CollectionInfo[] = [];
  for (const collectionName of Object.keys(config.object_types)) {
    console.log("collectionName", collectionName);
    if (config.collection_names.includes(toPlural(collectionName))) {
      collectionInfos.push({
        name: toPlural(collectionName),
        description: null,
        arguments: {},
        type: collectionName,
        uniqueness_constraints:
          config.uniqueness_constraints[collectionName] || {},
        foreign_keys: config.foreign_keys[collectionName] || {},
      });
    }
  }
  console.log("collectionInfos", JSON.stringify(collectionInfos, null, 2));
  const schemaResponse: SchemaResponse = {
    scalar_types: SCALAR_TYPES,
    functions: config.functions,
    procedures: config.procedures,
    object_types: config.object_types,
    collections: collectionInfos,
  };
  return schemaResponse;
}
