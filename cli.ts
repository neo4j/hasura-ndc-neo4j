import { Command } from "@commander-js/extra-typings";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { doUpdateConfiguration } from "./src/handlers/updateConfiguration";
import { Neo4j } from "./src/neo4j";
const program = new Command();

program
  .name("neo4j-connector-cli")
  .description("CLI for Neo4j connector on Hasura")
  .version("0.8.0");

program
  .command("initialize")
  .description("Initialize a configuration file for the Neo4j connector")
  .option("--context <fileName>", "context")
  .action((str) => {
    const emptyConfig = {
      typedefs: undefined,
    };
    console.log(emptyConfig);
    if (str.context) {
      writeFileSync(path.resolve(str.context), JSON.stringify(emptyConfig));
    }
  });

program
  .command("update")
  .description(
    "Update the configuration file for the Neo4j connector by introspecting the DB"
  )
  .option("--context <fileName>", "context")
  .action(async (str) => {
    if (str.context) {
      console.log("str", str.context, program.args[0]);
      try {
        const prevConfig = JSON.parse(
          readFileSync(path.resolve(str.context), "utf8")
        );

        const updatedConfig = await doUpdateConfiguration(prevConfig);
        writeFileSync(path.resolve(str.context), JSON.stringify(updatedConfig));
      } catch (error) {
        console.error("Failed to update configuration:", error);
      } finally {
        await Neo4j.getInstance().cleanDriver();
      }
    }
  });

program.parse();
