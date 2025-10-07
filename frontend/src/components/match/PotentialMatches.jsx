import React, { useEffect } from "react";
import { useMatch } from "../../context/MatchContext";

const PotentialMatches = () => {
  const {
    potentialMatches,
    loading,
    error,
    loadPotentialMatches,
    createMatch,
  } = useMatch();

  useEffect(() => {
    loadPotentialMatches();
  }, []);

  const handleMatch = async (userId) => {
    try {
      await createMatch(userId);
    } catch (error) {
      console.error("Lỗi khi tạo kết nối:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !error.includes("Vui lòng cập nhật")) {
    return <div className="text-center text-red-600 p-4">{error}</div>;
  }

  if (!potentialMatches || potentialMatches.length === 0) {
    return (
      <div className="text-center text-gray-600 p-4">
        Không tìm thấy kết nối phù hợp. Hãy thử lại sau!
      </div>
    );
  }
  const url = import.meta.env.VITE_PROXY_API_URL;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {potentialMatches.map(({ user, score }) => (
        <div
          key={user._id}
          className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
        >
          <div className="relative pb-48">
            {user?.avatar ? (
              <img
                src={`${url}${user?.avatar}`}
                alt={user?.fullName}
                className="absolute h-full w-full object-cover"
              />
            ) : (
              <div className="absolute h-full w-full bg-gray-200 flex items-center justify-center">
                <span className="text-4xl text-gray-400">
                  {user?.fullName.charAt(0)}
                </span>
              </div>
            )}
            <div className="absolute top-0 right-0 m-2 px-2 py-1 bg-indigo-600 text-white text-sm rounded">
              {score}% phù hợp
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg mb-2">{user?.fullName}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Tuổi:</span>{" "}
                {user.dateOfBirth
                  ? new Date().getFullYear() -
                    new Date(user.dateOfBirth).getFullYear()
                  : "Không có thông tin"}
              </p>
              <p>
                <span className="font-medium">Vị trí:</span>{" "}
                {user?.city ? `${user?.city}` : "Không có thông tin"}
              </p>
              {user.interests && user.interests.length > 0 && (
                <div>
                  <span className="font-medium">Sở thích:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.interests.slice(0, 3).map((interest, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs bg-gray-100 rounded"
                      >
                        {interest}
                      </span>
                    ))}
                    {user.interests.length > 3 && (
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 rounded">
                        +{user.interests.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => handleMatch(user._id)}
              className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
            >
              Kết nối ngay
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PotentialMatches;
