// tslint:disable:no-console
// tslint:disable:no-any
import { JSONSchema6 } from 'json-schema';
import { omit, pick, reduce } from 'lodash';

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

export namespace ApolloFormBuilder {

    // little helper.
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
        jsonSchema: JSONSchema6,
        name: string,
        options: FromMutationOptions = defaultFromMutationOptions
    ): PropertiesConfiguration => {
        const mutation = (jsonSchema.properties.Mutation as JSONSchema6).properties[name] as JSONSchema6;
        if (mutation) {
            const args = mutation.properties.arguments as JSONSchema6;
            if (args) {
                return {
                    properties: filterProperties(
                        reduce<JSONSchema6, { [k: string]: any }>(
                            args.properties,
                            (prev, curr, k) => {
                                prev[k] = curr;
                                return prev;
                            },
                            {}
                        ),
                        options.exclude!,
                        'exclusive'
                    ),
                    required: mutation.required.filter(r => !(options.exclude || []).includes(r))
                };
            } else {
                console.error(`mutation ${name} has no arguments`);
                return {};
            }
        }
        console.error(`unknown mutation ${name}`);
        return {};
    };

    // compose a final schema given different parts
    //  the developer provide a `properties` (or mutation) to <ApolloForm>
    //      `jsonSchema` is global to the builded component via configure()
    export const getSchema = (jsonSchema: JSONSchema6, properties: object, required: string[] = []) => {
        return {
            type: 'object',
            properties,
            required,
            definitions: jsonSchema.definitions || {}
        } as any;
    };
}
