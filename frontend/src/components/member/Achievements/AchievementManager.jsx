import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../../../context/AuthContext";
import {
  getAllAchievements,
  evaluateAndAward,
  awardAchievement,
} from "../../../services/achievement";
import PerformanceMetrics from "./PerformanceMetrics";
import { toast } from "react-toastify";

const AchievementManager = ({ memberId }) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const isLeaderOrAdmin = user?.role === "leader" || user?.role === "admin";

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const data = await getAllAchievements();
      setAchievements(data);
    } catch (error) {
      toast.error("Không thể tải thành tích");
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    try {
      setLoading(true);
      const result = await evaluateAndAward(memberId);
      toast.success("Đã đánh giá và cập nhật thành tích");

      
      if (result.awardedAchievements?.length > 0) {
        await fetchAchievements();
      }
    } catch (error) {
      toast.error("Không thể đánh giá thành tích");
    } finally {
      setLoading(false);
    }
  };

  const handleAward = async (achievementId) => {
    try {
      setLoading(true);
      await awardAchievement(achievementId, memberId);
      toast.success("Đã trao thành tích thành công");
      await fetchAchievements();
    } catch (error) {
      toast.error("Không thể trao thành tích");
    } finally {
      setLoading(false);
    }
  };

  const getMemberAchievements = () => {
    return achievements.filter((achievement) =>
      achievement.earnedBy.some((earned) => earned.member === memberId),
    );
  };

  const getEligibleAchievements = () => {
    return achievements.filter(
      (achievement) =>
        !achievement.earnedBy.some((earned) => earned.member === memberId),
    );
  };

  const getAchievementMetrics = (achievement) => {
    const earnedData = achievement.earnedBy.find(
      (earned) => earned.member === memberId,
    );
    if (!earnedData) return null;
    return earnedData.metrics;
  };

  const renderMetricsDetails = (metrics) => {
    if (!metrics) return null;
    return (
      <div className="mt-2 text-sm text-gray-600 space-y-1">
        <p>Sự kiện tham gia: {metrics.eventsParticipated}</p>
        <p>Công việc hoàn thành: {metrics.tasksCompleted}</p>
        <p>Dự án tham gia: {metrics.projectsParticipated}</p>
        <p>Hoạt động tham gia: {metrics.activitiesParticipated}</p>
        <p>Buổi sinh hoạt tham dự: {metrics.meetingsAttended}</p>
        <p>Tỷ lệ tham dự: {metrics.attendanceRate.toFixed(1)}%</p>
      </div>
    );
  };

  if (!isLeaderOrAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Quản lý thành tích</h2>
            <button
              onClick={handleEvaluate}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={loading}
            >
              Đánh giá tự động
            </button>
          </div>

          {/* Performance Metrics Overview */}
          <PerformanceMetrics memberId={memberId} />

          {/* Earned Achievements */}
          <div>
            <h3 className="text-lg font-medium mb-4">Thành tích đã đạt được</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getMemberAchievements().map((achievement) => (
                <div
                  key={achievement._id}
                  className="bg-white p-4 rounded-lg shadow"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {achievement.badgeImage && (
                      <img
                        src={achievement.badgeImage}
                        alt={achievement.name}
                        className="w-12 h-12 object-contain"
                      />
                    )}
                    <div>
                      <h4 className="font-medium">{achievement.name}</h4>
                      <p className="text-sm text-blue-600">
                        Hạng{" "}
                        {achievement.earnedBy.find((e) => e.member === memberId)
                          ?.rank || "N/A"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {achievement.description}
                  </p>
                  <div className="mt-2 text-sm">
                    <p className="text-indigo-600 font-medium">
                      Điểm:{" "}
                      {achievement.earnedBy.find((e) => e.member === memberId)
                        ?.totalPoints || 0}
                    </p>
                    {renderMetricsDetails(getAchievementMetrics(achievement))}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Đạt được:{" "}
                    {achievement.earnedBy.find(
                      (earned) => earned.member === memberId,
                    )?.dateEarned
                      ? new Date(
                          achievement.earnedBy.find(
                            (earned) => earned.member === memberId,
                          ).dateEarned,
                        ).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Available Achievements */}
          <div>
            <h3 className="text-lg font-medium mb-4">
              Thành tích có thể đạt được
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getEligibleAchievements().map((achievement) => (
                <div
                  key={achievement._id}
                  className="bg-white p-4 rounded-lg shadow"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {achievement.badgeImage && (
                      <img
                        src={achievement.badgeImage}
                        alt={achievement.name}
                        className="w-12 h-12 object-contain"
                      />
                    )}
                    <div>
                      <h4 className="font-medium">{achievement.name}</h4>
                      <p className="text-sm text-gray-500">
                        Loại: {achievement.type}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {achievement.description}
                  </p>
                  <div className="mt-2 text-sm text-gray-600">
                    <p className="font-medium">Yêu cầu đạt được:</p>
                    {achievement.criteria.eventsRequired > 0 && (
                      <p>
                        - Tham gia {achievement.criteria.eventsRequired} sự kiện
                      </p>
                    )}
                    {achievement.criteria.tasksRequired > 0 && (
                      <p>
                        - Hoàn thành {achievement.criteria.tasksRequired} công
                        việc
                      </p>
                    )}
                    {achievement.criteria.projectsRequired > 0 && (
                      <p>
                        - Tham gia {achievement.criteria.projectsRequired} dự án
                      </p>
                    )}
                    {achievement.criteria.activitiesRequired > 0 && (
                      <p>
                        - Tham gia {achievement.criteria.activitiesRequired}{" "}
                        hoạt động
                      </p>
                    )}
                    {achievement.criteria.attendanceRequired > 0 && (
                      <p>
                        - Tham dự {achievement.criteria.attendanceRequired} buổi
                        sinh hoạt
                      </p>
                    )}
                    {achievement.criteria.attendanceRate > 0 && (
                      <p>
                        - Tỷ lệ tham dự tối thiểu{" "}
                        {achievement.criteria.attendanceRate}%
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAward(achievement._id)}
                    className="mt-3 w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    disabled={loading}
                  >
                    Trao thành tích
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AchievementManager.propTypes = {
  memberId: PropTypes.string.isRequired,
};

export default AchievementManager;
