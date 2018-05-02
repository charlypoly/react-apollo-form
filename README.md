# react-apollo-form
React form generation from GraphQL API (Apollo only)


The idea is to build forms using mutations from the GraphQL API.

```
+-------------+ +-------------------------------------+
| GraphQL     | |     Front app CLI Tools             |
| API (server)| |                                     |
|             | |        +------->--+                 |
|             | |        |          |                 |
| +---------+ | +--------+----+ +---v---------+       |
| |mutations| | | schema      | | GraphQL     |       |
| |         +-->| introspect  | | AST         +--+    |
| +---------+ | +-------------+ +-------------+  |    |
|             | |                                |    |
|             | |               +-------------+  |    |
|             | |         +-----+ JSON Schema <--+    |
|             | |         |     |             |       |
+-------------+ |         |     +-------------+       |
                +-------------------------------------+
                |         |                           |
                |      +--v------------+              |
                |      |               |              |
                |      |  React Form   |              |
                |      |  from mutation|              |
                |      |  JSON Schema  |              |
                |      +---------------+              |
                |                                     |
                |         Front Developer Experience  |
                +-------------------------------------+

```

Given targeted GraphQL API, the tools extract all informations about available mutations to JSON Schema format.
The generated JSON Schema file is then used at runtime to extract mutation arguments to a valid JSON Schema properties.
