import {Message} from "../../domain/entities/message.entity.mjs";

export class SendMessageUseCase {
    constructor(messageRepository, userRepository, fcmService) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.fcmService = fcmService;
    }

    async execute(sender, receiverId, content, mimeType = 'text/plain') {
        const receiver = await this.userRepository.getUserById(receiverId);

        const message = new Message(
            Date.now().toString(),
            sender.id,
            receiverId,
            content,
            mimeType,
            new Date()
        );

        const savedMessage = await this.messageRepository.saveMessage(message);

        // Only send push notification if the message is not from the receiver themselves
        // This prevents users from getting notifications for their own messages
        if (sender.id !== receiverId) {
            // Check if receiver has fcmToken (for backward compatibility)
            if (receiver?.fcmToken) {
                await this.fcmService.sendPushNotification({
                    token: receiver.fcmToken,
                    title: 'Новое сообщение',
                    body: content
                });
            } 
            // Check if receiver has fcmTokens array
            else if (receiver?.fcmTokens) {
                await this.fcmService.sendPushNotification({
                    tokens: receiver.fcmTokens,
                    title: 'Новое сообщение',
                    body: content
                });
            }
            // If no tokens available, try to fetch from external API
            else if (receiver) {
                await this.fcmService.sendPushNotification({
                    userId: receiver.id,
                    title: 'Новое сообщение',
                    body: content
                });
            }
        }

        return savedMessage;
    }
}
