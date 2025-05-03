export class GetUnreadMessageCountByUserIdUseCase {
    constructor(messageRepository) {
        this.messageRepository = messageRepository;
    }

    async execute(userId, senderId) {
        return this.messageRepository.getUnreadMessageCountByUserId(userId, senderId);
    }
}