import { TypeORMUserRepository, TypeORMMessageRepository } from '../src/infrastructure/database/typeorm/repositories.mjs';
import { FirebaseFCMService } from '../src/infrastructure/fcm/fcm.service.mjs';
import { SendMessageUseCase } from '../src/application/use-cases/send-message.use-case.mjs';
import { User } from '../src/domain/entities/message.entity.mjs';
import { initializeTypeORM } from '../src/infrastructure/database/typeorm/typeorm.config.mjs';
import { container } from '../src/infrastructure/container.mjs';
import admin from 'firebase-admin';
import axios from 'axios';

// Create a custom FCM service for testing that doesn't actually send notifications
class TestFCMService extends FirebaseFCMService {
    constructor() {
        super();
        this.sentNotifications = [];

        // Override the admin.messaging().send method
        this.originalSend = admin.messaging().send;
        admin.messaging().send = (message) => {
            console.log('Would send notification:', message);
            this.sentNotifications.push(message);
            return Promise.resolve('message-id');
        };
    }

    // Method to check if a notification was sent
    getSentNotificationsCount() {
        return this.sentNotifications.length;
    }

    // Clean up
    cleanup() {
        admin.messaging().send = this.originalSend;
    }
}

// Create a custom user repository for testing
class TestUserRepository extends TypeORMUserRepository {
    constructor() {
        super();
        this.customUsers = new Map();

        // Add a user with multiple FCM tokens
        this.customUsers.set('8', new User('8', 'user', ['token1', 'token2']));
    }

    async getUserById(id) {
        if (this.customUsers.has(id)) {
            return this.customUsers.get(id);
        }
        return super.getUserById(id);
    }
}

async function testPushNotification() {
    try {
        console.log('Starting push notification test...');

        // Initialize repositories and services
        await initializeTypeORM(container);
        const userRepository = new TestUserRepository();
        const messageRepository = new TypeORMMessageRepository();
        const fcmService = new TestFCMService();

        // Create the use case
        const sendMessageUseCase = new SendMessageUseCase(
            messageRepository,
            userRepository,
            fcmService
        );

        // Test 1: Send message from admin to user (should trigger notification)
        console.log('\nTest 1: Send message from admin to user (should trigger notification)');
        const adminSender = new User('admin1', 'admin');
        const userId = '7';
        const content = 'Hello from admin';

        const notificationCountBefore = fcmService.getSentNotificationsCount();
        const message1 = await sendMessageUseCase.execute(adminSender, userId, content);
        const notificationCountAfter = fcmService.getSentNotificationsCount();

        console.log('Message sent successfully:');
        console.log(JSON.stringify(message1, null, 2));
        console.log(`Notifications sent: ${notificationCountAfter - notificationCountBefore}`);

        // Test 2: Send message from user to themselves (should NOT trigger notification)
        console.log('\nTest 2: Send message from user to themselves (should NOT trigger notification)');
        const userSender = new User(userId, 'user');
        const content2 = 'Hello to myself';

        const notificationCountBefore2 = fcmService.getSentNotificationsCount();
        const message2 = await sendMessageUseCase.execute(userSender, userId, content2);
        const notificationCountAfter2 = fcmService.getSentNotificationsCount();

        console.log('Message sent successfully:');
        console.log(JSON.stringify(message2, null, 2));
        console.log(`Notifications sent: ${notificationCountAfter2 - notificationCountBefore2}`);
        console.log(`Test passed: ${notificationCountAfter2 === notificationCountBefore2 ? 'Yes' : 'No'}`);

        // Test 3: Send message with multiple FCM tokens
        console.log('\nTest 3: Send message with multiple FCM tokens');

        const notificationCountBefore3 = fcmService.getSentNotificationsCount();
        const message3 = await sendMessageUseCase.execute(adminSender, '8', 'Hello user with multiple tokens');
        const notificationCountAfter3 = fcmService.getSentNotificationsCount();

        console.log('Message sent successfully:');
        console.log(JSON.stringify(message3, null, 2));
        console.log(`Notifications sent: ${notificationCountAfter3 - notificationCountBefore3}`);
        console.log(`Test passed: ${notificationCountAfter3 - notificationCountBefore3 === 2 ? 'Yes' : 'No'}`);

        // Clean up
        fcmService.cleanup();

        console.log('\nAll tests completed successfully!');
        return true;
    } catch (error) {
        console.error('Error in test:', error);
        throw error;
    }
}

// Run the test
testPushNotification()
    .then(() => console.log('Test completed successfully'))
    .catch(error => console.error('Test failed:', error));
