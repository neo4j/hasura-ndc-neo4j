import {
  CapabilitiesResponse,
  ScalarType,
  ObjectType,
} from "@hasura/ndc-sdk-typescript";

export const CAPABILITIES_RESPONSE: CapabilitiesResponse = {
  version: "^0.1.0",
  capabilities: {
    query: {
      aggregates: null,
      variables: {},
      explain: {},
    },
    mutation: {
      transactional: null,
      explain: null,
    },
    relationships: { relation_comparisons: {}, order_by_aggregate: {} },
  },
};

export const SCALAR_TYPES: { [key: string]: ScalarType } = {
  Int: {
    aggregate_functions: {
      min: {
        result_type: {
          type: "named",
          name: "Int",
        },
      },
      max: {
        result_type: {
          type: "named",
          name: "Int",
        },
      },
      average: {
        result_type: {
          type: "named",
          name: "Int",
        },
      },
      sum: {
        result_type: {
          type: "named",
          name: "Int",
        },
      },
    },
    comparison_operators: {
      eq: { type: "equal" },
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
    aggregate_functions: {
      min: {
        result_type: {
          type: "named",
          name: "Float",
        },
      },
      max: {
        result_type: {
          type: "named",
          name: "Float",
        },
      },
      average: {
        result_type: {
          type: "named",
          name: "Float",
        },
      },
      sum: {
        result_type: {
          type: "named",
          name: "Float",
        },
      },
    },
    comparison_operators: {
      eq: { type: "equal" },
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
      eq: { type: "equal" },
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
    aggregate_functions: {
      shortest: {
        result_type: {
          type: "named",
          name: "String",
        },
      },
      longest: {
        result_type: {
          type: "named",
          name: "String",
        },
      },
    },
    comparison_operators: {
      eq: { type: "equal" },
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
    aggregate_functions: {
      shortest: {
        result_type: {
          type: "named",
          name: "ID",
        },
      },
      longest: {
        result_type: {
          type: "named",
          name: "ID",
        },
      },
    },
    comparison_operators: {
      eq: { type: "equal" },
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
      eq: { type: "equal" },
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
      eq: { type: "equal" },
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
      eq: { type: "equal" },
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
      eq: { type: "equal" },
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
      eq: { type: "equal" },
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
      eq: { type: "equal" },
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
    aggregate_functions: {
      min: {
        result_type: {
          type: "named",
          name: "BigInt",
        },
      },
      max: {
        result_type: {
          type: "named",
          name: "BigInt",
        },
      },
      average: {
        result_type: {
          type: "named",
          name: "BigInt",
        },
      },
      sum: {
        result_type: {
          type: "named",
          name: "BigInt",
        },
      },
    },
    comparison_operators: {
      eq: { type: "equal" },
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

// Point and CartesianPoint should be added here when Hasura adds support for ObjectType fields
// Alternatively if needed, we could work around this limitation by implementing some Native Queries like Postgres does
export const BASE_TYPES: { [k: string]: ObjectType } = {
  // Point: {
  //   description:
  //     "A point in a coordinate system. For more information, see https://neo4j.com/docs/graphql/4/type-definitions/types/spatial/#point",
  //   fields: {
  //     longitude: {
  //       description: null,
  //       type: {
  //         type: "named",
  //         name: "Float",
  //       },
  //     },
  //     latitude: {
  //       description: null,
  //       type: {
  //         type: "named",
  //         name: "Float",
  //       },
  //     },
  //     height: {
  //       description: null,
  //       type: {
  //         type: "nullable",
  //         underlying_type: {
  //           type: "named",
  //           name: "Float",
  //         },
  //       },
  //     },
  //     crs: {
  //       description: null,
  //       type: {
  //         type: "named",
  //         name: "String",
  //       },
  //     },
  //     srid: {
  //       description: null,
  //       type: {
  //         type: "named",
  //         name: "Int",
  //       },
  //     },
  //   },
  // },
  // CartesianPoint: {
  //   description:
  //     "A point in a two- or three-dimensional Cartesian coordinate system or in a three-dimensional cylindrical coordinate system. For more information, see https://neo4j.com/docs/graphql/4/type-definitions/types/spatial/#cartesian-point",
  //   fields: {
  //     x: {
  //       description: null,
  //       type: {
  //         type: "named",
  //         name: "Float",
  //       },
  //     },
  //     y: {
  //       description: null,
  //       type: {
  //         type: "named",
  //         name: "Float",
  //       },
  //     },
  //     z: {
  //       description: null,
  //       type: {
  //         type: "nullable",
  //         underlying_type: {
  //           type: "named",
  //           name: "Float",
  //         },
  //       },
  //     },
  //     crs: {
  //       description: null,
  //       type: {
  //         type: "named",
  //         name: "String",
  //       },
  //     },
  //     srid: {
  //       description: null,
  //       type: {
  //         type: "named",
  //         name: "Int",
  //       },
  //     },
  //   },
  // },
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
