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

        if (receiver?.fcmToken) {
            await this.fcmService.sendPushNotification({
                token: receiver.fcmToken,
                title: 'New Message',
                body: content
            });
        }

        return savedMessage;
    }
}
