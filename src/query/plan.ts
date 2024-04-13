import {
  QueryRequest,
  Expression,
  ComparisonTarget,
  BadRequest,
  Field,
  OrderBy,
  OrderByElement,
  Query,
  ComparisonValue,
  PathElement,
} from "@hasura/ndc-sdk-typescript";
import { ConfigurationSchema } from "..";
import { lowerFirst, toSingular } from "../utilities";

export type QueryPlan = {
  collectionName: string;
  neo4jGraphQLQuery: string;
};

/**
 * Generates the GQL query to be forwarded to the library for execution.
 *
 * This function checks various conditions in the query and throws an Error if the library does not support the query in the request.
 *
 * @async
 * @param {QueryRequest} query - The main query request that specifies what data needs to be fetched.
 * @param {ConfigurationSchema} config
 * @returns {Promise<QueryPlan>} - A promise that resolves to a query plan. The plan contains the raw GQL query to be forwarded to the library.
 * @throws {Error} Various errors can be thrown if the provided query does not match the expected criteria such as if the collection is not found, if querying with relationships is attempted, if fields are null or not part of the collection, if the library does not support the query in the request.
 */
export async function planQuery(
  query: QueryRequest,
  config: ConfigurationSchema,
  variables?: Record<string, unknown>
): Promise<QueryPlan> {
  console.log("query to plan:", JSON.stringify(query, null, 2));
  const neo4jGraphQLQuery = `
      query { 
        ${makeGQLQuery({
          query: query.query,
          collectionName: query.collection,
          fieldThatQueryIsAttachedTo: lowerFirst(query.collection),
          config,
          initialQuery: query,
          variables,
        })} 
      }
    `;

  console.log("QUERY IS", neo4jGraphQLQuery);

  return {
    collectionName: query.collection,
    neo4jGraphQLQuery,
  };
}

// TODO
function makeGQLQuery({
  query,
  collectionName,
  fieldThatQueryIsAttachedTo,
  config,
  initialQuery,
  variables,
}: {
  query: Query;
  collectionName: string;
  fieldThatQueryIsAttachedTo: string;
  config: ConfigurationSchema;
  initialQuery: QueryRequest;
  variables?: Record<string, unknown>;
}): string {
  // Assert that the collection is registered in the schema
  if (!config.collection_names.includes(collectionName)) {
    throw new BadRequest(`Collection ${collectionName} not found in schema!`, {
      collectionNames: config.collection_names,
    });
  }

  const { limit, offset, predicate: where, order_by: orderBy, fields } = query;

  const individualCollectionName: string = toSingular(collectionName);
  if (!fields) {
    throw new BadRequest("Fields must be requested", { query });
  }
  Object.keys(fields)
    .filter((fieldName) => !fieldName.includes("hasura_phantom_field"))
    .forEach((field) => {
      if (
        !config.object_fields[individualCollectionName].includes(field) &&
        !Object.keys(config.foreign_keys[individualCollectionName]).includes(
          field
        )
      ) {
        throw new BadRequest("Requested field not in schema!", {
          field,
          collectionName: individualCollectionName,
        });
      }
    });

  const requestedFields = Object.entries(fields)
    .filter(([fieldName, _]) => !fieldName.includes("hasura_phantom_field"))
    .map<string>(([fieldName, f]: [string, Field]) => {
      if (f.type === "column") {
        return fieldName;
      }
      if (f.type === "relationship") {
        const relationshipMapping = Object.entries(
          initialQuery.collection_relationships
        ).find(([k, _]) => {
          const parsedKey = JSON.parse(k); // eg. [ { subgraph: 'default', name: 'Actor' }, 'actedInMovies' ]
          if (parsedKey[1] === fieldName) {
            return true;
          }
          return false;
        });
        if (!relationshipMapping) {
          throw new BadRequest(
            "Attempting to resolve relationship field without relationship in collection",
            { fieldName }
          );
        }
        const targetCollection = (
          relationshipMapping[1] as { target_collection: string }
        ).target_collection;
        return makeGQLQuery({
          query: f.query,
          collectionName: targetCollection,
          fieldThatQueryIsAttachedTo: fieldName,
          config,
          initialQuery,
          variables,
        });
      }
      return "";
    });

  // TODO:
  // the following code throws on behavior that is not supported by the library
  // filter instead of throw to make tests PASS depending on what we want
  orderBy?.elements.forEach((element: any) => {
    if (element.target.type !== "column") {
      throw new BadRequest("Sorting is only supported on own fields!", {
        target: element.target,
      });
    }
    const fieldName = element.target.name;
    const fieldType =
      config.object_types[individualCollectionName].fields[fieldName].type;
    const isArrayField =
      fieldType?.type === "array" ||
      (fieldType?.type === "nullable" &&
        fieldType.underlying_type.type === "array");

    if (isArrayField) {
      throw new BadRequest("Sorting is not supported on array fields!", {
        target: element.target,
      });
    }
  });

  return composeGQLQueryForLevel(
    fieldThatQueryIsAttachedTo,
    requestedFields,
    {
      limit,
      offset,
      where,
      orderBy,
    },
    variables
  );
}

function composeGQLQueryForLevel(
  fieldThatQueryIsAttachedTo: string,
  requestedFields: string[],
  args: {
    limit?: number | null;
    offset?: number | null;
    where?: Expression | null;
    orderBy?: OrderBy | null;
  },
  variables?: Record<string, unknown>
): string {
  const filtersStr =
    args.where &&
    `where: ${mapToGQLString(predicateToWhereFilter(args.where, variables))}`;

  const hasSortOption = args.orderBy && args.orderBy.elements.length;
  const options = {
    ...(args.limit && { limit: args.limit }),
    ...(args.offset && { offset: args.offset }),
    ...(hasSortOption && { sort: orderByToSort(args.orderBy as OrderBy) }),
  };
  const optionsStr =
    Object.entries(options).length && `options: ${mapToGQLString(options)}`;

  const queryArgs = [filtersStr, optionsStr].filter((x) => Boolean(x));
  const queryArgsStr = queryArgs.length ? `(${queryArgs.join(", ")})` : "";

  return `
      ${fieldThatQueryIsAttachedTo}${queryArgsStr} {
          ${requestedFields.join("\n")}
        }
    `;
}

function predicateToWhereFilter(
  predicateExpression: Expression,
  variables?: Record<string, unknown>
): Record<string, any> {
  switch (predicateExpression.type) {
    case "and":
    case "or": {
      const innerPredicates = predicateExpression.expressions.map(
        (expr: Expression) => predicateToWhereFilter(expr, variables)
      );
      return {
        [predicateExpression.type.toUpperCase()]: innerPredicates,
      };
    }
    case "not": {
      const innerPredicate = predicateToWhereFilter(
        predicateExpression.expression,
        variables
      );
      return { NOT: innerPredicate };
    }
    case "unary_comparison_operator": {
      if (predicateExpression.operator !== "is_null") {
        throw new Error("Operator is not supported");
      }
      const makeFilter = withResolvedTarget(predicateExpression.column);
      return makeFilter("null", "");
    }
    case "binary_comparison_operator": {
      const makeFilter = withResolvedTarget(predicateExpression.column);
      const operator = resolveBinaryComparisonOperator(
        predicateExpression.operator
      );
      const value = resolveComparisonValue(
        predicateExpression.value,
        variables
      );
      return makeFilter(value, operator);
    }
    case "exists":
      // in_collection: ExistsInCollection;
      // where: Expression;
      // TODO: implement
      throw Error("Exists operator is not supported");
    default:
      throw Error("Operator is not supported");
  }
}

function resolveComparisonValue(
  comparisonValue: ComparisonValue,
  variables?: Record<string, unknown>
) {
  let value: unknown;
  switch (comparisonValue.type) {
    case "column":
      throw new Error("Comparing against columns is not supported");
    case "scalar":
      value = comparisonValue.value;
      break;

    case "variable": {
      if (!variables) {
        throw new Error("Variables are being referenced but not provided");
      }
      value = variables[comparisonValue.name];
      break;
    }
  }
  if (typeof value === "string") {
    return `"${value}"`;
  }
  return value;
}

function resolveBinaryComparisonOperator(operator: string) {
  switch (operator) {
    case "eq":
      return "";
    case "other":
      return `_${operator.toUpperCase()}`;
    default:
      throw Error("Operator not supported");
  }
}

function withResolvedTarget(
  column: ComparisonTarget
): (value: unknown, operation: string) => Record<string, any> {
  switch (column.type) {
    case "column": {
      return function createComparison(value: unknown, operator: string) {
        return resolveTarget(
          [
            ...(column.path || []).map(
              (p: PathElement) => JSON.parse(p.relationship)[1]
            ),
            column.name,
          ],
          value,
          operator
        );
      };
    }
    // case "root_collection_column":
    //   TODO
    //   return function createComparison(value: unknown, operator: string) {
    //     return resolveTarget([column.name], value, operator);
    //   };
    default:
      throw new Error("Invalid comparison target");
  }
}

function resolveTarget(
  pathToTarget: string[],
  value: any,
  operator: string
): Record<string, any> {
  if (pathToTarget.length === 1) {
    return { [`${pathToTarget[0]}${operator}`]: value };
  }
  const [current, ...restOfPath] = pathToTarget;
  return { [current]: resolveTarget(restOfPath, value, operator) };
}

function orderByToSort(orderBy: OrderBy): Record<string, string>[] {
  const sortEntries = orderBy.elements.map((element: OrderByElement) => {
    switch (element.target.type) {
      case "column": {
        if (element.target.path.length) {
          throw Error("Order by relationships not supported");
        }
        const field = element.target.name;
        return { [field]: element.order_direction.toUpperCase() };
      }
      // TODO: Aggregates
      case "single_column_aggregate":
      case "star_count_aggregate":
        throw Error("Order by aggregates not supported");
    }
  });
  return sortEntries;
}

function mapToGQLString(
  x: Record<string, unknown> | Array<unknown> | unknown
): string {
  if (typeof x === "object" && !Array.isArray(x) && x !== null) {
    // x is Object
    let mapped = "";
    for (const [k, v] of Object.entries(x)) {
      mapped += `{ ${k}: ${mapToGQLString(v)} }`;
    }
    return mapped;
  }
  if (Array.isArray(x)) {
    // x is Array
    return `[ ${x.map(mapToGQLString).join(", ")} ]`;
  }
  // x is Primitive
  return `${x}`;
}
