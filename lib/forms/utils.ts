// tslint:disable:no-any
import { get, transform, unset, merge, map, set, has, isPlainObject, last, take, cloneDeep, uniq } from 'lodash';
import { AlineFormBuilder, MutationTypes } from './definitions';
import { DocumentNode } from 'graphql';
import { JSONSchema6 } from 'json-schema';
import { retrieveSchema } from 'react-jsonschema-form/lib/utils';
import { PureQueryOptions } from 'apollo-client';
import { RefetchQueriesProviderFn } from 'react-apollo';

// AlineForm options object is composed of 2 modes : "mutation" or "manual"
export type AlineFormConfigBase = {
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

export interface AlineFormConfigMutation extends AlineFormConfigBase {
    mutation: {
        name: MutationTypes;
        document: DocumentNode;
        variables?: object;
        context?: object;
        refetchQueries?: string[] | PureQueryOptions[] | RefetchQueriesProviderFn;
    };
}

export interface AlineFormConfigManual extends AlineFormConfigBase {
    schema: object;
    saveData: (formData: any) => any;
}

export type AlineFormConfig = AlineFormConfigManual | AlineFormConfigMutation;

// type guard
export const isMutationConfig = (config: AlineFormConfig): config is AlineFormConfigMutation => {
    return !!get(config, 'mutation') && get(config, 'mutation.name');
};

// Given a schema, expand properties that reference a definition
export const flattenSchemaProperties = (schema: any) => {
    return transform(
        schema.properties,
        (result, value, key) => {
            if (get(value, '$ref')) {
                result[key] = retrieveSchema(value, schema.definitions);
            } else {
                result[key] = value;
            }
            return result;
        },
        {}
    );
};

// Given a config, return a valid JSON Schema
export const getSchemaFromConfig = (config: AlineFormConfig, title?: string): JSONSchema6 => {
    let schema: any;
    // generated schema given mode: "manual" or "mutation"
    if (!isMutationConfig(config)) {
        schema = config.schema;
    } else {
        const mutationConfig = AlineFormBuilder.getMutationConfig(config.mutation.name);
        schema = AlineFormBuilder.getSchema(
            mutationConfig.properties as any,
            mutationConfig.required
        );
    }

    let flattenSchema = cloneDeep(Object.assign({}, schema, { properties: flattenSchemaProperties(schema) }));

    // schema modifiers
    if (config.ignoreFields) {
        config.ignoreFields.map(f => {
            unset(flattenSchema.properties, f.replace(/\./g, '.properties.'));
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
export const transformErrors = (prefix: string) => (errors: ReactJsonschemaFormError[]) => {
    return errors.map(error => ({
        ...error,
        message: t(`FormError.${prefix}${error.property}.${error.name}`)
    }));
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
