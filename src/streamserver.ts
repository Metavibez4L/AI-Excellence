import { Hono } from 'hono';
import { serve } from 'bun';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = new Hono();

// Initialize OpenAI client
const openai = new OpenAI(process.env.OPENAI_API_KEY);

app.post('/generate', async (c) => {
    try {
        const { prompt } = await c.req.json();

        console.log('Received prompt:', prompt);

        // Create a chat completion with OpenAI using the prompt
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'system', content: 'You are a master real estate mogul consultant' }, { role: 'user', content: prompt }],
        });

        const streamFeature = new c.res.StreamFeature(response);

        let result = '';

        // Process the streamed response
        for await (const chunk of streamFeature) {
            if (chunk) {
                const chunkStr = JSON.stringify(chunk);
                result += chunkStr;
                console.log('Stream chunk:', chunkStr);
            }
        }

        console.log('OpenAI API response:', result);

        if (!result) {
            throw new Error('No response body from OpenAI API');
        }

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(result);
        } catch (error) {
            console.error('Error parsing JSON:', error.message);
            return c.json({ error: 'Failed to parse JSON from OpenAI API', details: error.message }, 500);
        }

        if (!jsonResponse.choices || jsonResponse.choices.length === 0) {
            throw new Error('No choices found in the response from OpenAI API');
        }

        const generatedText = jsonResponse.choices[0].message.content;
        console.log('Generated text:', generatedText);

        return c.json({ text: generatedText });
    } catch (error) {
        console.error('Error generating suggestions:', error.message);

        if (error.response && error.response.data) {
            console.error('OpenAI API response error data:', error.response.data);
        }

        return c.json({ error: 'Failed to generate suggestions from OpenAI API', details: error.message }, 500);
    }
});

serve({
    fetch: app.fetch,
    port: Number(process.env.PORT) || 5000,
});

console.log(`Server running on port ${process.env.PORT || 5000}`);
