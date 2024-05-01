import { syncConfigurationFile } from "./src/connector-config/syncConfigurationFile";

async function main() {
  let HASURA_CONFIGURATION_DIRECTORY = process.env[
    "HASURA_CONFIGURATION_DIRECTORY"
  ] as string | undefined;
  if (
    HASURA_CONFIGURATION_DIRECTORY === undefined ||
    HASURA_CONFIGURATION_DIRECTORY.length === 0
  ) {
    HASURA_CONFIGURATION_DIRECTORY = ".";
  }

  await syncConfigurationFile(HASURA_CONFIGURATION_DIRECTORY);
}

main();
