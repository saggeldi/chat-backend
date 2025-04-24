import { MessageRepository } from "../../../domain/repositories/message.repository.mjs";
import { UserRepository } from "../../../domain/repositories/user.repository.mjs";
import { Message, User } from "../../../domain/entities/message.entity.mjs";
import { MessageEntity } from "./entities/message.entity.typeorm.mjs";

export class TypeORMUserRepository extends UserRepository {
    constructor() {
        super();
        // Simulating a database with an in-memory array
        this.users = [
            new User('admin1', 'admin', 'admin_fcm_token'),
            new User('user1', 'user', 'user_fcm_token')
        ];
    }

    async getUserById(id) {
        // In a real implementation, this would use TypeORM to query the database
        return this.users.find(user => user.id === id);
    }

    async updateUserFcmToken(userId, fcmToken) {
        // In a real implementation, this would use TypeORM to update the database
        const user = await this.getUserById(userId);
        if (user) {
            user.fcmToken = fcmToken;
            return true;
        }
        return false;
    }
}

export class TypeORMMessageRepository extends MessageRepository {
    constructor() {
        super();
        // Get the repository from TypeORM
        this.repository = null;

        // Keep a reference to in-memory messages for backward compatibility during transition
        this.messages = [];
    }

    // Initialize the repository after TypeORM connection is established
    setRepository(connection) {
        this.repository = connection.getRepository(MessageEntity);
    }

    async saveMessage(message) {
        if (this.repository) {
            // Use TypeORM to save to the database
            return this.repository.save(message);
        } else {
            // Fallback to in-memory array if repository is not initialized
            this.messages.push(message);
            return message;
        }
    }

    async getMessages(userId, adminId) {
        if (this.repository) {
            // Use TypeORM to query the database
            return this.repository.find({
                where: [
                    { senderId: userId, receiverId: adminId },
                    { senderId: adminId, receiverId: userId }
                ],
                order: { timestamp: 'ASC' }
            });
        } else {
            // Fallback to in-memory array if repository is not initialized
            return this.messages.filter(
                message => 
                    (message.senderId === userId && message.receiverId === adminId) ||
                    (message.senderId === adminId && message.receiverId === userId)
            );
        }
    }

    async markMessagesAsRead(userId, adminId) {
        if (this.repository) {
            // Use TypeORM to update the database
            await this.repository.update(
                { receiverId: userId, senderId: adminId, read: false },
                { read: true }
            );
            return true;
        } else {
            // Fallback to in-memory array if repository is not initialized
            this.messages.forEach(message => {
                if (message.receiverId === userId && message.senderId === adminId) {
                    message.read = true;
                }
            });
            return true;
        }
    }

    async deleteMessage(messageId) {
        if (this.repository) {
            // Use TypeORM to delete from the database
            const result = await this.repository.delete(messageId);
            return result.affected > 0;
        } else {
            // Fallback to in-memory array if repository is not initialized
            const initialLength = this.messages.length;
            this.messages = this.messages.filter(message => message.id !== messageId);
            return this.messages.length < initialLength;
        }
    }

    async getMessageById(messageId) {
        if (this.repository) {
            // Use TypeORM to find a message by ID
            return this.repository.findOne({ where: { id: messageId } });
        } else {
            // Fallback to in-memory array if repository is not initialized
            return this.messages.find(message => message.id === messageId);
        }
    }

    async getUnreadMessageCount(userId) {
        if (this.repository) {
            // Use TypeORM to count unread messages
            return this.repository.count({
                where: { receiverId: userId, read: false }
            });
        } else {
            // Fallback to in-memory array if repository is not initialized
            return this.messages.filter(message => message.receiverId === userId && !message.read).length;
        }
    }
}
