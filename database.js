const Database = require('better-sqlite3');
const path = require('path');

class ChatDatabase {
    constructor() {
        this.db = new Database(path.join(__dirname, 'chat_history.db'));
        this.initDatabase();
    }

    initDatabase() {
        // Create users table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create conversations table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                model TEXT NOT NULL,
                prompt TEXT NOT NULL,
                response TEXT NOT NULL,
                image_data TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        console.log('✅ Database initialized successfully');
    }

    // User management
    createUser(name) {
        try {
            const stmt = this.db.prepare('INSERT OR IGNORE INTO users (name) VALUES (?)');
            const result = stmt.run(name);
            
            if (result.changes > 0) {
                console.log(`✅ New user created: ${name}`);
            } else {
                console.log(`👋 Welcome back: ${name}`);
            }
            
            return this.getUserByName(name);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    getUserByName(name) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE name = ?');
        return stmt.get(name);
    }

    // Conversation management
    addConversation(userId, model, prompt, response, imageData = null) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO conversations (user_id, model, prompt, response, image_data)
                VALUES (?, ?, ?, ?, ?)
            `);
            const result = stmt.run(userId, model, prompt, response, imageData);
            return result.lastInsertRowid;
        } catch (error) {
            console.error('Error adding conversation:', error);
            throw error;
        }
    }

    getConversationHistory(userId, limit = 50) {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM conversations 
                WHERE user_id = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            `);
            return stmt.all(userId, limit);
        } catch (error) {
            console.error('Error getting conversation history:', error);
            return [];
        }
    }

    getConversationContext(userId, limit = 10, excludeImages = true) {
        try {
            let query = `
                SELECT prompt, response, image_data FROM conversations 
                WHERE user_id = ? 
            `;
            
            if (excludeImages) {
                query += `AND image_data IS NULL `;
            }
            
            query += `ORDER BY timestamp DESC LIMIT ?`;
            
            const stmt = this.db.prepare(query);
            const conversations = stmt.all(userId, limit);
            
            // Build context string from recent conversations
            let context = '';
            conversations.reverse().forEach(conv => {
                context += `User: ${conv.prompt}\n`;
                context += `Assistant: ${conv.response}\n\n`;
            });
            
            return context.trim();
        } catch (error) {
            console.error('Error getting conversation context:', error);
            return '';
        }
    }

    clearUserHistory(userId) {
        try {
            const stmt = this.db.prepare('DELETE FROM conversations WHERE user_id = ?');
            const result = stmt.run(userId);
            console.log(`🗑️ Cleared ${result.changes} conversations for user ${userId}`);
            return result.changes;
        } catch (error) {
            console.error('Error clearing user history:', error);
            throw error;
        }
    }

    // Statistics
    getUserStats(userId) {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    COUNT(*) as total_conversations,
                    COUNT(DISTINCT model) as models_used,
                    MIN(timestamp) as first_conversation,
                    MAX(timestamp) as last_conversation
                FROM conversations 
                WHERE user_id = ?
            `);
            return stmt.get(userId);
        } catch (error) {
            console.error('Error getting user stats:', error);
            return null;
        }
    }

    close() {
        this.db.close();
    }
}

module.exports = ChatDatabase; 