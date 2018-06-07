// tslint:disable-next-line:no-unused-variable
import { storiesOf } from '@storybook/react';
import { graphqlSync, introspectionQuery, IntrospectionQuery } from 'graphql';
import { fromIntrospectionQuery } from 'graphql-2-json-schema';
import gql from 'graphql-tag';
import { JSONSchema6 } from 'json-schema';
import { keys } from 'lodash';
import * as React from 'react';
import { ApolloConsumer } from 'react-apollo';
import { FieldProps } from 'react-jsonschema-form';
import { schema as mockSchema } from '../graphql-mock';
import { configure, ApolloFormConfigureTheme } from '../lib/forms/component';
import { ErrorListComponent } from '../lib/forms/renderers';
import { ReactJsonschemaFormError } from '../lib/forms/utils';
const { Button, Input, Checkbox, Header, Form, Message } = require('semantic-ui-react');
const { withKnobs, select, boolean: bool } = require('@storybook/addon-knobs/react');

const introspection = graphqlSync(mockSchema, introspectionQuery).data as IntrospectionQuery;
const jsonSchema = fromIntrospectionQuery(introspection);
const document = gql`
    mutation createTodo($todo: TodoInputType!) {
        create_todo(todo: $todo) {
            id
        }
    }
`;

const ErrorList: ErrorListComponent = p => (
    <Message
        error={true}
        visible={true}
        header="There was some errors"
        list={p.errors.map(e => e.message)}
    />
);

const transformErrors = (prefix: string) => (errors: ReactJsonschemaFormError[]) => {
    return errors.map(error => ({
        ...error,
        message: `FormError.${prefix}${error.property}.${error.name}`
    }));
};

const theme: ApolloFormConfigureTheme = {
    templates: {
        FieldTemplate: props => {
            const { description, children, label } = props;
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
                (e: React.SyntheticEvent<HTMLInputElement>, data: object) => {
                    // tslint:disable-next-line:no-any
                    p.onChange((data as any).checked);
                }
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
                    const liveValidate = bool('liveValidate', false);
                    const showErrorsList = bool('showErrorsList', true);
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
                            liveValidate={liveValidate}
                            config={{
                                mutation: {
                                    name: mutationName,
                                    document
                                }
                            }}
                            data={{}}
                            ui={{
                                showErrorsList: showErrorsList,
                                errorListComponent: ErrorList,
                                todo: {
                                    name: {
                                        'ui:label': 'Task name'
                                    },
                                    completed: {
                                        'ui:label': 'is task completed?'
                                    }
                                }
                            }}
                            transformErrors={transformErrors}
                        >
                            {
                                form => (
                                    <Form>
                                        <div style={{ padding: '20px' }}>
                                            {form.header()}
                                            {form.form()}
                                            {form.buttons()}
                                            {JSON.stringify(form.data)}
                                        </div>
                                    </Form>
                                )
                            }
                        </ApplicationForm>
                    );
                }}
            </ApolloConsumer>
        );
    }).add('with conditionals', () => {
        return (
            <ApolloConsumer>
                {client => {
                    const withTheme = bool('withTheme', true);
                    const liveValidate = bool('liveValidate', false);
                    const showErrorsList = bool('showErrorsList', true);
                    const ApplicationForm = configure({
                        client,
                        jsonSchema,
                        theme: withTheme ? theme : undefined
                    });

                    return (
                        <ApplicationForm
                            title={'Todo Form'}
                            liveValidate={liveValidate}
                            config={{
                                name: 'todo',
                                schema: {
                                    type: 'object',
                                    properties: {
                                        shipping: {
                                            type: 'object',
                                            properties: {
                                                billingSameAsDelivery: { type: 'boolean' },
                                                billing: {
                                                    type: 'object',
                                                    properties: {
                                                        address: { type: 'string' }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } as JSONSchema6,
                                saveData: data => {
                                    // tslint:disable-next-line:no-console
                                    console.log('save !', data);
                                }
                            }}
                            data={{}}
                            ui={{
                                showErrorsList: showErrorsList,
                                errorListComponent: ErrorList,
                                shipping: {
                                    billing: {
                                        'ui:if': {
                                            'shipping.billingSameAsDelivery': true
                                        },
                                    }
                                }
                            }}
                            transformErrors={transformErrors}
                        >
                            {
                                form => (
                                    <Form>
                                        <div style={{ padding: '20px' }}>
                                            {form.header()}
                                            {form.form()}
                                            {form.buttons()}
                                            {JSON.stringify(form.data)}
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
