const Match = require('../models/Match');
const User = require('../models/User');
const { createNotification } = require('./notificationController');


const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};


const calculateMatchScore = (user1, user2) => {
    let score = 0;
    const maxScore = 100;
    let totalWeight = 0;

    
    if (user1.relationshipStatus === 'prefer-not-to-say' || 
        user2.relationshipStatus === 'prefer-not-to-say') {
        return 0; 
    }
   
    if (user1.relationshipStatus !== 'single' || user2.relationshipStatus !== 'single') {
        return 0; 
    }

    
    if (user1.interests?.length > 0 && user2.interests?.length > 0) {
        const interestWeight = 35;
        totalWeight += interestWeight;
        const commonInterests = user1.interests.filter(interest => 
            user2.interests.includes(interest)
        );
        score += (commonInterests.length / Math.max(user1.interests.length, user2.interests.length)) * interestWeight;
    }

    
    if (user1.city && user2.city) {
        const locationWeight = 25;
        totalWeight += locationWeight;
        if (user1.city === user2.city) {
            score += locationWeight;
        } else if (user1.province && user2.province && user1.province === user2.province) {
            score += locationWeight * 0.7;
        }
    }

    
    const age1 = calculateAge(user1.dateOfBirth);
    const age2 = calculateAge(user2.dateOfBirth);
    if (age1 && age2) {
        const ageWeight = 20;
        totalWeight += ageWeight;
        const ageDiff = Math.abs(age1 - age2);
        if (ageDiff <= 5) {
            score += ageWeight;
        } else if (ageDiff <= 10) {
            score += ageWeight * 0.7;
        } else if (ageDiff <= 15) {
            score += ageWeight * 0.4;
        }
    }

    
    const genderWeight = 20;
    if (user1.gender && user2.gender) {
        totalWeight += genderWeight;
        if (user1.gender !== user2.gender) { 
            score += genderWeight;
        } else {
            score += genderWeight * 0.5; 
        }
    }

    
    if (totalWeight > 0) {
        score = (score / totalWeight) * maxScore;
    }

    return Math.round(score);
};


exports.getPotentialMatches = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        
        if (!user.relationshipStatus || user.relationshipStatus === 'prefer-not-to-say') {
            return res.status(400).json({ 
                message: 'Vui lòng cập nhật trạng thái mối quan hệ trong hồ sơ của bạn' 
            });
        }

        if (!user.dateOfBirth) {
            return res.status(400).json({ 
                message: 'Vui lòng cập nhật ngày sinh trong hồ sơ của bạn' 
            });
        }

        if (!user.interests || user.interests.length === 0) {
            return res.status(400).json({ 
                message: 'Vui lòng thêm sở thích vào hồ sơ của bạn' 
            });
        }

        
        const existingMatches = await Match.find({
            $or: [
                { user1: userId },
                { user2: userId }
            ],
            status: { $in: ['pending', 'matched'] }
        }).select('user1 user2');
        
        const excludedUsers = existingMatches.reduce((acc, match) => {
            
            if (match.user1.toString() === userId.toString()) {
                acc.push(match.user2);
            } else {
                acc.push(match.user1);
            }
            return acc;
        }, [userId]); 

        
        const potentialMatches = await User.find({
            _id: { $nin: excludedUsers },
            relationshipStatus: 'single'
        });

        
        const scoredMatches = potentialMatches
            .filter(match => match._id.toString() !== userId.toString()) 
            .map(match => ({
                user: match,
                score: calculateMatchScore(user, match)
            }))
            .filter(match => match.score > 30) 
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); 

        if (scoredMatches.length === 0) {
            return res.json({ 
                message: 'Chưa tìm thấy người phù hợp. Hãy thử lại sau!',
                matches: [] 
            });
        }

        res.json(scoredMatches);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm người phù hợp:', error);
        res.status(500).json({ message: 'Lỗi khi tìm kiếm người phù hợp' });
    }
};


exports.createMatch = async (req, res) => {
    try {
        const { user2Id } = req.body;
        const user1Id = req.user._id;

        if (user1Id.toString() === user2Id.toString()) {
            return res.status(400).json({ message: 'Không thể tự kết nối với chính mình' });
        }

        const [user1, user2] = await Promise.all([
            User.findById(user1Id),
            User.findById(user2Id)
        ]);

        if (!user2) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        
        const existingMatch = await Match.findOne({
            $or: [
                { user1: user1Id, user2: user2Id },
                { user1: user2Id, user2: user1Id }
            ]
        });

        if (existingMatch) {
            return res.status(400).json({ message: 'Đã tồn tại lời mời kết nối giữa hai người dùng này' });
        }

        const matchScore = calculateMatchScore(user1, user2);

        const match = await Match.create({
            user1: user1Id,
            user2: user2Id,
            matchScore,
            user1Accepted: true 
        });

        
        await createNotification({
            body: {
                title: 'Lời mời kết nối mới',
                message: `${user1.fullName} muốn kết nối với bạn!`,
                type: 'match',
                recipients: [user2Id],
                sender: user1Id
            },
            user: user1
        });

        const populatedMatch = await Match.findById(match._id).populate('user1 user2');
        res.json(populatedMatch);
    } catch (error) {
        console.error('Lỗi khi tạo kết nối:', error);
        res.status(500).json({ message: 'Lỗi khi tạo kết nối' });
    }
};


exports.getMatches = async (req, res) => {
    try {
        const userId = req.user._id;
        const matches = await Match.find({
            $or: [
                { user1: userId },
                { user2: userId }
            ],
            status: { $ne: 'rejected' } 
        }).populate('user1 user2');

        const formattedMatches = matches.map(match => {
            const otherUser = match.user1._id.toString() === userId.toString() 
                ? match.user2 
                : match.user1;
            
            const isPending = match.status === 'pending';
            const isCurrentUserInitiator = match.user1._id.toString() === userId.toString();
            const showMatchButtons = isPending && !isCurrentUserInitiator;
            
            return {
                ...match.toObject(),
                otherUser,
                showMatchButtons
            };
        });

        res.json(formattedMatches);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách kết nối:', error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách kết nối' });
    }
};


exports.respondToMatch = async (req, res) => {
    try {
        const matchId = req.params.matchId;
        const accepted = req.body.accepted;
        const userId = req.user._id;

        let match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({ message: 'Không tìm thấy lời mời kết nối' });
        }

        
        const isUser2 = match.user2.toString() === userId.toString();
        if (!isUser2) {
            return res.status(403).json({ message: 'Chỉ người nhận lời mời mới có thể phản hồi' });
        }

        match.user2Accepted = accepted;
        match.status = accepted ? 'matched' : 'rejected';
        await match.save();

        match = await match.populate(['user1', 'user2']);

        if (accepted) {
            
            await Promise.all([
                createNotification({
                    body: {
                        title: 'Kết nối mới!',
                        message: `Bạn đã kết nối thành công với ${match.user1.fullName}!`,
                        type: 'match',
                        recipients: [match.user2._id],
                        sender: match.user1._id
                    },
                    user: match.user1
                }),
                createNotification({
                    body: {
                        title: 'Kết nối mới!',
                        message: `${match.user2.fullName} đã chấp nhận lời mời kết nối của bạn!`,
                        type: 'match',
                        recipients: [match.user1._id],
                        sender: match.user2._id
                    },
                    user: match.user2
                })
            ]);
        }

        res.json(match);
    } catch (error) {
        console.error('Lỗi khi phản hồi lời mời kết nối:', error);
        res.status(500).json({ message: 'Lỗi khi phản hồi lời mời kết nối' });
    }
};