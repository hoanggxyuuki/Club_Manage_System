import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PotentialMatches from "../../../components/match/PotentialMatches";
import MatchesList from "../../../components/match/MatchesList";
import { useMatch } from "../../../context/MatchContext";

const MatchPage = () => {
  const [activeTab, setActiveTab] = useState("potential");
  const { error } = useMatch();
  const [showProfileAlert, setShowProfileAlert] = useState(false);

  useEffect(() => {
    if (error?.includes("Vui lòng cập nhật")) {
      setShowProfileAlert(true);
    }
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Tìm kiếm và Kết nối
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("potential")}
            className={`px-4 py-2 rounded-lg ${
              activeTab === "potential"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Gợi ý kết nối
          </button>
          <button
            onClick={() => setActiveTab("matches")}
            className={`px-4 py-2 rounded-lg ${
              activeTab === "matches"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Kết nối của tôi
          </button>
        </div>
      </div>

      {showProfileAlert && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-400 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm text-yellow-700">{error}</p>
              <Link
                to="/member/profile"
                className="text-sm font-medium text-yellow-700 underline hover:text-yellow-600"
              >
                Cập nhật hồ sơ ngay
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        {activeTab === "potential" ? (
          <>
            <div className="mb-6 text-gray-600">
              <p className="mb-2">Gợi ý kết nối dựa trên:</p>
              <ul className="list-disc list-inside text-sm">
                <li>Sở thích chung (35%)</li>
                <li>Vị trí địa lý (25%)</li>
                <li>Độ tuổi tương đồng (20%)</li>
                <li>Giới tính (20%)</li>
              </ul>
              <p className="mt-2 text-sm text-gray-500">
                * Chỉ hiển thị những người có độ phù hợp trên 30%
              </p>
            </div>
            <PotentialMatches />
          </>
        ) : (
          <MatchesList />
        )}
      </div>
    </div>
  );
};

export default MatchPage;
