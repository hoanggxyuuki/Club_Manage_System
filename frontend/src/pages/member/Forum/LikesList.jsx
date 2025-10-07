import React from "react";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { X } from "lucide-react";

const LikesList = ({ isOpen, onClose, likes = [] }) => {
  if (!isOpen) return null;
  const url = import.meta.env.VITE_PROXY_API_URL;

  
  const safeLikes = Array.isArray(likes) ? likes : [];

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
              <div className="w-full text-center sm:text-left">
                <h3
                  className="text-base sm:text-lg font-semibold leading-6 text-gray-900 mb-4 pb-3 border-b"
                  id="modal-title"
                >
                  Người đã thích bài viết
                </h3>
                <div className="mt-2 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {safeLikes.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm sm:text-base text-gray-500">
                        Chưa có lượt thích nào
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {safeLikes.map((like, index) => (
                        <div
                          key={like?._id || index}
                          className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          {like?.user?.avatar ? (
                            <img
                              src={`${url}${like.user.avatar}`}
                              alt={
                                like?.isAnonymous
                                  ? "Anonymous User"
                                  : like?.user?.username
                              }
                              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <UserCircleIcon className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 flex-shrink-0" />
                          )}
                          <div>
                            <p className="text-sm sm:text-base font-medium text-gray-900">
                              {like?.isAnonymous
                                ? "Người dùng ẩn danh"
                                : like?.user?.username || "Người dùng"}
                            </p>
                            {like?.user?.fullName && !like?.isAnonymous && (
                              <p className="text-xs sm:text-sm text-gray-500">
                                {like.user.fullName}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

export default LikesList;
