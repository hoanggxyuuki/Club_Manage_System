import { createContext, useContext, useState, useCallback } from "react";
import { forumService } from "../services/forum";

const ForumContext = createContext(null);

export const useForum = () => {
  const context = useContext(ForumContext);
  if (!context) {
    throw new Error("useForum must be used within a ForumProvider");
  }
  return context;
};

export const ForumProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    hasMore: false,
  });

  const clearError = () => setError(null);

  const getPopulatedPost = useCallback(async (postId) => {
    try {
      return await forumService.getPostById(postId);
    } catch (err) {
      console.error("Error fetching post:", err);
      throw err;
    }
  }, []);

  const fetchPosts = useCallback(async (page = 1, { category, query } = {}) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await (category || query
        ? forumService.searchPosts({ category, query, page })
        : forumService.getAllPosts({ page }));

      setPosts(response.posts);
      setPagination({
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalPosts: response.totalPosts,
        hasMore: response.hasMore,
      });
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = useCallback(
    async (postData) => {
      try {
        clearError();
        const newPost = await forumService.createPost(postData);
        const populatedPost = await getPopulatedPost(newPost._id);
        setPosts((currentPosts) => [populatedPost, ...currentPosts]);
        return populatedPost;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [getPopulatedPost],
  );

  const toggleLike = useCallback(
    async (postId) => {
      try {
        clearError();
        await forumService.toggleLike(postId);
        const updatedPost = await getPopulatedPost(postId);
        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post._id === postId ? updatedPost : post,
          ),
        );
        return updatedPost;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [getPopulatedPost],
  );

  const addComment = useCallback(async (postId, content, replyToId = null) => {
    try {
      clearError();
      let updatedPost;

      if (replyToId) {
        updatedPost = await forumService.addReplyToComment(
          postId,
          replyToId,
          content,
        );
      } else {
        updatedPost = await forumService.addComment(postId, content);
      }

      setPosts((currentPosts) =>
        currentPosts.map((post) => (post._id === postId ? updatedPost : post)),
      );
      return updatedPost;
    } catch (err) {
      console.error("Error in addComment:", err);
      setError(err.message);
      throw err;
    }
  }, []);

  const addPoll = useCallback(
    async (postId, pollData) => {
      try {
        clearError();
        await forumService.addPoll(postId, pollData);
        const updatedPost = await getPopulatedPost(postId);
        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post._id === postId ? updatedPost : post,
          ),
        );
        return updatedPost;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [getPopulatedPost],
  );

  const votePoll = useCallback(
    async (postId, pollId, optionId) => {
      try {
        clearError();
        await forumService.voteOnPoll(postId, pollId, optionId);
        const updatedPost = await getPopulatedPost(postId);
        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post._id === postId ? updatedPost : post,
          ),
        );
        return updatedPost;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [getPopulatedPost],
  );

  const deletePost = useCallback(async (postId) => {
    try {
      clearError();
      await forumService.deletePost(postId);
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post._id !== postId),
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updatePost = useCallback(async (postId, postData) => {
    try {
      clearError();
      const updatedPost = await forumService.updatePost(postId, postData);
      setPosts((currentPosts) =>
        currentPosts.map((post) => (post._id === postId ? updatedPost : post)),
      );
      return updatedPost;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return (
    <ForumContext.Provider
      value={{
        posts,
        loading,
        error,
        pagination,
        fetchPosts,
        createPost,
        toggleLike,
        addComment,
        addPoll,
        votePoll,
        deletePost,
        updatePost,
        clearError,
      }}
    >
      {children}
    </ForumContext.Provider>
  );
};
