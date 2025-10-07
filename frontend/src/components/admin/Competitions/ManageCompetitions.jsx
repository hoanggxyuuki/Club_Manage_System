import React, { useState } from "react";
import { useCompetition } from "../../../context/CompetitionContext";
import {
  createCompetition,
  updateScore,
  endCompetition,
} from "../../../services/competition";

const ManageCompetitions = () => {
  const { competitions, loading, fetchCompetitions } = useCompetition();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    startDate: "",
    endDate: "",
    rules: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCompetition(formData);
      await fetchCompetitions();
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        category: "",
        startDate: "",
        endDate: "",
        rules: "",
      });
    } catch (error) {
      console.error("Error creating competition:", error);
      alert("Failed to create competition");
    }
  };

  const handleScoreUpdate = async (competitionId, memberId, newScore) => {
    try {
      await updateScore(competitionId, memberId, parseInt(newScore));
      await fetchCompetitions();
    } catch (error) {
      console.error("Error updating score:", error);
      alert("Failed to update score");
    }
  };

  const handleEndCompetition = async (competitionId) => {
    if (window.confirm("Are you sure you want to end this competition?")) {
      try {
        await endCompetition(competitionId);
        await fetchCompetitions();
      } catch (error) {
        console.error("Error ending competition:", error);
        alert("Failed to end competition");
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Competitions</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? "Cancel" : "Create New Competition"}
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
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
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
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Rules
              </label>
              <textarea
                value={formData.rules}
                onChange={(e) =>
                  setFormData({ ...formData, rules: e.target.value })
                }
                className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Create Competition
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {competitions.map((competition) => (
          <div key={competition._id} className="bg-white p-4 rounded shadow">
            <h3 className="text-xl font-semibold mb-2">{competition.title}</h3>
            <div className="text-sm text-gray-600 mb-4">
              Status: <span className="capitalize">{competition.status}</span>
            </div>

            {competition.status === "active" && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Participants</h4>
                <div className="space-y-2">
                  {competition.participants.map((participant) => (
                    <div
                      key={participant.member._id}
                      className="flex items-center space-x-4"
                    >
                      <span>{participant.member.name}</span>
                      <input
                        type="number"
                        value={participant.score}
                        onChange={(e) =>
                          handleScoreUpdate(
                            competition._id,
                            participant.member._id,
                            e.target.value,
                          )
                        }
                        className="w-20 rounded border-gray-300 shadow-sm"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleEndCompetition(competition._id)}
                  className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  End Competition
                </button>
              </div>
            )}

            {competition.status === "completed" && (
              <div>
                <h4 className="font-medium mb-2">Winners</h4>
                <ul className="list-disc list-inside">
                  {competition.winners.map((winner) => (
                    <li key={winner.member._id}>
                      {winner.member.name} - Rank {winner.rank}
                      (Points: {winner.reward.points})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageCompetitions;
