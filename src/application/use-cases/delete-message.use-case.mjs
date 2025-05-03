import fs from 'fs';
import path from 'path';

export class DeleteMessageUseCase {
    constructor(messageRepository) {
        this.messageRepository = messageRepository;
    }

    async execute(messageId) {
        // Get the message before deleting it
        const message = await this.messageRepository.getMessageById(messageId);

        // Delete the message from the database
        const success = await this.messageRepository.deleteMessage(messageId);

        // If deletion was successful and the message contained a file path, delete the file
        if (success && message && message.content && message.content.startsWith('/uploads/')) {
            try {
                const filePath = path.join(process.cwd(), message.content.substring(1)); // Remove leading slash
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted file: ${filePath}`);
                }
            } catch (error) {
                console.error(`Error deleting file: ${error.message}`);
                // Continue even if file deletion fails
            }
        }

        return success;
    }
}
