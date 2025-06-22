const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const ChatDatabase = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Initialize database
const db = new ChatDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(express.static('public'));

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// User management endpoints
app.post('/api/user/login', (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        const trimmedName = name.trim();
        const user = db.createUser(trimmedName);
        
        res.json({ 
            success: true, 
            user: user,
            message: user ? 'Welcome back!' : 'New user created!'
        });
    } catch (error) {
        console.error('Error in user login:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.get('/api/user/:name', (req, res) => {
    try {
        const { name } = req.params;
        const user = db.getUserByName(name);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const stats = db.getUserStats(user.id);
        res.json({ user, stats });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Get available models
app.get('/api/models', async (req, res) => {
    try {
        const response = await axios.get(`${OLLAMA_URL}/api/tags`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching models:', error.message);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

// Generate response from Ollama with conversation context
app.post('/api/generate', async (req, res) => {
    try {
        const { model, prompt, options = {}, images = [], userName } = req.body;
        
        console.log('Received request:', {
            model,
            prompt,
            userName,
            hasOptions: !!options,
            optionsKeys: Object.keys(options),
            hasImages: !!images,
            imagesLength: images ? images.length : 0,
            allKeys: Object.keys(req.body)
        });
        
        if (!model || (!prompt && images.length === 0)) {
            return res.status(400).json({ error: 'Model and either prompt or image are required' });
        }

        if (!userName) {
            return res.status(400).json({ error: 'User name is required' });
        }

        // Get or create user
        const user = db.createUser(userName);
        if (!user) {
            return res.status(500).json({ error: 'Failed to get user' });
        }

        // Get conversation context
        const hasImages = images && images.length > 0;
        const context = db.getConversationContext(user.id, 5, hasImages); // Exclude images if current request has images
        let fullPrompt = prompt || "Please describe this image in detail.";
        
        // Add context if available
        if (context) {
            fullPrompt = `${context}\n\nUser: ${fullPrompt}`;
            console.log(`Adding conversation context for user ${userName} (${context.length} chars, excludeImages: ${hasImages})`);
        }

        const requestBody = {
            model,
            prompt: fullPrompt,
            stream: false,
            ...options
        };

        // Add images if present
        if (images && images.length > 0) {
            // Validate image data
            images.forEach((img, index) => {
                if (!img || typeof img !== 'string') {
                    throw new Error(`Invalid image data at index ${index}`);
                }
                // Check if it's valid base64
                if (!/^[A-Za-z0-9+/]*={0,2}$/.test(img)) {
                    throw new Error(`Invalid base64 format at index ${index}`);
                }
            });
            
            requestBody.images = images;
            console.log(`Processing ${images.length} image(s) for model: ${model}`);
            console.log(`Image data length: ${images[0]?.length || 0} characters`);
        }

        console.log(`Generating response for user: ${userName}, model: ${model}`);
        console.log(`Final request body keys:`, Object.keys(requestBody));
        console.log(`Has images in request:`, !!requestBody.images);
        if (requestBody.images) {
            console.log(`Number of images:`, requestBody.images.length);
        }

        const response = await axios.post(`${OLLAMA_URL}/api/generate`, requestBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Save conversation to database
        const imageData = images && images.length > 0 ? images[0] : null;
        db.addConversation(user.id, model, prompt, response.data.response, imageData);
        console.log(`💾 Saved conversation for user: ${userName}`);

        res.json(response.data);
    } catch (error) {
        console.error('Error generating response:', error.message);
        if (error.response) {
            console.error('Ollama response error:', error.response.data);
        }
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// Get conversation history for a user
app.get('/api/conversations/:userName', (req, res) => {
    try {
        const { userName } = req.params;
        const user = db.getUserByName(userName);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const conversations = db.getConversationHistory(user.id, 100);
        res.json({ conversations });
    } catch (error) {
        console.error('Error getting conversations:', error);
        res.status(500).json({ error: 'Failed to get conversations' });
    }
});

// Clear conversation history for a user
app.delete('/api/conversations/:userName', (req, res) => {
    try {
        const { userName } = req.params;
        const user = db.getUserByName(userName);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const deletedCount = db.clearUserHistory(user.id);
        res.json({ 
            success: true, 
            message: `Cleared ${deletedCount} conversations`,
            deletedCount 
        });
    } catch (error) {
        console.error('Error clearing conversations:', error);
        res.status(500).json({ error: 'Failed to clear conversations' });
    }
});

// Stream response from Ollama (keeping for compatibility)
app.post('/api/generate/stream', async (req, res) => {
    try {
        const { model, prompt, options = {}, images = [] } = req.body;
        
        if (!model || (!prompt && images.length === 0)) {
            return res.status(400).json({ error: 'Model and either prompt or image are required' });
        }

        const requestBody = {
            model,
            prompt: prompt || "Please describe this image in detail.",
            stream: true,
            ...options
        };

        // Add images if present
        if (images && images.length > 0) {
            requestBody.images = images;
        }

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const response = await axios.post(`${OLLAMA_URL}/api/generate`, requestBody, {
            headers: {
                'Content-Type': 'application/json'
            },
            responseType: 'stream'
        });

        response.data.on('data', (chunk) => {
            res.write(chunk);
        });

        response.data.on('end', () => {
            res.end();
        });

        response.data.on('error', (error) => {
            console.error('Stream error:', error);
            res.end();
        });

    } catch (error) {
        console.error('Error streaming response:', error.message);
        res.status(500).json({ error: 'Failed to stream response' });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        await axios.get(`${OLLAMA_URL}/api/tags`);
        res.json({ status: 'healthy', ollama: 'connected', database: 'connected' });
    } catch (error) {
        res.status(503).json({ status: 'unhealthy', ollama: 'disconnected', error: error.message });
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    db.close();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🚀 Ollama Web Server running on http://localhost:${PORT}`);
    console.log(`📡 Connecting to Ollama at: ${OLLAMA_URL}`);
    console.log(`🌐 Open your browser and navigate to: http://localhost:${PORT}`);
    console.log(`📸 Image upload support enabled`);
    console.log(`👥 Multi-user support with SQLite database enabled`);
}); 