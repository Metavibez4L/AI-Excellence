import { fetch } from "bun";
import dotenv from "dotenv";

dotenv.config();

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

async function main() {
    const data = await fetchTrestleData();
    if (data) {
        console.log('Fetched data:', data);
    } else {
        console.log('Failed to fetch data');
    }
}

main();