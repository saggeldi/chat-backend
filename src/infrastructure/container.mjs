import { TypeORMMessageRepository, TypeORMUserRepository } from "./database/typeorm/repositories.mjs";
import { FirebaseFCMService } from "./fcm/fcm.service.mjs";

const messageRepository = new TypeORMMessageRepository();
const userRepository = new TypeORMUserRepository();
const fcmService = new FirebaseFCMService();

export const container = {
    messageRepository,
    userRepository,
    fcmService
};
