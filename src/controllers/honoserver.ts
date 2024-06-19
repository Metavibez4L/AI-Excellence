import { Context } from 'hono';
import { connectToDatabase, fetchDataFromPostgres, closeDatabaseConnection } from '../models/honodata.ts';
import { generateSuggestions } from '../services/honoservices.ts';
import { constructPrompt } from '../utils/summarizeutil.ts';
import { Client } from 'pg';

const existingClientConfig = {
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT || '5432', 10),
};

const newClientConfig = {
    user: process.env.NEW_PGUSER,
    host: process.env.NEW_PGHOST,
    database: process.env.NEW_PGDATABASE,
    password: process.env.NEW_PGPASSWORD,
    port: parseInt(process.env.NEW_PGPORT || '5432', 10),
};

export async function handleGenerate(c: Context) {
    let existingClient: Client | null = null;
    let newClient: Client | null = null;
    try {
        const { userInput } = await c.req.json();
        console.log('Received user input:', userInput);

        existingClient = await connectToDatabase(existingClientConfig);
        newClient = await connectToDatabase(newClientConfig);

        const existingData = await fetchDataFromPostgres(existingClient, 'properties', 10);
        const villaTerrazaData = await fetchDataFromPostgres(newClient, 'villa_terraza', 10);

        const prompt = constructPrompt(userInput, existingData, villaTerrazaData);
        const suggestions = await generateSuggestions(prompt);

        return c.json({ suggestions });
    } catch (error) {
        console.error('Error generating suggestions:', error);
        return c.json({ error: 'Error generating suggestions', details: error.message }, 500);
    } finally {
        if (existingClient) {
            await closeDatabaseConnection(existingClient);
        }
        if (newClient) {
            await closeDatabaseConnection(newClient);
        }
    }
}
