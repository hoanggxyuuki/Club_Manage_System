import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-xl p-8 text-center">
        <h2 className="mb-8 font-bold text-9xl text-blue-600">
          <span className="sr-only">Error</span>
          404
        </h2>
        <p className="text-4xl font-semibold text-gray-700 mb-4">
          Trang không tồn tại
        </p>
        <p className="text-gray-600 mb-8">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
          >
            Về trang chủ
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
