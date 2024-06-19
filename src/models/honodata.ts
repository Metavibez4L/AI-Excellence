import { Client } from 'pg';

export async function connectToDatabase(config: object): Promise<Client> {
    const client = new Client(config);
    await client.connect();
    console.log('Connected to PostgreSQL database');
    return client;
}

export async function fetchDataFromPostgres(client: Client, table: string, limit: number): Promise<any[]> {
    const result = await client.query(`SELECT * FROM ${table} LIMIT $1`, [limit]);
    console.log('Fetched data from PostgreSQL:', result.rows);
    return result.rows;
}

export async function closeDatabaseConnection(client: Client): Promise<void> {
    await client.end();
    console.log('Closed PostgreSQL database connection');
}
