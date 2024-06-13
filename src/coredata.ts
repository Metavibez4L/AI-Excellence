import dotenv from "dotenv";
import pkg from "pg"; // Import the PostgreSQL client

dotenv.config();

const { Client } = pkg;

export async function connectToDatabase() {
    const client = new Client({
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT,
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');
    return client;
}

export async function fetchDataFromPostgres(client, limit = 10) {
    const result = await client.query('SELECT * FROM properties LIMIT $1', [limit]);
    console.log('Fetched data from PostgreSQL:', result.rows);
    return result.rows;
}

export async function closeDatabaseConnection(client) {
    await client.end();
    console.log('Closed PostgreSQL database connection');
}