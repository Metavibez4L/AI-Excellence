import { Client } from 'pg';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

// PostgreSQL client configuration for the new database
const newClient = new Client({
    user: process.env.NEW_PGUSER,
    host: process.env.NEW_PGHOST,
    database: process.env.NEW_PGDATABASE,
    password: process.env.NEW_PGPASSWORD,
    port: parseInt(process.env.NEW_PGPORT || '5432', 10),
});

// Load the XLSX file
const filePath = '/home/lagunaAI/lagunaAI/AI-Excellence/src/Final Upload LPR Data Load.xlsx - Cleaned Data.csv';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const jsonData = xlsx.utils.sheet_to_json<any>(worksheet);

// Function to insert data into the new database
async function insertNewData(data: any[]) {
    await newClient.connect();

    for (const row of data) {
        const query = `
            INSERT INTO villa_terraza (
                key, street_number, street, unit, model, units, mutual, bldg_date, bldg_code,
                phase, parking_type, building_type, elevator, someone_lives, steps, num_front_steps,
                num_back_steps, distance_to_drop, distance_to_parking, parking_grade, carport_num,
                apn, location, hoa_amount
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
            )
            ON CONFLICT (key) DO NOTHING; -- Adjust conflict handling as necessary
        `;

        const values = [
            row.key, row.street_number, row.street, row.unit, row.model, row.units, row.mutual, row.bldg_date,
            row.bldg_code, row.phase, row.parking_type, row.building_type, row.elevator, row.someone_lives,
            row.steps, row.num_front_steps, row.num_back_steps, row.distance_to_drop, row.distance_to_parking,
            row.parking_grade, row.carport_num, row.apn, row.location, row.hoa_amount
        ];

        await newClient.query(query, values);
    }

    await newClient.end();
}

// Main function to load XLSX data into the new database
async function loadXlsxToDb() {
    try {
        await insertNewData(jsonData);
        console.log('Data loaded successfully.');
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

loadXlsxToDb();
