import dotenv from "dotenv"; // Import dotenv to manage environment variables
import pkg from "pg"; // Import the PostgreSQL client

dotenv.config(); // Load environment variables from .env file

const { Client } = pkg; // Destructure the Client from the pg package

/**
 * Connects to the PostgreSQL database using the given configuration.
 * @param {object} config - The PostgreSQL configuration.
 * @returns {Client} The PostgreSQL client connected to the database.
 */
export async function connectToDatabase(config) {
    // Create a new instance of the PostgreSQL client with provided configuration
    const client = new Client(config);
    // Connect to the PostgreSQL database
    await client.connect();
    console.log('Connected to PostgreSQL database'); // Log successful connection
    return client; // Return the connected client
}

/**
 * Fetches data from the PostgreSQL database.
 * @param {Client} client - The PostgreSQL client.
 * @param {string} tableName - The name of the table to fetch data from.
 * @param {number} limit - The maximum number of rows to fetch (default is 10).
 * @returns {Array} The rows fetched from the database.
 */
export async function fetchDataFromPostgres(client, tableName, limit = 10) {
    // Construct the SQL query string with the table name directly interpolated
    const queryText = `SELECT * FROM ${tableName} LIMIT $1`;
    const result = await client.query(queryText, [limit]);
    console.log(`Fetched data from PostgreSQL table ${tableName}:`, result.rows); // Log the fetched data
    return result.rows; // Return the fetched rows
}

/**
 * Closes the PostgreSQL database connection.
 * @param {Client} client - The PostgreSQL client.
 */
export async function closeDatabaseConnection(client) {
    // Close the connection to the PostgreSQL database
    await client.end();
    console.log('Closed PostgreSQL database connection'); // Log successful disconnection
}
