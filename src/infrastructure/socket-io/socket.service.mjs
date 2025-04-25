import { Server } from 'socket.io';

export class SocketIoService {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        // Store multiple socket IDs for each user ID
        this.connections = new Map();
        this.setupConnectionHandling();
    }

    setupConnectionHandling() {
        // Skip authentication for demo purposes
        // this.io.use(this.authenticationMiddleware);

        this.io.on('connection', (socket) => {
            console.log('New socket connection:', socket.id);

            // Handle user identification
            socket.on('identify', (userData) => {
                console.log('User identified:', userData);
                if (userData && userData.userId) {
                    socket.data.userId = userData.userId;
                    socket.data.role = userData.role || 'user';

                    // Store multiple socket connections for the same user ID
                    if (!this.connections.has(userData.userId)) {
                        this.connections.set(userData.userId, []);
                    }

                    const userSockets = this.connections.get(userData.userId);
                    if (!userSockets.includes(socket.id)) {
                        userSockets.push(socket.id);
                    }

                    console.log(`User ${userData.userId} identified with socket ${socket.id}`);
                    socket.emit('identified', { userId: userData.userId });
                }
            });

            socket.on('disconnect', () => {
                if (socket.data && socket.data.userId) {
                    const userId = socket.data.userId;
                    const userSockets = this.connections.get(userId);

                    if (userSockets) {
                        // Remove this socket ID from the array
                        const index = userSockets.indexOf(socket.id);
                        if (index !== -1) {
                            userSockets.splice(index, 1);
                        }

                        // If no more sockets for this user, remove the user from the connections map
                        if (userSockets.length === 0) {
                            this.connections.delete(userId);
                        }
                    }

                    console.log(`Socket ${socket.id} for user ${userId} disconnected`);
                }
            });
        });
    }

    authenticationMiddleware(socket, next) {
        const token = socket.handshake.auth.token;
        // Add JWT verification logic here
        // Set socket.data.userId and socket.data.role

        // For demo purposes, we'll accept connections without authentication
        next();
    }

    sendToUser(userId, event, payload) {
        const socketIds = this.connections.get(userId);
        if (socketIds && socketIds.length > 0) {
            // Send the message to all connected sockets for this user
            socketIds.forEach(socketId => {
                this.io.to(socketId).emit(event, payload);
            });
        }
    }
}
