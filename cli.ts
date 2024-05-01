import { Command } from "@commander-js/extra-typings";
import { writeFile } from "fs/promises";
import path from "path";
import {
  CONFIGURATION_FILE_NAME,
  syncConfigurationFile,
} from "./src/connector-config/syncConfigurationFile";
const program = new Command();

program
  .name("neo4j-connector-cli")
  .description("CLI for Neo4j connector on Hasura")
  .version("0.8.0");

program
  .command("initialize")
  .description("Initialize a configuration file for the Neo4j connector")
  .option("--context <directoryName>", "context")
  .action(async (str) => {
    const emptyConfig = {
      typedefs: undefined,
    };
    console.log(emptyConfig);
    if (str.context) {
      await writeFile(
        path.resolve(str.context, CONFIGURATION_FILE_NAME),
        JSON.stringify(emptyConfig)
      );
    }
  });

program
  .command("update")
  .description(
    "Update the configuration file for the Neo4j connector by introspecting the DB"
  )
  .option("--context <directoryName>", "context")
  .action(async (str) => {
    if (str.context) {
      console.log("str", str.context, program.args[0]);
      await syncConfigurationFile(str.context);
    }
  });

program.parse();
