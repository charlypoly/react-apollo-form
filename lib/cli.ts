#!/usr/bin/env node
import * as codegen from 'apollo-codegen';
import * as fs from 'fs';
import { fstat } from 'fs';
import { fromIntrospectionQuery } from 'graphql-2-json-schema';
import * as path from 'path';
import * as yargs from 'yargs';
import { extractMutationsNamesFromFile, generateMutationTypesDef } from './utils';

// tslint:disable:no-console

process.on('unhandledRejection', error => { throw error; });
// tslint:disable-next-line:no-any
process.on('uncaughtException' as any, handleError);
function handleError(error: string) { console.error(error); process.exit(1); }

// tslint:disable-next-line:no-unused-expression
yargs
    .command(
        'fetch-mutations <url> <outputPath>',
        'Generate typings, and JSON Schema from GraphQL endpoint',
        {
            outputPath: {
                alias: 'o',
                demand: true,
                describe: 'Output path for generated files',
                default: '.',
                normalize: true,
                coerce: path.resolve,
            },
            header: {
                alias: 'H',
                describe: 'Additional header to send to the server as part of the introspection query request',
                type: 'array',
                coerce: arg => {
                    let additionalHeaders: { [k: string]: string } = {};
                    for (const header of arg) {
                        const separator = header.indexOf(':');
                        const name = header.substring(0, separator).trim();
                        const value = header.substring(separator + 1).trim();
                        if (!(name && value)) {
                            throw new Error('Headers should be specified as "Name: Value"');
                        }
                        additionalHeaders[name] = value;
                    }
                    return additionalHeaders;
                }
            },
            insecure: {
                alias: 'K',
                describe: 'Allows "insecure" SSL connection to the server',
                type: 'boolean'
            },
            method: {
                demand: false,
                describe: 'The HTTP request method to use for the introspection query request',
                type: 'string',
                default: 'POST',
                choices: ['POST', 'GET', 'post', 'get']
            }
        },
        async argv => {
            const { url, outputPath, header, insecure, method } = argv;

            try {
                // ------
                console.log('[1/3] downloadSchema ...');
                await codegen.downloadSchema(url, path.resolve(outputPath, 'schema.json'), header, insecure, method);

                // ------
                console.log('[2/3] generate mutations enum type ...');

                const mutationNames = extractMutationsNamesFromFile(path.resolve(outputPath, 'schema.json'));
                if (mutationNames) {
                    fs.writeFileSync(
                        path.resolve(outputPath, 'mutations.d.ts'),
                        generateMutationTypesDef(mutationNames)
                    );
                } else {
                    console.error('Failed to generate mutations typing');
                }
                // ------
                console.log('[3/3] generate json schema file ...');

                const jsonSchemaObj = fromIntrospectionQuery(
                    JSON.parse(fs.readFileSync(path.resolve(outputPath, 'schema.json')).toString()).data
                );

                fs.writeFileSync(
                    path.resolve(outputPath, 'apollo-form-json-schema.json'),
                    JSON.stringify(jsonSchemaObj)
                );
            } catch (error) {
                console.error(error);
            }

            console.log('Done.');
        }
    )
    // tslint:disable-next-line:no-any
    .fail(function (message: any, error: any) {
        handleError(message);
    })
    .help()
    .version()
    .strict()
    .argv;
