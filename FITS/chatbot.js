// Enhanced Medical Chatbot functionality
class MedicalChatbot {
    constructor() {
        this.chatHistory = [];
        this.isTyping = false;
        this.medicalKnowledge = this.initializeKnowledge();
        this.initializeChat();
    }

    initializeKnowledge() {
        return {
            "fever": {
                "definition": "Fever is a temporary increase in body temperature, often a sign that your body is fighting an illness. Normal body temperature is around 37°C (98.6°F).",
                "causes": [
                    "Viral infections (flu, COVID-19, common cold)",
                    "Bacterial infections (strep throat, UTI, pneumonia)", 
                    "Inflammatory conditions",
                    "Heat exhaustion",
                    "Certain medications"
                ],
                "home_care": [
                    "Drink plenty of fluids (water, broth, electrolyte solutions)",
                    "Rest and avoid physical exertion",
                    "Use light clothing and keep room temperature comfortable",
                    "Take fever-reducers like acetaminophen or ibuprofen as directed",
                    "Use cool compresses on forehead and wrists"
                ],
                "warning_signs": [
                    "Temperature above 40°C (104°F)",
                    "Fever lasting more than 3 days", 
                    "Severe headache or stiff neck",
                    "Difficulty breathing",
                    "Confusion or disorientation",
                    "Seizures",
                    "Rash that doesn't fade under pressure"
                ]
            },
            "dengue": {
                "definition": "Dengue is a mosquito-borne viral infection causing flu-like illness that can develop into severe dengue (dengue hemorrhagic fever).",
                "symptoms": [
                    "High fever (40°C/104°F)",
                    "Severe headache",
                    "Pain behind eyes", 
                    "Muscle and joint pain",
                    "Nausea and vomiting",
                    "Skin rash",
                    "Mild bleeding (nose or gum bleed)"
                ],
                "treatment": [
                    "No specific antiviral treatment",
                    "Rest and hydration are crucial",
                    "Acetaminophen for fever and pain (avoid aspirin/ibuprofen)",
                    "Monitor platelet count regularly", 
                    "Hospitalization if severe symptoms develop"
                ],
                "prevention": [
                    "Use mosquito repellent",
                    "Wear long-sleeved clothing",
                    "Use mosquito nets",
                    "Eliminate standing water where mosquitoes breed",
                    "Install window screens"
                ]
            },
            "malaria": {
                "definition": "Malaria is a serious parasitic disease transmitted through the bite of infected Anopheles mosquitoes.",
                "symptoms": [
                    "High fever with chills and shivering",
                    "Headache and muscle pains", 
                    "Fatigue",
                    "Nausea and vomiting",
                    "Diarrhea", 
                    "Anemia and jaundice",
                    "Cyclic fever episodes every 48-72 hours"
                ],
                "treatment": [
                    "Antimalarial medications (chloroquine, artemisinin-based therapy)",
                    "Early diagnosis and treatment are critical",
                    "Hospital care for severe cases", 
                    "Supportive care for symptoms"
                ],
                "prevention": [
                    "Antimalarial prophylaxis when traveling to endemic areas",
                    "Mosquito bite prevention",
                    "Sleep under insecticide-treated nets", 
                    "Indoor residual spraying"
                ]
            },
            "typhoid": {
                "definition": "Typhoid fever is a bacterial infection caused by Salmonella typhi, spread through contaminated food or water.",
                "symptoms": [
                    "Sustained high fever",
                    "Headache and weakness",
                    "Stomach pain",
                    "Loss of appetite",
                    "Rose-colored spots on chest",
                    "Diarrhea or constipation"
                ],
                "treatment": [
                    "Antibiotics (ceftriaxone, azithromycin)",
                    "Adequate hydration",
                    "Proper nutrition",
                    "Hospitalization for severe cases",
                    "Complete the full course of antibiotics"
                ],
                "prevention": [
                    "Vaccination for travelers to endemic areas",
                    "Drink boiled or bottled water",
                    "Eat well-cooked food",
                    "Practice good hand hygiene",
                    "Avoid raw fruits and vegetables unless peeled"
                ]
            },
            "covid": {
                "definition": "COVID-19 is a respiratory illness caused by the SARS-CoV-2 virus, first identified in 2019.",
                "symptoms": [
                    "Fever or chills",
                    "Cough",
                    "Shortness of breath",
                    "Fatigue",
                    "Muscle or body aches",
                    "Loss of taste or smell",
                    "Sore throat",
                    "Congestion or runny nose"
                ],
                "treatment": [
                    "Rest and hydration",
                    "Fever reducers and pain relievers",
                    "Monitor oxygen saturation with pulse oximeter",
                    "Antiviral medications for high-risk patients",
                    "Hospital care for severe breathing difficulties"
                ],
                "prevention": [
                    "Vaccination and boosters",
                    "Mask-wearing in crowded places",
                    "Hand hygiene",
                    "Physical distancing",
                    "Good ventilation in indoor spaces"
                ]
            }
        };
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

        // Enable send button by default if there's text
        sendButton.disabled = messageInput.value.trim() === '';
    }

    loadSuggestions() {
        try {
            const suggestions = [
                "What is dengue fever and its symptoms?",
                "How to treat malaria at home?",
                "What are the warning signs for fever?",
                "How to prevent typhoid fever?",
                "What's the difference between viral fever and COVID-19?",
                "When should I go to hospital for fever?",
                "What home remedies help reduce fever?",
                "How long does a typical fever last?"
            ];

            const suggestionsContainer = document.getElementById('suggestions');
            suggestionsContainer.innerHTML = '';
            
            suggestions.forEach(suggestion => {
                const chip = document.createElement('div');
                chip.className = 'suggestion-chip';
                chip.textContent = suggestion;
                chip.addEventListener('click', () => {
                    document.getElementById('messageInput').value = suggestion;
                    document.getElementById('messageInput').focus();
                    // Enable send button when suggestion is clicked
                    document.getElementById('sendButton').disabled = false;
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
            // Generate response
            const response = this.generateResponse(message);
            
            // Simulate typing delay
            await this.delay(1000 + Math.random() * 1000);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add bot response to chat
            this.addMessage(response, 'bot');
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessage(
                "I'm sorry, I'm having trouble processing your request right now. Please try again later.", 
                'bot'
            );
        }
        
        // Re-enable send button and refocus input
        document.getElementById('sendButton').disabled = false;
        messageInput.focus();
    }

    generateResponse(message) {
        const messageLower = message.toLowerCase();
        
        // Greeting patterns
        if (this.containsAny(messageLower, ['hello', 'hi', 'hey', 'greetings'])) {
            const greetings = [
                "Hello! I'm FTIS Medical Assistant. I can help answer questions about fevers, diseases, and general health information. What would you like to know?",
                "Hi there! I'm here to provide medical information about fevers and related conditions. How can I assist you today?",
                "Welcome! I'm your medical information assistant. I can explain symptoms, treatments, and prevention methods for various fever-related illnesses."
            ];
            return this.randomChoice(greetings);
        }
        
        // Farewell patterns
        if (this.containsAny(messageLower, ['bye', 'goodbye', 'thanks', 'thank you'])) {
            const farewells = [
                "You're welcome! Remember, I'm not a substitute for professional medical advice. Stay healthy!",
                "Glad I could help! Please consult a healthcare provider for personalized medical advice.",
                "Take care! If symptoms worsen or you have concerns, please seek medical attention."
            ];
            return this.randomChoice(farewells);
        }
        
        // Emergency advice
        if (this.containsAny(messageLower, ['emergency', 'urgent', 'help now', 'critical', '911'])) {
            return `🚨 **MEDICAL EMERGENCY ADVICE** 🚨

If you or someone else is experiencing:
• Difficulty breathing or shortness of breath
• Chest pain or pressure
• Severe bleeding that won't stop
• Confusion or loss of consciousness
• Seizures or convulsions
• Severe allergic reaction

**Call emergency services immediately! (911 or your local emergency number)**

Do not rely on chatbot advice for emergency situations.`;
        }
        
        // Disease-specific queries
        for (const disease of ['dengue', 'malaria', 'typhoid', 'covid']) {
            if (messageLower.includes(disease)) {
                return this.getDiseaseInfo(disease, messageLower);
            }
        }
        
        // Fever queries
        if (messageLower.includes('fever')) {
            return this.getFeverInfo(messageLower);
        }
        
        // Symptom queries
        if (this.containsAny(messageLower, ['symptom', 'sign', 'feel', 'experience'])) {
            return "**Common Fever Symptoms**:\n• High temperature\n• Headache\n• Body pain and muscle aches\n• Chills and sweating\n• Fatigue and weakness\n• Loss of appetite\n\nSpecific diseases have additional symptoms - ask about dengue, malaria, or typhoid for details.";
        }
        
        // Treatment queries
        if (this.containsAny(messageLower, ['treatment', 'cure', 'medicine', 'medication', 'what to do'])) {
            return "**General Fever Treatment**:\n• Rest and adequate sleep\n• Drink plenty of fluids\n• Take fever reducers as directed\n• Use cool compresses\n• Wear lightweight clothing\n\nTreatment depends on the specific condition. Always consult a doctor for proper diagnosis and treatment.";
        }
        
        // Prevention queries
        if (this.containsAny(messageLower, ['prevent', 'avoid', 'protection', 'how to prevent'])) {
            return "**General Fever Prevention**:\n• Practice good hand hygiene\n• Avoid close contact with sick individuals\n• Maintain a healthy immune system\n• Get vaccinated when available\n• Use mosquito protection in endemic areas\n\nSpecific prevention methods vary by disease.";
        }

        // Home care queries
        if (this.containsAny(messageLower, ['home', 'care', 'remedy', 'home treatment'])) {
            return "**Fever Home Care Tips**:\n• Drink water, broth, or electrolyte solutions\n• Rest in a comfortable environment\n• Take acetaminophen or ibuprofen as directed\n• Use lukewarm sponge baths\n• Monitor temperature regularly\n• Watch for warning signs that need medical attention";
        }

        // Duration queries
        if (this.containsAny(messageLower, ['how long', 'duration', 'last', 'persist'])) {
            return "**Typical Fever Duration**:\n• Viral fevers: 3-7 days\n• Bacterial infections: Varies with treatment\n• Dengue fever: 2-7 days\n• Malaria: Cyclic patterns\n• COVID-19: 1-2 weeks\n\nConsult a doctor if fever lasts more than 3 days or is accompanied by severe symptoms.";
        }
        
        // Default response
        const defaultResponses = [
            "I'm not sure I understand. Could you try asking about specific diseases like dengue, malaria, typhoid, or COVID-19?",
            "I specialize in fever-related medical information. Try asking about symptoms, treatments, or prevention for specific conditions.",
            "I can help with information about fevers, dengue, malaria, typhoid, and COVID-19. What would you like to know?",
            "Please ask about specific fever-related topics like symptoms, causes, treatments, or prevention methods."
        ];
        
        return this.randomChoice(defaultResponses) + "\n\n---\n*Note: I'm an AI assistant providing general information. I'm not a substitute for professional medical advice, diagnosis, or treatment.*";
    }

    getDiseaseInfo(disease, message) {
        const diseaseInfo = this.medicalKnowledge[disease];
        if (!diseaseInfo) return `I don't have specific information about ${disease} in my knowledge base.`;

        if (message.includes('what') || message.includes('define') || message.includes('is')) {
            return `**${disease.toUpperCase()}**: ${diseaseInfo.definition}`;
        } else if (message.includes('symptom')) {
            const symptoms = diseaseInfo.symptoms.join('\n• ');
            return `**${disease.toUpperCase()} SYMPTOMS**:\n• ${symptoms}`;
        } else if (message.includes('treatment') || message.includes('cure') || message.includes('medicine')) {
            const treatments = diseaseInfo.treatment.join('\n• ');
            return `**${disease.toUpperCase()} TREATMENT**:\n• ${treatments}`;
        } else if (message.includes('prevent')) {
            const prevention = diseaseInfo.prevention.join('\n• ');
            return `**${disease.toUpperCase()} PREVENTION**:\n• ${prevention}`;
        } else {
            // General disease overview
            const keySymptoms = diseaseInfo.symptoms.slice(0, 4).join('\n• ');
            return `**${disease.toUpperCase()} OVERVIEW**:\n${diseaseInfo.definition}\n\n**KEY SYMPTOMS**:\n• ${keySymptoms}\n\n**TREATMENT**: ${diseaseInfo.treatment[0]}\n**PREVENTION**: ${diseaseInfo.prevention[0]}`;
        }
    }

    getFeverInfo(message) {
        const feverInfo = this.medicalKnowledge['fever'];
        
        if (message.includes('what') || message.includes('define')) {
            return `**FEVER**: ${feverInfo.definition}`;
        } else if (message.includes('cause')) {
            const causes = feverInfo.causes.join('\n• ');
            return `**COMMON CAUSES OF FEVER**:\n• ${causes}`;
        } else if (message.includes('treatment') || message.includes('home') || message.includes('care')) {
            const homeCare = feverInfo.home_care.join('\n• ');
            return `**FEVER HOME CARE**:\n• ${homeCare}`;
        } else if (message.includes('warning') || message.includes('danger') || message.includes('emergency')) {
            const warnings = feverInfo.warning_signs.join('\n• ');
            return `**SEEK MEDICAL ATTENTION IF YOU HAVE**:\n• ${warnings}`;
        } else {
            return `**FEVER INFORMATION**:\n${feverInfo.definition}\n\nFor specific information, ask about:\n• Causes of fever\n• Home care tips\n• Warning signs\n• When to see a doctor`;
        }
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

    containsAny(str, terms) {
        return terms.some(term => str.includes(term));
    }

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize chatbot when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.medicalChatbot = new MedicalChatbot();
    console.log('Medical Chatbot initialized successfully!');
});