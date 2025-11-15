const { app } = require('@azure/functions');

const connectionString = process.env.DATABASE_CONNECTION_STRING;


app.http('testTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {

        return { body: JSON.stringify({ "text": `Hello, from the API! ${connectionString}` }) };
    }
});
