# react-apollo-form
React form generation from GraphQL API (Apollo only)

### Pre-requisites

- `apollo-codegen` (globally)
- `react@^15` 
- `react-apollo@^15` 

### Installation

- install `yarn add react-apollo-form`
- add to your `package.json`, at the `scripts` section :

```json
"scripts: [
    /* ... */
    "sync_forms": "react-apollo-form fetch-mutations <graphql_endpoint> --outputDir <dir>"
]

```

*(this will generate a `schema.json` and `mutations.d.ts` file)*


### Usage

Given the following `update_user` mutation:

and following component:

![https://s3.eu-west-2.amazonaws.com/github-oss/react-apollo-form/read-me-demo.png](https://s3.eu-west-2.amazonaws.com/github-oss/react-apollo-form/read-me-demo.png)

it, will generate the following form:


### Architecture


The idea is to build forms using mutations from the GraphQL API.

```
+-------------+ +-------------------------------------+
| GraphQL     | |     Front app CLI Tools             |
| API (server)| |                                     |
|             | |        +------->--+                 |
|             | |        |          |                 |
|             | +--------+----+ +---v---------+       |
| +---------+ | | schema      | | GraphQL     |       |
| |mutations+-->| introspect  | | AST         +->+    |
| +---------+ | +-------------+ +-------------+  |    |
|             | +--------------------------------|----+
|             | |               +-------------+  |    |
|             | |         +-----+ JSON Schema |<-+    |
|             | |         |     | (at runtime)|       |
+-------------+ |         |     +-------------+       |
                |         v                           |
                |      +-----------------+            |
                |      |                 |            |
                |      |  React Form     |            |
                |      |  from mutation  |            |
                |      |  JSON Schema    |            |
                |      +-----------------+            |
                |                                     |
                |         Front Developer Experience  |
                +-------------------------------------+

```

Given targeted GraphQL API, the tools extract all informations about available mutations to JSON Schema format.
The generated JSON Schema file is then used at runtime to extract mutation arguments to a valid JSON Schema properties.


### Roadmap

#### 1.0

-