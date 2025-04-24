export class User {
    constructor(id, role, fcmTokens = undefined) {
        this.id = id;
        this.role = role;
        this.fcmTokens = fcmTokens;
    }
}

export class Message {
    constructor(id, senderId, receiverId, content, mimeType = 'text/plain', timestamp, read = false) {
        this.id = id;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.content = content;
        this.mimeType = mimeType;
        this.timestamp = timestamp;
        this.read = read;
    }
}