import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForum } from "../../../context/ForumContext";
import { useAuth } from "../../../context/AuthContext";
import PostCard from "./PostCard";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import forumService from "../../../services/forum";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { AnimatedComponent, AnimatePresence } from "../../../components/common/AnimatedComponent";

const SinglePostView = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { toggleLike, addComment, addPoll, votePoll, deletePost, updatePost } =
    useForum();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        
        const data = await forumService.getPostById(postId);

        
        const formattedPost = {
          ...data,
          likes: data.likes || [],
        };

        
        if (data.author) {
          
          if (data.author.name && !data.author.fullName) {
            formattedPost.author = {
              ...data.author,
              fullName: data.author.name,
            };
          }

          
          if (data.author.displayName && !data.author.fullName) {
            formattedPost.author = {
              ...data.author,
              fullName: data.author.displayName,
            };
          }

          
          if (data.author.username && !data.author.fullName) {
            formattedPost.author = {
              ...data.author,
              fullName: data.author.username,
            };
          }
        }

        setPost(formattedPost);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError(err.message || "Lỗi khi tải bài viết");
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const handleLike = async (postId) => {
    try {
      await toggleLike(postId);
      
      const updatedPost = await forumService.getPostById(postId);
      setPost(updatedPost);
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await deletePost(postId);
      
      navigate("/member/forum");
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const handleEdit = async (postId, postData) => {
    try {
      await updatePost(postId, postData);
      
      const updatedPost = await forumService.getPostById(postId);
      setPost(updatedPost);
    } catch (err) {
      console.error("Error updating post:", err);
    }
  };

  const handleAddComment = async (postId, content, replyToId = null) => {
    try {
      
      const newComment = await addComment(postId, content, replyToId);

      
      if (post) {
        
        const updatedPost = { ...post };

        
        
        if (updatedPost.comments) {
          
          if (replyToId) {
            updatedPost.comments = updatedPost.comments.map((comment) => {
              if (comment._id === replyToId) {
                
                const updatedComment = { ...comment };
                if (!updatedComment.replies) {
                  updatedComment.replies = [];
                }
                updatedComment.replies.push(newComment);
                return updatedComment;
              }
              return comment;
            });
          } else {
            
            updatedPost.comments = [...updatedPost.comments, newComment];
          }
        } else {
          updatedPost.comments = [newComment];
        }

        
        setPost(updatedPost);
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleAddPoll = async (postId, pollData) => {
    try {
      await addPoll(postId, pollData);
      
      const updatedPost = await forumService.getPostById(postId);
      setPost(updatedPost);
    } catch (err) {
      console.error("Error adding poll:", err);
    }
  };

  const handleVotePoll = async (postId, pollId, optionId) => {
    try {
      await votePoll(postId, pollId, optionId);
      
      const updatedPost = await forumService.getPostById(postId);
      setPost(updatedPost);
    } catch (err) {
      console.error("Error voting on poll:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Đang tải bài viết..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate("/member/forum")}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span>Quay lại diễn đàn</span>
          </button>
        </div>

        {error ? (
          <AnimatedComponent
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
            animation="slideInUp"
            duration={300}
          >
            <p>{error}</p>
            <button
              onClick={() => navigate("/member/forum")}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
            >
              Trở về trang chính
            </button>
          </AnimatedComponent>
        ) : post ? (
          <>
            <AnimatedComponent
              className="text-2xl font-bold mb-6"
              animation="slideInDown"
              duration={300}
            >
              Chi tiết bài viết
            </AnimatedComponent>

            <PostCard
              post={post}
              currentUser={user}
              onLike={handleLike}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onAddComment={handleAddComment}
              onAddPoll={handleAddPoll}
              onVotePoll={handleVotePoll}
            />
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500 text-lg mb-4">
              Không tìm thấy bài viết
            </p>
            <button
              onClick={() => navigate("/member/forum")}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Trở về diễn đàn
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SinglePostView;
