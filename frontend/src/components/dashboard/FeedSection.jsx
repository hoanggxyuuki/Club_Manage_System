import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useForum } from "../../context/ForumContext";
import { useNavigate } from "react-router-dom";
import CreatePostModal from "../../pages/member/Forum/CreatePostModal";
import PostCard from "../../pages/member/Forum/PostCard";
import {
  UserCircleIcon,
  FaceSmileIcon,
  PhotoIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { AnimatedComponent, AnimatePresence } from "../common/AnimatedComponent";
import LoadingSpinner from "../common/LoadingSpinner";

const FeedSection = () => {
  const {
    posts,
    loading,
    error,
    fetchPosts,
    createPost,
    toggleLike,
    deletePost,
    addComment,
    addPoll,
    votePoll,
    updatePost,
  } = useForum();
  const { userData } = useAuth();
  const [isCreatePostModalOpen, setCreatePostModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const url = import.meta.env.VITE_PROXY_API_URL;
  const navigate = useNavigate();
  const feedRef = useRef(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setPage(1);
        await fetchPosts(1);
        setHasMore(true);
      } else {
        await fetchPosts(page);
      }
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadMorePosts = async () => {
    try {
      const nextPage = page + 1;
      const newPosts = await fetchPosts(nextPage, true);
      if (newPosts && newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Failed to load more posts:", error);
    }
  };

  const handleCreatePost = async (postData) => {
    try {
      await createPost(postData);
      
      if (feedRef.current) {
        feedRef.current.scrollTop = 0;
      }
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deletePost(postId);
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const handleEditPost = async (postId, postData) => {
    try {
      await updatePost(postId, postData);
    } catch (error) {
      console.error("Failed to edit post:", error);
    }
  };

  const handleAddComment = async (postId, content, replyToId = null) => {
    try {
      await addComment(postId, content, replyToId);
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  
  const handlePullToRefresh = () => {
    loadPosts(true);
  };

  const PostSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 animate-pulse">
      <div className="flex items-center space-x-3 mb-4">
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-200"></div>
        <div className="space-y-1 sm:space-y-2 flex-1">
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-2.5 sm:h-3 bg-gray-100 rounded w-1/6"></div>
        </div>
      </div>
      <div className="space-y-1.5 sm:space-y-2 mb-4">
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 sm:h-4 bg-gray-200 rounded"></div>
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="h-32 sm:h-40 bg-gray-100 rounded mb-4"></div>
      <div className="flex space-x-3 pt-3 border-t">
        <div className="h-6 sm:h-8 bg-gray-200 rounded w-16 sm:w-20"></div>
        <div className="h-6 sm:h-8 bg-gray-200 rounded w-16 sm:w-20"></div>
      </div>
    </div>
  );

  if (loading && posts.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-0 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-4 animate-pulse">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-200"></div>
            <div className="h-8 sm:h-10 bg-gray-100 rounded-full flex-grow"></div>
          </div>
        </div>

        {[1, 2, 3].map((i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-0">
        <div className="bg-white rounded-xl shadow-md py-6 sm:py-8 px-4 sm:px-6 text-center">
          <div className="mb-4 flex justify-center">
            <svg
              className="h-10 w-10 sm:h-12 sm:w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            Không thể tải bài viết
          </h3>
          <p className="text-gray-500 mb-5 sm:mb-6 text-sm sm:text-base">
            {error}
          </p>
          <button
            onClick={() => loadPosts(true)}
            className="px-3 py-2 sm:px-4 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition flex items-center justify-center mx-auto"
          >
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-0" ref={feedRef}>
      {/* Create Post Card */}
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-3 sm:p-4 mb-5 sm:mb-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {userData?.avatar ? (
            <img
              src={`${url}${userData?.avatar}`}
              alt={
                userData?.fullName?.charAt(0) || userData?.username?.charAt(0)
              }
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-base sm:text-lg">
              {userData?.fullName?.charAt(0) ||
                userData?.username?.charAt(0) ||
                "U"}
            </div>
          )}

          <button
            onClick={() => setCreatePostModalOpen(true)}
            className="bg-gray-100 hover:bg-gray-200 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 flex-grow text-left text-gray-500 transition-colors duration-200 text-sm sm:text-base"
          >
            Bạn đang nghĩ gì, {userData?.fullName || userData?.username}?
          </button>
        </div>

        <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => setCreatePostModalOpen(true)}
            className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <PhotoIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />

            <span className="text-xs sm:text-sm font-medium">Ảnh/Video</span>
          </button>

          <button
            onClick={() => setCreatePostModalOpen(true)}
            className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <FaceSmileIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />

            <span className="text-xs sm:text-sm font-medium">Cảm xúc</span>
          </button>

          <button
            onClick={() => setCreatePostModalOpen(true)}
            className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <PaperClipIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />

            <span className="text-xs sm:text-sm font-medium">Tài liệu</span>
          </button>
        </div>
      </div>

      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setCreatePostModalOpen(false)}
        onSubmit={handleCreatePost}
      />

      {/* Pull to refresh indicator */}
      {refreshing && (
        <div className="flex justify-center items-center py-2 sm:py-3 mb-3 sm:mb-4">
          <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-xs sm:text-sm text-gray-500">
            Đang tải...
          </span>
        </div>
      )}

      {/* Posts list with animation */}
      <AnimatePresence>
        {posts.map((post, index) => (
          <AnimatedComponent
            key={post._id}
            className="mb-6"
            animation="slideInUp"
            duration={300}
            delay={index * 100}
          >
            <PostCard
              post={post}
              onLike={toggleLike}
              onDelete={handleDeletePost}
              onAddComment={handleAddComment}
              onAddPoll={addPoll}
              onVotePoll={votePoll}
              onEdit={handleEditPost}
            />
          </AnimatedComponent>
        ))}
      </AnimatePresence>

      {/* No posts message */}
      {!loading && posts.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm text-center py-8 sm:py-12 px-4 sm:px-6">
          <div className="mb-3 sm:mb-4">
            <svg
              className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
            Chưa có bài viết nào
          </h3>
          <p className="text-gray-500 mb-5 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
            Hãy là người đầu tiên chia sẻ suy nghĩ, ý tưởng hoặc thông tin với
            mọi người!
          </p>
          <button
            onClick={() => setCreatePostModalOpen(true)}
            className="px-5 py-2 sm:px-6 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base rounded-lg shadow transition"
          >
            Tạo bài viết đầu tiên
          </button>
        </div>
      )}

      {/* Load more button */}
      {/* {!loading && posts.length > 0 && hasMore && (
                 <div className="flex justify-center my-5 sm:my-6">
                   <button 
                     onClick={loadMorePosts}
                     className="px-5 py-2 sm:px-6 sm:py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm transition text-sm sm:text-base font-medium flex items-center"
                   >
                     Tải thêm bài viết
                   </button>
                 </div>
                )} */}

      {/* Loading more indicator */}
      {loading && posts.length > 0 && (
        <div className="flex justify-center items-center py-4 sm:py-6">
          <LoadingSpinner size="md" text="Đang tải thêm..." />
        </div>
      )}

      {/* End of feed indicator */}
      {!loading && posts.length > 0 && !hasMore && (
        <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-gray-500">
          <div className="w-12 sm:w-16 h-1 bg-gray-200 mx-auto mb-3 sm:mb-4 rounded-full"></div>
          Bạn đã xem hết bài viết
        </div>
      )}
    </div>
  );
};

export default FeedSection;
