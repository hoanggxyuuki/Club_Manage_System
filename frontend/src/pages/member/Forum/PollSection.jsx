import { useState } from "react";
import { BarChart2, Info } from "lucide-react";
import PollVotersList from "./PollVotersList";
import { useAuth } from "../../../context/AuthContext";

const PollSection = ({ polls, postId, onVote }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [error, setError] = useState(null);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [showVoters, setShowVoters] = useState(false);
  const { user } = useAuth();

  const handleVote = async (pollId) => {
    if (!selectedOption) return;
    try {
      setError(null);
      await onVote(postId, pollId, selectedOption);
      setSelectedOption(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const calculatePercentage = (votes, totalVotes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const hasVoted = (poll) => {
    const currentUserId = user?.userId;
    return poll.options.some((option) =>
      option.votes.some((vote) => vote._id === currentUserId),
    );
  };

  const findUserVote = (options) => {
    const currentUserId = user?.userId;
    return options.find((option) =>
      option.votes.some((vote) => vote._id === currentUserId),
    );
  };

  const formatTimeLeft = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff <= 0) return "Đã kết thúc";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} ngày còn lại`;
    if (hours > 0) return `${hours} giờ còn lại`;
    return `${minutes} phút còn lại`;
  };

  return (
    <div className="mt-6 space-y-6">
      {polls.map((poll) => {
        const totalVotes = poll.options.reduce(
          (sum, option) => sum + option.votes.length,
          0,
        );
        const isExpired = new Date(poll.expiresAt) < new Date();
        const userHasVoted = hasVoted(poll);
        const userVote = findUserVote(poll.options);

        return (
          <div
            key={poll._id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {poll.question}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-500">
                      {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                    </span>
                    {/* {!isExpired && (
                                 console.log(poll),
                                 <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                                     <Info size={14} />
                                     {formatTimeLeft(poll.expiresAt)}
                                 </span>
                              )} */}
                    {isExpired && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Đã kết thúc
                      </span>
                    )}
                  </div>
                </div>
                <BarChart2 className="text-gray-400" size={20} />
              </div>

              <div className="space-y-3">
                {poll.options.map((option) => {
                  const percentage = calculatePercentage(
                    option.votes.length,
                    totalVotes,
                  );
                  const isSelected = selectedOption === option._id;
                  const isUserVote = userVote?._id === option._id;

                  return (
                    <div key={option._id} className="relative">
                      {userHasVoted || isExpired ? (
                        <button
                          onClick={() => {
                            setSelectedPoll(poll);
                            setShowVoters(true);
                          }}
                          className="w-full"
                        >
                          <div className="relative z-10 flex items-center justify-between mb-1 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {option.text}
                              </span>
                              {isUserVote && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Đã chọn
                                </span>
                              )}
                            </div>
                            <span className="font-medium text-gray-900">
                              {percentage}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 transition-all duration-500 ease-out"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="mt-1 text-right">
                            <span className="text-sm text-gray-500">
                              {option.votes.length} phiếu
                            </span>
                          </div>
                        </button>
                      ) : (
                        <div className="relative">
                          <input
                            type="radio"
                            name={`poll-${poll._id}`}
                            value={option._id}
                            checked={isSelected}
                            onChange={() => setSelectedOption(option._id)}
                            className="peer absolute opacity-0 w-full h-full cursor-pointer"
                          />

                          <div className="p-3 rounded-lg border-2 border-gray-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-colors">
                            <label className="font-medium text-gray-900 cursor-pointer">
                              {option.text}
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!userHasVoted && !isExpired && (
                <div className="mt-4">
                  <button
                    onClick={() => handleVote(poll._id)}
                    disabled={!selectedOption}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Bình chọn
                  </button>
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <PollVotersList
        isOpen={showVoters}
        onClose={() => {
          setShowVoters(false);
          setSelectedPoll(null);
        }}
        poll={selectedPoll}
      />
    </div>
  );
};

export default PollSection;
