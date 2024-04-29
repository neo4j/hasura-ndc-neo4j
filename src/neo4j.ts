import neo4j, { Driver } from "neo4j-driver";

/**
 * Singleton wrapper class to manage Neo4j driver instances
 */
export class Neo4j {
  private static instance: Neo4j;
  private driver: Driver | undefined;

  private constructor() {
    this.initDriver();
  }

  public static getInstance(): Neo4j {
    if (!Neo4j.instance) {
      Neo4j.instance = new Neo4j();
    }

    return Neo4j.instance;
  }

  private initDriver(): Driver {
    const { NEO4J_URL, NEO4J_USER, NEO4J_PASS } = this.getCredentialsFromEnv();
    this.driver = neo4j.driver(
      NEO4J_URL,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASS)
    );
    return this.driver;
  }

  public getDriver(): Driver {
    if (this.driver) {
      return this.driver;
    }
    return this.initDriver();
  }

  public async cleanDriver() {
    if (!this.driver) {
      return;
    }
    await this.driver.close();
    this.driver = undefined;
  }

  private getCredentialsFromEnv(): {
    NEO4J_URL: string;
    NEO4J_USER: string;
    NEO4J_PASS: string;
  } {
    const NEO4J_URL = process.env["NEO4J_URL"] as string;
    let NEO4J_USER = process.env["NEO4J_USER"] as string | undefined;
    if (NEO4J_USER === undefined) {
      throw new Error("Must provide environment variable NEO4j_USER");
    }
    let NEO4J_PASS = process.env["NEO4J_PASS"] as string | undefined;
    if (NEO4J_PASS === undefined) {
      throw new Error("Must provide environment variable NEO4J_PASS");
    }
    return { NEO4J_URL, NEO4J_USER, NEO4J_PASS };
  }
}
