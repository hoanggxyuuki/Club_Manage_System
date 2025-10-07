const Notification = require('../models/notification');
const User = require('../models/User');
const { sendNotification } = require('../utils/socketHandler');
const { sendPushNotification } = require('../utils/pushNotification');

exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            'recipients.userId': req.user._id
        })
        .populate('sender', 'username')
        .populate('groupId', 'name')
        .populate('taskId', 'title')
        .sort({ createdAt: -1 });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            {
                'recipients': {
                    $elemMatch: {
                        userId: req.user._id,
                        read: false
                    }
                }
            },
            {
                $set: {
                    'recipients.$[elem].read': true
                }
            },
            {
                arrayFilters: [{ 'elem.userId': req.user._id }],
                multi: true
            }
        );

        res.json({ 
            success: true, 
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await Notification.findOneAndUpdate(
            {
                _id: notificationId,
                'recipients.userId': req.user._id
            },
            {
                $set: {
                    'recipients.$.read': true
                }
            },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const createAndSendNotification = async (data) => {
    const notification = new Notification({
        title: data.title,
        message: data.message,
        type: data.type,
        url: data.url,
        sender: data.sender,
        recipients: data.recipients?.map(userId => ({ userId, read: false })),
        groupId: data.groupId,
        taskId: data.taskId
    });

    await notification.save();

    
    await notification.populate([
        { path: 'sender', select: 'username avatar' },
        { path: 'groupId', select: 'name' },
        { path: 'taskId', select: 'title' }
    ]);

    
    for (const recipient of data.recipients) {
        
        await sendNotification(recipient, {
            notification,
            type: 'NEW_NOTIFICATION',
        });

        
        const user = await User.findById(recipient).select('pushSubscription');
        if (user?.pushSubscription) {
            await sendPushNotification(user.pushSubscription, {
                title: notification.title,
                content: notification.message,
                _id: notification._id,
                url: notification.url
            });
        }
    }

    return notification;
};


exports.createNotification = async (params) => {
    try {
        const { body, user } = params;
        const { title, message, type, recipients, groupId, taskId, url } = body;

        return await createAndSendNotification({
            title,
            message,
            type,
            url,
            sender: user._id,
            recipients,
            groupId,
            taskId
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};


exports.createNotificationHandler = async (req, res) => {
    try {
        const notification = await exports.createNotification({
            body: req.body,
            user: req.user
        });
        res.status(201).json(notification);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            'recipients': {
                $elemMatch: {
                    userId: req.user._id,
                    read: false
                }
            }
        });

        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};