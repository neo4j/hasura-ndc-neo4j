# hasura-ndc-neo4j

### To start the server:

All commands will require some environment variables to connect to your Neo4j instance, for example:
NEO4J_URL=neo4j://localhost:7687/neo4j
NEO4J_USER=<user>
NEO4J_PASS=<password>

Remember to provide them when running the following commands.

#### Prerequisite: Set-up configuration file

Use the included CLI tool by running `npm run update:config`.
This will introspect your database and create the corresponding configuration file in the root directory, named `configuration.json`. The connector will use this file in running mode.

2. Run `npm install`

3. Run `npm start`

### To run the Hasura tests:

1. Make sure the server is started by following the instructions above.

2. Run `cargo run --bin ndc-test -- test --endpoint http://localhost:8100` from the `ndc-spec`. More info can be found [here](https://github.com/hasura/ndc-spec/tree/main#test-an-agent).

### To test the features of the connector by sending different requests and asserting the responses:

1. Make sure the server is started in test mode. For this, follow the instructions above but run the `npm run start:test` command as the last step.

2. Run `npm run test`

3. Any new tests you want to run should be inside the `__tests__/requests` folder and should follow the schema described in the `__tests__/data/configuration.json` file

## Development

Prerequisite: Steps 1-3 from https://hasura.io/docs/3.0/local-dev/#step-1-prerequisites

1. Start server locally

2. Make sure the connector URL is your local server URL

```yml
definition:
  name: neo4j_connector
  url:
    singleUrl:
      value: http://localhost:<PORT>
```

## Deploy connector

1. Start server locally

2. Use Hasura extension to refresh connector, track collections, track relationships

- only track Array relationships
- rename relationships if necessary

3. Start Hasura daemon: `hasura3 daemon start`

4. Get Tunnel Endpoint

- check if exists: `hasura3 tunnel list`
- or create one: `hasura3 tunnel create localhost:<PORT>`

5. Change connector URL to Tunnel Endpoint

6. Deploy connector: `hasura3 build create`

7. Run queries in Hasura Console using the latest build: https://console.hasura.io/project/grown-pegasus-6631
