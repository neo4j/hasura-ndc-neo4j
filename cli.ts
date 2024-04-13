import { Command } from "@commander-js/extra-typings";
import { readFileSync } from "fs";
import path from "path";
import { doUpdateConfiguration } from "./src/handlers/updateConfiguration";
const program = new Command();

program
  .name("neo4j-connector-cli")
  .description("CLI for Neo4j connector on Hasura")
  .version("0.8.0");

program
  .command("initialize")
  .description("changeme")
  .action(() => {
    console.log({
      neo4j_url: "",
      neo4j_user: "",
      neo4j_pass: "",
      typedefs: undefined,
    });
  });

program
  .command("update")
  .description("changeme")
  // .argument("<string>", "string to split")
  .option("--context <fileName>", "context")
  .action(async (str, options) => {
    if (str.context) {
      console.log("str", str.context, program.args[0]);
      try {
        const fileContent = readFileSync(path.resolve(str.context), "utf8");
        const configObject = JSON.parse(fileContent);
        const x = await doUpdateConfiguration(configObject);
        console.log(JSON.stringify(x));
      } catch (error) {
        console.error("Failed to parse configuration:", error);
      }
    }
  });

program.parse();
