import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Function to fetch data from the database
async function fetchData(query, clientConfig) {
    const client = new Client(clientConfig);
    await client.connect();
    const res = await client.query(query);
    await client.end();
    return res.rows;
}

// Function to normalize strings (e.g., trim spaces, convert to lowercase)
function normalize(str) {
    return str.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
}

// Function to find matches
function findMatches(db1, db2) {
    const matches = [];

    db1.forEach(record1 => {
        db2.forEach(record2 => {
            if (normalize(record1.name) === normalize(record2.name) &&
                normalize(record1.address) === normalize(record2.address)) {
                matches.push({ db1_id: record1.id, db2_id: record2.id, name: record1.name, address: record1.address });
            }
        });
    });

    return matches;
}

// Main function to fetch data, find matches, and display the results in JSON format
async function main() {
    const clientConfig1 = {
        user: process.env.PGUSER1,
        host: process.env.PGHOST1,
        database: process.env.PGDATABASE1,
        password: process.env.PGPASSWORD1,
        port: process.env.PGPORT1,
    };

    const clientConfig2 = {
        user: process.env.PGUSER2,
        host: process.env.PGHOST2,
        database: process.env.PGDATABASE2,
        password: process.env.PGPASSWORD2,
        port: process.env.PGPORT2,
    };

    try {
        const db1 = await fetchData('SELECT id, name, address FROM table1', clientConfig1);
        const db2 = await fetchData('SELECT id, name, address FROM table2', clientConfig2);

        const matches = findMatches(db1, db2);

        // Display the matches in JSON format
        console.log(JSON.stringify(matches, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the main function and catch any errors
main().catch(console.error);
