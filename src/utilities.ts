import camelcase from "camelcase";
import pluralize, { singular } from "pluralize";

export function toPlural(name: string) {
  return pluralize(name);
}

export function toSingular(name: string) {
  return singular(name);
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
