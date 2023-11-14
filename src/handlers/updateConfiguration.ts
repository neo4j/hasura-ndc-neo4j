import { Configuration } from "..";
import { BASE_TYPES, assertTypeNameIsRestricted } from "../constants";
import {
  getNeo4jDriver,
  insertion,
  makeTypeDefs,
  Neo4jToGQL,
  toPlural,
} from "../utilities";

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
  if (configuration.config) {
    return configuration;
  }

  const driver = getNeo4jDriver(configuration);
  const { records } = await driver.executeQuery("call db.labels();");
  // MATCH (n) RETURN labels(n), collect(n); -> record 1:: labels(n): ["label1", "label2"]   collect(n): [{}, {}]

  const collectionNames = records.map((record): string =>
    record.get<string>("label")
  );

  configuration.config = {
    collection_names: collectionNames.map(toPlural),
    object_types: { ...BASE_TYPES },
    object_fields: {},
    functions: [],
    procedures: [],
  };

  const { addToTypeDefs, getTypeDefs } = makeTypeDefs();
  for (const label of collectionNames) {
    if (assertTypeNameIsRestricted(label)) {
      throw new Error(`${label} is a restricted name!`);
    }
    const { records } = await driver.executeQuery(
      `MATCH (n: ${label}) RETURN n LIMIT 1`
    );

    if (records.length > 0) {
      const recordPayload = records[0].get("n")["properties"];
      addToTypeDefs([label, Neo4jToGQL(recordPayload)]);

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
  }
  configuration.typedefs = getTypeDefs();

  return configuration;
}
