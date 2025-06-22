class OllamaWebInterface {
    constructor() {
        this.currentModel = null;
        this.chatHistory = [];
        this.recentMessages = [];
        this.isGenerating = false;
        
        this.initializeElements();
        this.bindEvents();
        this.checkConnection();
        this.loadModels();
    }

    initializeElements() {
        this.elements = {
            statusIndicator: document.getElementById('statusIndicator'),
            statusDot: document.querySelector('.status-dot'),
            statusText: document.querySelector('.status-text'),
            modelSelect: document.getElementById('modelSelect'),
            promptInput: document.getElementById('promptInput'),
            sendButton: document.getElementById('sendButton'),
            clearChat: document.getElementById('clearChat'),
            chatMessages: document.getElementById('chatMessages'),
            charCount: document.getElementById('charCount'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            temperature: document.getElementById('temperature'),
            temperatureValue: document.getElementById('temperatureValue'),
            maxTokens: document.getElementById('maxTokens'),
            topP: document.getElementById('topP'),
            topPValue: document.getElementById('topPValue'),
            modelInfo: document.getElementById('modelInfo'),
            recentMessages: document.getElementById('recentMessages')
        };
    }

    bindEvents() {
        // Send message
        this.elements.sendButton.addEventListener('click', () => this.sendMessage());
        this.elements.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Clear chat
        this.elements.clearChat.addEventListener('click', () => this.clearChat());

        // Character count
        this.elements.promptInput.addEventListener('input', () => this.updateCharCount());

        // Model selection
        this.elements.modelSelect.addEventListener('change', (e) => this.onModelChange(e.target.value));

        // Settings
        this.elements.temperature.addEventListener('input', (e) => {
            this.elements.temperatureValue.textContent = e.target.value;
        });

        this.elements.topP.addEventListener('input', (e) => {
            this.elements.topPValue.textContent = e.target.value;
        });

        // Recent messages
        this.elements.recentMessages.addEventListener('click', (e) => {
            if (e.target.tagName === 'P' && e.target.textContent !== 'No recent messages') {
                this.elements.promptInput.value = e.target.textContent;
                this.updateCharCount();
            }
        });
    }

    async checkConnection() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            if (data.status === 'healthy') {
                this.updateStatus(true, 'Connected to Ollama');
            } else {
                this.updateStatus(false, 'Ollama not responding');
            }
        } catch (error) {
            this.updateStatus(false, 'Connection failed');
        }
    }

    updateStatus(connected, message) {
        const { statusDot, statusText } = this.elements;
        
        if (connected) {
            statusDot.classList.add('connected');
            statusText.textContent = message;
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = message;
        }
    }

    async loadModels() {
        try {
            const response = await fetch('/api/models');
            const data = await response.json();
            
            this.elements.modelSelect.innerHTML = '<option value="">Select a model...</option>';
            
            if (data.models && data.models.length > 0) {
                data.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.name;
                    option.textContent = `${model.name} (${this.formatSize(model.size)})`;
                    this.elements.modelSelect.appendChild(option);
                });
            } else {
                this.elements.modelSelect.innerHTML = '<option value="">No models found</option>';
            }
        } catch (error) {
            console.error('Error loading models:', error);
            this.elements.modelSelect.innerHTML = '<option value="">Error loading models</option>';
        }
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    onModelChange(modelName) {
        this.currentModel = modelName;
        this.updateSendButton();
        
        if (modelName) {
            this.updateModelInfo(modelName);
        } else {
            this.elements.modelInfo.innerHTML = '<p>Select a model to see details</p>';
        }
    }

    updateModelInfo(modelName) {
        // This would typically fetch model details from Ollama
        this.elements.modelInfo.innerHTML = `
            <p><strong>Model:</strong> ${modelName}</p>
            <p><strong>Status:</strong> Ready</p>
            <p><strong>Type:</strong> Local LLM</p>
        `;
    }

    updateCharCount() {
        const length = this.elements.promptInput.value.length;
        this.elements.charCount.textContent = `${length}/4000`;
        this.updateSendButton();
    }

    updateSendButton() {
        const hasText = this.elements.promptInput.value.trim().length > 0;
        const hasModel = this.currentModel;
        this.elements.sendButton.disabled = !hasText || !hasModel || this.isGenerating;
    }

    async sendMessage() {
        if (this.isGenerating || !this.currentModel) return;

        const prompt = this.elements.promptInput.value.trim();
        if (!prompt) return;

        // Add user message to chat
        this.addMessage('user', prompt);
        
        // Clear input
        this.elements.promptInput.value = '';
        this.updateCharCount();
        
        // Add to recent messages
        this.addToRecentMessages(prompt);

        // Show loading
        this.isGenerating = true;
        this.elements.loadingOverlay.classList.add('show');
        this.updateSendButton();

        try {
            const options = {
                temperature: parseFloat(this.elements.temperature.value),
                top_p: parseFloat(this.elements.topP.value),
                num_predict: parseInt(this.elements.maxTokens.value)
            };

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.currentModel,
                    prompt: prompt,
                    options: options
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.response) {
                this.addMessage('assistant', data.response);
            } else {
                throw new Error('No response from model');
            }

        } catch (error) {
            console.error('Error generating response:', error);
            this.addMessage('system', `Error: ${error.message}`);
        } finally {
            this.isGenerating = false;
            this.elements.loadingOverlay.classList.remove('show');
            this.updateSendButton();
        }
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        this.elements.chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        // Add to chat history
        this.chatHistory.push({ type, content, timestamp: new Date() });
    }

    addToRecentMessages(message) {
        // Add to beginning of array
        this.recentMessages.unshift(message);
        
        // Keep only last 10 messages
        if (this.recentMessages.length > 10) {
            this.recentMessages = this.recentMessages.slice(0, 10);
        }
        
        this.updateRecentMessagesDisplay();
    }

    updateRecentMessagesDisplay() {
        const container = this.elements.recentMessages;
        
        if (this.recentMessages.length === 0) {
            container.innerHTML = '<p>No recent messages</p>';
            return;
        }
        
        container.innerHTML = this.recentMessages
            .map(message => `<p>${this.truncateMessage(message)}</p>`)
            .join('');
    }

    truncateMessage(message, maxLength = 50) {
        return message.length > maxLength 
            ? message.substring(0, maxLength) + '...' 
            : message;
    }

    clearChat() {
        this.elements.chatMessages.innerHTML = `
            <div class="message system">
                <div class="message-content">
                    <i class="fas fa-info-circle"></i>
                    Chat cleared. Select a model and start a new conversation.
                </div>
            </div>
        `;
        this.chatHistory = [];
    }
}

// Initialize the interface when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new OllamaWebInterface();
}); 