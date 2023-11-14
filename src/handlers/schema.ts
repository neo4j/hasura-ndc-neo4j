import { SchemaResponse, CollectionInfo } from "@hasura/ndc-sdk-typescript";
import { ConfigurationSchema } from "..";
import { SCALAR_TYPES } from "../constants";
import { toPlural } from "../utilities";

export function doGetSchema(config: ConfigurationSchema): SchemaResponse {
  let collectionInfos: CollectionInfo[] = [];
  for (const collectionName of Object.keys(config.object_types)) {
    if (config.collection_names.includes(toPlural(collectionName))) {
      collectionInfos.push({
        name: toPlural(collectionName),
        description: null,
        arguments: {},
        type: collectionName,
        deletable: false,
        uniqueness_constraints: {
          // TODO:
          // [`${cn.charAt(0).toUpperCase() + cn.slice(1)}ByID`]: {
          //     unique_columns: ["id"]
          // }
        },
        foreign_keys: {},
      });
    }
  }
  const schemaResponse: SchemaResponse = {
    scalar_types: SCALAR_TYPES,
    functions: config.functions,
    procedures: config.procedures,
    object_types: config.object_types,
    collections: collectionInfos,
  };
  return schemaResponse;
}
