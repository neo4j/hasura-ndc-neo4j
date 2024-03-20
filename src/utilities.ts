// @ts-ignore
import { ObjectType, ObjectField, Type } from "@hasura/ndc-sdk-typescript";
import { Integer } from "neo4j-driver";
import { Configuration } from ".";
import neo4j, { Driver } from "neo4j-driver";
import { RESTRICTED_NAMES } from "./constants";
import camelcase from "camelcase";
import pluralize from "pluralize";

const recursiveType = (
  val: any,
  namePrefix: string,
  objTypes: { [k: string]: ObjectType }
): Type => {
  const wrapNull = (x: Type): Type => ({
    type: "nullable",
    underlying_type: x,
  });

  if (Array.isArray(val)) {
    const new_val = val.length === 0 ? "str" : val[0];
    return wrapNull({
      type: "array",
      element_type: recursiveType(new_val, namePrefix, objTypes),
    });
  } else if (typeof val === "boolean") {
    return wrapNull({
      type: "named",
      name: "Boolean",
    });
  } else if (typeof val === "string") {
    return wrapNull({
      type: "named",
      name: "String",
    });
  } else if (typeof val === "number") {
    if (Number.isInteger(val)) {
      return wrapNull({
        type: "named",
        name: "Int",
      });
    } else {
      return wrapNull({
        type: "named",
        name: "Float",
      });
    }
  } else if (typeof val === "object") {
    // const fDict: any = {};
    // for (const [k, v] of Object.entries(val)) {
    //   const nestedName = namePrefix + "_" + k;
    //   const fieldType = recursiveType(v, nestedName, objTypes);
    //   fDict[k] = {
    //     description: null,
    //     type: fieldType,
    //   };
    // }
    // objTypes[namePrefix] = {
    //   description: null,
    //   fields: fDict,
    // };
    // return {
    //   type: "named",
    //   name: namePrefix,
    // };
    if (Integer.isInteger(val)) {
      return wrapNull({
        type: "named",
        name: "Int",
      });
    }
    // TODO: obj is not handled
    else {
      throw new Error(`Object Not Handled: ${val}`);
    }
  } else {
    throw new Error(`Not Implemented: ${typeof val}`);
  }
};

export const insertion = (
  collectionName: string,
  payloadDict: Record<string, any>,
  objTypes: { [k: string]: ObjectType }
): Record<string, ObjectField> => {
  let responseDict: Record<string, ObjectField> = {};
  for (const [k, v] of Object.entries(payloadDict)) {
    if (RESTRICTED_NAMES.includes(k)) {
      throw new Error(`${k} is a restricted name!`);
    }
    responseDict[k] = {
      description: null,
      type: recursiveType(v, collectionName + "_" + k, objTypes),
    };
  }
  return responseDict;
};

const getRecursiveTypeGQLFromValue = (val: any): string => {
  if (Array.isArray(val)) {
    const new_val = val.length === 0 ? "str" : val[0];
    return `[${getRecursiveTypeGQLFromValue(new_val)}]`;
  } else if (typeof val === "boolean") {
    return `Boolean`;
  } else if (typeof val === "string") {
    return `String`;
  } else if (typeof val === "number") {
    if (Number.isInteger(val)) {
      return `Int`;
    } else {
      return `Float`;
    }
  } else if (typeof val === "object") {
    if (Integer.isInteger(val)) {
      return `Int`;
    }
    // TODO: obj is not handled
    else {
      throw new Error(`Object Not Handled: ${val}`);
    }
  } else {
    throw new Error(`Not Implemented: ${typeof val}, ${val}`);
  }
};

export function getNeo4jDriver(configuration: Configuration): Driver {
  return neo4j.driver(
    configuration.neo4j_url,
    neo4j.auth.basic(configuration.neo4j_user, configuration.neo4j_pass)
  );
}

export function toPlural(name: String) {
  return `${name}s`;
}

export function lowerFirst(str: string): string {
  return `${str.charAt(0).toLowerCase()}${str.slice(1)}`;
}

export function asArray<T>(raw: T | Array<T> | undefined | null): Array<T> {
  if (Array.isArray(raw)) return raw;
  if (raw === undefined || raw === null) return [];
  return [raw];
}

// TODO: export FROM INTROSPECTOR - generates relationship field name from relationship
export function inferRelationshipFieldName(
  relType: string,
  fromType: string,
  toType: string,
  direction: "IN" | "OUT"
): string {
  const sanitizedRelType = relType.replaceAll(/[\s/()\\`]/g, "");
  if (direction === "OUT") {
    return camelcase(sanitizedRelType + pluralize(toType));
  }
  return camelcase(pluralize(fromType) + sanitizedRelType);
}
