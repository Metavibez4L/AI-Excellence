import { Client } from 'pg';
import dotenv from 'dotenv';
import { diff } from 'deep-diff';

dotenv.config();

// Function to fetch data from the database
async function fetchData(query, clientConfig) {
    const client = new Client(clientConfig);
    try {
        await client.connect();
        console.log(`Connected to database ${clientConfig.database} successfully.`);
        const res = await client.query(query);
        console.log(`Data fetched from ${clientConfig.database} successfully.`);
        return res.rows;
    } catch (error) {
        console.error(`Error fetching data from database ${clientConfig.database}:`, error.message);
        throw error;
    } finally {
        await client.end();
        console.log(`Disconnected from database ${clientConfig.database}.`);
    }
}

// Function to normalize strings (e.g., trim spaces, convert to lowercase)
function normalize(str) {
    return str.trim().toLowerCase();
}

// Function to summarize existing database data
function summarizeExistingData(data) {
    return data.map(item => ({
        listing_id: item.listing_id,
        street_number: item.street_number,
        street: item.street_name,
        city: item.city,
        price: item.list_price,
        bedrooms: item.bedrooms_total,
        bathrooms: item.bathrooms_total,
        square_feet: item.living_area,
    }));
}

// Function to summarize Villa Terraza database data
function summarizeVillaTerrazaData(data) {
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
        hoa_amount: item.hoa_amount,
    }));
}

// Function to find matches based on street number and street name
function findMatches(db1, db2) {
    const matches = [];

    db1.forEach(record1 => {
        db2.forEach(record2 => {
            if (normalize(record1.street_number) === normalize(record2.street_number) &&
                normalize(record1.street) === normalize(record2.street)) {
                matches.push({
                    db1_id: record1.listing_id,
                    db2_id: record2.key,
                    street_number: record1.street_number,
                    street: record1.street,
                });
            }
        });
    });

    return matches;
}

// Main function to fetch data, find matches, and display the results in JSON format
async function main() {
    const clientConfig1 = {
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT,
    };

    const clientConfig2 = {
        user: process.env.NEW_PGUSER,
        host: process.env.NEW_PGHOST,
        database: process.env.NEW_PGDATABASE,
        password: process.env.NEW_PGPASSWORD,
        port: process.env.NEW_PGPORT,
    };

    console.log('Database configurations:', clientConfig1, clientConfig2);

    try {
        console.log('Fetching data from databases...');
        const db1 = await fetchData('SELECT listing_id, street_number, street_name, city, list_price, bedrooms_total, bathrooms_total, living_area FROM your_existing_table', clientConfig1);
        const db2 = await fetchData('SELECT * FROM your_villa_terraza_table', clientConfig2);

        console.log('Summarizing data...');
        const summarizedExistingData = summarizeExistingData(db1);
        const summarizedVillaTerrazaData = summarizeVillaTerrazaData(db2);

        console.log('Finding matches...');
        const matches = findMatches(summarizedExistingData, summarizedVillaTerrazaData);

        // Display the matches in JSON format
        console.log('Matches found:');
        console.log(JSON.stringify(matches, null, 2));
    } catch (error) {
        console.error('Error in main function:', error.message);
    }
}

// Run the main function and catch any errors
main().catch(error => {
    console.error('Unhandled error:', error.message);
});
