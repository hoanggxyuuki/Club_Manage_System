const Achievement = require('../models/Achievement');
const Event = require('../models/eventSchema');
const Task = require('../models/Task');
const Group = require('../models/Group');
const ActivitySchedule = require('../models/ActivitySchedule');

exports.createAchievement = async (req, res) => {
    try {
        const achievement = new Achievement(req.body);
        await achievement.save();
        res.status(201).json(achievement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllAchievements = async (req, res) => {
    try {
        const achievements = await Achievement.find();
        res.json(achievements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMemberAchievements = async (req, res) => {
    try {
        const achievements = await Achievement.find({
            'earnedBy.member': req.params.memberId
        });
        res.json(achievements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

async function calculateMemberMetrics(memberId) {
    const events = await Event.find({
        'participants.userId': memberId
    });
    const eventsParticipated = events.length;

    const tasks = await Task.find({
        assignedTo: memberId,
        status: 'completed'
    });
    const tasksCompleted = tasks.length;

    const projects = await Group.find({
        members: memberId,
        type: 'project'
    });
    const projectsParticipated = projects.length;

    const activities = await Group.find({
        members: memberId,
        type: 'activity'
    });
    const activitiesParticipated = activities.length;

    
    const schedules = await ActivitySchedule.find({
        attendees: memberId
    });
    const meetingsAttended = schedules.length;

    
    const totalSchedules = await ActivitySchedule.countDocuments();
    const attendanceRate = totalSchedules > 0 
        ? (meetingsAttended / totalSchedules) * 100 
        : 0;

    return {
        eventsParticipated,
        tasksCompleted,
        projectsParticipated,
        activitiesParticipated,
        meetingsAttended,
        attendanceRate
    };
}


function calculatePoints(metrics, achievement) {
    let points = 0;
    const criteria = achievement.criteria;

    
    if (metrics.eventsParticipated >= criteria.eventsRequired) {
        points += 20 * (metrics.eventsParticipated / criteria.eventsRequired);
    }

    
    if (metrics.tasksCompleted >= criteria.tasksRequired) {
        points += 15 * (metrics.tasksCompleted / criteria.tasksRequired);
    }

    
    if (metrics.projectsParticipated >= criteria.projectsRequired) {
        points += 30 * (metrics.projectsParticipated / criteria.projectsRequired);
    }

    
    if (metrics.activitiesParticipated >= criteria.activitiesRequired) {
        points += 15 * (metrics.activitiesParticipated / criteria.activitiesRequired);
    }

    
    if (metrics.meetingsAttended >= criteria.attendanceRequired && 
        metrics.attendanceRate >= criteria.attendanceRate) {
        points += 20 * (metrics.attendanceRate / criteria.attendanceRate);
    }

    return Math.round(points);
}


exports.evaluateAndAward = async (req, res) => {
    try {
        const { memberId } = req.params;
        const metrics = await calculateMemberMetrics(memberId);
        const awardedAchievements = [];

        
        const eligibleAchievements = await Achievement.find({
            'earnedBy.member': { $ne: memberId }
        });

        for (const achievement of eligibleAchievements) {
            const meetsEventCriteria = metrics.eventsParticipated >= achievement.criteria.eventsRequired;
            const meetsTaskCriteria = metrics.tasksCompleted >= achievement.criteria.tasksRequired;
            const meetsProjectCriteria = metrics.projectsParticipated >= achievement.criteria.projectsRequired;
            const meetsActivityCriteria = metrics.activitiesParticipated >= achievement.criteria.activitiesRequired;
            const meetsAttendanceCriteria = 
                metrics.meetingsAttended >= achievement.criteria.attendanceRequired &&
                metrics.attendanceRate >= achievement.criteria.attendanceRate;

            
            if ((achievement.type === 'event' && meetsEventCriteria) ||
                (achievement.type === 'task' && meetsTaskCriteria) ||
                (achievement.type === 'project' && meetsProjectCriteria) ||
                (achievement.type === 'activity' && meetsActivityCriteria) ||
                (achievement.type === 'attendance' && meetsAttendanceCriteria)) {

                const points = calculatePoints(metrics, achievement);

                
                const currentEarners = achievement.earnedBy
                    .sort((a, b) => b.totalPoints - a.totalPoints);

                
                let rank = 1;
                for (const earner of currentEarners) {
                    if (earner.totalPoints > points) rank++;
                }

                
                achievement.earnedBy.push({
                    member: memberId,
                    dateEarned: new Date(),
                    totalPoints: points,
                    metrics,
                    rank
                });

                
                achievement.earnedBy = achievement.earnedBy
                    .sort((a, b) => b.totalPoints - a.totalPoints)
                    .map((earner, index) => {
                        earner.rank = index + 1;
                        return earner;
                    });

                await achievement.save();
                awardedAchievements.push(achievement);
            }
        }

        res.json({
            message: 'Evaluation complete',
            awardedAchievements,
            metrics
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.awardAchievement = async (req, res) => {
    try {
        const { memberId } = req.params;
        const achievement = await Achievement.findById(req.params.achievementId);
        
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        
        const alreadyEarned = achievement.earnedBy.some(
            earn => earn.member.toString() === memberId
        );

        if (alreadyEarned) {
            return res.status(400).json({ 
                message: 'Member already has this achievement' 
            });
        }

        
        const metrics = await calculateMemberMetrics(memberId);
        
        
        const totalPoints = calculatePoints(metrics, achievement);

        
        const currentEarners = achievement.earnedBy
            .sort((a, b) => b.totalPoints - a.totalPoints);
        
        
        let rank = 1;
        for (const earner of currentEarners) {
            if (earner.totalPoints > totalPoints) rank++;
        }

        
        achievement.earnedBy.push({
            member: memberId,
            dateEarned: new Date(),
            totalPoints,
            metrics,
            rank
        });

        
        achievement.earnedBy = achievement.earnedBy
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .map((earner, index) => {
                earner.rank = index + 1;
                return earner;
            });

        await achievement.save();
        res.json(achievement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.updateAchievement = async (req, res) => {
    try {
        const achievement = await Achievement.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        
        if (!achievement) {
            return res.status(404).json({ message: 'Không tìm thấy thành tích' });
        }
        
        
        for (let i = 0; i < achievement.earnedBy.length; i++) {
            const metrics = await calculateMemberMetrics(achievement.earnedBy[i].member);
            achievement.earnedBy[i].totalPoints = calculatePoints(metrics, achievement);
            achievement.earnedBy[i].metrics = metrics;
        }

        
        achievement.earnedBy = achievement.earnedBy
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .map((earner, index) => {
                earner.rank = index + 1;
                return earner;
            });

        await achievement.save();
        res.json(achievement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.deleteAchievement = async (req, res) => {
    try {
        const achievement = await Achievement.findByIdAndDelete(req.params.id);
        
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }
        
        res.json({ message: 'Achievement deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};