import { OpenAI } from 'openai';

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export async function generateSuggestions(prompt: string): Promise<string> {
    try {
        const openai = new OpenAI(process.env.OPENAI_API_KEY); // Move the instantiation of OpenAI inside the function

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are a master real estate mogul consultant' },
                { role: 'user', content: prompt }
            ]
        });

        console.log('OpenAI API response:', response);

        if (!response || !response.choices || response.choices.length === 0) {
            throw new Error('No choices found in the response from OpenAI API');
        }

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error generating suggestions:', error.response ? error.response.data : error.message);
        throw new Error('Failed to generate suggestions from OpenAI API');
    }
}
