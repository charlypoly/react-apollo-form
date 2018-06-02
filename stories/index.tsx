// tslint:disable-next-line:no-unused-variable
import { storiesOf } from '@storybook/react';
import { graphqlSync, introspectionQuery, DocumentNode, IntrospectionQuery } from 'graphql';
import { fromIntrospectionQuery } from 'graphql-2-json-schema';
import gql from 'graphql-tag';
import { JSONSchema6 } from 'json-schema';
import { keys } from 'lodash';
import * as React from 'react';
import { ApolloConsumer, Mutation } from 'react-apollo';
import { FieldProps } from 'react-jsonschema-form';
import { schema } from '../graphql-mock';
import { configure, ApolloFormConfigureTheme } from '../lib/forms/component';
const { Button, Input, Checkbox, Header, Form } = require('semantic-ui-react');
const { withKnobs, select, boolean: bool } = require('@storybook/addon-knobs/react');

const introspection = graphqlSync(schema, introspectionQuery).data as IntrospectionQuery;
const jsonSchema = fromIntrospectionQuery(introspection);
const document = gql`
    mutation createTodo($todo: TodoInputType!) {
        create_todo(todo: $todo) {
            id
        }
    }
`;

const theme: ApolloFormConfigureTheme = {
    templates: {
        FieldTemplate: props => {
            const { classNames, help, description, errors, children, rawErrors, label } = props;
            return (
                <Form.Field>
                    <label>{label}{props.required && '*'}</label>
                    {children}
                    <span>{description}</span>
                </Form.Field>
            );
        },
        ObjectFieldTemplate: props => {
            return (
                <div>
                    {props.properties.map(p => p.content)}
                </div>
            );
        }
    },
    fields: {
        StringField: (p: FieldProps) => (
            <Input value={p.formData} onChange={
                (e: React.SyntheticEvent<HTMLInputElement>) => p.onChange(e.currentTarget.value)
            } />
        ),
        BooleanField: (p: FieldProps) => (
            <Checkbox label={p.title} checked={p.formData} onChange={
                (e: React.SyntheticEvent<HTMLInputElement>) => p.onChange(e.currentTarget.value)
            } />
        )
    },
    renderers: {
        saveButton: p => (
            <Button onClick={p.save} primary={true}>
                Save
            </Button>
        ),
        cancelButton: p => (
            <Button onClick={p.cancel}>
                Cancel
            </Button>
        ),
        header: p => (
            <Header as="h1">{p.title}</Header>
        )
    }
};

storiesOf('ApolloForm', module)
    .addDecorator(withKnobs)
    .add('default forms', () => {
        return (
            <ApolloConsumer>
                {client => {
                    const withTheme = bool('withTheme', true);
                    const ApplicationForm = configure({
                        client,
                        jsonSchema,
                        theme: withTheme ? theme : undefined
                    });
                    const mutations = keys((jsonSchema.properties.Mutation as JSONSchema6).properties);
                    const mutationName = select('Mutation', mutations, 'create_todo');
                    return (
                        <ApplicationForm
                            title={'Todo Form'}
                            config={{
                                mutation: {
                                    name: mutationName,
                                    document
                                }
                            }}
                            data={{}}
                            ui={{
                                todo: {
                                    name: {
                                        'ui:label': 'Task name'
                                    },
                                    completed: {
                                        'ui:label': 'is task completed?'
                                    }
                                }
                            }}
                        >
                            {
                                form => (
                                    <Form>
                                        <div style={{ padding: '20px' }}>
                                            {form.header()}
                                            {form.form()}
                                            {form.buttons()}
                                        </div>
                                    </Form>
                                )
                            }
                        </ApplicationForm>
                    );
                }}
            </ApolloConsumer>
        );
    });
