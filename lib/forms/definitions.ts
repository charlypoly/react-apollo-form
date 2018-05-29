// tslint:disable:no-console
// tslint:disable:no-any
import * as definitions from '../JSON-schema.json';
import { reduce, omit, pick } from 'lodash';

export const _mutations = _def.Mutation.properties;
export type MutationTypes = ApolloFormMutationNames;

export const getFormDefinitions = () => _def;

type FromMutationOptions = {
    exclude?: string[];
};

const defaultFromMutationOptions: FromMutationOptions = {
    exclude: ['id'] // id field is always excluded from mutation arguments
};

type PropertiesConfiguration = {
    properties?: object;
    required?: string[];
};

export namespace AlineFormBuilder {

    export const filterProperties = (
        properties: { [k: string]: { title: string } },
        paths: string[],
        mode: 'exclusive' | 'inclusive' = 'exclusive'
    ) => {
        return mode === 'exclusive' ?
            omit(properties, paths) :
            pick(properties, paths);
    };

    // Extract mutation arguments to valid JSON Schema properties
    export const getMutationConfig = (
        name: keyof typeof _mutations,
        options: FromMutationOptions = defaultFromMutationOptions
    ): PropertiesConfiguration => {
        const mutation = _mutations[name];
        if (mutation) {
            if (mutation.arguments) {
                return {
                    properties: filterProperties(
                        reduce(
                            mutation.arguments,
                            (prev, curr) => {
                                (prev as any)[(curr as any).title] = curr;
                                return prev;
                            },
                            {}
                        ),
                        options.exclude!,
                        'exclusive'
                    ),
                    required: (mutation.required as string[]).filter(r => !(options.exclude || []).includes(r))
                };
            } else {
                console.error(`mutation ${name} has no arguments`);
                return {};
            }
        }
        console.error(`unknown mutation ${name}`);
        return {};
    };

    export const getSchema = (properties: object, required: string[] = []) => {
        return {
            type: 'object',
            properties,
            required,
            definitions: getFormDefinitions()
        } as any;
    };
}
