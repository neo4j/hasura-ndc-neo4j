# hasura-ndc-neo4j

### To start the server:

1. Make sure there is a `configuration.json` file at the root level. The file should look like this:

```json
{
  "neo4j_url": "neo4j://localhost:7687/neo4j",
  "neo4j_user": "",
  "neo4j_pass": ""
}
```

The config property is optional and if not configured, the server will introspect the Neo4j DB in order to create the GraphQL operations.
To control the design of the GraphQL operations, the `config` property can be specified. An example can be found in the `__tests__/data/configuration.json` file.

2. Run `npm install`

3. Run `npm start`

### To run the Hasura tests:

1. Make sure the server is started by following the instructions above.

2. Run `cargo run --bin ndc-test -- test --endpoint http://localhost:8100` from the `ndc-spec`. More info can be found [here](https://github.com/hasura/ndc-spec/tree/main#test-an-agent).

### To test the features of the connector by sending different requests and asserting the responses:

1. Make sure the server is started in test mode. For this, follow the instructions above but run the `npm run start:test` command as the last step.

2. Run `npm run test`

3. Any new tests you want to run should be inside the `__tests__/requests` folder and should follow the schema described in the `__tests__/data/configuration.json` file
