import React from "react";
import { useAchievement } from "../../../context/AchievementContext";
import { useAuth } from "../../../context/AuthContext";

const AchievementList = () => {
  const { achievements, memberAchievements, loading } = useAchievement();
  const { user } = useAuth();

  if (loading) {
    return <div>Loading achievements...</div>;
  }

  
  const earnedAchievements = memberAchievements.reduce((acc, achievement) => {
    acc[achievement._id] = achievement;
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {achievements.map((achievement) => {
        const isEarned = earnedAchievements[achievement._id];

        return (
          <div
            key={achievement._id}
            className={`bg-white rounded-lg shadow-md p-4 ${
              isEarned ? "border-2 border-green-500" : ""
            }`}
          >
            {achievement.badgeImage && (
              <div className="mb-4 flex justify-center">
                <img
                  src={achievement.badgeImage}
                  alt={achievement.name}
                  className="w-24 h-24 object-contain"
                />
              </div>
            )}

            <h3 className="text-xl font-semibold mb-2">{achievement.name}</h3>
            <p className="text-gray-600 mb-4">{achievement.description}</p>

            <div className="text-sm text-gray-600">
              <div className="mb-2">
                <span className="font-semibold">Requirements:</span>
                <p>{achievement.criteria}</p>
              </div>

              {isEarned && (
                <div className="mt-4">
                  <div className="text-green-600 font-semibold">✓ Earned</div>
                  <div className="text-sm text-gray-500">
                    Earned on:{" "}
                    {new Date(
                      isEarned.earnedBy.find(
                        (e) => e.member === user?._id,
                      )?.dateEarned,
                    ).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AchievementList;
