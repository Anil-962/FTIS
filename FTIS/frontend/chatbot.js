const API_BASE = 'http://localhost:5000';

class MedicalChatbot {
    constructor() {
        this.chatHistory = [];
        this.isTyping = false;
        this.initializeChat();
    }

    initializeChat() {
        // Set welcome message timestamp
        document.getElementById('welcomeTime').textContent = this.getCurrentTime();
        
        // Load suggestions
        this.loadSuggestions();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Auto-focus input
        document.getElementById('messageInput').focus();
    }

    setupEventListeners() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        
        // Send message on button click
        sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter key
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Enable/disable send button based on input
        messageInput.addEventListener('input', () => {
            sendButton.disabled = messageInput.value.trim() === '';
        });
    }

    async loadSuggestions() {
        try {
            const response = await fetch(`${API_BASE}/chat/suggestions`);
            const data = await response.json();
            
            const suggestionsContainer = document.getElementById('suggestions');
            suggestionsContainer.innerHTML = '';
            
            data.suggestions.forEach(suggestion => {
                const chip = document.createElement('div');
                chip.className = 'suggestion-chip';
                chip.textContent = suggestion;
                chip.addEventListener('click', () => {
                    document.getElementById('messageInput').value = suggestion;
                    document.getElementById('messageInput').focus();
                });
                suggestionsContainer.appendChild(chip);
            });
        } catch (error) {
            console.error('Error loading suggestions:', error);
        }
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message || this.isTyping) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        messageInput.value = '';
        document.getElementById('sendButton').disabled = true;
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send to backend
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    context: this.getUserContext()
                })
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add bot response to chat
            this.addMessage(data.response, 'bot', data.timestamp);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessage(
                "I'm sorry, I'm having trouble connecting right now. Please try again later or check your internet connection.", 
                'bot'
            );
        }
        
        // Reload suggestions for next interaction
        this.loadSuggestions();
    }

    addMessage(content, sender, timestamp = null) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        // Format the message content (simple markdown-like formatting)
        const formattedContent = this.formatMessage(content);
        bubbleDiv.innerHTML = formattedContent;
        
        // Add timestamp
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = timestamp ? this.formatTimestamp(timestamp) : this.getCurrentTime();
        bubbleDiv.appendChild(timeDiv);
        
        messageDiv.appendChild(bubbleDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Add to history
        this.chatHistory.push({
            sender: sender,
            content: content,
            timestamp: timestamp || new Date().toISOString()
        });
    }

    formatMessage(content) {
        // Simple markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/🚨/g, '🚨 ')
            .replace(/•/g, '• ');
    }

    showTypingIndicator() {
        this.isTyping = true;
        const typingIndicator = document.getElementById('typingIndicator');
        typingIndicator.style.display = 'block';
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typingIndicator');
        typingIndicator.style.display = 'none';
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }

    getUserContext() {
        // Get any relevant user context (could be extended with user data)
        return {
            platform: 'web',
            timestamp: new Date().toISOString(),
            chat_history_length: this.chatHistory.length
        };
    }
}

// Initialize chatbot when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.medicalChatbot = new MedicalChatbot();
});