import { OpenAI } from 'openai';

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export async function generateSuggestions(prompt: string): Promise<string> {
    try {
        const openai = new OpenAI(process.env.OPENAI_API_KEY); // Move the instantiation of OpenAI inside the function

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'system', content: 'You are a master real estate mogul consultant' }, { role: 'user', content: prompt }],
            stream: true,
        });

        let result = '';
        for await (const chunk of response) {
            result += JSON.stringify(chunk);
        }

        console.log('OpenAI API response:', result);

        if (!result) {
            throw new Error('No response body from OpenAI API');
        }

        const jsonResponse = JSON.parse(result);
        if (!jsonResponse.choices || jsonResponse.choices.length === 0) {
            throw new Error('No choices found in the response from OpenAI API');
        }

        return jsonResponse.choices[0].message.content;
    } catch (error) {
        console.error('Error generating suggestions:', error.response ? error.response.data : error.message);
        throw new Error('Failed to generate suggestions from OpenAI API');
    }
}
