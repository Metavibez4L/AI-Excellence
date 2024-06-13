import { serve } from "bun";
import { connectToDatabase, fetchDataFromPostgres, closeDatabaseConnection } from "./coredata.ts";
import dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();

const openai = new OpenAI(process.env.OPENAI_API_KEY);

function summarizeData(data) {
    const summary = data.map(item => ({
        listing_id: item.listing_id,
        city: item.city,
        price: item.list_price,
        bedrooms: item.bedrooms_total,
        bathrooms: item.bathrooms_total,
        square_feet: item.living_area
    }));
    console.log('Summarized data:', summary);
    return summary;
}

function constructPrompt(userInput, data) {
    const summary = summarizeData(data);
    const prompt = `
    You are a master real estate mogul. Based on the following summarized data from the PostgreSQL database, provide data-driven suggestions for real estate investment strategies. Here is the data:

    ${JSON.stringify(summary, null, 2)}

    User input: ${userInput}

    Provide your suggestions:
    `;
    console.log('Constructed prompt:', prompt);
    return prompt;
}

async function generateSuggestions(prompt) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4', // or the specific model you are using
            messages: [{ role: 'system', content: 'You are a master real estate mogul consultant' }, { role: 'user', content: prompt }],
        });

        console.log('OpenAI API response:', response);

        if (response.choices && response.choices.length > 0) {
            return response.choices[0].message.content;
        } else {
            throw new Error('No choices found in the response from OpenAI API');
        }
    } catch (error) {
        console.error('Error from OpenAI API:', error.response ? error.response.data : error.message);
        throw new Error('Failed to generate suggestions from OpenAI API');
    }
}

async function handleGenerate(req) {
    let client;
    try {
        const { userInput } = await req.json(); // Parse user input from the request body
        console.log('Received user input:', userInput);

        client = await connectToDatabase();
        const data = await fetchDataFromPostgres(client, 10); // Fetch a limited number of rows
        const prompt = constructPrompt(userInput, data);
        const suggestions = await generateSuggestions(prompt);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(JSON.stringify({ suggestions })));
                controller.close();
            }
        });

        console.log('Generated suggestions:', suggestions);
        return new Response(stream, {
            headers: {
                "Content-Type": "application/json",
                "Transfer-Encoding": "chunked"
            }
        });
    } catch (error) {
        console.error('Error generating suggestions:', error);
        return new Response(JSON.stringify({ error: 'Error generating suggestions', details: error.message }), { status: 500 });
    } finally {
        if (client) {
            await closeDatabaseConnection(client);
        }
    }
}

serve({
    port: process.env.PORT || 5000,
    fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/generate" && req.method === "POST") { // Change method to POST for user input
            return handleGenerate(req);
        }
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`Server running on port ${process.env.PORT || 5000}`);