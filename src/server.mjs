import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { container } from './infrastructure/container.mjs';
import { SocketIoService } from './infrastructure/socket-io/socket.service.mjs';
import { ChatController } from './presentation/websocket/chat.controller.mjs';
import { SendMessageUseCase } from './application/use-cases/send-message.use-case.mjs';
import { User } from './domain/entities/message.entity.mjs';
import { initializeTypeORM } from './infrastructure/database/typeorm/typeorm.config.mjs';
import { createMessageRouter } from './presentation/rest/message.router.mjs';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Initialize WebSocket
const socketService = new SocketIoService(server);

// API Routes
app.use('/api', createMessageRouter(container, socketService));

// Serve sample.html at the root URL
app.get('/', (req, res) => {
    res.sendFile('sample.html', { root: './public' });
});

const sendMessageUseCase = new SendMessageUseCase(
    container.messageRepository,
    container.userRepository,
    container.fcmService
);

// In server.mjs
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

const chatController = new ChatController(sendMessageUseCase, socketService);
socketService.io.on('connection', (socket) => chatController.initialize(socket));

// Initialize TypeORM and start server
const PORT = process.env.PORT || 3000;

// Initialize TypeORM before starting the server
initializeTypeORM(container)
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error('Failed to initialize TypeORM:', error);
        process.exit(1);
    });

// Note: We're already creating a Socket.IO server in SocketIoService
// No need to create another one here
