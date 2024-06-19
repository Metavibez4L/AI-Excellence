import dotenv from "dotenv"; // Import dotenv to manage environment variables
import pkg from "pg"; // Import the PostgreSQL client

dotenv.config(); // Load environment variables from .env file

const { Client } = pkg; // Destructure the Client from the pg package

/**
 * Connects to the PostgreSQL database using the credentials from the environment variables.
 * @returns {Client} The PostgreSQL client connected to the database.
 */
export async function connectToDatabase() {
    // Create a new instance of the PostgreSQL client with configuration from environment variables
    const client = new Client({
        user: process.env.PGUSER, // PostgreSQL username
        host: process.env.PGHOST, // PostgreSQL host
        database: process.env.PGDATABASE, // PostgreSQL database name
        password: process.env.PGPASSWORD, // PostgreSQL password
        port: process.env.PGPORT, // PostgreSQL port
    });

    // Connect to the PostgreSQL database
    await client.connect();
    console.log('Connected to PostgreSQL database'); // Log successful connection
    return client; // Return the connected client
}

/**
 * Fetches data from the PostgreSQL database.
 * @param {Client} client - The PostgreSQL client.
 * @param {number} limit - The maximum number of rows to fetch (default is 10).
 * @returns {Array} The rows fetched from the database.
 */
export async function fetchDataFromPostgres(client, limit = 10) {
    // Execute a SQL query to fetch data from the properties table with a limit
    const result = await client.query('SELECT * FROM properties LIMIT $1', [limit]);
    console.log('Fetched data from PostgreSQL:', result.rows); // Log the fetched data
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
