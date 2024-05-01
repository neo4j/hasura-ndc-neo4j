import { Configuration, ConfigurationSchema } from "../";
import { BASE_TYPES, assertTypeNameIsRestricted } from "../constants";
import { inferRelationshipFieldName, toPlural } from "../utilities";
import { toGenericStruct, toGraphQLTypeDefs } from "@neo4j/introspector";
import { Neo4jStruct } from "@neo4j/introspector/dist/types";
import Property from "@neo4j/introspector/dist/classes/Property";
import { ObjectField, Type } from "@hasura/ndc-sdk-typescript";
import { Neo4j } from "../neo4j";

/**
 * Utility to be called at connector set-up to generate the Configuration that will be used while the connector is running.
 * Will be called to create the configuration file whenever the connector code is updated. (see entrypoint.sh)
 * Will be called from the CLI for local development to create the configuration file.
 *
 * @param {Configuration} configuration - Previous configuration
 * @returns {Promise<Configuration>} - An updated configuration to reflect the data present in the DB
 */
export async function doUpdateConfiguration(
  configuration: Configuration
): Promise<Configuration> {
  const driver = Neo4j.getInstance().getDriver();
  const typeDefs = await toGraphQLTypeDefs(() => driver.session());
  configuration.typeDefs = typeDefs;

  // TODO: result of toGenericStruct may differ from what toGraphQLTypeDefs used to generate the typedefs string
  // ideally change the introspector to return typedefs and also the struct it used to generate them
  const genericStruct = await toGenericStruct(() => driver.session());

  const collectionNames = Object.values(genericStruct.nodes)
    .map((n) => n.labels[0])
    .map(toPlural);

  for (const label of collectionNames) {
    if (assertTypeNameIsRestricted(label)) {
      throw new Error(`${label} is a restricted name!`);
    }
  }

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

  return configuration;
}

type NodeInfo = {
  k: string;
  labels: string[];
  mainLabel: string;
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
      mainLabel: node.labels[0], // TODO: Assumption - generated query (the collection) will be named using the first label only
      properties: node.properties,
    };
    return acc;
  }, {});
  for (const k in nodesMap) {
    const node = nodesMap[k];
    const nodeMainLabel = node.mainLabel;
    const fields = propertiesToHasuraField(node.properties);
    config.object_types[nodeMainLabel] = {
      description: null,
      fields: Object.fromEntries(fields.entries()),
    };
    config.object_fields[nodeMainLabel] = Array.from(fields.keys());
  }

  const relationships = Object.entries(
    introspectedRelationships
  ).flatMap<RelationshipInfo>(([_, rel]) => {
    // TODO: Assumption - all relationships are traversable from both directions
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
              fromType?.mainLabel as string,
              toType?.mainLabel as string,
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
              fromType?.mainLabel as string,
              toType?.mainLabel as string,
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
    const fromTypeKey = config.object_fields[rel.fromType.mainLabel][0];
    const toTypeKey = config.object_fields[rel.toType.mainLabel][0];

    config.foreign_keys[rel.fromType.mainLabel] = {
      ...config.foreign_keys[rel.fromType.mainLabel],
      [rel.fieldName]: {
        foreign_collection: toPlural(rel.toType.mainLabel),
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
    // TODO: Assumption - takes only first item
    const propertyType = property.types[0];
    // TODO: Assumption - all Longs are Ints
    const renamedPropertyType = propertyType.includes("Long")
      ? propertyType.replace("Long", "Int")
      : propertyType;

    // TODO: Assumption - introspector generates properties with types ending in Array for arrays
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
