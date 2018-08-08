// tslint:disable:no-any
import { PureQueryOptions } from 'apollo-client';
import { every, reduce } from 'async';
import { DocumentNode } from 'graphql';
import { JSONSchema6 } from 'json-schema';
import {
    cloneDeep, filter, get,
    has, isPlainObject, isUndefined,
    last,
    map,
    merge,
    set,
    take,
    transform,
    uniq,
    unset,
    Dictionary,
    MemoVoidDictionaryIterator
} from 'lodash';
import { RefetchQueriesProviderFn } from 'react-apollo';
import { UiSchema } from 'react-jsonschema-form';
import { retrieveSchema } from 'react-jsonschema-form/lib/utils';
import { isObject } from 'util';
import { ApolloFormUi } from './component';
import { ApolloFormBuilder } from './definitions';

// ApolloForm options object is composed of 2 modes : "mutation" or "manual"
export type ApolloFormConfigBase = {
    name?: string;
    // ability to ignore specific fields, eg: ["user.id"]
    ignoreFields?: string[];
    // ability to set specific fields to required, eg: ["user.email"]
    requiredFields?: string[];
    // update a existing field config (merge, not override)
    updateFields?: { [k: string]: object };
    // update directly schema (merge, not override)
    augment?: object;
};
export interface ApolloFormConfigMutation extends ApolloFormConfigBase {
    mutation: {
        name: string;
        document: DocumentNode;
        variables?: object;
        context?: object;
        refetchQueries?: string[] | PureQueryOptions[] | RefetchQueriesProviderFn;
    };
}
export interface ApolloFormConfigManual extends ApolloFormConfigBase {
    schema: JSONSchema6;
    saveData: (formData: any) => any;
}
export type ApolloFormConfig = ApolloFormConfigManual | ApolloFormConfigMutation;

// type guard
export const isMutationConfig = (config: ApolloFormConfig): config is ApolloFormConfigMutation => {
    return !!get(config, 'mutation') && !!get(config, 'mutation.name');
};

// Given a schema, expand properties that reference a definition
export const flattenSchemaProperties = (entrySchema: any): any => {
    const reducer = (schema: any, definitions: any) => {
        return transform(
            schema.properties,
            (result, value, key) => {
                if (get(value, '$ref')) {
                    result[key] = cloneDeep(retrieveSchema(value, definitions));
                } else {
                    result[key] = has(value, 'properties') ?
                        { ...value, properties: reducer(value, definitions) }
                        : value;
                }
                return result;
            },
            {}
        );
    };
    return reducer(entrySchema, entrySchema.definitions || {});
};

// Given a UiSchema, a JSON Schema and data
//  remove all schema not matching UiSchema "ui:if" predicates
const applyConditionsReducer =
    (ui: UiSchema & ApolloFormUi, data: object) =>
        (acc: JSONSchema6, curr: JSONSchema6, key: string) => {
            const propUi: (UiSchema & ApolloFormUi) | undefined = get(ui, key);
            const prop = last(key.split('.'));
            if (propUi && propUi['ui:if']) {
                if (
                    filter(propUi['ui:if'], (predicate, k) => {
                        const value = get(data, k);
                        return predicate && predicate !== value;
                    }).length === 0
                ) {
                    Object.assign(acc, curr);
                }
            } else if (has(curr, 'properties')) {
                Object.assign(
                    acc,
                    {
                        [prop]: {
                            type: 'object',
                            properties: {},
                            ...(curr.required ? { required: curr.required } : {})
                        }
                    }
                );
                map(curr.properties, (v, k) => {
                    (acc as any)[prop].properties[k] =
                        applyConditionsReducer(ui, data)({}, v as JSONSchema6, `${key}.${k}`);
                });
            } else {
                Object.assign(acc, curr);
            }
            return acc;
        };

export const applyConditionsToSchema =
    (jsonSchema: JSONSchema6, ui: UiSchema & ApolloFormUi, data: object): JSONSchema6 => {
        const schema = cloneDeep(jsonSchema);
        return schema.properties ?
            Object.assign(
                {},
                schema,
                {
                    properties: transform(
                        schema.properties,
                        applyConditionsReducer(ui, data),
                        {}
                    )
                }
            ) :
            schema;
    };

// Given a config, return a valid JSON Schema
export const getSchemaFromConfig = (jsonSchema: JSONSchema6, config: ApolloFormConfig, title?: string): JSONSchema6 => {
    let schema: any;
    // generated schema given mode: "manual" or "mutation"
    if (!isMutationConfig(config)) {
        schema = ApolloFormBuilder.getSchema(
            jsonSchema,
            config.schema.properties || {}
        );
    } else {
        const mutationConfig = ApolloFormBuilder.getMutationConfig(jsonSchema, config.mutation.name);
        schema = ApolloFormBuilder.getSchema(
            jsonSchema,
            mutationConfig.properties as any,
            mutationConfig.required
        );
    }

    let flattenSchema = cloneDeep(Object.assign({}, schema, { properties: flattenSchemaProperties(schema) }));

    // schema modifiers
    if (config.ignoreFields) {
        config.ignoreFields.map(f => {
            unset(flattenSchema.properties, f.replace(/\./g, '.properties.'));
            const pathParts = f.split('.');
            const prop = pathParts.pop(); // remove prop
            const parentPath = pathParts.join('.properties.');
            const parentRequired = get(flattenSchema.properties, `${parentPath}.required`);
            if (parentRequired.includes(prop)) {
                set(flattenSchema.properties, `${parentPath}.required`, filter(parentRequired, v => v !== prop));
            }
        });
    }

    if (config.updateFields) {
        map(config.updateFields, (fieldDef, fieldName) => {
            const name = fieldName.replace(/\./g, '.properties.');
            set(
                flattenSchema.properties,
                name,
                merge(get(flattenSchema.properties, name), fieldDef)
            );
        });
    }

    if (config.requiredFields) {
        map(config.requiredFields, fieldName => {
            const parts = fieldName.split('.');
            const prop = last(parts);
            const parentsPaths = take(parts, parts.length - 1);
            const name = parentsPaths.join('.').replace(/\./g, '.properties.');
            const newRequired = uniq([...get(flattenSchema.properties, `${name}.required`), prop]);
            set(
                flattenSchema.properties,
                `${name}.required`,
                newRequired
            );
        });
    }

    if (config.augment) {
        flattenSchema = merge({}, flattenSchema, config.augment);
    }

    return flattenSchema;
};

// Custom errors messages implementations
export type ReactJsonschemaFormError = {
    message: string;
    name: string;
    params: object;
    property: string;
    stack: string;
};

// Given formData and form properties, remove all formData properties not present in form properties
export const cleanData = (formData: object, properties: object, parentPath: string | null = null): object => {
    return transform(
        formData as {},
        (acc, curr, key) => {
            const currentPath = parentPath ? `${parentPath}.${key}` : key;
            if (has(properties, currentPath.replace(/\./g, '.properties.'))) {
                if (isPlainObject(curr)) {
                    acc[key] = cleanData(curr, properties, currentPath);
                } else {
                    acc[key] = curr;
                }
            }
            return acc;
        },
        {}
    );
};

// awesome util for all components
//      - Get prop boolean value even if undefined
export const isTruthyWithDefault = (value: undefined | boolean, defaultValue = true) => {
    return isUndefined(value) ? defaultValue : !!value;
};
