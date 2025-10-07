import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getAllAchievements } from "../../../services/achievement";

const PerformanceMetrics = ({ memberId }) => {
  const [metrics, setMetrics] = useState({
    totalPoints: 0,
    highestRank: 0,
    achievementsCount: 0,
    eventsParticipated: 0,
    tasksCompleted: 0,
    projectsParticipated: 0,
    activitiesParticipated: 0,
    meetingsAttended: 0,
    averageAttendanceRate: 0,
  });

  useEffect(() => {
    fetchMetrics();
  }, [memberId]);

  const fetchMetrics = async () => {
    try {
      const achievements = await getAllAchievements();
      const memberAchievements = achievements.filter((achievement) =>
        achievement.earnedBy.some((earned) => earned.member === memberId),
      );

      if (memberAchievements.length === 0) return;

      
      const aggregatedMetrics = memberAchievements.reduce(
        (acc, achievement) => {
          const earnedData = achievement.earnedBy.find(
            (earned) => earned.member === memberId,
          );
          if (!earnedData) return acc;

          return {
            totalPoints: acc.totalPoints + (earnedData.totalPoints || 0),
            highestRank: Math.min(
              acc.highestRank || Infinity,
              earnedData.rank || Infinity,
            ),
            eventsParticipated: Math.max(
              acc.eventsParticipated,
              earnedData.metrics?.eventsParticipated || 0,
            ),
            tasksCompleted: Math.max(
              acc.tasksCompleted,
              earnedData.metrics?.tasksCompleted || 0,
            ),
            projectsParticipated: Math.max(
              acc.projectsParticipated,
              earnedData.metrics?.projectsParticipated || 0,
            ),
            activitiesParticipated: Math.max(
              acc.activitiesParticipated,
              earnedData.metrics?.activitiesParticipated || 0,
            ),
            meetingsAttended: Math.max(
              acc.meetingsAttended,
              earnedData.metrics?.meetingsAttended || 0,
            ),
            attendanceRates: [
              ...acc.attendanceRates,
              earnedData.metrics?.attendanceRate || 0,
            ],
          };
        },
        {
          totalPoints: 0,
          highestRank: Infinity,
          eventsParticipated: 0,
          tasksCompleted: 0,
          projectsParticipated: 0,
          activitiesParticipated: 0,
          meetingsAttended: 0,
          attendanceRates: [],
        },
      );

      setMetrics({
        ...aggregatedMetrics,
        achievementsCount: memberAchievements.length,
        highestRank:
          aggregatedMetrics.highestRank === Infinity
            ? "N/A"
            : aggregatedMetrics.highestRank,
        averageAttendanceRate:
          aggregatedMetrics.attendanceRates.length > 0
            ? (
                aggregatedMetrics.attendanceRates.reduce((a, b) => a + b, 0) /
                aggregatedMetrics.attendanceRates.length
              ).toFixed(1)
            : 0,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  const MetricCard = ({ title, value, color = "blue" }) => (
    <div className={`bg-${color}-50 p-4 rounded-lg shadow`}>
      <h4 className="text-sm font-medium text-gray-600">{title}</h4>
      <p className={`text-xl font-semibold text-${color}-600 mt-1`}>{value}</p>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Tổng quan thành tích</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tổng điểm"
          value={metrics.totalPoints}
          color="blue"
        />

        <MetricCard
          title="Xếp hạng cao nhất"
          value={metrics.highestRank}
          color="purple"
        />

        <MetricCard
          title="Số thành tích"
          value={metrics.achievementsCount}
          color="green"
        />

        <MetricCard
          title="Sự kiện tham gia"
          value={metrics.eventsParticipated}
          color="yellow"
        />

        <MetricCard
          title="Công việc hoàn thành"
          value={metrics.tasksCompleted}
          color="pink"
        />

        <MetricCard
          title="Dự án tham gia"
          value={metrics.projectsParticipated}
          color="indigo"
        />

        <MetricCard
          title="Hoạt động tham gia"
          value={metrics.activitiesParticipated}
          color="red"
        />

        <MetricCard
          title="Buổi sinh hoạt tham dự"
          value={metrics.meetingsAttended}
          color="teal"
        />

        <MetricCard
          title="Tỷ lệ tham dự TB"
          value={`${metrics.averageAttendanceRate}%`}
          color="orange"
        />
      </div>
    </div>
  );
};

PerformanceMetrics.propTypes = {
  memberId: PropTypes.string.isRequired,
};

export default PerformanceMetrics;
