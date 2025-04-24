import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { MessageController } from './message.controller.mjs';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case.mjs';
import { GetMessageHistoryUseCase } from '../../application/use-cases/get-message-history.use-case.mjs';
import { DeleteMessageUseCase } from '../../application/use-cases/delete-message.use-case.mjs';
import { GetUnreadMessageCountUseCase } from '../../application/use-cases/get-unread-message-count.use-case.mjs';

export function createMessageRouter(container, socketService = null) {
    const router = express.Router();

    // Configure multer for file uploads
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            // Create uploads directory if it doesn't exist
            const uploadsDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            cb(null, uploadsDir);
        },
        filename: function (req, file, cb) {
            // Generate a unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

    const upload = multer({ storage: storage });

    const sendMessageUseCase = new SendMessageUseCase(
        container.messageRepository,
        container.userRepository,
        container.fcmService
    );

    const getMessageHistoryUseCase = new GetMessageHistoryUseCase(
        container.messageRepository
    );

    const deleteMessageUseCase = new DeleteMessageUseCase(
        container.messageRepository
    );

    const getUnreadMessageCountUseCase = new GetUnreadMessageCountUseCase(
        container.messageRepository
    );

    const messageController = new MessageController(
        sendMessageUseCase,
        getMessageHistoryUseCase,
        deleteMessageUseCase,
        getUnreadMessageCountUseCase,
        socketService
    );

    // Send a text message
    router.post('/messages', (req, res) => messageController.sendMessage(req, res));

    // Send a file message
    router.post('/messages/file', upload.single('file'), (req, res) => messageController.sendFileMessage(req, res));

    // Get unread message count by user ID
    router.get('/messages/unread/:userId', (req, res) => messageController.getUnreadMessageCount(req, res));

    // Get message history by user ID and admin ID
    router.get('/messages/:userId/:adminId', (req, res) => messageController.getMessageHistory(req, res));

    // Delete a message
    router.delete('/messages/:messageId', (req, res) => messageController.deleteMessage(req, res));

    return router;
}
