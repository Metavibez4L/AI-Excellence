// 1. Import Necessary Functions and Modules
import { connectToDatabase, fetchDataFromPostgres, closeDatabaseConnection } from './models/honodata.ts';
import { generateSuggestions } from './services/honoservices.ts';
import { constructPrompt } from './utils/summarizeutil.ts';
import { existingClientConfig, newClientConfig } from './controllers/honoserver.ts'; // Assuming these configs are exported

async function compareData() {
    let existingClient = null;
    let newClient = null;
    try {
        // 2. Setup Database Connections
        existingClient = await connectToDatabase(existingClientConfig);
        newClient = await connectToDatabase(newClientConfig);

        // 3. Fetch Data
        const existingData = await fetchDataFromPostgres(existingClient, 'existing_table', 10);
        const newData = await fetchDataFromPostgres(newClient, 'new_table', 10);

        // 4. Generate Prompt for Comparison
        const prompt = constructPrompt("Compare data", existingData, newData);

        // 5. Generate Suggestions/Comparisons
        const suggestions = await generateSuggestions(prompt);

        // 6. Handle Results
        console.log("Comparison Suggestions:", suggestions);
    } catch (error) {
        console.error("Error during comparison:", error);
    } finally {
        // 7. Close Database Connections
        if (existingClient) await closeDatabaseConnection(existingClient);
        if (newClient) await closeDatabaseConnection(newClient);
    }
}

// Execute the comparison
compareData();