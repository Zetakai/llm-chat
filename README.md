# Ollama Web Interface

A modern, feature-rich web interface for Ollama that provides a beautiful chat experience with local AI models. Built with Node.js, Express, and vanilla JavaScript.

![Ollama Web Interface](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-orange)

## ✨ Features

### 🤖 **Multi-Model Support**
- Connect to any Ollama model (gemma3, llama, mistral, etc.)
- Automatic model detection and listing
- Model information display (size, capabilities)

### 🖼️ **Image Interpretation**
- Upload images for AI analysis
- Support for models like `gemma3:12b`, `llava`, and other vision models
- Image preview and removal
- Smart context management to avoid image confusion

### 👥 **Multi-User System**
- User login with name-based identification
- Isolated conversation history per user
- Persistent conversations with SQLite database
- User statistics and conversation management

### 💬 **Conversation Context**
- Intelligent conversation memory
- Context-aware responses
- Smart filtering to prevent image confusion
- Export conversation history

### 🎨 **Modern UI/UX**
- Dark/Light theme support
- Responsive design for mobile and desktop
- Markdown rendering with syntax highlighting
- Real-time character count and typing indicators
- Input suggestions and quick actions

### ⚙️ **Advanced Settings**
- Temperature, Top P, and Max Tokens controls
- Model selection and information
- Connection status monitoring
- Recent messages history

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Ollama](https://ollama.ai/) installed and running
- At least one Ollama model downloaded

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zetakai/llm-chat.git
   cd llm-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### First Time Setup

1. **Enter your name** in the login modal
2. **Select a model** from the dropdown in the sidebar
3. **Start chatting!** 🎉

## 📸 Image Upload Guide

### Supported Models
- `gemma3:12b` (recommended)
- `llava` and variants
- `bakllava`
- Other vision-capable models

### How to Use
1. Select a supported model
2. Click the camera icon in the input area
3. Choose an image file (JPEG, PNG, under 10MB)
4. Add a prompt or let the AI describe the image
5. Send your message

## 🛠️ Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3000
OLLAMA_URL=http://localhost:11434
```

### Database
The application uses SQLite for data persistence:
- **File**: `chat_history.db` (created automatically)
- **Tables**: `users`, `conversations`
- **Features**: Automatic backup and recovery

## 📁 Project Structure

```
llm-chat/
├── public/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # CSS styles
│   └── script.js           # Frontend JavaScript
├── server.js               # Express server
├── database.js             # SQLite database operations
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🔧 Development

### Running in Development Mode
```bash
npm run dev
```

### Database Operations
The application automatically handles:
- User creation and management
- Conversation storage and retrieval
- Context building for AI responses
- Image data management

### API Endpoints

- `GET /` - Main web interface
- `POST /api/user/login` - User authentication
- `GET /api/models` - List available models
- `POST /api/generate` - Generate AI responses
- `GET /api/conversations/:userName` - Get user conversations
- `DELETE /api/conversations/:userName` - Clear user history
- `GET /api/health` - Health check

## 🎯 Features in Detail

### Smart Context Management
- **Text Conversations**: Full context from previous chats
- **Image Conversations**: Isolated context to prevent confusion
- **Mixed Context**: Intelligent filtering based on request type

### User Experience
- **Auto-login**: Remembers your session
- **Conversation Export**: Download chat history as JSON
- **Real-time Updates**: Live connection status and notifications
- **Mobile Responsive**: Works on all device sizes

### Security & Performance
- **Input Validation**: Secure file uploads and data handling
- **Error Handling**: Graceful error recovery
- **Memory Management**: Efficient conversation storage
- **Rate Limiting**: Built-in protection against abuse

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Developed by [zetakai](https://github.com/zetakai)**

- GitHub: [@zetakai](https://github.com/zetakai)
- Project: [llm-chat](https://github.com/zetakai/llm-chat)

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) for the amazing local AI platform
- [Express.js](https://expressjs.com/) for the web framework
- [SQLite](https://www.sqlite.org/) for data persistence
- [Font Awesome](https://fontawesome.com/) for icons
- [Marked](https://marked.js.org/) for markdown rendering

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/zetakai/llm-chat/issues) page
2. Create a new issue with detailed information
3. Include your Ollama version and model information

---

**Made with ❤️ by zetakai** 