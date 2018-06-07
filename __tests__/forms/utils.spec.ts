import { schema, types } from 'functional-json-schema';
import { JSONSchema6 } from 'json-schema';
import { merge } from 'lodash';
import { UiSchema } from 'react-jsonschema-form';
import { ApolloFormUi } from '../../lib/forms/component';
import {
    applyConditionsToSchema,
    cleanData,
    flattenSchemaProperties,
    isMutationConfig,
    ApolloFormConfigManual,
    ApolloFormConfigMutation
} from '../../lib/forms/utils';

describe('forms/utils', () => {

    describe('isMutationConfig()', () => {
        test('with ApolloFormConfigManual', () => {
            const config: ApolloFormConfigManual = {
                schema: {},
                saveData: () => ({})
            };
            expect(isMutationConfig(config)).toBe(false);
        });
        test('with ApolloFormConfigMutation', () => {
            const config: ApolloFormConfigMutation = {
                mutation: {
                    name: 'my_mutation',
                    document: null
                }
            };
            expect(isMutationConfig(config)).toBe(true);
        });
    });

    describe('flattenSchemaProperties()', () => {
        test('should expand definitions', () => {
            const todoSchema: JSONSchema6 = require('../mocks/todo-json-schema.json');
            const mySchema: JSONSchema6 = {
                '$schema': 'http://json-schema.org/draft-06/schema#',
                properties: {
                    a: { '$ref': '#/definitions/Todo' }
                },
                definitions: todoSchema.definitions
            };
            expect(
                flattenSchemaProperties(mySchema)
            ).toEqual({
                a: {
                    type: 'object',
                    properties: {
                        completed: { type: 'boolean' },
                        id: { type: 'string' },
                        name: { type: 'string' }
                    }, required: ['id', 'name']
                }
            });
        });
    });

    describe('applyConditionsToSchema()', () => {
        test('should update schema following "ui:if"', () => {

            const jsonSchema: JSONSchema6 = schema({
                form: {
                    referAFriend: types.type('boolean'),
                    friendName: types.type('string')
                }
            });
            const uiSchema: UiSchema & ApolloFormUi = {
                form: {
                    friendName: {
                        'ui:if': {
                            'form.referAFriend': true
                        }
                    }
                }
            };
            const data = {
                form: {
                    referAFriend: false
                }
            };

            expect(applyConditionsToSchema(jsonSchema, uiSchema, data).properties).toEqual(merge(
                schema({
                    form: {
                        referAFriend: types.type('boolean'),
                    }
                }).properties,
                { form: { properties: { friendName: {} } } }
            ));

        });
    });

    describe('cleanData()', () => {
        test('should remove extraneous properties', () => {
            const jsonSchema: JSONSchema6 = schema({
                form: {
                    referAFriend: types.type('boolean'),
                    friendName: types.type('string')
                }
            });
            const data = {
                form: {
                    a: 1,
                    referAFriend: false,
                    b: {
                        c: 1
                    }
                }
            };
            expect(cleanData(data, jsonSchema.properties)).toEqual({
                form: {
                    referAFriend: false,
                }
            });
        });
    });

});
