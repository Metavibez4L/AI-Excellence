export function summarizeExistingData(data: any[]): any[] {
    return data.map(item => ({
        listing_id: item.listing_id,
        city: item.city,
        price: item.list_price,
        bedrooms: item.bedrooms_total,
        bathrooms: item.bathrooms_total,
        square_feet: item.living_area
    }));
}

export function summarizeVillaTerrazaData(data: any[]): any[] {
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

export function constructPrompt(userInput: string, existingData: any[], villaTerrazaData: any[]): string {
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
