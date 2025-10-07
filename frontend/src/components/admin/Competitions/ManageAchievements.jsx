import React, { useState } from "react";
import { useAchievement } from "../../../context/AchievementContext";
import {
  createAchievement,
  awardAchievement,
  deleteAchievement,
} from "../../../services/achievement";

const ManageAchievements = () => {
  const { achievements, loading, fetchAchievements } = useAchievement();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    criteria: "",
    badgeImage: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAchievement(formData);
      await fetchAchievements();
      setShowForm(false);
      setFormData({
        name: "",
        description: "",
        criteria: "",
        badgeImage: "",
      });
    } catch (error) {
      console.error("Error creating achievement:", error);
      alert("Failed to create achievement");
    }
  };

  const handleAward = async (achievementId, memberId) => {
    try {
      await awardAchievement(achievementId, memberId);
      await fetchAchievements();
    } catch (error) {
      console.error("Error awarding achievement:", error);
      alert("Failed to award achievement");
    }
  };

  const handleDelete = async (achievementId) => {
    if (window.confirm("Are you sure you want to delete this achievement?")) {
      try {
        await deleteAchievement(achievementId);
        await fetchAchievements();
      } catch (error) {
        console.error("Error deleting achievement:", error);
        alert("Failed to delete achievement");
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Achievements</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? "Cancel" : "Create New Achievement"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 bg-white p-4 rounded shadow"
        >
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Criteria
              </label>
              <textarea
                value={formData.criteria}
                onChange={(e) =>
                  setFormData({ ...formData, criteria: e.target.value })
                }
                className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Badge Image URL
              </label>
              <input
                type="url"
                value={formData.badgeImage}
                onChange={(e) =>
                  setFormData({ ...formData, badgeImage: e.target.value })
                }
                className="mt-1 block w-full rounded border-gray-300 shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Create Achievement
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {achievements.map((achievement) => (
          <div key={achievement._id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {achievement.name}
                </h3>
                <p className="text-gray-600 mb-2">{achievement.description}</p>
                <p className="text-sm text-gray-500">
                  Criteria: {achievement.criteria}
                </p>
              </div>
              {achievement.badgeImage && (
                <img
                  src={achievement.badgeImage}
                  alt={achievement.name}
                  className="w-16 h-16 object-contain"
                />
              )}
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">Earned by:</h4>
              <ul className="list-disc list-inside">
                {achievement.earnedBy.map((earned) => (
                  <li key={earned.member}>
                    {earned.member} -{" "}
                    {new Date(earned.dateEarned).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => handleDelete(achievement._id)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageAchievements;
