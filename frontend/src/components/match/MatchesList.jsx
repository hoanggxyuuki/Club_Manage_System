import React, { useEffect } from "react";
import { useMatch } from "../../context/MatchContext";
import { Link } from "react-router-dom";

const MatchesList = () => {
  const { matches, loading, error, loadMatches, respondToMatch } = useMatch();

  useEffect(() => {
    loadMatches();
  }, []);

  const handleResponse = async (matchId, accepted) => {
    try {
      await respondToMatch(matchId, accepted);
      loadMatches();
    } catch (error) {
      console.error("Lỗi khi phản hồi lời mời kết nối:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 p-4">{error}</div>;
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center text-gray-600 p-4">
        Bạn chưa có kết nối nào. Hãy tìm kiếm người phù hợp trong tab "Gợi ý kết
        nối"!
      </div>
    );
  }

  const renderMatchStatus = (match) => {
    if (match.status === "matched") {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-green-600">Đã kết nối</span>
          <Link
            to={`/member/chat?userId=${match.otherUser?._id}`}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200"
          >
            Nhắn tin
          </Link>
        </div>
      );
    }

    if (match.status === "rejected") {
      return <span className="text-red-600">Đã từ chối</span>;
    }

    
    if (match.showMatchButtons) {
      return (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleResponse(match?._id, true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-200"
          >
            Chấp nhận
          </button>
          <button
            onClick={() => handleResponse(match?._id, false)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200"
          >
            Từ chối
          </button>
        </div>
      );
    }

    return <span className="text-yellow-600">Đang chờ phản hồi</span>;
  };
  const url = import.meta.env.VITE_PROXY_API_URL;
  return (
    <div className="space-y-6">
      {matches.map((match) => (
        <div
          key={match?._id}
          className={`flex items-center justify-between p-4 rounded-lg border ${
            match.status === "matched"
              ? "border-green-200 bg-green-50"
              : match.status === "rejected"
                ? "border-red-200 bg-red-50"
                : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              {match.otherUser?.avatar ? (
                <img
                  src={`${url}${match.otherUser?.avatar}`}
                  alt={match.otherUser?.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl text-gray-400">
                    {match.otherUser?.fullName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">{match.otherUser?.fullName}</h3>
              <div className="text-sm text-gray-600">
                {match.otherUser?.city && match.otherUser?.province && (
                  <p>
                    {match.otherUser?.city}, {match.otherUser?.province}
                  </p>
                )}
                {match.otherUser?.interests && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {match.otherUser?.interests
                      .slice(0, 2)
                      .map((interest, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-0.5 text-xs bg-gray-100 rounded"
                        >
                          {interest}
                        </span>
                      ))}
                    {match.otherUser?.interests.length > 2 && (
                      <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 rounded">
                        +{match.otherUser?.interests.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {renderMatchStatus(match)}
            <div className="text-sm text-gray-500">
              {match.matchScore}% phù hợp
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchesList;
