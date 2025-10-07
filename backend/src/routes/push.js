const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { vapidPublicKey, saveSubscription } = require('../utils/pushNotification');

router.get('/vapid-public-key', (req, res) => {
    res.json({ vapidPublicKey });
});


router.post('/subscribe', auth, async (req, res) => {
    try {
        const subscription = req.body;
        await saveSubscription(req.user._id, subscription);
        res.json({ message: 'Successfully subscribed to push notifications' });
    } catch (error) {
        console.error('Push subscription error:', error);
        if (error.message === 'Invalid push subscription format') {
            return res.status(400).json({
                message: 'Failed to subscribe to push notifications: Invalid subscription format',
                details: 'Subscription must include endpoint and valid keys (p256dh and auth)'
            });
        }
        res.status(500).json({ message: 'Failed to subscribe to push notifications' });
    }
});

router.post('/unsubscribe', auth, async (req, res) => {
    try {
        await saveSubscription(req.user._id, null);
        res.json({ message: 'Successfully unsubscribed from push notifications' });
    } catch (error) {
        console.error('Push unsubscription error:', error);
        res.status(500).json({ message: 'Failed to unsubscribe from push notifications' });
    }
});

module.exports = router;