import { User } from '../../domain/entities/message.entity.mjs';
import fs from 'fs';
import path from 'path';

export class MessageController {
    constructor(
        sendMessageUseCase,
        getMessageHistoryUseCase,
        deleteMessageUseCase,
        getUnreadMessageCountUseCase,
        getAdminMessageHistoryUseCase,
        socketService = null
    ) {
        this.sendMessageUseCase = sendMessageUseCase;
        this.getMessageHistoryUseCase = getMessageHistoryUseCase;
        this.deleteMessageUseCase = deleteMessageUseCase;
        this.getUnreadMessageCountUseCase = getUnreadMessageCountUseCase;
        this.getAdminMessageHistoryUseCase = getAdminMessageHistoryUseCase;
        this.socketService = socketService;
    }

    async sendMessage(req, res) {
        try {
            const { senderId, receiverId, content, mimeType = 'text/plain' } = req.body;

            if (!senderId || !receiverId || !content) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Determine the MIME type based on the content
            let actualMimeType = mimeType;
            let finalContent = content;

            // If content is a base64 string for a file, extract the MIME type and save the file
            if (content.startsWith('data:')) {
                const matches = content.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
                if (matches && matches.length > 2) {
                    actualMimeType = matches[1];
                    const base64Data = matches[2];
                    const buffer = Buffer.from(base64Data, 'base64');

                    // Create uploads directory if it doesn't exist
                    const uploadsDir = path.join(process.cwd(), 'uploads');
                    if (!fs.existsSync(uploadsDir)) {
                        fs.mkdirSync(uploadsDir, { recursive: true });
                    }

                    // Generate a unique filename
                    const filename = `file-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
                    const extension = this.getExtensionFromMimeType(actualMimeType);
                    const filepath = path.join(uploadsDir, `${filename}${extension}`);

                    // Write the file
                    fs.writeFileSync(filepath, buffer);

                    // Update content to be the file path
                    finalContent = `/uploads/${filename}${extension}`;
                }
            }

            const sender = new User(senderId, 'user');
            const message = await this.sendMessageUseCase.execute(sender, receiverId, finalContent, actualMimeType);

            // If socketService is available, send the message through the socket
            if (this.socketService) {
                this.socketService.sendToUser(receiverId, 'new_message', message);
                this.socketService.sendToUser(sender.id, 'message_sent', message);
            }

            return res.status(201).json(message);
        } catch (error) {
            console.error('Error sending message:', error);
            return res.status(500).json({ error: 'Failed to send message' });
        }
    }

    // Helper method to get file extension from MIME type
    getExtensionFromMimeType(mimeType) {
        const mimeToExt = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/svg+xml': '.svg',
            'text/plain': '.txt',
            'text/html': '.html',
            'text/css': '.css',
            'text/javascript': '.js',
            'application/json': '.json',
            'application/pdf': '.pdf',
            'application/xml': '.xml',
            'application/zip': '.zip',
            'audio/mpeg': '.mp3',
            'audio/wav': '.wav',
            'video/mp4': '.mp4',
            'video/webm': '.webm'
        };

        return mimeToExt[mimeType] || '.bin';
    }

    async getMessageHistory(req, res) {
        try {
            const { userId, adminId } = req.params;

            if (!userId || !adminId) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            const messages = await this.getMessageHistoryUseCase.execute(userId, adminId);

            return res.status(200).json(messages);
        } catch (error) {
            console.error('Error getting message history:', error);
            return res.status(500).json({ error: 'Failed to get message history' });
        }
    }

    async deleteMessage(req, res) {
        try {
            const { messageId } = req.params;

            if (!messageId) {
                return res.status(400).json({ error: 'Missing message ID' });
            }

            const success = await this.deleteMessageUseCase.execute(messageId);

            if (success) {
                return res.status(200).json({ message: 'Message deleted successfully' });
            } else {
                return res.status(404).json({ error: 'Message not found' });
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            return res.status(500).json({ error: 'Failed to delete message' });
        }
    }

    async getUnreadMessageCount(req, res) {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({ error: 'Missing user ID' });
            }

            const count = await this.getUnreadMessageCountUseCase.execute(userId);

            return res.status(200).json({ count });
        } catch (error) {
            console.error('Error getting unread message count:', error);
            return res.status(500).json({ error: 'Failed to get unread message count' });
        }
    }

    async sendFileMessage(req, res) {
        try {
            const { senderId, receiverId } = req.body;
            const file = req.file;

            if (!senderId || !receiverId || !file) {
                return res.status(400).json({ error: 'Missing required fields or file' });
            }

            // Get the file path and MIME type
            const filePath = file.path;
            const mimeType = file.mimetype;

            // Create a relative path to the file that can be used in URLs
            const relativePath = `/uploads/${path.basename(filePath)}`;

            const sender = new User(senderId, 'user');
            const message = await this.sendMessageUseCase.execute(sender, receiverId, relativePath, mimeType);

            // If socketService is available, send the message through the socket
            if (this.socketService) {
                this.socketService.sendToUser(receiverId, 'new_message', message);
                this.socketService.sendToUser(sender.id, 'message_sent', message);
            }

            return res.status(201).json(message);
        } catch (error) {
            console.error('Error sending file message:', error);
            return res.status(500).json({ error: 'Failed to send file message' });
        }
    }

    async getAdminMessageHistory(req, res) {
        try {
            const adminMessageHistory = await this.getAdminMessageHistoryUseCase.execute();
            return res.status(200).json(adminMessageHistory);
        } catch (error) {
            console.error('Error getting admin message history:', error);
            return res.status(500).json({ error: 'Failed to get admin message history' });
        }
    }
}
