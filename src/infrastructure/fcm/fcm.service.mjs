import admin from 'firebase-admin';
import axios from 'axios';

export class FirebaseFCMService {
    constructor() {
        admin.initializeApp({
            credential: admin.credential.cert('balary-v2-firebase-adminsdk.json')
        });
    }

    async sendPushNotification(message) {
        // If token is provided directly, use it
        if (message.token) {
            await admin.messaging().send({
                token: message.token,
                notification: {
                    title: message.title,
                    body: message.body
                }
            });
            return;
        }

        // If tokens array is provided, send to all tokens
        if (message.tokens && Array.isArray(message.tokens) && message.tokens.length > 0) {
            const notifications = message.tokens.map(token => 
                admin.messaging().send({
                    token: token,
                    notification: {
                        title: message.title,
                        body: message.body
                    }
                })
            );
            try {
                await Promise.all(notifications);
            } catch (error) {
                console.error('Error sending push notification:', error);
            }
            return;
        }

        // If userId is provided but no tokens, try to fetch tokens from external API
        if (message.userId) {
            try {
                const response = await axios.get(`https://api2.balary.net/customers/${message.userId}`);
                const userInfo = response.data;

                if (userInfo.tokens && Array.isArray(userInfo.tokens) && userInfo.tokens.length > 0) {
                    const notifications = userInfo.tokens.map(token => 
                        admin.messaging().send({
                            token: token,
                            notification: {
                                title: message.title,
                                body: message.body
                            }
                        })
                    );
                    await Promise.all(notifications);
                }
            } catch (error) {
                console.error('Error fetching user tokens from external API:', error);
                throw new Error('Failed to send push notification: could not fetch user tokens');
            }
        }
    }
}
