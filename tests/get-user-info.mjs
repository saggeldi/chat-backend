import { TypeORMUserRepository } from '../src/infrastructure/database/typeorm/repositories.mjs';

async function testGetUserInfoFromExternalApi() {
    try {
        const userRepository = new TypeORMUserRepository();
        const customerId = 7; // The customer ID from the issue description
        
        console.log(`Fetching user info for customer ID: ${customerId}`);
        const userInfo = await userRepository.getUserInfoFromExternalApi(customerId);
        
        console.log('User info fetched successfully:');
        console.log(JSON.stringify(userInfo, null, 2));
        
        return userInfo;
    } catch (error) {
        console.error('Error in test:', error.message);
        throw error;
    }
}

// Run the test
testGetUserInfoFromExternalApi()
    .then(() => console.log('Test completed successfully'))
    .catch(error => console.error('Test failed:', error));