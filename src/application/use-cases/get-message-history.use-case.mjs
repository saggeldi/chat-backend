export class GetMessageHistoryUseCase {
    constructor(messageRepository) {
        this.messageRepository = messageRepository;
    }

    async execute(userId, adminId) {
        return this.messageRepository.getMessages(userId, adminId);
    }
}