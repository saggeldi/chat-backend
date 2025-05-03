# Chat Application

## User Repository API Integration

This repository includes functionality to fetch user information from an external API and manage chat messages.

### Features

- Fetch user information from the external API at `https://api2.balary.net/customers/{customerId}`
- Get full message history by user distinct ID
- Get admin message history with user info and last message, sorted by updated_at in descending order
- Handle special case where receiver ID -1 represents an admin
- Real-time notifications for new messages using Socket.IO
- The API returns detailed user information including:
  - Personal details (name, phone, avatar, balance)
  - Order history
  - Ratings
  - Addresses
  - FCM tokens

### Recent Updates

- Modified `getUserById` to fetch user information from the external API
- Added `getFullMessageHistoryByUserId` method to retrieve all messages for a specific user
- Added `getAdminMessageHistory` method to retrieve admin message history with user info and last message
- Added new endpoint `/api/admin/messages` to get admin message history
- Added real-time notifications for new messages using Socket.IO
- Created a React TypeScript example for admin notifications
- Updated `updateUserFcmToken` to work with the new implementation
- Special handling for admin user (ID -1 or 'admin1')

### Usage

```javascript
import { TypeORMUserRepository, TypeORMMessageRepository } from './src/infrastructure/database/typeorm/repositories.mjs';

// Create instances of the repositories
const userRepository = new TypeORMUserRepository();
const messageRepository = new TypeORMMessageRepository();

// Get user by ID (fetches from external API for regular users)
const customerId = 7;
const user = await userRepository.getUserById(customerId);

// Get admin user
const adminUser = await userRepository.getUserById(-1);

// Get full message history for a user
const messageHistory = await messageRepository.getFullMessageHistoryByUserId(customerId);

// Get messages between a user and admin
const userAdminMessages = await messageRepository.getMessages(customerId, -1);

// Get admin message history with user info and last message
const adminMessageHistory = await messageRepository.getAdminMessageHistory();
```

### Testing

To test the API integration and chat functionality, run:

```bash
node tests/get-user-info.mjs
node tests/test-chat-functionality.mjs
```

The first script will fetch user information for customer ID 7 and display it in the console.
The second script will test the chat functionality, including getting users, updating FCM tokens, and retrieving message history.

You can also test the API endpoints using the HTTP request files in the `tests` directory:

```bash
# Using curl
curl -X GET http://localhost:3000/api/admin/messages

# Or use the .http files directly in an IDE like VS Code or IntelliJ with the REST Client plugin
# See tests/get-admin-message-history.http
```

### Response Structure

#### User API Response

The external user API response includes the following structure:

```json
{
  "customer_id": 7,
  "fullname": "Shageldi",
  "phone": "+99362737222",
  "avatar": "images/18332568-54e3-4a20-89c1-5fbf802e0530.png",
  "balance": "22.00",
  "character": null,
  "orders": [...],
  "ratings": [...],
  "addresses": [...],
  "total_orders": "31",
  "total_ratings": "1",
  "tokens": [...]
}
```

#### Admin Message History Response

The admin message history endpoint returns an array of objects, each containing user information and the last message between the user and admin:

```json
[
  {
    "user": {
      "id": "7",
      "fullname": "Shageldi",
      "phone": "+99362737222",
      "avatar": "images/18332568-54e3-4a20-89c1-5fbf802e0530.png"
    },
    "lastMessage": {
      "id": "1371",
      "senderId": "7",
      "receiverId": "-1",
      "content": "Hello admin",
      "mimeType": "text/plain",
      "timestamp": "2025-04-06T13:00:39.924Z",
      "read": false
    }
  },
  // More user conversations...
]
```

The results are sorted by the timestamp of the last message in descending order (most recent first).

### Socket.IO Integration

The application uses Socket.IO for real-time communication between the server and clients. This enables instant message delivery and notifications.

#### Socket Events

- `identify`: Sent by the client to identify itself with a user ID and role
- `new_message`: Sent by the server to notify clients of new messages
- `message_sent`: Sent by the server to confirm a message was successfully sent
- `error`: Sent by the server to notify clients of errors

#### React TypeScript Example

An example React TypeScript component is provided in `examples/react-socket-notification.tsx` that demonstrates how to:

1. Connect to the Socket.IO server
2. Listen for new messages
3. Display notifications using react-toastify
4. Fetch and display admin message history
5. Mark messages as read

To use this example in your React application:

```bash
# Install required dependencies
npm install socket.io-client react-toastify

# Copy the example component to your project
cp examples/react-socket-notification.tsx your-react-app/src/components/
```

Then import and use the component in your application:

```jsx
import AdminChatNotification from './components/react-socket-notification';

function App() {
  return (
    <div className="App">
      <AdminChatNotification />
      {/* Your other components */}
    </div>
  );
}
```
