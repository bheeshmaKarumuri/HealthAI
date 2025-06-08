const LANGUAGES = {
    "English": "en",
    "Hindi": "hi",
    "Malayalam": "ml",
    "Telugu": "te"
};

let chatHistory = [];

// DOM Elements
const queryInput = document.getElementById("user_query");
const languageSelect = document.getElementById("language");
const chatHistoryDiv = document.getElementById("chat-history");
const interpretButton = document.getElementById("interpret-btn");
const loadingIndicator = document.getElementById("loading");
const errorMessageDiv = document.getElementById("error-message");
const suggestionChips = document.querySelectorAll(".suggestion-chip");

// Helper functions for UI feedback
function addMessage(text, type, displayTime = true) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${type}-message`;

    const messageContent = document.createElement("div");
    messageContent.innerHTML = text;

    messageDiv.appendChild(messageContent);

    if (displayTime) {
        const timeDiv = document.createElement("div");
        timeDiv.className = "message-time";
        timeDiv.textContent = new Date().toLocaleTimeString();
        messageDiv.appendChild(timeDiv);
    }
    chatHistoryDiv.appendChild(messageDiv);
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
}

function showLoading(show) {
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? "block" : "none";
    }
}

function showError(message) {
    if (errorMessageDiv) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = "block";
        
        // Remove existing retry button if any
        const existingRetryButton = errorMessageDiv.querySelector('.retry-button');
        if (existingRetryButton) {
            existingRetryButton.remove();
        }

        // Add a retry button for server errors
        if (message.includes('Server is not running') || message.includes('API request failed')) {
            const retryButton = document.createElement('button');
            retryButton.textContent = 'Retry';
            retryButton.className = 'retry-button';
            retryButton.style.marginTop = '10px';
            retryButton.onclick = () => {
                errorMessageDiv.style.display = "none";
                interpretButton.click();
            };
            errorMessageDiv.appendChild(retryButton);
        }
        
        setTimeout(() => {
            errorMessageDiv.style.display = "none";
            // Remove retry button if it exists
            const retryButton = errorMessageDiv.querySelector('.retry-button');
            if (retryButton) {
                retryButton.remove();
            }
        }, 10000); // Show error for 10 seconds
    }
}

function showSuccess(message) {
    const successDiv = document.createElement("div");
    successDiv.className = "success-message";
    successDiv.textContent = message;
    const container = document.querySelector(".container"); // Assuming .container exists
    if (container && chatHistoryDiv) {
        container.insertBefore(successDiv, chatHistoryDiv);
    } else {
        document.body.appendChild(successDiv); // Fallback
    }
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Function to update the chat history display on the page from the chatHistory array
function updateChatHistory() {
    chatHistoryDiv.innerHTML = ''; // Clear existing chat history

    if (chatHistory.length === 0) {
        addMessage('No chat history available.', 'info', false);
        return;
    }

    chatHistory.forEach(chat => {
        addMessage(`You: ${chat.user}`, 'user');
        addMessage(`AI: ${chat.ai}`, 'ai');
    });
}

// Function to send a single chat entry to the server
async function storeSingleChatInFirebase(userQuery, aiResponse) {
    const userData = JSON.parse(sessionStorage.getItem('user'));
    if (!userData || !userData.id) {
        console.error('No user data found for storing single chat.');
        return;
    }

    console.log('Attempting to store single chat in Firebase:', { userId: userData.id, userQuery, aiResponse });

    try {
        const response = await fetch('/history/store-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userData.id,
                query: userQuery,
                response: aiResponse
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to store single chat with status ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('Single chat stored successfully:', result);

    } catch (error) {
        console.error('Error storing single chat:', error);
        showError(`Failed to save chat: ${error.message}`);
    }
}

// Function to fetch chat history from the server
async function fetchChatHistory() {
    const userData = JSON.parse(sessionStorage.getItem('user'));
    if (!userData || !userData.id) {
        console.error('No user data found for fetchChatHistory.');
        return;
    }

    console.log('Fetching chat history for user:', userData.id);

    try {
        const response = await fetch(`/history/get-history/${userData.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch chat history with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Raw chat data received:', data);

        // Convert the object from Firebase to an array if it's an object
        if (data.chats && typeof data.chats === 'object' && !Array.isArray(data.chats)) {
            chatHistory = Object.values(data.chats);
        } else if (data.chats) {
            chatHistory = data.chats;
        } else {
            chatHistory = [];
        }
        console.log('Processed chat history:', chatHistory);
        updateChatHistory();
    } catch (error) {
        console.error('Error fetching chat history:', error);
        showError(`Failed to load chat history: ${error.message}`);
    }
}

// Event Listeners

// Initial fetch of chat history when the page loads
document.addEventListener('DOMContentLoaded', fetchChatHistory);

// Language selection handler
if (languageSelect) {
    languageSelect.addEventListener("change", () => {
        // Handle language change for text input only
        const selectedLanguage = languageSelect.value;
        console.log('Language changed to:', selectedLanguage);
    });
}

// Handle query submission (main chat logic)
if (interpretButton) {
    interpretButton.addEventListener('click', async () => {
        const language = languageSelect ? languageSelect.value : 'English'; // Default to English if not found
        const userQuery = queryInput ? queryInput.value.trim() : '';

        const userData = JSON.parse(sessionStorage.getItem('user'));

        if (!userData || !userData.id) {
            console.error('No user data found for interpret-btn click.');
            alert('Please log in to use this feature');
            return;
        }

        if (userQuery === "") {
            alert("Please enter a query.");
            return;
        }

        console.log('Starting chat interaction:', {
            userId: userData.id,
            query: userQuery,
            language: language
        });

        // Clear previous messages and show "AI is thinking..."
        chatHistoryDiv.innerHTML = '';
        addMessage(`You: ${userQuery}`, 'user');
        const aiThinkingMessage = document.createElement('div');
        aiThinkingMessage.className = 'ai';
        aiThinkingMessage.innerHTML = 'AI is thinking...';
        chatHistoryDiv.appendChild(aiThinkingMessage);
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
        
        showLoading(true);

        try {
            const response = await fetch('/chat/chatcomplete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_query: userQuery,
                    language: LANGUAGES[language],
                    userId: userData.id,
                    model: "llama3-8b-8192",
                    temperature: 0.7,
                    max_tokens: 1024,
                    top_p: 1,
                    stream: true,
                    stop: null
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let aiResponse = '';
            aiThinkingMessage.innerHTML = 'AI: '; // Change "thinking" to "AI:" once stream starts

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunkText = decoder.decode(value, { stream: true });
                aiResponse += chunkText;

                // Update the display with AI response in real-time
                aiThinkingMessage.innerHTML = `AI: ${aiResponse}`;
                chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
            }

            console.log('Chat interaction completed:', {
                userQuery: userQuery,
                aiResponse: aiResponse
            });

            // Store the new chat in the local history array (user query + AI response)
            const newChat = {
                user: userQuery,
                ai: aiResponse,
                timestamp: new Date().toISOString()
            };
            chatHistory.push(newChat);
            console.log('Added new chat to history:', newChat);

            // Persist the new chat to the server (Firebase) individually
            await storeSingleChatInFirebase(newChat.user, newChat.ai);

            // Ensure the final display is correct after streaming
            updateChatHistory(); 
            
            // Clear input after successful query
            if (queryInput) queryInput.value = "";

        } catch (error) {
            console.error('Error during chat interaction:', error);
            showError(`Chat error: ${error.message}`);
            // Display a generic error message in chat history if specific message is not shown
            if (!chatHistoryDiv.innerHTML.includes('Error:')) {
                addMessage(`Sorry, an error occurred: ${error.message}`, 'ai');
            }
        } finally {
            showLoading(false);
        }
    });
}

// Add click handlers for suggestion chips
if (suggestionChips) {
    suggestionChips.forEach(chip => {
        chip.addEventListener("click", () => {
            if (queryInput) {
                queryInput.value = chip.textContent;
            }
        });
    });
}

// Handle Enter key press on query input
if (queryInput && interpretButton) {
    queryInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent default form submission
            interpretButton.click();
        }
    });
}