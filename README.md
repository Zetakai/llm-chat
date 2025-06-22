# Ollama Web Server

A Node.js server that connects your local Ollama instance to the internet with a beautiful, modern web interface for chatting with your local LLM models.

## Features

- 🌐 **Web Interface**: Modern, responsive HTML interface for interacting with Ollama
- 🔗 **API Proxy**: RESTful API endpoints to connect to your local Ollama instance
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- ⚙️ **Model Management**: Automatic detection and selection of available models
- 🎛️ **Advanced Settings**: Temperature, top-p, and max tokens controls
- 💬 **Chat Interface**: Real-time chat with message history
- 📊 **Connection Status**: Live status indicator for Ollama connection
- 🔄 **Recent Messages**: Quick access to recent prompts

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [Ollama](https://ollama.ai/) installed and running locally
- At least one Ollama model downloaded

## Installation

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd ollama-web-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Ollama** (if not already running)
   ```bash
   ollama serve
   ```

4. **Download a model** (if you haven't already)
   ```bash
   ollama pull llama2
   # or any other model you prefer
   ```

## Usage

### Starting the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` by default.

### Environment Variables

Create a `.env` file in the root directory to customize settings:

```env
PORT=3000
OLLAMA_URL=http://localhost:11434
```

- `PORT`: The port for the web server (default: 3000)
- `OLLAMA_URL`: The URL of your Ollama instance (default: http://localhost:11434)

## API Endpoints

### GET `/api/models`
Get all available models from Ollama.

**Response:**
```json
{
  "models": [
    {
      "name": "llama2",
      "size": 3790000000,
      "modified_at": "2023-12-01T10:00:00Z"
    }
  ]
}
```

### POST `/api/generate`
Generate a response from a model.

**Request Body:**
```json
{
  "model": "llama2",
  "prompt": "Hello, how are you?",
  "options": {
    "temperature": 0.7,
    "top_p": 0.9,
    "num_predict": 2048
  }
}
```

**Response:**
```json
{
  "model": "llama2",
  "response": "Hello! I'm doing well, thank you for asking...",
  "done": true
}
```

### GET `/api/health`
Check the connection status to Ollama.

**Response:**
```json
{
  "status": "healthy",
  "ollama": "connected"
}
```

## Web Interface

Once the server is running, open your browser and navigate to `http://localhost:3000`. You'll see:

1. **Header**: Shows connection status and title
2. **Chat Area**: Main conversation interface
3. **Model Selection**: Dropdown to choose your Ollama model
4. **Settings Panel**: Adjust temperature, top-p, and max tokens
5. **Recent Messages**: Quick access to previous prompts

### How to Use

1. **Select a Model**: Choose from your available Ollama models
2. **Adjust Settings**: Modify temperature, top-p, and max tokens as needed
3. **Start Chatting**: Type your message and press Enter or click Send
4. **View Responses**: See the model's response in real-time
5. **Clear Chat**: Use the trash button to start a new conversation

## Troubleshooting

### Common Issues

1. **"Connection failed" status**
   - Make sure Ollama is running: `ollama serve`
   - Check if Ollama is accessible at `http://localhost:11434`

2. **"No models found"**
   - Download a model: `ollama pull llama2`
   - Check available models: `ollama list`

3. **Server won't start**
   - Check if port 3000 is available
   - Try a different port in the `.env` file

4. **Slow responses**
   - This is normal for local LLMs
   - Consider using a smaller/faster model
   - Adjust max tokens to limit response length

### Port Conflicts

If port 3000 is already in use, you can:

1. Change the port in `.env`:
   ```env
   PORT=3001
   ```

2. Or specify the port when starting:
   ```bash
   PORT=3001 npm start
   ```

## Security Considerations

⚠️ **Important**: This server is designed for local development and personal use. For production deployment:

1. **Add Authentication**: Implement user authentication
2. **Use HTTPS**: Set up SSL/TLS certificates
3. **Rate Limiting**: Add request rate limiting
4. **Input Validation**: Validate and sanitize all inputs
5. **Firewall**: Configure firewall rules appropriately

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- [Ollama](https://ollama.ai/) for the amazing local LLM framework
- [Express.js](https://expressjs.com/) for the web server framework
- [Font Awesome](https://fontawesome.com/) for the icons 