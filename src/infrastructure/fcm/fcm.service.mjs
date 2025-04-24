import admin from 'firebase-admin';

export class FirebaseFCMService {
    constructor() {
        admin.initializeApp({
            credential: admin.credential.cert('balary-v2-firebase-adminsdk.json')
        });
    }

    async sendPushNotification(message) {
        await admin.messaging().send({
            token: message.token,
            notification: {
                title: message.title,
                body: message.body
            }
        });
    }
}