// gpt.js

// Function to send a prompt to the Google Gemini API and get a response
async function getAIResponse(prompt) {
    const apiKey = 'AIzaSyDxJlS4JInXxPEVu8082facQoELt-WLWR8';
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    try {
        const response = await fetch(`${endpoint}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        const data = await response.json();
        if (response.ok) {
            // Return the response from the AI
            return data.candidates[0].content.parts[0].text;
        } else {
            console.error("Gemini API error:", data);
            return "Error: " + (data.error?.message || "Unknown error occurred");
        }
    } catch (error) {
        console.error("Request failed", error);
        return "Request failed: " + error.message;
    }
}

// Function to retrieve the user's transactions and generate the prompt
async function generateFinancialReportPrompt() {
    const user = firebase.auth().currentUser;
    if (!user) {
        return "User not logged in!";
    }

    try {
        const snapshot = await firebase.database().ref('users/' + user.uid + '/transactions').once('value');
        const transactions = snapshot.val() || [];
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        const transactionList = transactions.map(t => `${t.date} - ${t.type}: $${t.amount.toFixed(2)} (${t.category})`).join('\n');
        const prompt = `Here is a list of your transactions:\n\n${transactionList}\n\nTotal Income: $${income.toFixed(2)}\nTotal Expenses: $${expenses.toFixed(2)}\n\nBased on this information, please provide suggestions to improve the financial situation.`;
        
        return prompt;
    } catch (error) {
        console.error('Error retrieving transactions:', error);
        return "Failed to retrieve financial data.";
    }
}

// Example usage: get response from AI and display it
async function handleUserPrompt() {
    const prompt = await generateFinancialReportPrompt();
    const aiResponse = await getAIResponse(prompt);
    console.log("AI Response:", aiResponse);
    document.getElementById('responseOutput').innerText = aiResponse;
}

// Event listener for form submission
document.getElementById('promptForm').addEventListener('submit', function(event) {
    event.preventDefault();
    handleUserPrompt();
});
