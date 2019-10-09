const express = require('express');
const expressGraphQL = require('express-graphql');
const schema = require('./schema/schema');

const app = express();

// app.use is used to apply middleware; expressGraphQL is a middleware between express and GraphQL (glue)
app.use('/graphql', expressGraphQL({
    // configuration options for expressGraphQL
    schema,
    // development tool in browser
    graphiql: true
}));

app.listen(4000, () => {
    console.log('listening...');
});