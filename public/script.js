class OllamaWebInterface {
    constructor() {
        this.currentModel = null;
        this.chatHistory = [];
        this.recentMessages = [];
        this.isGenerating = false;
        this.currentImage = null;
        this.currentTheme = 'dark';
        this.currentUser = null;
        this.imageSupportedModels = [
            'gemma3:12b',
            'gemma3:27b',
            'llava',
            'llava:7b',
            'llava:13b',
            'bakllava',
            'llava-llama3',
            'llava-llama3:8b',
            'llava-llama3:34b'
        ];
        
        this.initializeElements();
        this.bindEvents();
        this.loadTheme();
        this.checkLoginStatus();
    }

    initializeElements() {
        this.elements = {
            // Login elements
            loginModal: document.getElementById('loginModal'),
            loginForm: document.getElementById('loginForm'),
            userName: document.getElementById('userName'),
            mainInterface: document.getElementById('mainInterface'),
            currentUser: document.getElementById('currentUser'),
            logoutBtn: document.getElementById('logoutBtn'),
            
            // Main interface elements
            statusIndicator: document.getElementById('statusIndicator'),
            statusDot: document.querySelector('.status-dot'),
            statusText: document.querySelector('.status-text'),
            modelSelect: document.getElementById('modelSelect'),
            promptInput: document.getElementById('promptInput'),
            sendButton: document.getElementById('sendButton'),
            clearChat: document.getElementById('clearChat'),
            exportChat: document.getElementById('exportChat'),
            chatMessages: document.getElementById('chatMessages'),
            charCount: document.getElementById('charCount'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            temperature: document.getElementById('temperature'),
            temperatureValue: document.getElementById('temperatureValue'),
            maxTokens: document.getElementById('maxTokens'),
            maxTokensValue: document.getElementById('maxTokensValue'),
            topP: document.getElementById('topP'),
            topPValue: document.getElementById('topPValue'),
            modelInfo: document.getElementById('modelInfo'),
            recentMessages: document.getElementById('recentMessages'),
            imageUpload: document.getElementById('imageUpload'),
            imagePreview: document.getElementById('imagePreview'),
            previewImg: document.getElementById('previewImg'),
            removeImage: document.getElementById('removeImage'),
            currentTime: document.getElementById('currentTime'),
            sidebar: document.getElementById('sidebar'),
            menuBtn: document.getElementById('menuBtn'),
            sidebarToggle: document.getElementById('sidebarToggle'),
            inputSuggestions: document.getElementById('inputSuggestions')
        };
    }

    bindEvents() {
        // Login form
        this.elements.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout
        this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());

        // Send message
        this.elements.sendButton.addEventListener('click', () => this.sendMessage());
        this.elements.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Clear and export chat
        this.elements.clearChat.addEventListener('click', () => this.clearChat());
        this.elements.exportChat.addEventListener('click', () => this.exportChat());

        // Character count
        this.elements.promptInput.addEventListener('input', () => {
            this.updateCharCount();
            this.autoResize();
        });

        // Model selection
        this.elements.modelSelect.addEventListener('change', (e) => this.onModelChange(e.target.value));

        // Settings
        this.elements.temperature.addEventListener('input', (e) => {
            this.elements.temperatureValue.textContent = e.target.value;
        });

        this.elements.topP.addEventListener('input', (e) => {
            this.elements.topPValue.textContent = e.target.value;
        });

        this.elements.maxTokens.addEventListener('input', (e) => {
            this.elements.maxTokensValue.textContent = e.target.value;
        });

        // Recent messages
        this.elements.recentMessages.addEventListener('click', (e) => {
            if (e.target.tagName === 'P' && e.target.textContent !== 'No recent messages') {
                this.elements.promptInput.value = e.target.textContent;
                this.updateCharCount();
                this.autoResize();
            }
        });

        // Image upload with proper disabled handling
        const imageUploadLabel = this.elements.imageUpload.parentElement;
        imageUploadLabel.addEventListener('click', (e) => {
            console.log('Image upload clicked, disabled state:', imageUploadLabel.classList.contains('disabled'));
            if (imageUploadLabel.classList.contains('disabled')) {
                e.preventDefault();
                e.stopPropagation();
                const message = this.currentModel ? 
                    'Image upload not supported for this model' : 
                    'Select a model that supports images';
                this.showNotification(message, 'warning');
                return false;
            }
            // If not disabled, let the click proceed to trigger file input
            console.log('Image upload enabled, proceeding with file selection');
        });

        this.elements.imageUpload.addEventListener('change', (e) => {
            console.log('File input change event triggered');
            this.handleImageUpload(e);
        });
        this.elements.removeImage.addEventListener('click', () => this.removeImage());

        // Theme switching
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTheme(e.target.dataset.theme));
        });

        // Mobile menu
        this.elements.menuBtn.addEventListener('click', () => this.toggleSidebar());
        this.elements.sidebarToggle.addEventListener('click', () => this.toggleSidebar());

        // Input suggestions
        this.elements.inputSuggestions.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-btn')) {
                this.elements.promptInput.value = e.target.dataset.suggestion;
                this.updateCharCount();
                this.autoResize();
                this.elements.promptInput.focus();
            }
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && 
                !this.elements.sidebar.contains(e.target) && 
                !this.elements.menuBtn.contains(e.target) &&
                this.elements.sidebar.classList.contains('show')) {
                this.toggleSidebar();
            }
        });
    }

    // User management methods
    async handleLogin() {
        const userName = this.elements.userName.value.trim();
        
        if (!userName) {
            this.showNotification('Please enter your name', 'error');
            return;
        }

        try {
            const response = await fetch('/api/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: userName })
            });

            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                // Hide login modal and show main interface
                this.elements.loginModal.style.display = 'none';
                this.elements.mainInterface.classList.remove('hidden');
                
                // Update UI
                this.elements.currentUser.textContent = this.currentUser.name;
                
                // Initialize the rest of the app
                this.checkConnection();
                this.loadModels();
                this.updateCurrentTime();
                this.setupAutoResize();
                this.loadConversationHistory();
                
                this.showNotification(`Welcome, ${this.currentUser.name}!`, 'success');
            } else {
                this.showNotification(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please try again.', 'error');
        }
    }

    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        
        // Clear chat
        this.chatHistory = [];
        this.elements.chatMessages.innerHTML = '';
        
        // Show login modal
        this.elements.loginModal.style.display = 'flex';
        this.elements.mainInterface.classList.add('hidden');
        this.elements.userName.value = '';
        this.elements.userName.focus();
    }

    checkLoginStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.elements.userName.value = this.currentUser.name;
                this.handleLogin(); // Auto-login
            } catch (error) {
                console.error('Error parsing saved user:', error);
                localStorage.removeItem('currentUser');
            }
        }
    }

    async loadConversationHistory() {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`/api/conversations/${this.currentUser.name}`);
            const data = await response.json();
            
            if (data.conversations && data.conversations.length > 0) {
                // Load recent conversations into chat
                const recentConversations = data.conversations.slice(0, 10).reverse();
                
                recentConversations.forEach(conv => {
                    this.addMessage('user', conv.prompt, null, false);
                    this.addMessage('assistant', conv.response, null, false);
                });
                
                this.showNotification(`Loaded ${recentConversations.length} recent conversations`, 'success');
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.switchTheme(savedTheme);
    }

    switchTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Update theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    toggleSidebar() {
        this.elements.sidebar.classList.toggle('show');
    }

    setupAutoResize() {
        this.autoResize();
    }

    autoResize() {
        const textarea = this.elements.promptInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }

    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.elements.currentTime.textContent = timeString;
    }

    isImageSupported(modelName) {
        return this.imageSupportedModels.some(supportedModel => 
            modelName.toLowerCase().includes(supportedModel.toLowerCase())
        );
    }

    updateImageUploadStatus() {
        const imageUploadLabel = this.elements.imageUpload.parentElement;
        const isSupported = this.currentModel && this.isImageSupported(this.currentModel);
        
        if (isSupported) {
            imageUploadLabel.classList.remove('disabled');
            imageUploadLabel.title = 'Upload image';
        } else {
            imageUploadLabel.classList.add('disabled');
            imageUploadLabel.title = this.currentModel ? 
                'Image upload not supported for this model' : 
                'Select a model that supports images';
            
            // Remove any existing image if model doesn't support it
            if (this.currentImage) {
                this.removeImage();
                this.showNotification('Image removed - current model does not support image interpretation', 'warning');
            }
        }
    }

    handleImageUpload(event) {
        console.log('handleImageUpload called with event:', event);
        const file = event.target.files[0];
        console.log('Selected file:', file);
        
        if (!file) {
            console.log('No file selected');
            return;
        }

        if (!this.currentModel) {
            this.showNotification('Please select a model first', 'warning');
            return;
        }

        if (!this.isImageSupported(this.currentModel)) {
            this.showNotification('This model does not support image interpretation', 'error');
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select an image file.', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            this.showNotification('Image file is too large. Please select an image smaller than 10MB.', 'error');
            return;
        }

        console.log('File validation passed, starting to read file...');
        const reader = new FileReader();
        
        reader.onload = (e) => {
            console.log('FileReader onload triggered');
            try {
                const result = e.target.result;
                if (!result || typeof result !== 'string') {
                    throw new Error('Invalid file read result');
                }

                // Ensure we have the complete data URL format
                if (!result.startsWith('data:image/')) {
                    throw new Error('Invalid image data URL');
                }

                const base64Data = result.split(',')[1];
                if (!base64Data) {
                    throw new Error('Invalid base64 data');
                }

                console.log('Image processed successfully, setting currentImage');
                this.currentImage = {
                    file: file,
                    dataUrl: result,
                    base64: base64Data
                };
                
                this.elements.previewImg.src = result;
                this.elements.imagePreview.style.display = 'inline-block';
                this.updateSendButton();
                
                this.showNotification('Image uploaded successfully!', 'success');
            } catch (error) {
                console.error('Error processing image:', error);
                this.showNotification('Error processing image. Please try again.', 'error');
                this.removeImage();
            }
        };

        reader.onerror = () => {
            console.error('FileReader error occurred');
            this.showNotification('Error reading image file. Please try again.', 'error');
            this.removeImage();
        };

        console.log('Starting FileReader.readAsDataURL...');
        reader.readAsDataURL(file);
    }

    removeImage() {
        this.currentImage = null;
        if (this.elements.imagePreview) {
            this.elements.imagePreview.style.display = 'none';
        }
        if (this.elements.imageUpload) {
            this.elements.imageUpload.value = '';
        }
        this.updateSendButton();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
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
                    const isImageSupported = this.isImageSupported(model.name);
                    const imageIcon = isImageSupported ? ' 📸' : '';
                    option.textContent = `${model.name} (${this.formatSize(model.size)})${imageIcon}`;
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
        this.updateImageUploadStatus();
        
        if (modelName) {
            this.updateModelInfo(modelName);
        } else {
            this.elements.modelInfo.innerHTML = '<p>Select a model to see details</p>';
        }
    }

    updateModelInfo(modelName) {
        const isImageSupported = this.isImageSupported(modelName);
        const imageSupport = isImageSupported ? '✅ Supports image interpretation' : '❌ No image support';
        
        this.elements.modelInfo.innerHTML = `
            <p><strong>Model:</strong> ${modelName}</p>
            <p><strong>Image Support:</strong> ${imageSupport}</p>
            <p><strong>Status:</strong> Ready to chat</p>
        `;
    }

    updateCharCount() {
        const length = this.elements.promptInput.value.length;
        this.elements.charCount.textContent = `${length}/4000`;
        
        if (length > 3500) {
            this.elements.charCount.style.color = 'var(--warning-color)';
        } else if (length > 4000) {
            this.elements.charCount.style.color = 'var(--error-color)';
        } else {
            this.elements.charCount.style.color = 'var(--text-muted)';
        }
    }

    updateSendButton() {
        const hasText = this.elements.promptInput.value.trim().length > 0;
        const hasImage = this.currentImage !== null;
        const hasModel = this.currentModel !== null;
        const canSend = (hasText || hasImage) && hasModel && !this.isGenerating;
        
        this.elements.sendButton.disabled = !canSend;
    }

    async sendMessage() {
        if (this.isGenerating || !this.currentModel || !this.currentUser) return;

        const prompt = this.elements.promptInput.value.trim();
        const hasImage = this.currentImage !== null;
        
        console.log('Debug image state:', {
            prompt: prompt,
            hasImage: hasImage,
            currentImage: this.currentImage ? {
                hasFile: !!this.currentImage.file,
                hasDataUrl: !!this.currentImage.dataUrl,
                hasBase64: !!this.currentImage.base64,
                base64Length: this.currentImage?.base64?.length || 0
            } : null
        });
        
        if (!prompt && !hasImage) return;

        // Check if image is supported for this model
        if (hasImage && !this.isImageSupported(this.currentModel)) {
            this.showNotification('This model does not support image interpretation', 'error');
            return;
        }

        // Validate image data before sending
        if (hasImage && (!this.currentImage || !this.currentImage.base64)) {
            this.showNotification('Invalid image data. Please try uploading the image again.', 'error');
            this.removeImage();
            return;
        }

        // Add user message to chat
        this.addMessage('user', prompt, hasImage ? this.currentImage.dataUrl : null);
        
        // Clear input but keep image for request
        this.elements.promptInput.value = '';
        this.updateCharCount();
        this.autoResize();
        
        // Add to recent messages
        if (prompt) {
            this.addToRecentMessages(prompt);
        }

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

            let requestBody = {
                model: this.currentModel,
                prompt: prompt || "Please describe this image in detail.",
                userName: this.currentUser.name,
                options: options
            };

            // Add image data if present and valid
            if (hasImage && this.currentImage && this.currentImage.base64) {
                requestBody.images = [this.currentImage.base64];
                console.log('Sending image data:', {
                    hasImage: true,
                    base64Length: this.currentImage.base64.length,
                    base64Preview: this.currentImage.base64.substring(0, 50) + '...',
                    imageType: this.currentImage.file.type,
                    imageSize: this.currentImage.file.size
                });
            }

            console.log('Sending request to Ollama:', {
                model: this.currentModel,
                prompt: requestBody.prompt,
                userName: this.currentUser.name,
                hasImages: requestBody.images ? requestBody.images.length : 0,
                options: options,
                requestBodyKeys: Object.keys(requestBody)
            });

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Add assistant response to chat
            this.addMessage('assistant', data.response);

        } catch (error) {
            console.error('Error generating response:', error);
            this.addMessage('system', `Error: ${error.message}`);
        } finally {
            // Now remove the image after the request is complete
            this.removeImage();
            
            this.isGenerating = false;
            this.elements.loadingOverlay.classList.remove('show');
            this.updateSendButton();
        }
    }

    addMessage(type, content, imageUrl = null, addToHistory = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let avatarIcon = 'fas fa-user';
        let authorName = 'You';
        
        if (type === 'assistant') {
            avatarIcon = 'fas fa-robot';
            authorName = 'Assistant';
        } else if (type === 'system') {
            avatarIcon = 'fas fa-info-circle';
            authorName = 'System';
        }

        // Render markdown for assistant messages
        const renderedContent = type === 'assistant' ? this.renderMarkdown(content) : this.escapeHtml(content);

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${authorName}</span>
                    <span class="message-time">${timeString}</span>
                </div>
                <div class="message-text">${renderedContent}</div>
                ${imageUrl ? `<div class="message-image"><img src="${imageUrl}" alt="Uploaded image"></div>` : ''}
            </div>
        `;

        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        // Add to chat history
        if (addToHistory) {
            this.chatHistory.push({
                type,
                content,
                timestamp: now,
                imageUrl
            });
        }

        // Highlight code blocks
        if (type === 'assistant') {
            this.highlightCodeBlocks(messageDiv);
        }
    }

    renderMarkdown(text) {
        try {
            // Configure marked options
            marked.setOptions({
                breaks: true,
                gfm: true
            });
            
            return marked.parse(text);
        } catch (error) {
            console.error('Markdown rendering error:', error);
            return this.escapeHtml(text);
        }
    }

    highlightCodeBlocks(messageDiv) {
        const codeBlocks = messageDiv.querySelectorAll('pre code');
        codeBlocks.forEach(block => {
            if (window.Prism) {
                Prism.highlightElement(block);
            }
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }

    addToRecentMessages(message) {
        if (!this.recentMessages.includes(message)) {
            this.recentMessages.unshift(message);
            if (this.recentMessages.length > 10) {
                this.recentMessages.pop();
            }
            this.updateRecentMessagesDisplay();
        }
    }

    updateRecentMessagesDisplay() {
        const container = this.elements.recentMessages;
        
        if (this.recentMessages.length === 0) {
            container.innerHTML = '<p>No recent messages</p>';
            return;
        }
        
        container.innerHTML = '';
        this.recentMessages.forEach(message => {
            const p = document.createElement('p');
            p.textContent = this.truncateMessage(message);
            container.appendChild(p);
        });
    }

    truncateMessage(message, maxLength = 50) {
        return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
    }

    async clearChat() {
        if (!this.currentUser) {
            this.showNotification('Please log in first', 'warning');
            return;
        }

        if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
            try {
                const response = await fetch(`/api/conversations/${this.currentUser.name}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.chatHistory = [];
                    this.elements.chatMessages.innerHTML = '';
                    this.showNotification(`Cleared ${data.deletedCount} conversations`, 'success');
                } else {
                    this.showNotification('Failed to clear chat history', 'error');
                }
            } catch (error) {
                console.error('Error clearing chat:', error);
                this.showNotification('Error clearing chat history', 'error');
            }
        }
    }

    exportChat() {
        if (this.chatHistory.length === 0) {
            this.showNotification('No chat history to export', 'warning');
            return;
        }

        const exportData = {
            user: this.currentUser?.name || 'Unknown',
            exportDate: new Date().toISOString(),
            conversations: this.chatHistory
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ollama-chat-${this.currentUser?.name || 'export'}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Chat exported successfully!', 'success');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new OllamaWebInterface();
}); 