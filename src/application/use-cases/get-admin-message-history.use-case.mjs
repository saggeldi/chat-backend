export class GetAdminMessageHistoryUseCase {
    constructor(messageRepository) {
        this.messageRepository = messageRepository;
    }

    async execute() {
        return this.messageRepository.getAdminMessageHistory();
    }
}