import { EntitySchema } from 'typeorm';
import {Message} from "../../../../domain/entities/message.entity.mjs";

export const MessageEntity = new EntitySchema({
    name: 'Message',
    target: Message,
    tableName: 'messages',
    columns: {
        id: {
            primary: true,
            type: 'varchar',
            length: 255
        },
        senderId: {
            type: 'varchar',
            length: 255
        },
        receiverId: {
            type: 'varchar',
            length: 255
        },
        content: {
            type: 'text'
        },
        mimeType: {
            type: 'varchar',
            length: 50,
            default: 'text/plain'
        },
        timestamp: {
            type: 'timestamp',
            createDate: true
        },
        read: {
            type: 'boolean',
            default: false
        }
    },
    indices: [
        {
            name: 'IDX_MESSAGE_SENDER_RECEIVER',
            columns: ['senderId', 'receiverId']
        }
    ]
});