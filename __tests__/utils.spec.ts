import { IntrospectionQuery } from 'graphql';
import { extractMutationsNamesFromIntrospection } from '../lib/utils';

describe('utils', () => {

    test('extractMutationsNamesFromIntrospection()', () => {
        const introspection: IntrospectionQuery = require('./mocks/todo-introspection.json');
        const mutations = extractMutationsNamesFromIntrospection(introspection);
        expect(mutations).toEqual([
            'update_todo',
            'create_todo',
        ]);
    });
});
