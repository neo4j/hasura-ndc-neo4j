import {
  CapabilitiesResponse,
  ScalarType,
  ObjectType,
  // @ts-ignore
} from "@hasura/ndc-sdk-typescript";
import { JSONSchemaObject } from "@json-schema-tools/meta-schema";

export const CAPABILITIES_RESPONSE: CapabilitiesResponse = {
  versions: "^0.1.0",
  capabilities: {
    query: {
      aggregates: {},
      variables: {},
    },
    explain: {},
    relationships: { relation_comparisons: {}, order_by_aggregate: {} },
  },
};

export const SCALAR_TYPES: { [key: string]: ScalarType } = {
  Int: {
    aggregate_functions: {},
    comparison_operators: {
      not: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Int",
        },
      },
      gt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Int",
        },
      },
      lt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Int",
        },
      },
      gte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Int",
        },
      },
      lte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Int",
        },
      },
    },
  },
  Float: {
    aggregate_functions: {},
    comparison_operators: {
      not: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Float",
        },
      },
      gt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Float",
        },
      },
      lt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Float",
        },
      },
      gte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Float",
        },
      },
      lte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Float",
        },
      },
    },
  },
  Boolean: {
    aggregate_functions: {},
    comparison_operators: {
      not: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Boolean",
        },
      },
    },
  },
  String: {
    aggregate_functions: {},
    comparison_operators: {
      not: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "String",
        },
      },
      contains: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "String",
        },
      },
      starts_with: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "String",
        },
      },
      ends_with: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "String",
        },
      },
      not_contains: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "String",
        },
      },
      not_starts_with: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "String",
        },
      },
      not_ends_with: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "String",
        },
      },
    },
  },
  ID: {
    aggregate_functions: {},
    comparison_operators: {
      not: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "ID",
        },
      },
      contains: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "ID",
        },
      },
      starts_with: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "ID",
        },
      },
      ends_with: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "ID",
        },
      },
      not_contains: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "ID",
        },
      },
      not_starts_with: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "ID",
        },
      },
      not_ends_with: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "ID",
        },
      },
    },
  },
  DateTime: {
    aggregate_functions: {},
    comparison_operators: {
      not: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "DateTime",
        },
      },
      gt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "DateTime",
        },
      },
      lt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "DateTime",
        },
      },
      gte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "DateTime",
        },
      },
      lte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "DateTime",
        },
      },
    },
  },
  Date: {
    aggregate_functions: {},
    comparison_operators: {
      not: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Date",
        },
      },
      gt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Date",
        },
      },
      lt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Date",
        },
      },
      gte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Date",
        },
      },
      lte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Date",
        },
      },
    },
  },
  Duration: {
    aggregate_functions: {},
    comparison_operators: {
      not: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Duration",
        },
      },
      gt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Duration",
        },
      },
      lt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Duration",
        },
      },
      gte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Duration",
        },
      },
      lte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Duration",
        },
      },
    },
  },
  LocalDateTime: {
    aggregate_functions: {},
    comparison_operators: {
      not: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "LocalDateTime",
        },
      },
      gt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "LocalDateTime",
        },
      },
      lt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "LocalDateTime",
        },
      },
      gte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "LocalDateTime",
        },
      },
      lte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "LocalDateTime",
        },
      },
    },
  },
  LocalTime: {
    aggregate_functions: {},
    comparison_operators: {
      not: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "LocalTime",
        },
      },
      gt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "LocalTime",
        },
      },
      lt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "LocalTime",
        },
      },
      gte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "LocalTime",
        },
      },
      lte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "LocalTime",
        },
      },
    },
  },
  Time: {
    aggregate_functions: {},
    comparison_operators: {
      not: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Time",
        },
      },
      gt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Time",
        },
      },
      lt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Time",
        },
      },
      gte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Time",
        },
      },
      lte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "Time",
        },
      },
    },
  },
  BigInt: {
    aggregate_functions: {},
    comparison_operators: {
      not: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "BigInt",
        },
      },
      gt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "BigInt",
        },
      },
      lt: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "BigInt",
        },
      },
      gte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "BigInt",
        },
      },
      lte: {
        type: "custom",
        argument_type: {
          type: "named",
          name: "BigInt",
        },
      },
    },
  },
  // CartesianPoint: {
  //   aggregate_functions: {},
  //   comparison_operators: {
  //     not: {
  //       argument_type: {
  //         type: "named",
  //         name: "CartesianPoint",
  //       },
  //     },
  //     distance: {
  //       argument_type: {
  //         type: "named",
  //         name: "CartesianPointDistance",
  //       },
  //     },
  //     gt: {
  //       argument_type: {
  //         type: "named",
  //         name: "CartesianPointDistance",
  //       },
  //     },
  //     lt: {
  //       argument_type: {
  //         type: "named",
  //         name: "CartesianPointDistance",
  //       },
  //     },
  //     gte: {
  //       argument_type: {
  //         type: "named",
  //         name: "CartesianPointDistance",
  //       },
  //     },
  //     lte: {
  //       argument_type: {
  //         type: "named",
  //         name: "CartesianPointDistance",
  //       },
  //     },
  //   },
  //   update_operators: {},
  // },
  // Point: {
  //   aggregate_functions: {},
  //   comparison_operators: {
  //     not: {
  //       argument_type: {
  //         type: "named",
  //         name: "Point",
  //       },
  //     },
  //     distance: {
  //       argument_type: {
  //         type: "named",
  //         name: "PointDistance",
  //       },
  //     },
  //     gt: {
  //       argument_type: {
  //         type: "named",
  //         name: "PointDistance",
  //       },
  //     },
  //     lt: {
  //       argument_type: {
  //         type: "named",
  //         name: "PointDistance",
  //       },
  //     },
  //     gte: {
  //       argument_type: {
  //         type: "named",
  //         name: "PointDistance",
  //       },
  //     },
  //     lte: {
  //       argument_type: {
  //         type: "named",
  //         name: "PointDistance",
  //       },
  //     },
  //   },
  //   update_operators: {},
  // },
};

// TODO: maybe add input objects and enums here
export const BASE_TYPES: { [k: string]: ObjectType } = {
  Point: {
    description:
      "A point in a coordinate system. For more information, see https://neo4j.com/docs/graphql/4/type-definitions/types/spatial/#point",
    fields: {
      longitude: {
        description: null,
        type: {
          type: "named",
          name: "Float",
        },
      },
      latitude: {
        description: null,
        type: {
          type: "named",
          name: "Float",
        },
      },
      height: {
        description: null,
        type: {
          type: "nullable",
          underlying_type: {
            type: "named",
            name: "Float",
          },
        },
      },
      crs: {
        description: null,
        type: {
          type: "named",
          name: "String",
        },
      },
      srid: {
        description: null,
        type: {
          type: "named",
          name: "Int",
        },
      },
    },
  },
  CartesianPoint: {
    description:
      "A point in a two- or three-dimensional Cartesian coordinate system or in a three-dimensional cylindrical coordinate system. For more information, see https://neo4j.com/docs/graphql/4/type-definitions/types/spatial/#cartesian-point",
    fields: {
      x: {
        description: null,
        type: {
          type: "named",
          name: "Float",
        },
      },
      y: {
        description: null,
        type: {
          type: "named",
          name: "Float",
        },
      },
      z: {
        description: null,
        type: {
          type: "nullable",
          underlying_type: {
            type: "named",
            name: "Float",
          },
        },
      },
      crs: {
        description: null,
        type: {
          type: "named",
          name: "String",
        },
      },
      srid: {
        description: null,
        type: {
          type: "named",
          name: "Int",
        },
      },
    },
  },
};

// field names that are not valid
export const RESTRICTED_NAMES: string[] = [];

// node labels that are not valid
const RESTRICTED_OBJECTS = [
  {
    regex: /^PageInfo$/,
    error:
      "Type or Interface with name `PageInfo` reserved to support the pagination model of connections. See https://relay.dev/graphql/connections.htm#sec-Reserved-Types for more information.",
  },
  {
    regex: /^.+Connection$/,
    error:
      'Type or Interface with name ending "Connection" are reserved to support the pagination model of connections. See https://relay.dev/graphql/connections.htm#sec-Reserved-Types for more information.',
  },
  {
    regex: /^Node$/,
    error:
      "Type or Interface with name `Node` reserved to support Relay. See https://relay.dev/graphql/ for more information.",
  },
];
export function assertTypeNameIsRestricted(typeName: string): boolean {
  RESTRICTED_OBJECTS.forEach((restrictedName) => {
    if (restrictedName.regex.test(typeName)) {
      return true;
    }
  });
  return false;
}

export const CONFIGURATION_SCHEMA: JSONSchemaObject = {
  $schema: "http://json-schema.org/draft-07/schema#",
  definitions: {
    ArgumentInfo: {
      properties: {
        description: {
          description: "Argument description",
          type: "string",
        },
        type: {
          $ref: "#/definitions/Type",
          description: "The name of the type of this argument",
        },
      },
      type: "object",
    },
    ConfigurationSchema: {
      properties: {
        collection_names: {
          items: {
            type: "string",
          },
          type: "array",
        },
        functions: {
          items: {
            $ref: "#/definitions/FunctionInfo",
          },
          type: "array",
        },
        object_fields: {
          additionalProperties: {
            items: {
              type: "string",
            },
            type: "array",
          },
          type: "object",
        },
        object_types: {
          additionalProperties: {
            $ref: "#/definitions/ObjectType",
          },
          type: "object",
        },
        procedures: {
          items: {
            $ref: "#/definitions/ProcedureInfo",
          },
          type: "array",
        },
      },
      type: "object",
    },
    FunctionInfo: {
      properties: {
        arguments: {
          additionalProperties: {
            $ref: "#/definitions/ArgumentInfo",
          },
          description: "Any arguments that this collection requires",
          type: "object",
        },
        description: {
          description: "Description of the function",
          type: "string",
        },
        name: {
          description: "The name of the function",
          type: "string",
        },
        result_type: {
          $ref: "#/definitions/Type",
          description: "The name of the function's result type",
        },
      },
      type: "object",
    },
    ObjectField: {
      description: "The definition of an object field",
      properties: {
        description: {
          description: "Description of this field",
          type: "string",
        },
        type: {
          $ref: "#/definitions/Type",
          description: "The type of this field",
        },
      },
      type: "object",
    },
    ObjectType: {
      description: "The definition of an object type",
      properties: {
        description: {
          description: "Description of this type",
          type: "string",
        },
        fields: {
          additionalProperties: {
            $ref: "#/definitions/ObjectField",
          },
          description: "Fields defined on this object type",
          type: "object",
        },
      },
      type: "object",
    },
    ProcedureInfo: {
      properties: {
        arguments: {
          additionalProperties: {
            $ref: "#/definitions/ArgumentInfo",
          },
          description: "Any arguments that this collection requires",
          type: "object",
        },
        description: {
          description: "Column description",
          type: "string",
        },
        name: {
          description: "The name of the procedure",
          type: "string",
        },
        result_type: {
          $ref: "#/definitions/Type",
          description: "The name of the result type",
        },
      },
      type: "object",
    },
    Type: {
      anyOf: [
        {
          properties: {
            name: {
              description:
                "The name can refer to a primitive type or a scalar type",
              type: "string",
            },
            type: {
              const: "named",
              type: "string",
            },
          },
          type: "object",
        },
        {
          properties: {
            type: {
              const: "nullable",
              type: "string",
            },
            underlying_type: {
              $ref: "#/definitions/Type",
              description: "The type of the non-null inhabitants of this type",
            },
          },
          type: "object",
        },
        {
          properties: {
            element_type: {
              $ref: "#/definitions/Type",
              description: "The type of the elements of the array",
            },
            type: {
              const: "array",
              type: "string",
            },
          },
          type: "object",
        },
      ],
      description: "Types track the valid representations of values as JSON",
    },
  },
  properties: {
    config: {
      $ref: "#/definitions/ConfigurationSchema",
    },
    neo4j_user: {
      type: "string",
    },
    neo4j_password: {
      type: "string",
    },
    neo4j_url: {
      type: "string",
    },
  },
  type: "object",
};
