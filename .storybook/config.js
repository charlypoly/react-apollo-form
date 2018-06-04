import { configure, addDecorator } from '@storybook/react';
import { schemaString, mocks } from '../graphql-mock';
import apolloStorybookDecorator from 'apollo-storybook-react';
import '@storybook/addon-console';

const req = require.context('../stories', true, /\.tsx?$/)

addDecorator(
    apolloStorybookDecorator({
        typeDefs: schemaString,
        mocks
    })
);

function loadStories() {
    req.keys().forEach((filename) => req(filename))
}

configure(loadStories, module);