import { TypeORMUserRepository, TypeORMMessageRepository } from '../src/infrastructure/database/typeorm/repositories.mjs';
import { Message } from '../src/domain/entities/message.entity.mjs';

async function testChatFunctionality() {
    try {
        console.log('Starting chat functionality test...');
        
        // Create repositories
        const userRepository = new TypeORMUserRepository();
        const messageRepository = new TypeORMMessageRepository();
        
        // Test 1: Get user by ID from external API
        console.log('\nTest 1: Get user by ID from external API');
        const customerId = 7; // The customer ID from the issue description
        console.log(`Fetching user info for customer ID: ${customerId}`);
        const user = await userRepository.getUserById(customerId);
        console.log('User info fetched successfully:');
        console.log(JSON.stringify(user, null, 2));
        
        // Test 2: Get admin user
        console.log('\nTest 2: Get admin user');
        const adminUser = await userRepository.getUserById(-1);
        console.log('Admin user fetched successfully:');
        console.log(JSON.stringify(adminUser, null, 2));
        
        // Test 3: Update FCM token for admin
        console.log('\nTest 3: Update FCM token for admin');
        const newAdminFcmToken = 'new_admin_fcm_token';
        const adminTokenUpdateResult = await userRepository.updateUserFcmToken(-1, newAdminFcmToken);
        console.log(`Admin FCM token update result: ${adminTokenUpdateResult}`);
        const updatedAdminUser = await userRepository.getUserById(-1);
        console.log('Updated admin user:');
        console.log(JSON.stringify(updatedAdminUser, null, 2));
        
        // Test 4: Simulate message history
        console.log('\nTest 4: Simulate message history');
        
        // Add some test messages to the in-memory repository
        const messages = [
            new Message('1', customerId, -1, 'Hello from user', 'text/plain', new Date(2023, 0, 1), true),
            new Message('2', -1, customerId, 'Hello from admin', 'text/plain', new Date(2023, 0, 2), true),
            new Message('3', customerId, -1, 'How are you?', 'text/plain', new Date(2023, 0, 3), true),
            new Message('4', -1, customerId, 'I am fine, thanks!', 'text/plain', new Date(2023, 0, 4), false),
            new Message('5', customerId, 'other_user', 'Hello other user', 'text/plain', new Date(2023, 0, 5), false),
        ];
        
        for (const message of messages) {
            await messageRepository.saveMessage(message);
        }
        
        // Test 5: Get full message history by user ID
        console.log('\nTest 5: Get full message history by user ID');
        const messageHistory = await messageRepository.getFullMessageHistoryByUserId(customerId);
        console.log(`Found ${messageHistory.length} messages for user ${customerId}:`);
        console.log(JSON.stringify(messageHistory, null, 2));
        
        // Test 6: Get messages between user and admin
        console.log('\nTest 6: Get messages between user and admin');
        const userAdminMessages = await messageRepository.getMessages(customerId, -1);
        console.log(`Found ${userAdminMessages.length} messages between user ${customerId} and admin:`);
        console.log(JSON.stringify(userAdminMessages, null, 2));
        
        console.log('\nAll tests completed successfully!');
        return true;
    } catch (error) {
        console.error('Error in test:', error);
        throw error;
    }
}

// Run the test
testChatFunctionality()
    .then(() => console.log('Test completed successfully'))
    .catch(error => console.error('Test failed:', error));