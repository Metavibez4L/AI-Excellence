import { Hono } from 'hono';
import { serve } from 'bun';
import dotenv from 'dotenv';
import { handleGenerate } from './controllers/honoserver.ts';

dotenv.config();

const app = new Hono();

app.post('/generate', handleGenerate);

serve({
    port: process.env.PORT || 5000,
    fetch: app.fetch,
});

console.log(`Server running on port ${process.env.PORT || 5000}`);
