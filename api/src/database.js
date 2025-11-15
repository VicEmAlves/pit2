const sql = require('mssql');

const connectionString = process.env.DATABASE_CONNECTION_STRING;

let pool = null;

async function connectDatabase() {
  try {
    if (!connectionString) {
      throw new Error('DATABASE_CONNECTION_STRING environment variable not set');
    }

    if (!pool) {
      pool = new sql.connect(connectionString);
      await pool.connect();
      console.log('Connected to SQL Server database');
    }
    return pool;
  } catch (error) {
    console.error('Database connection error:', error.message);
    throw error;
  }
}

async function closeDatabase() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database connection:', error.message);
  }
}

async function query(queryString, params = {}) {
  try {
    const dbPool = await connectDatabase();
    const request = dbPool.request();

    // Add parameters if provided
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });

    const result = await request.query(queryString);
    return result.recordset;
  } catch (error) {
    console.error('Query execution error:', error.message);
    throw error;
  }
}

module.exports = {
  connectDatabase,
  closeDatabase,
  query,
  getPool: () => pool
};
