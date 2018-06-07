import gql from 'graphql-tag';
import { isMutationConfig, ApolloFormConfigManual, ApolloFormConfigMutation } from '../../lib/forms/utils';

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
});
