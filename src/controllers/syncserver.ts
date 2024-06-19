import { serve } from "bun"; // Import Bun's built-in server
import { connectToDatabase, fetchDataFromPostgres, closeDatabaseConnection } from "../models/insyncdata"; // Import database functions
import dotenv from "dotenv"; // Import dotenv to manage environment variables
import { OpenAI } from "openai"; // Import OpenAI client

dotenv.config(); // Load environment variables from .env file

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// PostgreSQL client configurations for existing and new databases
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

/**
 * Summarizes the data fetched from the existing database.
 * @param {Array} data - The data fetched from the existing database.
 * @returns {Array} The summarized data.
 */
function summarizeExistingData(data: any[]): any[] {
    return data.map(item => ({
        listing_id: item.listing_id,
        city: item.city,
        price: item.list_price,
        bedrooms: item.bedrooms_total,
        bathrooms: item.bathrooms_total,
        square_feet: item.living_area
    }));
}

/**
 * Summarizes the data fetched from the villa_terraza table.
 * @param {Array} data - The data fetched from the villa_terraza table.
 * @returns {Array} The summarized data.
 */
function summarizeVillaTerrazaData(data: any[]): any[] {
    return data.map(item => ({
        key: item.key,
        street_number: item.street_number,
        street: item.street,
        unit: item.unit,
        model: item.model,
        units: item.units,
        mutual: item.mutual,
        bldg_date: item.bldg_date,
        bldg_code: item.bldg_code,
        phase: item.phase,
        parking_type: item.parking_type,
        building_type: item.building_type,
        elevator: item.elevator,
        someone_lives: item.someone_lives,
        steps: item.steps,
        num_front_steps: item.num_front_steps,
        num_back_steps: item.num_back_steps,
        distance_to_drop: item.distance_to_drop,
        distance_to_parking: item.distance_to_parking,
        parking_grade: item.parking_grade,
        carport_num: item.carport_num,
        apn: item.apn,
        location: item.location,
        hoa_amount: item.hoa_amount
    }));
}

/**
 * Constructs the prompt for the OpenAI API based on user input and the data fetched from the database.
 * @param {string} userInput - The user input.
 * @param {Array} existingData - The summarized data from the existing database.
 * @param {Array} villaTerrazaData - The summarized data from the villa_terraza table.
 * @returns {string} The constructed prompt.
 */
function constructPrompt(userInput: string, existingData: any[], villaTerrazaData: any[]): string {
    const existingSummary = summarizeExistingData(existingData);
    const villaTerrazaSummary = summarizeVillaTerrazaData(villaTerrazaData);

    return `
    You are a master real estate mogul. Based on the following summarized data from the PostgreSQL database, provide data-driven suggestions for real estate investment strategies. Here is the data:

    Existing Database:
    ${JSON.stringify(existingSummary, null, 2)}

    Villa Terraza Database:
    ${JSON.stringify(villaTerrazaSummary, null, 2)}

    User input: ${userInput}

    Provide your suggestions:
    `;
}

/**
 * Generates suggestions from the OpenAI API based on the constructed prompt.
 * @param {string} prompt - The constructed prompt.
 * @returns {Promise<string>} The suggestions generated by the OpenAI API.
 */
async function generateSuggestions(prompt: string): Promise<string> {
    try {
        // Make a request to the OpenAI API with the constructed prompt
        const response = await openai.chat.completions.create({
            model: 'gpt-4', // Specify the OpenAI model
            messages: [{ role: 'system', content: 'You are a master real estate mogul consultant' }, { role: 'user', content: prompt }],
        });

        console.log('OpenAI API response:', response);

        // Check if the response contains choices and return the content of the first choice
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

/**
 * Handles the incoming HTTP request to generate suggestions.
 * @param {Request} req - The incoming request.
 * @returns {Response} The response with the generated suggestions.
 */
async function handleGenerate(req: Request): Promise<Response> {
    let existingClient: Client | null = null;
    let newClient: Client | null = null;
    try {
        // Parse user input from the request body
        const { userInput } = await req.json();
        console.log('Received user input:', userInput);

        // Connect to the existing and new PostgreSQL databases
        existingClient = await connectToDatabase(existingClientConfig);
        newClient = await connectToDatabase(newClientConfig);

        // Fetch data from both databases
        const existingData = await fetchDataFromPostgres(existingClient, 'properties', 10); // Replace 'properties' with the actual table name for the existing database
        const villaTerrazaData = await fetchDataFromPostgres(newClient, 'villa_terraza', 10); // Replace 'villa_terraza' if necessary

        // Construct the prompt for the OpenAI API
        const prompt = constructPrompt(userInput, existingData, villaTerrazaData);

        // Generate suggestions using the OpenAI API
        const suggestions = await generateSuggestions(prompt);

        // Stream the suggestions back to the client
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
        // Close the database connections if they were established
        if (existingClient) {
            await closeDatabaseConnection(existingClient);
        }
        if (newClient) {
            await closeDatabaseConnection(newClient);
        }
    }
}

// Start the Bun server and define request handling
serve({
    port: process.env.PORT || 5000,
    async fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/generate" && req.method === "POST") {
            return handleGenerate(req); // Handle POST requests to the /generate endpoint
        }
        return new Response("Not Found", { status: 404 }); // Return 404 for all other requests
    },
});

// Log the server start message
console.log(`Server running on port ${process.env.PORT || 5000}`);
