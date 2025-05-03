export class GetUnreadMessageCountUseCase {
    constructor(messageRepository) {
        this.messageRepository = messageRepository;
    }

    async execute(userId) {
        return this.messageRepository.getUnreadMessageCount(userId);
    }
}