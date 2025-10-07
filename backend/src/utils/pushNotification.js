const webpush = require('web-push');
const User = require('../models/User');

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  'mailto:' + process.env.VAPID_EMAIL,
  vapidPublicKey,
  vapidPrivateKey
);

const validateSubscription = (subscription) => {
  if (!subscription) return false;
  
  if (!subscription.endpoint || typeof subscription.endpoint !== 'string') return false;
  if (!subscription.keys || typeof subscription.keys !== 'object') return false;
  if (!subscription.keys.p256dh || typeof subscription.keys.p256dh !== 'string') return false;
  if (!subscription.keys.auth || typeof subscription.keys.auth !== 'string') return false;
  
  return true;
};

const saveSubscription = async (userId, subscription) => {
  if (subscription === null) {
    await User.findByIdAndUpdate(userId, {
      pushSubscription: null
    });
    return;
  }

  if (!validateSubscription(subscription)) {
    throw new Error('Invalid push subscription format');
  }

  await User.findByIdAndUpdate(userId, {
    pushSubscription: subscription
  });
};

const sendPushNotification = async (subscription, data) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

module.exports = {
  vapidPublicKey,
  saveSubscription,
  sendPushNotification
};