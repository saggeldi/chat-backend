import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Define types for our messages and user
interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  mimeType: string;
  timestamp: string;
  read: boolean;
}

interface User {
  id: string;
  fullname?: string;
  phone?: string;
  avatar?: string;
}

// Admin component that listens for new messages
const AdminChatNotification: React.FC = () => {
  // State to store socket connection
  const [socket, setSocket] = useState<Socket | null>(null);
  // State to track connection status
  const [connected, setConnected] = useState<boolean>(false);
  // State to store unread messages
  const [unreadMessages, setUnreadMessages] = useState<Message[]>([]);
  // State to store admin message history
  const [messageHistory, setMessageHistory] = useState<Array<{user: User, lastMessage: Message}>>([]);
  
  // Reference to store the socket instance
  const socketRef = useRef<Socket | null>(null);

  // Effect to initialize socket connection
  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    // Store socket in ref and state
    socketRef.current = newSocket;
    setSocket(newSocket);

    // Set up event listeners
    newSocket.on('connect', handleConnect);
    newSocket.on('disconnect', handleDisconnect);
    newSocket.on('new_message', handleNewMessage);
    
    // Clean up on component unmount
    return () => {
      newSocket.off('connect', handleConnect);
      newSocket.off('disconnect', handleDisconnect);
      newSocket.off('new_message', handleNewMessage);
      newSocket.close();
    };
  }, []);

  // Effect to fetch admin message history when connected
  useEffect(() => {
    if (connected) {
      fetchAdminMessageHistory();
    }
  }, [connected]);

  // Function to handle socket connection
  const handleConnect = () => {
    console.log('Connected to socket server');
    setConnected(true);
    
    // Identify as admin
    if (socketRef.current) {
      socketRef.current.emit('identify', {
        userId: 'admin1', // Admin ID
        role: 'admin'
      });
    }
  };

  // Function to handle socket disconnection
  const handleDisconnect = () => {
    console.log('Disconnected from socket server');
    setConnected(false);
  };

  // Function to handle new messages
  const handleNewMessage = (message: Message) => {
    console.log('New message received:', message);
    
    // Add to unread messages if it's sent to admin
    if (message.receiverId === 'admin1' || message.receiverId === '-1') {
      setUnreadMessages(prev => [...prev, message]);
      
      // Show notification
      showNotification(message);
      
      // Update message history
      fetchAdminMessageHistory();
    }
  };

  // Function to show notification
  const showNotification = (message: Message) => {
    // Use react-toastify to show a notification
    toast.info(
      <div>
        <strong>New message from User {message.senderId}</strong>
        <p>{message.content.length > 50 ? `${message.content.substring(0, 50)}...` : message.content}</p>
      </div>,
      {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
    
    // Play notification sound
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(e => console.log('Error playing notification sound:', e));
  };

  // Function to fetch admin message history
  const fetchAdminMessageHistory = async () => {
    try {
      const response = await fetch('/api/admin/messages');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMessageHistory(data);
    } catch (error) {
      console.error('Error fetching admin message history:', error);
    }
  };

  // Function to mark message as read
  const markAsRead = async (userId: string) => {
    try {
      // Update local state
      setUnreadMessages(prev => prev.filter(msg => msg.senderId !== userId));
      
      // Call API to mark messages as read
      await fetch(`/api/messages/read/${userId}/-1`, {
        method: 'POST'
      });
      
      // Refresh message history
      fetchAdminMessageHistory();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return (
    <div className="admin-chat-container">
      <ToastContainer />
      
      <div className="connection-status">
        Status: {connected ? 'Connected' : 'Disconnected'}
      </div>
      
      <h2>Admin Message Center</h2>
      
      {/* Display message history */}
      <div className="message-history">
        <h3>Recent Conversations</h3>
        {messageHistory.length === 0 ? (
          <p>No conversations yet</p>
        ) : (
          <ul className="conversation-list">
            {messageHistory.map(item => (
              <li 
                key={item.user.id} 
                className={`conversation-item ${
                  unreadMessages.some(msg => msg.senderId === item.user.id) ? 'unread' : ''
                }`}
                onClick={() => markAsRead(item.user.id)}
              >
                <div className="user-avatar">
                  {item.user.avatar ? (
                    <img src={item.user.avatar} alt={item.user.fullname || `User ${item.user.id}`} />
                  ) : (
                    <div className="avatar-placeholder">{(item.user.fullname || `User ${item.user.id}`).charAt(0)}</div>
                  )}
                </div>
                <div className="conversation-details">
                  <div className="user-name">{item.user.fullname || `User ${item.user.id}`}</div>
                  <div className="last-message">
                    {item.lastMessage.content.length > 30 
                      ? `${item.lastMessage.content.substring(0, 30)}...` 
                      : item.lastMessage.content}
                  </div>
                  <div className="message-time">
                    {new Date(item.lastMessage.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                {unreadMessages.some(msg => msg.senderId === item.user.id) && (
                  <div className="unread-badge">New</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminChatNotification;