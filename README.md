# Hasura Neo4j Connector
<a href="https://neo4j.com/"><img src="https://github.com/neo4j/hasura-ndc-neo4j/blob/main/docs/logo.png" align="right" width="200"></a>

The Hasura Neo4j Connector allows for connecting to a Neo4j database to give you an instant GraphQL API on top of your Neo4j data.

This connector is built using the [Typescript Data Connector SDK](https://github.com/hasura/ndc-sdk-typescript) and implements the [Data Connector Spec](https://github.com/hasura/ndc-spec).

- [See the listing in the Hasura Hub](https://hasura.io/connectors/neo4j)
- [Hasura V3 Documentation](https://hasura.io/docs/3.0/index/)

## Features

Below, you'll find a matrix of all supported features for the Turso connector:

| Feature                         | Supported | Notes |
| ------------------------------- | --------- | ----- |
| Native Queries + Logical Models | ❌     |       |
| Simple Object Query             | ✅     |       |
| Filter / Search                 | ✅     |       |
| Simple Aggregation              | ❌     |       |
| Sort                            | ✅     |       |
| Paginate                        | ✅     |       |
| Table Relationships             | ✅     |       |
| Views                           | ❌     |       |
| Distinct                        | ❌     |       |
| Remote Relationships            | ✅     |       |
| Custom Fields                   | ❌     |       |
| Mutations                       | ❌     |       |

## Before you get Started

1. The [DDN CLI](https://hasura.io/docs/3.0/cli/installation) and [Docker](https://docs.docker.com/engine/install/) installed
2. A [supergraph](https://hasura.io/docs/3.0/getting-started/init-supergraph)
3. A [subgraph](https://hasura.io/docs/3.0/getting-started/init-subgraph)
4. Have a [Neo4j](https://neo4j.com/product/neo4j-graph-database/) database, along with login credentials.

The steps below explain how to Initialize and configure a connector for local development. You can learn how to deploy a
connector — after it's been configured — [here](https://hasura.io/docs/3.0/getting-started/deployment/deploy-a-connector).

## Using the Neo4j connector

### Step 1: Authenticate your CLI session

```bash
ddn auth login
```

### Step 2: Configure the connector

Once you have an initialized supergraph and subgraph, run the initialization command in interactive mode while providing a name for the connector in the prompt:

```bash
ddn connector init neo4j -i
```

#### Step 2.1: Choose the `neo4j/neo4j` option from the list

#### Step 2.2: Choose a port for the connector

The CLI will ask for a specific port to run the connector on. Choose a port that is not already in use or use the default suggested port.

#### Step 2.3: Provide the env var(s) for the connector

| Name | Description |
|-|-|
| NEO4J_URL        | The connection string for the Neo4j database |
| NEO4J_USER | The username for the Neo4J database |
| NEO4J_PASS | The password for the Neo4J database |

You'll find the environment variables in the `.env` file and they will be in the format:

`<SUBGRAPH_NAME>_<CONNECTOR_NAME>_<VARIABLE_NAME>`

Here is an example of what your `.env` file might look like:

```
APP_NEO4J_AUTHORIZATION_HEADER="Bearer vrHKneV3KIs-qz5dbIbFsg=="
APP_NEO4J_HASURA_SERVICE_TOKEN_SECRET="vrHKneV3KIs-qz5dbIbFsg=="
APP_NEO4J_NEO4J_PASS="2j..."
APP_NEO4J_NEO4J_URL="neo4j+s://47b154c4.databases.neo4j.io"
APP_NEO4J_NEO4J_USER="neo4j"
APP_NEO4J_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="http://local.hasura.dev:4317"
APP_NEO4J_OTEL_SERVICE_NAME="app_neo4j"
APP_NEO4J_READ_URL="http://local.hasura.dev:8781"
APP_NEO4J_WRITE_URL="http://local.hasura.dev:8781"
```

### Step 3: Introspect the connector

Introspecting the connector will generate a `configuration.json` file and a `neo4j.hml` file.

```bash
ddn connector introspect neo4j
```

### Step 4: Add your resources

You can add the models, commands, and relationships to your API by tracking them which generates the HML files. 

```bash
ddn connector-link add-resources neo4j
```