import { doUpdateConfiguration } from "./updateConfiguration";
import path from "path";
import { writeFile, readFile } from "fs/promises";
import { Neo4j } from "../neo4j";

const EMPTY_CONFIGURATION = { typeDefs: "" };
export const CONFIGURATION_FILE_NAME = "configuration.json";

/**
 * Synchronizes the configuration object and writes it to a JSON file at expected location.
 *
 * @param {string} directory - Either a path in Docker container for production usage or local path for local development
 */
export async function syncConfigurationFile(directory: string) {
  const configurationFileLocation = path.resolve(
    directory,
    CONFIGURATION_FILE_NAME
  );

  let currentConfigStr;
  try {
    currentConfigStr = await readFile(configurationFileLocation, "utf8");
  } catch (error) {
    console.log("No current configuration exists.");
  }

  try {
    const currentConfig = currentConfigStr
      ? JSON.parse(currentConfigStr)
      : EMPTY_CONFIGURATION;
    const newConfig = await doUpdateConfiguration(currentConfig);
    const newConfigStr = JSON.stringify(newConfig, null, 2);

    if (currentConfigStr !== newConfigStr) {
      await writeFile(
        path.resolve(directory, CONFIGURATION_FILE_NAME),
        newConfigStr
      );
      console.log("File updated.");
    } else {
      console.log("No changes detected. File not updated.");
    }
  } catch (error) {
    console.error("Failed to update configuration:", error);
  } finally {
    await Neo4j.getInstance().cleanDriver();
  }
}
