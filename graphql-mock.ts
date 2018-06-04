import {
    buildSchema,
    GraphQLSchema
} from 'graphql';

export const mocks = {
    Query: () => {
        return {
            todos: () => {
                return [
                    { id: 1, name: 'Todo #1', completed: false },
                    { id: 2, name: 'Todo #2', completed: false },
                    { id: 3, name: 'Todo #3', completed: false },
                ];
            },
        };
    },
    Mutation: () => {
        return {
            // @ts-ignore
            create_todo: (_, variables) => {
                console.log('create_todo()', variables);
            }
        }
    }
};

export const schemaString = `
        type Todo {
            id: String!
            name: String!
            completed: Boolean
        }

        input TodoInputType {
            name: String!
            completed: Boolean
        }

        type Query {
            todo(id: String!): Todo!
            todos: [Todo!]!
        }

        type Mutation {
            update_todo(id: String!, todo: TodoInputType!): Todo
            create_todo(todo: TodoInputType!): Todo
        }
`;

export const schema = buildSchema(schemaString);