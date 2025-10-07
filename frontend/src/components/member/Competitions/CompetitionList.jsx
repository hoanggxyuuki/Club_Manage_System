import React from "react";
import { useCompetition } from "../../../context/CompetitionContext";

const CompetitionList = () => {
  const { competitions, loading, handleJoinCompetition, isParticipant } =
    useCompetition();

  if (loading) {
    return <div>Loading competitions...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {competitions.map((competition) => (
        <div
          key={competition._id}
          className="bg-white rounded-lg shadow-md p-4"
        >
          <h3 className="text-xl font-semibold mb-2">{competition.title}</h3>
          <p className="text-gray-600 mb-4">{competition.description}</p>

          <div className="flex flex-col space-y-2 text-sm text-gray-600">
            <div>Category: {competition.category}</div>
            <div>
              Status: <span className="capitalize">{competition.status}</span>
            </div>
            <div>Participants: {competition.participants.length}</div>
            <div>
              Start: {new Date(competition.startDate).toLocaleDateString()}
            </div>
            <div>End: {new Date(competition.endDate).toLocaleDateString()}</div>
          </div>

          {competition.status === "completed" ? (
            <div className="mt-4">
              <h4 className="font-semibold">Winners:</h4>
              <ul className="list-disc list-inside">
                {competition.winners.map((winner) => (
                  <li key={winner.member._id}>
                    {winner.member.name} - Rank {winner.rank}
                  </li>
                ))}
              </ul>
            </div>
          ) : competition.status === "upcoming" &&
            !isParticipant(competition) ? (
            <button
              onClick={() => handleJoinCompetition(competition._id)}
              className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
            >
              Join Competition
            </button>
          ) : null}

          {isParticipant(competition) && (
            <div className="mt-4 text-green-600 font-semibold">
              You are participating in this competition
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CompetitionList;
