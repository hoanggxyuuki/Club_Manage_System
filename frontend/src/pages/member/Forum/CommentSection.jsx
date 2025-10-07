import { useState } from "react";
import { Send, Reply, MoreHorizontal, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { UserCircleIcon } from "@heroicons/react/24/outline";

const CommentSection = ({ comments, postId, onComment }) => {
  const { user, userData } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [visibleComments, setVisibleComments] = useState(2);
  const [replyToId, setReplyToId] = useState(null);
  const [replyToUser, setReplyToUser] = useState(null);
  const COMMENTS_PER_PAGE = 5;
  const url = import.meta.env.VITE_PROXY_API_URL;
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onComment(postId, newComment, replyToId);
    setNewComment("");
    setReplyToId(null);
    setReplyToUser(null);
  };

  const handleViewMore = () => {
    setVisibleComments((prev) =>
      Math.min(prev + COMMENTS_PER_PAGE, comments.length),
    );
  };

  const handleReply = (comment) => {
    setReplyToId(comment._id);
    setReplyToUser(comment.author);
    document.getElementById("commentInput").focus();
  };

  const cancelReply = () => {
    setReplyToId(null);
    setReplyToUser(null);
  };

  return (
    <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
      <form onSubmit={handleSubmitComment} className="relative">
        <div className="flex items-start space-x-2 sm:space-x-3">
          {userData?.avatar ? (
            <img
              src={`${url}${userData.avatar}`}
              alt={userData.fullName.charAt(0)}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <UserCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 flex-shrink-0" />
          )}

          <div className="flex-1">
            {replyToUser &&
              (console.log(replyToUser),
              (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="inline-flex items-center space-x-1 bg-blue-50 text-blue-600 text-xs sm:text-sm py-1 px-2 sm:px-3 rounded-full">
                    <span>Đang trả lời {replyToUser.fullName}</span>
                    <button
                      type="button"
                      onClick={cancelReply}
                      className="p-0.5 hover:bg-blue-100 rounded-full transition-colors"
                    >
                      <X size={12} className="sm:w-3 sm:h-3" />
                    </button>
                  </div>
                </div>
              ))}
            <div className="relative">
              <textarea
                id="commentInput"
                rows="2"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  replyToId
                    ? `Trả lời ${replyToUser?.username}...`
                    : "Thêm bình luận..."
                }
                className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-400"
              />

              <button
                type="submit"
                className={`absolute right-2 sm:right-3 top-2 sm:top-2.5 p-1.5 rounded-full transition-colors ${
                  newComment.trim()
                    ? "text-blue-600 hover:bg-blue-50"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                disabled={!newComment.trim()}
              >
                <Send size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        {comments.slice(0, visibleComments).map((comment) => (
          <div key={comment._id} className="group">
            <div className="flex items-start space-x-2 sm:space-x-3">
              {comment.isAnonymous ? (
                <UserCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 flex-shrink-0" />
              ) : comment.author.avatar ? (
                <img
                  src={`${url}${comment.author.avatar}`}
                  alt={comment.author.username.charAt(0)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <UserCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm sm:text-base font-medium text-gray-900">
                      {comment.isAnonymous
                        ? "Người dùng ẩn danh"
                        : comment.author.fullName}
                    </span>
                    {user?.userId === comment.author._id && (
                      <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-1 ml-3 sm:ml-4">
                  <span className="text-xs sm:text-sm text-gray-500">
                    {formatDate(comment.createdAt)}
                  </span>
                  <button
                    onClick={() => handleReply(comment)}
                    className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <Reply size={12} className="sm:w-4 sm:h-4" />

                    <span>Trả lời</span>
                  </button>
                </div>

                {comment.replies?.length > 0 && (
                  <div className="mt-2 sm:mt-3 ml-3 sm:ml-6 space-y-3">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply._id}
                        className="flex items-start space-x-2 sm:space-x-3"
                      >
                        {reply.isAnonymous ? (
                          <UserCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 flex-shrink-0" />
                        ) : reply.author.avatar ? (
                          <img
                            src={`${url}${reply.author.avatar}`}
                            alt={reply.author.username}
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <UserCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-2xl px-3 sm:px-4 py-2">
                            <span className="text-sm font-medium text-gray-900 block mb-1">
                              {reply.isAnonymous
                                ? "Người dùng ẩn danh"
                                : reply.author.fullName}
                            </span>
                            <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words">
                              {reply.content}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4 mt-1 ml-3 sm:ml-4">
                            <span className="text-xs text-gray-500">
                              {formatDate(reply.createdAt)}
                            </span>
                            <button
                              onClick={() => handleReply(comment)}
                              className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                            >
                              <Reply size={10} className="sm:w-3 sm:h-3" />

                              <span>Trả lời</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {comments.length > visibleComments && (
          <button
            onClick={handleViewMore}
            className="w-full py-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Xem thêm {comments.length - visibleComments} bình luận
          </button>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
