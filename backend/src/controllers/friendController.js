const Friend = require('../models/Friend');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Notification = require('../models/notification');
const { getIO } = require('../utils/socketHandler');

exports.sendFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user._id;

    if (userId.toString() === friendId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    
    const existingFriendship = await Friend.findOne({
      $or: [
        { user: userId, friend: friendId },
        { user: friendId, friend: userId }
      ]
    });

    if (existingFriendship) {
      return res.status(400).json({ message: 'Friend request already exists' });
    }

    const friendRequest = new Friend({
      user: userId,
      friend: friendId
    });

    await friendRequest.save();

    
    const sender = await User.findById(userId);
    if (!sender) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    
    const notification = await new Notification({
      title: 'New Friend Request',
      message: `${sender.fullName} sent you a friend request`,
      type: 'friend',
      sender: userId,
      recipients: [{ userId: friendId }],
      url: '/member/friends'
    }).save();

    
    const io = getIO();
    io.to(friendId).emit('notification', {
      type: 'NEW_NOTIFICATION',
      notification
    });

    res.json(friendRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.respondToFriendRequest = async (req, res) => {
  try {
    const { requestId, status } = req.body;
    const userId = req.user._id;

    const friendRequest = await Friend.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendRequest.friend.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    if (status === 'accepted') {
      friendRequest.status = status;
      await friendRequest.save();
    } else {
      
      await Friend.deleteOne({ _id: requestId });
    }

    
    const io = getIO();
    io.to(friendRequest.user.toString()).emit('friendRequestResponse', {
      type: 'friendRequestResponse',
      requestId,
      status
    });

    res.json(friendRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const userId = req.user._id;
    
    
    const friends = await Friend.find({
      $or: [
        { user: userId, status: 'accepted' },
        { friend: userId, status: 'accepted' }
      ]
    }).populate('user friend', 'fullName email avatar');

    
    const friendList = friends.map(friendship => {
      const friend = friendship.user._id.toString() === userId.toString() 
        ? friendship.friend 
        : friendship.user;
      return friend;
    });

    res.json(friendList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSentRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    
    
    const sentRequests = await Friend.find({
      user: userId,
      status: 'pending'
    }).populate('friend', 'fullName email avatar');

    res.json(sentRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    

    const userId = req.user._id;
    
    
    const pendingRequests = await Friend.find({
      friend: userId,
      status: 'pending'
    }).populate('user', 'fullName email avatar');
    res.json(pendingRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    
    const friendships = await Friend.find({
      $or: [
        { user: userId },
        { friend: userId }
      ]
    });

    const friendIds = friendships.map(friendship => 
      friendship.user.toString() === userId.toString() 
        ? friendship.friend 
        : friendship.user
    );

    
    const users = await User.find({
      _id: { $nin: [...friendIds, userId] },
      $or: [
        { fullName: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') }
      ]
    })
    .select('fullName email avatar')
    .skip(skip)
    .limit(limit);

    const total = await User.countDocuments({
      _id: { $nin: [...friendIds, userId] },
      $or: [
        { fullName: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') }
      ]
    });

    res.json({
      users,
      pagination: {
        current: page,
        total: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    
    const friendship = await Friend.findOne({
      $or: [
        { user: userId, friend: friendId },
        { user: friendId, friend: userId }
      ],
      status: 'accepted'
    });

    if (!friendship) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    
    const chat = await Chat.findOne({
      participants: { $all: [userId, friendId] }
    });

    if (chat) {
      await Chat.deleteOne({ _id: chat._id });
    }

    
    await Friend.deleteOne({ _id: friendship._id });

    
    const friend = await User.findById(friendId).select('fullName');
    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' });
    }

    
    const notification = await new Notification({
      title: 'Friend Removed',
      message: `${req.user.fullName} has removed you from their friends list`,
      type: 'friend',
      sender: userId,
      recipients: [{ userId: friendId }],
      url: '/member/friends'
    }).save();

    
    const io = getIO();
    
    io.to(friendId).emit('friendRemoved', {
      type: 'FRIEND_REMOVED',
      userId: userId
    });
    
    io.to(friendId).emit('notification', {
      type: 'NEW_NOTIFICATION',
      notification
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};