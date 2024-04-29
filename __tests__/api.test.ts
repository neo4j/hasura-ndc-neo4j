import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { Neo4j } from "../src/neo4j";

describe("API Tests", () => {
  const baseDir = path.resolve(__dirname, "./requests");
  const dataFile = path.resolve(__dirname, "./data/data.json");
  const configurationFile = path.resolve(
    __dirname,
    "./data/configuration.json"
  );
  const testDirs: string[] = [
    path.resolve(baseDir, "movies"),
    // path.resolve(baseDir, "actors"), Hasura does not seem to support nested fields, Point and CartesianPoint are nested
  ];
  const neo4jInstance = Neo4j.getInstance();
  let cleanupStatement: string | undefined;

  async function loadDataFromFile(filePath: string) {
    const data = await fs.promises.readFile(filePath, "utf-8");
    return JSON.parse(data);
  }

  async function generateCypherStatements(): Promise<{
    create: string[];
    cleanup: string[];
  }> {
    const configuration = await loadDataFromFile(configurationFile);
    const data = await loadDataFromFile(dataFile);
    const statements: { create: string[]; cleanup: string[] } = {
      create: [],
      cleanup: [],
    };
    for (const label in data) {
      const nodesForLabel: Record<string, any>[] = data[label];
      for (const node of nodesForLabel) {
        const nodeFields = Object.entries(node).map(([fieldName, value]) => {
          const fieldType =
            configuration.config.object_types[label].fields[fieldName].type
              .name;
          if (["String", "ID", "Date", "BigInt"].includes(fieldType)) {
            return `${fieldName}: "${value}"`;
          }
          return `${fieldName}: ${value}`;
        });
        statements.create.push(`CREATE (:${label} {${nodeFields.join(", ")}})`);
        statements.cleanup.push(
          `MATCH (n:${label} {${nodeFields.join(", ")}}) DETACH DELETE n`
        );
      }
    }
    return statements;
  }

  async function setupDatabase(createStatement: string) {
    try {
      console.log("Setting up database, executing query", createStatement);
      await neo4jInstance.getDriver().executeQuery(createStatement);
    } catch (err) {
      console.error("error:", err);
      throw new Error(`Error while db set-up: ${err}`);
    } finally {
      await neo4jInstance.cleanDriver();
    }
  }

  beforeAll(async () => {
    const { create, cleanup } = await generateCypherStatements();
    await setupDatabase(create.join("\n"));
    cleanupStatement = cleanup.join("\n");
  });

  afterAll(async () => {
    if (!cleanupStatement) {
      console.log("No data to cleanup");
    } else {
      await neo4jInstance.getDriver().executeQuery(cleanupStatement);
    }
    await neo4jInstance.cleanDriver();
  });

  testDirs.forEach((testDir) => {
    describe(`Testing directory: ${testDir}`, () => {
      const files = fs.readdirSync(testDir);
      const testCases = files.map((file) => {
        const filePath = path.join(testDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const { method, url, request, response } = JSON.parse(content);
        return { filePath, method, url, request, response };
      });

      test.each(testCases)(
        "Testing %s",
        async ({ filePath, method, url, request, response }) => {
          //   try {
          const apiResponse = await axios({
            method,
            url: `http://127.0.0.1:8080/${url}`,
            data: request,
          });
          expect(apiResponse.data).toEqual(response);
          //   } catch (err) {
          //     console.error(
          //       "apiRequest error",
          //       (err as any).response.data.details
          //     );
          //   }
        }
      );
    });
  });
});
