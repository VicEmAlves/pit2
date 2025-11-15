const { app } = require('@azure/functions');
const { connectDatabase, query } = require('../database');

app.http('testTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            // Test database connection
            await connectDatabase();
            
            // Example query - replace with your actual query
            const result = await query('SELECT 1 as connection_test');
            
            return { 
                body: JSON.stringify({ 
                    text: 'Hello, from the API!',
                    database: 'Connected successfully',
                    result: result
                }) 
            };
        } catch (error) {
            context.log('Error:', error.message);
            return { 
                status: 500,
                body: JSON.stringify({ 
                    error: 'Database connection failed',
                    message: error.message 
                }) 
            };
        }
    }
});
