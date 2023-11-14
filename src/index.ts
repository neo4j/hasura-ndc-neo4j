import {
  SchemaResponse,
  ObjectType,
  FunctionInfo,
  ProcedureInfo,
  QueryRequest,
  QueryResponse,
  MutationRequest,
  MutationResponse,
  CapabilitiesResponse,
  ExplainResponse,
  start,
  Connector,
  InternalServerError,
} from "@hasura/ndc-sdk-typescript";
import { CAPABILITIES_RESPONSE, CONFIGURATION_SCHEMA } from "./constants";
import { doQuery } from "./handlers/query";
import { doExplain } from "./handlers/explain";
import { doGetSchema } from "./handlers/schema";
import { doUpdateConfiguration } from "./handlers/updateConfiguration";
import { JSONSchemaObject } from "@json-schema-tools/meta-schema";
import neo4j, { Driver } from "neo4j-driver";
import { configToTypeDefs, getNeo4jDriver } from "./utilities";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { GraphQLSchema } from "graphql";

export interface ConfigurationSchema {
  collection_names: string[];
  object_fields: { [k: string]: string[] };
  object_types: { [k: string]: ObjectType };
  functions: FunctionInfo[];
  procedures: ProcedureInfo[];
}

export interface RawConfiguration {}
export interface Configuration {
  neo4j_url: string;
  neo4j_user: string;
  neo4j_pass: string;
  typedefs?: string;
  config?: ConfigurationSchema;
}

export interface State {
  neo4j_driver: Driver;
  /**
   * Ideally this is the Neo4jGraphQL executable schema to be used when resolving requests.
   * This is possible when the configuration.config is already populated.
   * When introspecting the DB for populating the configuration.config there is no access to modifying the State object, so the configuration.typedefs is used
   */
  neoSchema?: GraphQLSchema;
}

const connector: Connector<RawConfiguration, Configuration, State> = {
  /**
   * Initialize the connector's in-memory state.
   *
   * For example, any connection pools, prepared queries,
   * or other managed resources would be allocated here.
   *
   * In addition, this function should register any
   * connector-specific metrics with the metrics registry.
   * @param configuration
   * @param metrics
   */
  async try_init_state(
    configuration: Configuration,
    _metrics: unknown
  ): Promise<State> {
    const driver = getNeo4jDriver(configuration);
    const typeDefs = configToTypeDefs(configuration);
    if (!typeDefs) {
      return Promise.resolve({ neo4j_driver: driver });
    }

    const neo4jGQL = new Neo4jGraphQL({
      typeDefs,
      driver,
    });
    const neoSchema = await neo4jGQL.getSchema();
    return Promise.resolve({ neo4j_driver: driver, neoSchema });
  },

  /**
   * Get the connector's capabilities.
   *
   * This function implements the [capabilities endpoint](https://hasura.github.io/ndc-spec/specification/capabilities.html)
   * from the NDC specification.
   *
   * This function should be synchronous
   * @param configuration
   */
  get_capabilities(_: Configuration): CapabilitiesResponse {
    return CAPABILITIES_RESPONSE;
  },

  /**
   * Return jsonschema for the configuration for this connector
   */
  get_configuration_schema(): JSONSchemaObject {
    return CONFIGURATION_SCHEMA;
  },

  /**
   * Return an empty raw configuration, to be manually filled in by the user to allow connection to the data source.
   *
   * The exact shape depends on your connector's configuration. Example:
   *
   * ```json
   * {
   *   "connection_string": "",
   *   "tables": []
   * }
   * ```
   */
  make_empty_configuration(): Configuration {
    const conf: Configuration = {
      neo4j_url: "",
      neo4j_user: "",
      neo4j_pass: "",
      typedefs: undefined,
    };
    return conf;
  },

  /**
   * Take a raw configuration, update it where appropriate by connecting to the underlying data source, and otherwise return it as-is
   * For example, if our configuration includes a list of tables, we may want to fetch an updated list from the data source.
   * This is also used to "hydrate" an "empty" configuration where a user has provided connection details and little else.
   * @param rawConfiguration a base raw configuration
   */
  update_configuration(configuration: Configuration): Promise<Configuration> {
    return doUpdateConfiguration(configuration);
  },

  /**
   * Validate the raw configuration provided by the user,
   * returning a configuration error or a validated [`Connector::Configuration`].
   * @param configuration
   */
  validate_raw_configuration(
    configuration: Configuration
  ): Promise<Configuration> {
    return Promise.resolve(configuration);
  },

  /**
   * Get the connector's schema.
   *
   * This function implements the [schema endpoint](https://hasura.github.io/ndc-spec/specification/schema/index.html)
   * from the NDC specification.
   * @param configuration
   */
  async get_schema(configuration: Configuration): Promise<SchemaResponse> {
    if (!configuration.config) {
      await this.update_configuration(configuration);
    }

    return Promise.resolve(
      doGetSchema(configuration.config as ConfigurationSchema)
    );
  },

  /**
   * Explain a query by creating an execution plan
   *
   * This function implements the [explain endpoint](https://hasura.github.io/ndc-spec/specification/explain.html)
   * from the NDC specification.
   * @param configuration
   * @param state
   * @param request
   */
  async explain(
    configuration: Configuration,
    _: State,
    request: QueryRequest
  ): Promise<ExplainResponse> {
    if (!configuration.config) {
      await this.update_configuration(configuration);
    }
    return doExplain(request, configuration);
  },

  /**
   * Execute a query
   *
   * This function implements the [query endpoint](https://hasura.github.io/ndc-spec/specification/queries/index.html)
   * from the NDC specification.
   * @param configuration
   * @param state
   * @param request
   */
  async query(
    configuration: Configuration,
    state: State,
    request: QueryRequest
  ): Promise<QueryResponse> {
    if (!configuration.config) {
      await this.update_configuration(configuration);
    }
    return doQuery(request, state, configuration);
  },

  /**
   * Execute a mutation
   *
   * This function implements the [mutation endpoint](https://hasura.github.io/ndc-spec/specification/mutations/index.html)
   * from the NDC specification.
   * @param configuration
   * @param state
   * @param request
   */
  mutation(
    configuration: Configuration,
    state: State,
    request: MutationRequest
  ): Promise<MutationResponse> {
    throw new Error("Mutation endpoint not implemented!");
  },

  /**
   * Check the health of the connector.
   *
   * For example, this function should check that the connector
   * is able to reach its data source over the network.
   * @param configuration
   * @param state
   */
  async health_check(_: Configuration, state: State): Promise<undefined> {
    try {
      const driver = state.neo4j_driver;
      const canReachServer = driver.getServerInfo();
      console.log("Connection established");
      console.log(canReachServer);
      return Promise.resolve(undefined);
    } catch (err) {
      throw new InternalServerError(`Connection error ${err}`);
    }
  },

  /**
   *
   * Update any metrics from the state
   *
   * Note: some metrics can be updated directly, and do not
   * need to be updated here. This function can be useful to
   * query metrics which cannot be updated directly, e.g.
   * the number of idle connections in a connection pool
   * can be polled but not updated directly.
   * @param configuration
   * @param state
   */
  fetch_metrics(_: Configuration, __: State): Promise<undefined> {
    return Promise.resolve(undefined);
  },
  get_raw_configuration_schema(): JSONSchemaObject {
    throw new Error("Function not implemented.");
  },
};

start(connector);
