import { useState, useEffect, useCallback } from "react";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import {
  Search,
  ThumbsUp,
  MessageSquare,
  PieChart,
  Trash,
  X,
  Edit2,
  Share2,
} from "lucide-react";
import ReactPaginate from "react-paginate";
import { useAuth } from "../../../context/AuthContext";
import { useForum } from "../../../context/ForumContext";
import forumService from "../../../services/forum";
const ForumPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");

  
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    fetchPosts(1, {
      query: searchQuery.trim(),
      category: selectedCategory !== "general" ? selectedCategory : null,
    });
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    fetchPosts(1, {
      category: selectedCategory !== "general" ? selectedCategory : null,
    });
    setShowSuggestions(false);
  };

  const { user } = useAuth();
  const {
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
  } = useForum();

  const categories = [
    { value: "general", label: "Chung" },
    { value: "qa", label: "Hỏi đáp" },
    { value: "event", label: "Sự kiện" },
    { value: "project", label: "Dự án" },
    { value: "resource", label: "Tài nguyên" },
    { value: "technical", label: "Kĩ thuật" },
  ];

  const handlePageClick = (data) => {
    const page = data.selected + 1;
    fetchPosts(page, {
      category: selectedCategory !== "general" ? selectedCategory : null,
      query: searchQuery || null,
    });
  };

  const handleSearch = useCallback(() => {
    const category = selectedCategory !== "general" ? selectedCategory : null;
    const query = searchQuery || null;

    if (category || query) {
      fetchPosts(1, { category, query });
    } else {
      fetchPosts(1);
    }
  }, [fetchPosts, selectedCategory, searchQuery]);

  
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (!value.trim()) {
      setSearchSuggestions([]);
      return;
    }
    setShowSuggestions(true);
  }, []);

  
  
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await forumService.getSearchSuggestions(searchQuery);
        setSearchSuggestions(data.suggestions || []);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSearchSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.title);
    setShowSuggestions(false);
    fetchPosts(1, {
      query: suggestion.title,
      category: selectedCategory !== "general" ? selectedCategory : null,
    });
  };

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const handleCreatePost = async (postData) => {
    try {
      await createPost(postData);
      setIsCreateModalOpen(false);
      
      fetchPosts(1, {
        category: selectedCategory !== "general" ? selectedCategory : null,
        query: searchQuery || null,
      });
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  const handleLike = async (postId) => {
    try {
      
      await toggleLike(postId);
      
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await deletePost(postId);
      
      fetchPosts(pagination.currentPage, {
        category: selectedCategory !== "general" ? selectedCategory : null,
        query: searchQuery || null,
      });
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const handleEdit = async (postId, postData) => {
    try {
      await updatePost(postId, postData);
      
      fetchPosts(pagination.currentPage, {
        category: selectedCategory !== "general" ? selectedCategory : null,
        query: searchQuery || null,
      });
    } catch (err) {
      console.error("Error updating post:", err);
    }
  };

  const handleAddComment = async (postId, content, replyToId = null) => {
    try {
      
      await addComment(postId, content, replyToId);
      
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleAddPoll = async (postId, pollData) => {
    try {
      await addPoll(postId, pollData);
      
      fetchPosts(pagination.currentPage, {
        category: selectedCategory !== "general" ? selectedCategory : null,
        query: searchQuery || null,
      });
    } catch (err) {
      console.error("Error adding poll:", err);
    }
  };

  const handleVotePoll = async (postId, pollId, optionId) => {
    try {
      await votePoll(postId, pollId, optionId);
      
      fetchPosts(pagination.currentPage, {
        category: selectedCategory !== "general" ? selectedCategory : null,
        query: searchQuery || null,
      });
    } catch (err) {
      console.error("Error voting on poll:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Diễn đàn</h1>
              <p className="mt-1 text-sm text-gray-500">
                Tham gia thảo luận, tương tác bài viết, bình chọn
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Tạo bài viết mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <div className="relative">
                <form onSubmit={handleSearchSubmit} className="relative flex">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      placeholder="Tìm kiếm bài viết..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearchSubmit(e);
                        }
                      }}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />

                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />

                    {searchQuery && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Search className="h-5 w-5" />
                    <span>Tìm kiếm</span>
                  </button>
                </form>

                {showSuggestions && searchQuery && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 divide-y divide-gray-100 max-h-80 overflow-auto">
                    {searchSuggestions.length > 0 ? (
                      searchSuggestions.map((suggestion, index) => (
                        <div
                          key={
                            suggestion.type === "post"
                              ? suggestion.id
                              : `tag-${index}`
                          }
                          className="p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              {suggestion.type === "post" ? (
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Search className="h-4 w-4 text-blue-600" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                  <span className="text-green-600 font-semibold">
                                    #
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                {suggestion.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {suggestion.type === "tag" ? "Tag" : "Bài viết"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-sm text-gray-500">
                          Không tìm thấy kết quả phù hợp
                        </p>
                        <button
                          onClick={handleSearchSubmit}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          Tìm kiếm "{searchQuery}"
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-1">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  fetchPosts(1, {
                    category:
                      e.target.value !== "general" ? e.target.value : null,
                    query: searchQuery || null,
                  });
                }}
                className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  fetchPosts(1, {
                    category: cat.value !== "general" ? cat.value : null,
                    query: searchQuery || null,
                  });
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedCategory === cat.value
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          </div>
        ) : (
          <>
            {posts?.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500 text-lg mb-4">
                  {searchQuery || selectedCategory !== "general"
                    ? "Không tìm thấy bài viết phù hợp"
                    : "Không có bài viết nào"}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("general");
                    setIsCreateModalOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Tạo bài viết mới
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {posts?.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      currentUser={user}
                      onLike={handleLike}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      onAddComment={handleAddComment}
                      onAddPoll={handleAddPoll}
                      onVotePoll={handleVotePoll}
                    />
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <ReactPaginate
                      previousLabel="Trước"
                      nextLabel="Sau"
                      breakLabel="..."
                      pageCount={pagination.totalPages}
                      marginPagesDisplayed={2}
                      pageRangeDisplayed={5}
                      onPageChange={handlePageClick}
                      containerClassName="flex items-center gap-2"
                      pageClassName="px-3 py-1 border rounded-md hover:bg-gray-50"
                      activeClassName="bg-blue-50 text-blue-600 border-blue-500"
                      previousClassName="px-4 py-1 border rounded-md hover:bg-gray-50"
                      nextClassName="px-4 py-1 border rounded-md hover:bg-gray-50"
                      disabledClassName="opacity-50 cursor-not-allowed"
                      breakClassName="px-3 py-1"
                      forcePage={pagination.currentPage - 1}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
      />
    </div>
  );
};

export default ForumPage;
