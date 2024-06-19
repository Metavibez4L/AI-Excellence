import { fetch } from "bun"; // Import fetch from Bun
import dotenv from "dotenv"; // Import dotenv to manage environment variables
import pkg from "pg"; // Import the PostgreSQL client

const { Client } = pkg; // Destructure the Client from the pg package

dotenv.config(); // Load environment variables from .env file

/**
 * Fetches data from the Trestle API.
 * @returns {Array|null} The fetched data or null if an error occurred.
 */
async function fetchTrestleData() {
    try {
        const response = await fetch('https://api-prod.corelogic.com/trestle/odata/Property?$top=1000&$select=ListingKey,City,ListAgentFullName,StandardStatus,ListPrice,StreetNumber,UnitNumber,ListOfficeName,ListingId,ModificationTimestamp,PhotosChangeTimestamp,PhotosCount,ListAgentStateLicense,PostalCode,BedroomsTotal,DaysOnMarket,PublicRemarks,PrivateRemarks,PrivateOfficeRemarks,ShowingInstructions,VirtualTourURLUnbranded,StatusChangeTimestamp,StreetName,PropertySubType,AboveGradeFinishedAreaUnits,LivingAreaUnits,LivingArea&$filter=StandardStatus eq \'Active\' and City eq \'Laguna Woods\' and ListingAgreement eq \'ExclusiveRightToSell\'', {
            headers: {
                'Authorization': `Bearer ${process.env.TRESTLE_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.value;
    } catch (error) {
        console.error('Error fetching Trestle data:', error);
        return null;
    }
}

/**
 * Transforms Trestle API data to match PostgreSQL schema.
 * @param {Array} trestleData - The data fetched from the Trestle API.
 * @returns {Array} The transformed data.
 */
function transformData(trestleData) {
    return trestleData.map(listing => ({
        listing_key: listing.ListingKey,
        city: listing.City,
        list_agent_full_name: listing.ListAgentFullName,
        standard_status: listing.StandardStatus,
        list_price: listing.ListPrice,
        street_number: listing.StreetNumber,
        unit_number: listing.UnitNumber,
        list_office_name: listing.ListOfficeName,
        listing_id: listing.ListingId,
        modification_timestamp: listing.ModificationTimestamp,
        photos_change_timestamp: listing.PhotosChangeTimestamp,
        photos_count: listing.PhotosCount,
        list_agent_state_license: listing.ListAgentStateLicense,
        postal_code: listing.PostalCode,
        bedrooms_total: listing.BedroomsTotal,
        days_on_market: listing.DaysOnMarket,
        public_remarks: listing.PublicRemarks,
        private_remarks: listing.PrivateRemarks,
        private_office_remarks: listing.PrivateOfficeRemarks,
        showing_instructions: listing.ShowingInstructions,
        virtual_tour_url_unbranded: listing.VirtualTourURLUnbranded,
        status_change_timestamp: listing.StatusChangeTimestamp,
        street_name: listing.StreetName,
        property_sub_type: listing.PropertySubType,
        above_grade_finished_area_units: listing.AboveGradeFinishedAreaUnits,
        living_area_units: listing.LivingAreaUnits,
        living_area: listing.LivingArea
    }));
}

/**
 * Deletes old data from the PostgreSQL database.
 * @param {Client} client - The PostgreSQL client.
 */
async function deleteOldData(client) {
    await client.query('DELETE FROM properties WHERE city = $1', ['Laguna Woods']);
}

/**
 * Inserts transformed data into PostgreSQL.
 * @param {Array} data - The transformed data.
 */
async function insertDataIntoPostgres(data) {
    const client = new Client({
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT,
    });

    await client.connect();

    await deleteOldData(client);

    const query = `
        INSERT INTO properties (
            listing_key, city, list_agent_full_name, standard_status, list_price,
            street_number, unit_number, list_office_name, listing_id, modification_timestamp,
            photos_change_timestamp, photos_count, list_agent_state_license, postal_code,
            bedrooms_total, days_on_market, public_remarks, private_remarks, private_office_remarks,
            showing_instructions, virtual_tour_url_unbranded, status_change_timestamp,
            street_name, property_sub_type, above_grade_finished_area_units, living_area_units, living_area
        ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14,
            $15, $16, $17, $18,
            $19, $20, $21,
            $22, $23, $24, $25, $26, $27
        ) ON CONFLICT (listing_key) DO NOTHING;
    `;

    for (const item of data) {
        await client.query(query, [
            item.listing_key,
            item.city,
            item.list_agent_full_name,
            item.standard_status,
            item.list_price,
            item.street_number,
            item.unit_number,
            item.list_office_name,
            item.listing_id,
            item.modification_timestamp,
            item.photos_change_timestamp,
            item.photos_count,
            item.list_agent_state_license,
            item.postal_code,
            item.bedrooms_total,
            item.days_on_market,
            item.public_remarks,
            item.private_remarks,
            item.private_office_remarks,
            item.showing_instructions,
            item.virtual_tour_url_unbranded,
            item.status_change_timestamp,
            item.street_name,
            item.property_sub_type,
            item.above_grade_finished_area_units,
            item.living_area_units,
            item.living_area
        ]);
    }

    await client.end();
}

/**
 * Integration function to fetch, transform, and load data.
 */
async function integrateTrestleData() {
    const trestleData = await fetchTrestleData();
    if (trestleData) {
        const transformedData = transformData(trestleData);
        await insertDataIntoPostgres(transformedData);
    }
}

// Execute integration
integrateTrestleData()
    .then(() => console.log('Data integration complete'))
    .catch(err => console.error('Error integrating data:', err));
