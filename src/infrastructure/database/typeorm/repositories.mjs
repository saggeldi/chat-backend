import { MessageRepository } from "../../../domain/repositories/message.repository.mjs";
import { UserRepository } from "../../../domain/repositories/user.repository.mjs";
import { Message, User } from "../../../domain/entities/message.entity.mjs";
import { MessageEntity } from "./entities/message.entity.typeorm.mjs";
import axios from 'axios';

export class TypeORMUserRepository extends UserRepository {
    constructor() {
        super();
        // Keep admin user in memory
        this.adminUser = new User('admin1', 'admin', 'admin_fcm_token');
    }

    async getUserById(id) {
        // Special case: admin is always represented by ID -1 or admin1
        if (id === -1 || id === 'admin1') {
            return this.adminUser;
        }

        try {
            // Get user info from external API
            const userInfo = await this.getUserInfoFromExternalApi(id);

            // Create a User object from the API response
            const user = new User(
                userInfo.customer_id.toString(), 
                'user', 
                userInfo.tokens
            );

            return user;
        } catch (error) {
            console.error(`Error getting user by ID ${id}:`, error);
            return null;
        }
    }

    async updateUserFcmToken(userId, fcmToken) {
        // Special case: admin is always represented by ID -1 or admin1
        if (userId === -1 || userId === 'admin1') {
            this.adminUser.fcmTokens = fcmToken;
            return true;
        }

        try {
            // For regular users, we would need to update the FCM token in the external API
            // This is a placeholder for that implementation
            console.log(`Updating FCM token for user ${userId} to ${fcmToken}`);

            // Since we don't have direct access to update the external API,
            // we'll just return true to indicate success
            return true;
        } catch (error) {
            console.error(`Error updating FCM token for user ${userId}:`, error);
            return false;
        }
    }

    async getUserInfoFromExternalApi(customerId) {
        if(customerId == "-1") {
            return this.adminUser;
        }
        try {
            const response = await axios.get(`https://api2.balary.net/customers/${customerId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user info from external API:', error);
            throw new Error('Failed to fetch user info from external API');
        }
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

    async getFullMessageHistoryByUserId(userId) {
        if (this.repository) {
            // Use TypeORM to query the database
            // Get all messages where the user is either sender or receiver
            // Admin is always represented by receiverId = -1
            return this.repository.find({
                where: [
                    { senderId: userId },
                    { receiverId: userId }
                ],
                order: { timestamp: 'ASC' }
            });
        } else {
            // Fallback to in-memory array if repository is not initialized
            return this.messages.filter(
                message => message.senderId === userId || message.receiverId === userId
            ).sort((a, b) => a.timestamp - b.timestamp);
        }
    }

    async getUnreadMessageCountByUserId(userId, senderId) {
        if (this.repository) {
            // Use TypeORM to count unread messages from a specific sender
            return this.repository.count({
                where: { receiverId: userId, senderId: senderId, read: false }
            });
        } else {
            // Fallback to in-memory array if repository is not initialized
            return this.messages.filter(message => 
                message.receiverId === userId && 
                message.senderId === senderId && 
                !message.read
            ).length;
        }
    }

    async getAdminMessageHistory() {
        // Create an instance of the user repository to get user info
        const userRepository = new TypeORMUserRepository();

        // Admin ID is always -1
        const adminId = -1;

        if (this.repository) {
            try {
                // Get all unique user IDs who have communicated with the admin
                const uniqueUserIds = await this.repository
                    .createQueryBuilder('message')
                    .select('DISTINCT CASE WHEN message.senderId = :adminId THEN message.receiverId ELSE message.senderId END', 'userId')
                    .where('message.senderId = :adminId OR message.receiverId = :adminId', { adminId })
                    .andWhere('CASE WHEN message.senderId = :adminId THEN message.receiverId ELSE message.senderId END != :adminId', { adminId })
                    .getRawMany();

                // For each user, get their info and the most recent message
                const result = [];
                for (const { userId } of uniqueUserIds) {
                    // Get the most recent message between the user and admin
                    const lastMessage = await this.repository
                        .createQueryBuilder('message')
                        .where('(message.senderId = :userId AND message.receiverId = :adminId) OR (message.senderId = :adminId AND message.receiverId = :userId)', 
                            { userId, adminId })
                        .orderBy('message.timestamp', 'DESC')
                        .getOne();

                    if (lastMessage) {
                        try {
                            // Get user info from external API
                            const userInfo = await userRepository.getUserInfoFromExternalApi(userId);

                            // Add to result
                            result.push({
                                user: {
                                    id: userId,
                                    fullname: userInfo.fullname,
                                    phone: userInfo.phone,
                                    avatar: userInfo.avatar
                                },
                                lastMessage
                            });
                        } catch (error) {
                            console.error(`Error getting user info for user ${userId}:`, error);
                            // Still add the user with the message but without detailed info
                            result.push({
                                user: { id: userId },
                                lastMessage
                            });
                        }
                    }
                }

                // Sort by the timestamp of the last message in descending order
                return result.sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));
            } catch (error) {
                console.error('Error getting admin message history:', error);
                return [];
            }
        } else {
            // Fallback to in-memory array if repository is not initialized
            try {
                // Get all messages involving the admin
                const adminMessages = this.messages.filter(
                    message => message.senderId === adminId || message.receiverId === adminId
                );

                // Get unique user IDs
                const uniqueUserIds = [...new Set(
                    adminMessages.map(message => 
                        message.senderId === adminId ? message.receiverId : message.senderId
                    ).filter(id => id !== adminId)
                )];

                // For each user, get their info and the most recent message
                const result = [];
                for (const userId of uniqueUserIds) {
                    // Get all messages between the user and admin
                    const userAdminMessages = adminMessages.filter(
                        message => 
                            (message.senderId === userId && message.receiverId === adminId) ||
                            (message.senderId === adminId && message.receiverId === userId)
                    );

                    if (userAdminMessages.length > 0) {
                        // Get the most recent message
                        const lastMessage = userAdminMessages.sort(
                            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
                        )[0];

                        try {
                            // Get user info from external API
                            const userInfo = await userRepository.getUserInfoFromExternalApi(userId);

                            // Add to result
                            result.push({
                                user: {
                                    id: userId,
                                    fullname: userInfo.fullname,
                                    phone: userInfo.phone,
                                    avatar: userInfo.avatar
                                },
                                lastMessage
                            });
                        } catch (error) {
                            console.error(`Error getting user info for user ${userId}:`, error);
                            // Still add the user with the message but without detailed info
                            result.push({
                                user: { id: userId },
                                lastMessage
                            });
                        }
                    }
                }

                // Sort by the timestamp of the last message in descending order
                return result.sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));
            } catch (error) {
                console.error('Error getting admin message history:', error);
                return [];
            }
        }
    }
}
