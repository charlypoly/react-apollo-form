// tslint:disable-next-line:no-unused-variable
import * as React from 'react';
import gql from 'graphql-tag';
import { storiesOf } from '@storybook/react';
import { DocumentNode, graphqlSync, introspectionQuery, IntrospectionQuery } from 'graphql';
import { configure } from '../lib/forms/component';
import { Mutation, ApolloConsumer } from 'react-apollo';
import { JSONSchema6 } from 'json-schema';
import { keys } from 'lodash';
import { schema } from '../graphql-mock';
import { fromIntrospectionQuery } from 'graphql-2-json-schema';
const { withKnobs, select, array, object } = require('@storybook/addon-knobs/react');

const introspection = graphqlSync(schema, introspectionQuery).data as IntrospectionQuery;
const jsonSchema = fromIntrospectionQuery(introspection);
const document = gql`
    mutation createTodo($todo: TodoInputType!) {
        create_todo(todo: $todo) {
            id
        }
    }
`

storiesOf('ApolloForm', module)
    .addDecorator(withKnobs)
    .add('default forms', () => {
        return (
            <ApolloConsumer>
                {client => {
                    const Form = configure({
                        client,
                        jsonSchema
                    })
                    const mutations = keys((jsonSchema.properties.Mutation as JSONSchema6).properties)
                    const mutationName = select('Mutation', mutations, 'create_todo');
                    return (
                        <Form
                            config={{
                                mutation: {
                                    name: mutationName,
                                    document
                                }
                            }}
                            data={{}}
                        />
                    );
                }}
            </ApolloConsumer>
        );
    });
