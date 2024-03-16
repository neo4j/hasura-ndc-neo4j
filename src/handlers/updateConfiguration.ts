import { Configuration, ConfigurationSchema } from "..";
import { BASE_TYPES, assertTypeNameIsRestricted } from "../constants";
import {
  getNeo4jDriver,
  inferRelationshipFieldName,
  insertion,
  toPlural,
} from "../utilities";
import { toGenericStruct, toGraphQLTypeDefs } from "@neo4j/introspector";
import { Neo4jStruct } from "@neo4j/introspector/dist/types";
import Property from "@neo4j/introspector/dist/classes/Property";
// @ts-ignore
import { ObjectField, Type } from "@hasura/ndc-sdk-typescript";
import { Neo4jGraphQL } from "@neo4j/graphql";

/**
 * This is a fallback of the default mechanism of getting the data through the configuration object.
 * Assuming there will be an UI in Hasura for schema modelling, the configuration object should be used at all times.
 * For testing purposes, this function provides a DB introspection mechanism as a fallback, so that queries can be run against any data in the DB.
 *
 * @param {Configuration} configuration - A possibly empty configuration. If not empty, the same one should be returned.
 * @returns {Promise<Configuration>} - An updated configuration to reflect the data present in the DB
 */
export async function doUpdateConfiguration(
  configuration: Configuration
): Promise<Configuration> {
  // if (configuration.config) {
  //   // TODO: fix tests (they start with config but I removed logic to make schema from config)
  //   return configuration;
  // }

  const driver = getNeo4jDriver(configuration);
  const typeDefs = await toGraphQLTypeDefs(() => driver.session());
  console.log("typeDefs", typeDefs);
  const neo4jGQL = new Neo4jGraphQL({
    typeDefs,
    driver,
  });
  const neoSchema = await neo4jGQL.getSchema();
  configuration.typedefs = typeDefs;
  configuration.neoSchema = neoSchema;

  const genericStruct = await toGenericStruct(() => driver.session());
  console.log("genericStruct", genericStruct);
  const collectionNames = Object.values(genericStruct.nodes)
    .map((n) => n.labels[0])
    .map(toPlural);
  configuration.config = {
    collection_names: collectionNames,
    object_types: { ...BASE_TYPES },
    foreign_keys: {},
    uniqueness_constraints: {},
    object_fields: {},
    functions: [],
    procedures: [],
  };
  genericStructToHasuraConfig(genericStruct, configuration.config);

  for (const label of collectionNames) {
    // TODO: needed?
    if (assertTypeNameIsRestricted(label)) {
      throw new Error(`${label} is a restricted name!`);
    }
    /*
    const { records } = await driver.executeQuery(
      `MATCH (n: ${label}) RETURN n LIMIT 1`
    );

    if (records.length > 0) {
      const recordPayload = records[0].get("n")["properties"];

      const fieldDict = insertion(
        label,
        recordPayload,
        configuration.config.object_types
      );
      configuration.config.object_types[label] = {
        description: null,
        fields: fieldDict,
      };
      configuration.config.object_fields[label] = Object.keys(fieldDict);
    }
    */
  }

  return configuration;
}

type NodeInfo = {
  k: string;
  labels: string[];
  label: string;
  properties: Property[];
};

type RelationshipInfo = {
  fromType: NodeInfo;
  toType: NodeInfo;
  properties: Property[];
  type: string;
  fieldName: string;
};
function genericStructToHasuraConfig(
  genericStruct: Neo4jStruct,
  config: ConfigurationSchema
): void {
  const { nodes: introspectedNodes, relationships: introspectedRelationships } =
    genericStruct;
  const nodesMap = Object.entries(introspectedNodes).reduce<
    Record<string, NodeInfo>
  >((acc, [k, node]) => {
    acc[k] = {
      k,
      labels: node.labels,
      label: node.labels[0], // TODO??
      properties: node.properties,
    };
    return acc;
  }, {});
  for (const k in nodesMap) {
    const node = nodesMap[k];
    const nodeLabel = node.label;
    console.log("label", nodeLabel);
    const fields = propertiesToHasuraField(node.properties);
    console.log("fields", fields);
    // objTypes.set(nodeLabel, fields);
    // objFields.set(nodeLabel, Array.from(fields.keys()));
    config.object_types[nodeLabel] = {
      description: null,
      fields: Object.fromEntries(fields.entries()),
    };
    config.object_fields[nodeLabel] = Array.from(fields.keys());
  }

  const relationships = Object.entries(
    introspectedRelationships
  ).flatMap<RelationshipInfo>(([_, rel]) => {
    let relationshipsInBothDirection = rel.paths.flatMap<RelationshipInfo>(
      (p) => {
        const fromType = nodesMap[p.fromTypeId];
        const toType = nodesMap[p.toTypeId];
        return [
          {
            fromType,
            toType,
            properties: rel.properties,
            type: rel.type,
            fieldName: inferRelationshipFieldName(
              rel.type,
              fromType?.label as string,
              toType?.label as string,
              "OUT"
            ), // typenames can differ from what introspector generated in type defs
          },
          {
            fromType: toType,
            toType: fromType,
            properties: rel.properties,
            type: rel.type,
            fieldName: inferRelationshipFieldName(
              rel.type,
              fromType?.label as string,
              toType?.label as string,
              "IN"
            ), // typenames can differ from what introspector generated in type defs
          },
        ];
      }
    );
    return relationshipsInBothDirection;
  });
  for (const rel of relationships) {
    if (!rel.fromType || !rel.toType) {
      throw Error("could not find fromType toType");
    }

    // TODO: keys should be fields with Unique constraint if it exists
    const fromTypeKey = config.object_fields[rel.fromType.label][0];
    const toTypeKey = config.object_fields[rel.toType.label][0];

    config.foreign_keys[rel.fromType.label] = {
      ...config.foreign_keys[rel.fromType.label],
      [rel.fieldName]: {
        foreign_collection: toPlural(rel.toType.label),
        column_mapping: { [fromTypeKey]: toTypeKey },
      },
    };
  }
}

function propertiesToHasuraField(
  properties: Property[]
): Map<string, ObjectField> {
  const wrapNull = (x: Type): Type => ({
    type: "nullable",
    underlying_type: x,
  });
  const fields = new Map<string, ObjectField>();
  for (const property of properties) {
    let fieldType: Type | undefined;
    const propertyType = property.types[0];
    const renamedPropertyType = propertyType.includes("Long")
      ? propertyType.replace("Long", "Int")
      : propertyType;

    if (renamedPropertyType.endsWith("Array")) {
      fieldType = {
        type: "array",
        element_type: {
          type: "named",
          name: renamedPropertyType.split("Array")[0],
        },
      };
    } else {
      fieldType = {
        type: "named",
        name: renamedPropertyType,
      };
    }

    if (!property.mandatory) {
      fieldType = wrapNull(fieldType);
    }
    fields.set(property.name, {
      description: null,
      type: fieldType,
    });
  }
  return fields;
}
