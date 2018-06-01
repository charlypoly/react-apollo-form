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
"scripts": {
    /* ... */
    "react-apollo-form": "react-apollo-form fetch-mutations <graphql_endpoint> --outputDir <dir>"
}

```

*(this will generate a `schema.json` and `mutations.d.ts` file)*


### Usage

```ts
import gql from 'graphql-tag';
import { configure } from 'react-apollo-form';

// assume we have a client and a jsonSchema variables
const Form = configure<ApolloFormMutationNames>({
    client,
    jsonSchema
});

<Form
    config={{
        mutation: {
            name: 'create_todo',
            document: gql`mutation {...}`
        }
    }}
    data={{}}
/>

```


### Architecture


The idea is to build forms using mutations from the GraphQL API.

*// TODO*