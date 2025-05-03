export class MarkMessagesAsReadUseCase {
    constructor(messageRepository) {
        this.messageRepository = messageRepository;
    }

    /**
     * Mark all messages from a sender to a receiver as read
     * @param {string} receiverId - The ID of the message receiver
     * @param {string} senderId - The ID of the message sender
     * @returns {Promise<boolean>} - True if the operation was successful
     */
    async execute(receiverId, senderId) {
        if (!receiverId || !senderId) {
            throw new Error('Receiver ID and Sender ID are required');
        }

        return await this.messageRepository.markMessagesAsRead(receiverId, senderId);
    }
}