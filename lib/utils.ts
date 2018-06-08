import * as fs from 'fs';
import { IntrospectionObjectType, IntrospectionQuery } from 'graphql';

// Given a schema.json (GraphQL Introspection Query dump)
//  return all exposed mutations names
export const extractMutationsNamesFromFile = (filePath: string): string[] | void => {
    const content = fs.readFileSync(filePath);
    if (content) {
        const introspection = JSON.parse(content.toString()).data as IntrospectionQuery;
        return extractMutationsNamesFromIntrospection(introspection);
    } else {
        throw new Error(`Unable to read ${filePath}`);
    }

};

export const extractMutationsNamesFromIntrospection = (introspection: IntrospectionQuery): string[] | void => {
    const { name: mutationType } = introspection.__schema.mutationType;
    const mutations =
        introspection.__schema.types.find(t => t.name === mutationType) as (IntrospectionObjectType | undefined);
    return mutations ?
        mutations.fields.map(f => f.name) :
        [];
};

// `mutations.d.ts` file template
export const generateMutationTypesDef = (mutations: string[]): string => {
    return (
        `
/* this file is generated, do not edit and keep it in tsconfig.rootDir scope! */

declare type ApolloFormMutationNames = ${mutations.map(m => `'${m}'`).join(' | ')};
`
    );
};
