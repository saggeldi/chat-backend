import { User } from '../../domain/entities/message.entity.mjs';

export class ChatController {
    constructor(sendMessageUseCase, socketService) {
        this.sendMessageUseCase = sendMessageUseCase;
        this.socketService = socketService;
    }

    initialize(socket) {

        socket.on('send_message', async ({ senderId, receiverId, content }) => {
            // Use senderId from the message payload or fallback to socket.data if available
            const userId = senderId || (socket.data && socket.data.userId);
            const role = (socket.data && socket.data.role) || 'user';

            if (!userId) {
                socket.emit('error', 'User ID is required');
                return;
            }

            const sender = new User(userId, role);

            try {
                const message = await this.sendMessageUseCase.execute(
                    sender,
                    receiverId,
                    content
                );

                this.socketService.sendToUser(receiverId, 'new_message', message);
                this.socketService.sendToUser(sender.id, 'message_sent', message);
            } catch (error) {
                socket.emit('error', error.message);
            }
        });
    }
}
