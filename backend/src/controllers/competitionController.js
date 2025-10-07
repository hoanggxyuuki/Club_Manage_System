const Competition = require('../models/Competition');
const Achievement = require('../models/Achievement');


exports.createCompetition = async (req, res) => {
    try {
        const competition = new Competition({
            ...req.body,
            createdBy: req.user._id
        });
        await competition.save();
        res.status(201).json(competition);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.getCompetitions = async (req, res) => {
    try {
        const { status, category } = req.query;
        const query = {};
        
        if (status) query.status = status;
        if (category) query.category = category;

        const competitions = await Competition.find(query)
            .populate('participants.member', 'name avatar')
            .populate('winners.member', 'name avatar')
            .populate('createdBy', 'name')
            .sort({ startDate: -1 });

        res.json(competitions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getCompetitionById = async (req, res) => {
    try {
        const competition = await Competition.findById(req.params.id)
            .populate('participants.member', 'name avatar')
            .populate('winners.member', 'name avatar')
            .populate('createdBy', 'name');

        if (!competition) {
            return res.status(404).json({ message: 'Competition not found' });
        }

        res.json(competition);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.joinCompetition = async (req, res) => {
    try {
        const competition = await Competition.findById(req.params.id);
        
        if (!competition) {
            return res.status(404).json({ message: 'Competition not found' });
        }

        if (competition.status !== 'upcoming' && competition.status !== 'active') {
            return res.status(400).json({ message: 'Competition is not open for joining' });
        }

        const alreadyJoined = competition.participants.some(
            p => p.member.toString() === req.user._id.toString()
        );

        if (alreadyJoined) {
            return res.status(400).json({ message: 'Already joined this competition' });
        }

        competition.participants.push({
            member: req.user._id,
            score: 0,
            joinedAt: new Date()
        });

        await competition.save();
        res.json(competition);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.updateScore = async (req, res) => {
    try {
        const { score } = req.body;
        const competition = await Competition.findById(req.params.id);
        
        if (!competition) {
            return res.status(404).json({ message: 'Competition not found' });
        }

        const participant = competition.participants.find(
            p => p.member.toString() === req.params.memberId
        );

        if (!participant) {
            return res.status(404).json({ message: 'Participant not found' });
        }

        participant.score = score;
        await competition.save();
        res.json(competition);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.endCompetition = async (req, res) => {
    try {
        const competition = await Competition.findById(req.params.id);
        
        if (!competition) {
            return res.status(404).json({ message: 'Competition not found' });
        }

        if (competition.status !== 'active') {
            return res.status(400).json({ message: 'Competition is not active' });
        }

        
        const sortedParticipants = [...competition.participants]
            .sort((a, b) => b.score - a.score);

        
        const winners = sortedParticipants.slice(0, 3).map((p, index) => ({
            member: p.member,
            rank: index + 1,
            reward: {
                points: 100 - (index * 25), 
                achievement: null 
            }
        }));

        competition.winners = winners;
        competition.status = 'completed';
        competition.endDate = new Date();

        await competition.save();
        res.json(competition);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.updateCompetition = async (req, res) => {
    try {
        const competition = await Competition.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        
        if (!competition) {
            return res.status(404).json({ message: 'Competition not found' });
        }
        
        res.json(competition);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.deleteCompetition = async (req, res) => {
    try {
        const competition = await Competition.findByIdAndDelete(req.params.id);
        
        if (!competition) {
            return res.status(404).json({ message: 'Competition not found' });
        }
        
        res.json({ message: 'Competition deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};