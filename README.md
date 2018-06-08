# &lt;ApolloForm&gt; ![https://img.shields.io/circleci/project/github/wittydeveloper/react-apollo-form.svg](https://img.shields.io/circleci/project/github/wittydeveloper/react-apollo-form.svg) ![https://img.shields.io/npm/v/react-apollo-form.svg](https://img.shields.io/npm/v/react-apollo-form.svg) ![https://img.shields.io/npm/dt/react-apollo-form.svg](https://img.shields.io/npm/dt/react-apollo-form.svg)

*Build React forms based on GraphQL APIs.*

![https://s3.eu-west-2.amazonaws.com/github-oss/react-apollo-form/read-me-demo-preview.png](https://s3.eu-west-2.amazonaws.com/github-oss/react-apollo-form/read-me-demo-preview.png)

-------------------------

### To get started more easily, please read [Getting started: build a GraphQL Form in 5 minutes](https://github.com/wittydeveloper/react-apollo-form/wiki/Getting-started:-build-a-GraphQL-Form-in-5-minutes)


-------------------------

## Pre-requisites

- `apollo-codegen` (globally)
- `react@^15` 
- `react-apollo@^15`

*Optionally*
- `typescript@^2.8.4`

-------------------------

## Installation


### Install package
- install `yarn add react-apollo-form`

### Add script to your project
- add to your `package.json`, at the `scripts` section :

```json
{
    "scripts": {
        "react-apollo-form": "react-apollo-form fetch-mutations <graphql_endpoint> <outpurDir>"
    }
}

```

This script will generated 3 files needed by `<ApolloForm>`:
- `schema.json` (GraphQL Introspection Query result as JSON)
- `mutations.d.ts` (all available mutations names as TypeScript type definition)
- `apollo-form-json-schema.json` (GraphQL Schema as JSON Schema)

*Tips: you can change the output directory of theses with the second argument or `-o` option*

-------------------------

## Usage

Once the files generated, we can setup a Form.

```ts
import * as React from 'react';
import gql from 'graphql-tag';
import { configure } from 'react-apollo-form';
import { client } from './apollo';
import { applicationFormTheme } from './core/forms/themes/application';


const jsonSchema = require('./core/apollo-form-json-schema.json');

export const ApplicationForm = configure<ApolloFormMutationNames>({
    // tslint:disable-next-line:no-any
    client: client as any,
    jsonSchema,
    theme: applicationFormTheme
});

<ApplicationForm
    config={{
        mutation: {
            name: 'create_todo',
            document: gql`mutation {...}`
        }
    }}
    data={{}}
/>
```

-------------------------

## API

`ApolloForm` is based on the amazing Mozilla library [react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form).
Most of the questions regarding JSON Schema, validations or rendering are in [react-jsonschema-form documentation](https://github.com/mozilla-services/react-jsonschema-form)

To get started more easily, please read [Getting started: build a GraphQL Form in 5 minutes](https://github.com/wittydeveloper/react-apollo-form/wiki/Getting-started:-build-a-GraphQL-Form-in-5-minutes)

The following subjects are specific to `ApolloForm`:

- [configure your "Form component"](https://github.com/wittydeveloper/react-apollo-form/wiki/configure-your-%22Form-component%22)
- [Theming](https://github.com/wittydeveloper/react-apollo-form/wiki/Theming)
- [Build a form without mutation](https://github.com/wittydeveloper/react-apollo-form/wiki/Build-a-form-without-mutation)
- [Add a form specific Widget (outside a theme)](https://github.com/wittydeveloper/react-apollo-form/wiki/Add-a-form-specific-Widget-(outside-a-theme))
- [Conditional fields](https://github.com/wittydeveloper/react-apollo-form/wiki/Conditional-fields)
- [Form rendering customisation](https://github.com/wittydeveloper/react-apollo-form/wiki/Form-Rendering-customisation-with-renderers)
- [Add RegExp constraint to a field](https://github.com/wittydeveloper/react-apollo-form/wiki/Add-regex-constraints-to-a-field)
- [Error messages customization](https://github.com/wittydeveloper/react-apollo-form/wiki/Error-messages-customisation)

-------------------------

## Q&A

- **Can I make `ApolloForm` works with many GraphQL endpoints?**

*Yes, just setup multiple scripts in your project `package.json` with one output folder per endpoint,
then just configure a "component form" for each endpoint*

- **Where can I find some documentation about `widgets`, `fields` or theming in general?**

*Please take a look at the [react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form) documentation that will answers 90% of the rendering questions.
If not, please take a look at [Theming](https://github.com/wittydeveloper/react-apollo-form/wiki/Theming)*

-------------------------

## Architecture



### General

The idea is to build forms using mutations from the GraphQL API.


`ApolloForm` is "just" a wrapper around [react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form).

It brings some "embed" features: 
- JSON schema generation from GraphQL Schema
- conditionals forms
- form rendering customisation with `render props`
- build JSON Schema with functions (with [functional-json-schema](https://github.com/wittydeveloper/functional-json-schema))

### GraphQL to JSON Schema

See [graphql-2-json-schema](https://github.com/wittydeveloper/graphql-to-json-schema) package.
