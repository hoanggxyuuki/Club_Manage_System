import React from "react";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { X, BarChart2 } from "lucide-react";

const PollVotersList = ({ isOpen, onClose, poll }) => {
  if (!isOpen || !poll) return null;
  const url = import.meta.env.VITE_PROXY_API_URL;

  const calculatePercentage = (votes, totalVotes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const totalVotes = poll.options.reduce(
    (sum, option) => sum + option.votes.length,
    0,
  );

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-end sm:items-center justify-center p-0 sm:p-4 text-center sm:block">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        <span
          className="hidden sm:inline-block sm:h-screen sm:align-middle"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="relative inline-block transform overflow-hidden bg-white text-left align-bottom sm:align-middle rounded-t-xl sm:rounded-xl shadow-xl transition-all w-full sm:max-w-lg">
          <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="px-4 pt-5 pb-4 sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                  <BarChart2 className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />

                  <h3 className="text-base sm:text-lg font-semibold leading-6 text-gray-900">
                    {poll.question}
                  </h3>
                </div>

                <div className="mt-4 space-y-4 sm:space-y-6">
                  {poll.options.map((option) => {
                    const percentage = calculatePercentage(
                      option.votes.length,
                      totalVotes,
                    );

                    return (
                      <div key={option._id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm sm:text-base font-medium text-gray-900">
                              {option.text}
                            </h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {percentage}%
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-500">
                            {option.votes.length} phiếu
                          </span>
                        </div>

                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        {option.votes.length > 0 ? (
                          <div className="space-y-1 mt-2">
                            {option.votes.map((vote) => (
                              <div
                                key={vote._id}
                                className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                {vote.avatar ? (
                                  <img
                                    src={`${url}${vote.avatar}`}
                                    alt={vote.username}
                                    className="h-6 w-6 sm:h-8 sm:w-8 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <UserCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 flex-shrink-0" />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {vote.username}
                                  </p>
                                  {vote.fullName && (
                                    <p className="text-xs text-gray-500">
                                      {vote.fullName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-3 text-center text-sm text-gray-500">
                            Chưa có người bình chọn
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto flex justify-center items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollVotersList;
