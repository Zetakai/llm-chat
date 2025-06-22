const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

// Generate response from Ollama
app.post('/api/generate', async (req, res) => {
    try {
        const { model, prompt, options = {} } = req.body;
        
        if (!model || !prompt) {
            return res.status(400).json({ error: 'Model and prompt are required' });
        }

        const requestBody = {
            model,
            prompt,
            stream: false,
            ...options
        };

        const response = await axios.post(`${OLLAMA_URL}/api/generate`, requestBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error generating response:', error.message);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// Stream response from Ollama
app.post('/api/generate/stream', async (req, res) => {
    try {
        const { model, prompt, options = {} } = req.body;
        
        if (!model || !prompt) {
            return res.status(400).json({ error: 'Model and prompt are required' });
        }

        const requestBody = {
            model,
            prompt,
            stream: true,
            ...options
        };

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
        res.json({ status: 'healthy', ollama: 'connected' });
    } catch (error) {
        res.status(503).json({ status: 'unhealthy', ollama: 'disconnected', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Ollama Web Server running on http://localhost:${PORT}`);
    console.log(`📡 Connecting to Ollama at: ${OLLAMA_URL}`);
    console.log(`🌐 Open your browser and navigate to: http://localhost:${PORT}`);
}); 