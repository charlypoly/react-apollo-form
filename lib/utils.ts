import * as fs from 'fs';
import { IntrospectionObjectType, IntrospectionQuery } from 'graphql';

export const extractMutationsNames = (filePath: string): string[] | void => {
    const content = fs.readFileSync(filePath);
    if (content) {
        const json = JSON.parse(content.toString()).data as IntrospectionQuery;
        const { name: mutationType } = json.__schema.mutationType;
        const mutations =
            json.__schema.types.find(t => t.name === mutationType) as (IntrospectionObjectType | undefined);
        return mutations ?
            mutations.fields.map(f => f.name) :
            [];
    } else {
        throw new Error(`Unable to read ${filePath}`);
    }
};

export const generateMutationTypesDef = (mutations: string[]): string => {
    return (
        `
/* this file is generated, do not edit and keep it in tsconfig.rootDir scope! */

declare type ApolloFormMutationNames = ${mutations.map(m => `'${m}'`).join(' | ')};
`
    );
};
