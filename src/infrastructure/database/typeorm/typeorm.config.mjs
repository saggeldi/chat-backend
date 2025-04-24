import { MessageEntity } from './entities/message.entity.typeorm.mjs';
import {createConnection} from "typeorm";

// TypeORM configuration
export const typeormConfig = {
    type: 'postgres', // or 'mysql', 'sqlite', etc.
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'chat',
    synchronize: process.env.NODE_ENV !== 'production', // Auto-create database schema in non-production environments
    logging: process.env.NODE_ENV !== 'production',
    entities: [
        MessageEntity
        // Add other entities here as they are created
    ],
    migrations: [
        // Add migrations here when needed
    ],
    subscribers: [
        // Add subscribers here when needed
    ]
};

// Function to initialize TypeORM connection
export const initializeTypeORM = async (container) => {
    try {
        const connection = await createConnection(typeormConfig);
        console.log('Database connection established');

        // Initialize repositories with the connection
        if (container && container.messageRepository) {
            container.messageRepository.setRepository(connection);
            console.log('Message repository initialized with TypeORM connection');
        }

        return connection;
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
};
