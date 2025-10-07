import React, { useState } from "react";
import { CompetitionProvider } from "../../../context/CompetitionContext";
import { AchievementProvider } from "../../../context/AchievementContext";
import ManageCompetitions from "./ManageCompetitions";
import ManageAchievements from "./ManageAchievements";

const AdminCompetitionsPage = () => {
  const [activeTab, setActiveTab] = useState("competitions");

  return (
    <CompetitionProvider>
      <AchievementProvider>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">
              Manage Competitions & Achievements
            </h1>

            {/* Tab Navigation */}
            <div className="flex space-x-4 border-b border-gray-200">
              <button
                className={`py-2 px-4 -mb-px ${
                  activeTab === "competitions"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveTab("competitions")}
              >
                Manage Competitions
              </button>
              <button
                className={`py-2 px-4 -mb-px ${
                  activeTab === "achievements"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveTab("achievements")}
              >
                Manage Achievements
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "competitions" ? (
              <ManageCompetitions />
            ) : (
              <ManageAchievements />
            )}
          </div>
        </div>
      </AchievementProvider>
    </CompetitionProvider>
  );
};

export default AdminCompetitionsPage;
