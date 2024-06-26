import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import fastcsv from 'fast-csv';

dotenv.config();

// Database connection configurations
const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

// Function to connect to the database
async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to the database successfully.');
  } catch (error) {
    console.error('Failed to connect to the database:', error.message);
    throw error;
  }
}

// Function to upload CSV data to the database
async function uploadCSV(filePath, tableName) {
  const stream = fs.createReadStream(filePath);
  const csvData = [];
  const csvStream = fastcsv
    .parse()
    .on('data', (data) => {
      csvData.push(data);
    })
    .on('end', async () => {
      try {
        if (csvData.length === 0) {
          throw new Error('No data found in the CSV file.');
        }

        const columnNames = csvData[0].join(', ');
        const valuesString = csvData.slice(1)
          .map(row => `('${row.join("', '")}')`)
          .join(', ');

        const query = `INSERT INTO ${tableName} (${columnNames}) VALUES ${valuesString};`;
        await client.query(query);
        console.log('CSV data uploaded successfully.');
      } catch (error) {
        console.error('Error uploading CSV data:', error.message);
        throw error;
      } finally {
        await client.end();
        console.log('Disconnected from the database.');
      }
    });

  stream.pipe(csvStream);
}

// Main function to perform operations
async function main() {
  try {
    await connectToDatabase();

    const filePath = '/home/lagunaAI/LagunaAIserver/AI-Excellence/src/Final Upload LPR Data Load.xlsx - Cleaned Data.csv'; // Replace with your CSV file path
    const tableName = 'property_data'; // Replace with your table name

    await uploadCSV(filePath, tableName);
  } catch (error) {
    console.error('Unhandled error:', error.message);
  }
}

// Run the main function and catch any errors
main().catch(error => {
  console.error('Unhandled error:', error.message);
});
