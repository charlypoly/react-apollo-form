import { JSONSchema6 } from 'json-schema';
import {
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

});
