import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CommentSection from "./CommentSection";
import MultiUrlPreview from "../../../components/common/MultiUrlPreview";
import PollSection from "./PollSection";
import LikesList from "./LikesList";
import forumService from "../../../services/forum";

import {
  ThumbsUp,
  MessageSquare,
  PieChart,
  Trash,
  X,
  Edit2,
  Share2,
  ExternalLink,
  Heart,
  Bookmark,
  MoreHorizontal,
  AlertTriangle,
  Globe,
  Loader,
  Check,
} from "lucide-react";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../../context/AuthContext";
import { AnimatedComponent } from "../../../components/common/AnimatedComponent";
import { Tooltip } from "react-tooltip";
import TimeAgo from "react-timeago";
import vietnameseStrings from "react-timeago/lib/language-strings/vi";
import buildFormatter from "react-timeago/lib/formatters/buildFormatter";
import axios from "axios";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

const formatter = buildFormatter(vietnameseStrings);

const PostCard = ({
  post,
  onLike,
  onDelete,
  onAddComment,
  onAddPoll,
  onVotePoll,
  onEdit,
  onLoadMore,
  hasMore,
  loading,
}) => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const currentUser = user;
  const [showComments, setShowComments] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const [showLikesList, setShowLikesList] = useState(false);
  const [pollData, setPollData] = useState({ question: "", options: [] });
  const [expandedMedia, setExpandedMedia] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: post?.title || "",
    description: post?.description || "",
    category: post?.category || "general",
  });
  const [showDropdown, setShowDropdown] = useState(false);

  const [isLiked, setIsLiked] = useState(
    post?.likes?.some((like) => like?.user?._id === currentUser?.userId) ||
      false,
  );
  const [likesCount, setLikesCount] = useState(post?.likes?.length || 0);
  const [isAnimatingLike, setIsAnimatingLike] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const urlPreviewRef = useRef(null);
  const dropdownRef = useRef(null);
  const postRef = useRef(null);

  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState("");
  const [translatedDescription, setTranslatedDescription] = useState("");
  const [isTranslated, setIsTranslated] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [translateTarget, setTranslateTarget] = useState("vi");

  const url = import.meta.env.VITE_PROXY_API_URL;
  const isAuthor = currentUser?.userId === post?.author?._id;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (expandedMedia && !event.target.closest(".media-content")) {
        setExpandedMedia(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef, expandedMedia]);

  const handleLike = useCallback(() => {
    setIsAnimatingLike(true);

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount((prevCount) => (newIsLiked ? prevCount + 1 : prevCount - 1));

    onLike(post._id);

    setTimeout(() => {
      setIsAnimatingLike(false);
    }, 500);
  }, [isLiked, post._id, onLike]);

  const handleLikesClick = (e) => {
    e.preventDefault();
    if (post?.likes?.length > 0) {
      setShowLikesList(true);
    }
  };

  const handleMediaClick = (media) => {
    setExpandedMedia(media);
  };

  const getMediaUrl = (filename) => {
    if (!filename) return "";
    return `${url}uploads/forum/${filename}`;
  };

  const handleTranslate = async () => {
    if (isTranslated) {
      setIsTranslated(false);
      setTranslatedTitle("");
      setTranslatedDescription("");
      return;
    }

    setIsTranslating(true);

    try {
      if (post.description) {
        const descriptionResponse = await forumService.translateText(
          post.description,
          translateTarget,
        );

        if (descriptionResponse.translatedText) {
          setTranslatedDescription(descriptionResponse.translatedText);

          
          if (!detectedLanguage && descriptionResponse.from) {
            
            if (
              typeof descriptionResponse.from === "object" &&
              descriptionResponse.from.language
            ) {
              setDetectedLanguage(
                descriptionResponse.from.language.iso ||
                  descriptionResponse.from.language,
              );
            } else {
              setDetectedLanguage(descriptionResponse.from);
            }
          }
        } else if (
          descriptionResponse.data &&
          descriptionResponse.data.translatedText
        ) {
          setTranslatedDescription(descriptionResponse.data.translatedText);

          
          if (!detectedLanguage && descriptionResponse.data.from) {
            
            if (
              typeof descriptionResponse.data.from === "object" &&
              descriptionResponse.data.from.language
            ) {
              setDetectedLanguage(
                descriptionResponse.data.from.language.iso ||
                  descriptionResponse.data.from.language,
              );
            } else {
              setDetectedLanguage(descriptionResponse.data.from);
            }
          }
        } else {
          
          console.error(
            "Unexpected translation response format:",
            descriptionResponse,
          );
          throw new Error("Unexpected translation response format");
        }
      }

      setIsTranslated(true);
    } catch (error) {
      console.error("Translation error:", error);
      
      alert("Không thể dịch bài viết. Vui lòng thử lại sau.");
    } finally {
      setIsTranslating(false);
      setShowDropdown(false);
    }
  };

  
  const scrollToUrlPreview = () => {
    if (urlPreviewRef.current) {
      urlPreviewRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      
      urlPreviewRef.current.classList.add("ring-4", "ring-blue-300");
      setTimeout(() => {
        urlPreviewRef.current.classList.remove("ring-4", "ring-blue-300");
      }, 2000);
    }
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/member/forum/${post._id}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(postUrl)
        .then(() => {
          alert("Đã sao chép liên kết");
          setShowDropdown(false);
        })
        .catch((err) => {
          console.error("Could not copy text: ", err);
          fallbackCopyText(postUrl);
        });
    } else {
      fallbackCopyText(postUrl);
    }
  };

  const fallbackCopyText = (text) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;

      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      
      if (successful) {
        alert("Đã sao chép liên kết");
      } else {
        alert("Không thể sao chép liên kết. Vui lòng thử lại.");
      }
      setShowDropdown(false);
    } catch (err) {
      console.error("Fallback copy failed: ", err);
      alert("Không thể sao chép liên kết. Vui lòng sao chép thủ công.");
      setShowDropdown(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(post._id);
    setShowDeleteConfirm(false);
  };

  const getCategoryLabel = (category) => {
    const categories = {
      general: "Thảo luận chung",
      qa: "Hỏi đáp",
      event: "Sự kiện",
      project: "Dự án",
      resource: "Tài nguyên",
      technical: "Kỹ thuật",
    };
    return categories[category] || category;
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: "bg-blue-100 text-blue-800",
      qa: "bg-purple-100 text-purple-800",
      event: "bg-green-100 text-green-800",
      project: "bg-yellow-100 text-yellow-800",
      resource: "bg-indigo-100 text-indigo-800",
      technical: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-blue-100 text-blue-800";
  };

  
  const navigateToSinglePost = (e) => {
    
    if (
      e.target.closest("button") ||
      e.target.closest("a") ||
      isEditing ||
      e.target.closest(".post-actions")
    ) {
      return;
    }
    navigate(`/member/forum/${post._id}`);
  };

  
  const formattedDescription = useMemo(() => {
    
    const descriptionText =
      isTranslated && translatedDescription
        ? translatedDescription
        : post.description;

    if (!descriptionText) return "";

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    
    const parts = descriptionText.split(urlRegex);

    return parts.map((part, index) => {
      
      if (part.match(urlRegex)) {
        return (
          <button
            key={index}
            onClick={scrollToUrlPreview}
            className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 group font-medium transition-all px-1 py-0.5 rounded hover:bg-blue-50"
          >
            <span>{part}</span>
            <ExternalLink
              size={14}
              className="opacity-50 group-hover:opacity-100"
            />
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  }, [post.description, isTranslated, translatedDescription]);

  return (
    <AnimatedComponent
      ref={postRef}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
      animation="fadeIn"
      duration={300}
    >
      <div className="p-4 sm:p-6">
        {isEditing ? (
          <div className="space-y-4">
            <select
              value={editFormData.category}
              onChange={(e) =>
                setEditFormData({ ...editFormData, category: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="general">General - Thảo luận chung</option>
              <option value="qa">Q&A - Hỏi đáp</option>
              <option value="event">Event - Sự kiện</option>
              <option value="project">Project - Dự án</option>
              <option value="resource">Resource - Tài nguyên</option>
              <option value="technical">Technical - Kỹ thuật</option>
            </select>
            <textarea
              value={editFormData.description}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  description: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="16"
              placeholder="Nội dung"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onEdit(post._id, editFormData);
                  setIsEditing(false);
                }}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Lưu
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                {post.isAnonymous ? (
                  <UserCircleIcon className="h-10 w-10 text-gray-400 flex-shrink-0" />
                ) : post.author?.avatar ? (
                  <img
                    src={`${url}${post.author.avatar}`}
                    alt={post.author.username}
                    className="h-10 w-10 rounded-full object-cover flex-shrink-0 ring-2 ring-white"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                    {post.author?.fullName?.charAt(0) ||
                      post.author?.username?.charAt(0) ||
                      "U"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col">
                    <div className="flex items-center flex-wrap">
                      {post.isAnonymous ? (
                        <span className="font-semibold text-[15px] text-gray-700 mr-2">
                          Người dùng ẩn danh
                        </span>
                      ) : (
                        <span className="font-semibold text-[15px] text-[#050505] hover:underline cursor-pointer mr-2">
                          {post.author?.fullName ||
                            post.author?.username ||
                            "Người dùng"}
                        </span>
                      )}
                      <div className="flex items-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(post.category)} font-medium`}
                        >
                          {getCategoryLabel(post.category)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center text-[13px] text-[#65676B] mt-0.5">
                      <TimeAgo
                        date={post.createdAt}
                        formatter={formatter}
                        className="text-gray-500"
                      />

                      <span className="mx-1">•</span>
                      <span
                        className={`${post.isAnonymous ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-600"} px-1 rounded-sm flex items-center`}
                      >
                        {post.isAnonymous ? (
                          <UserCircleIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <span className="relative flex h-3 w-3 items-center justify-center rounded-full bg-blue-600 text-white overflow-hidden mr-1">
                            <span className="text-[8px]">
                              {(post.author?.fullName || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </span>
                        )}
                        {post.isAnonymous ? "Ẩn danh" : "Công khai"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Tùy chọn"
                >
                  <MoreHorizontal
                    size={16}
                    className="sm:w-[18px] sm:h-[18px]"
                  />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-10 border border-gray-100">
                    {isAuthor && (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowDropdown(false);
                          }}
                          className="w-full flex items-center px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50"
                        >
                          <Edit2 size={14} className="mr-2" />
                          Chỉnh sửa bài viết
                        </button>
                        <button
                          onClick={handleDelete}
                          className="w-full flex items-center px-4 py-2.5 text-sm text-left text-red-600 hover:bg-red-50"
                        >
                          <Trash size={14} className="mr-2" />
                          Xóa bài viết
                        </button>
                        <hr className="border-gray-100" />
                      </>
                    )}
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50"
                    >
                      <Share2 size={14} className="mr-2" />
                      Sao chép liên kết
                    </button>
                    <button
                      onClick={() => {
                        handleTranslate();
                        setShowDropdown(false);
                      }}
                      disabled={isTranslating}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Globe size={14} className="mr-2" />
                      {isTranslating && (
                        <Loader size={12} className="mr-2 animate-spin" />
                      )}
                      {isTranslated ? "Hiển thị bản gốc" : "Dịch bài viết"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Post title if available */}
            {(post.title || (isTranslated && translatedTitle)) &&
              post.title !== post.description?.substring(0, 100) && (
                <h3
                  onClick={navigateToSinglePost}
                  className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-700 hover:underline transition-colors"
                >
                  {isTranslated && translatedTitle
                    ? translatedTitle
                    : post.title}

                  {/* Show translation badge if content is translated */}
                  {isTranslated && (
                    <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      <Globe size={12} className="mr-1" />
                      Translated from {detectedLanguage || "another language"}
                    </span>
                  )}
                </h3>
              )}

            <div
              onClick={navigateToSinglePost}
              className="prose prose-sm sm:prose-base max-w-none text-gray-700 mb-4 whitespace-pre-wrap break-words cursor-pointer"
            >
              {formattedDescription}
            </div>

            {/* URL Preview section */}
            <div
              className="mb-4 transition-all duration-300"
              ref={urlPreviewRef}
            >
              <MultiUrlPreview content={post.description} />
            </div>

            {/* Media attachments grid */}
            {post.attachments && post.attachments.length > 0 && (
              <div
                className={`grid ${post.attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-2 sm:gap-3 mb-4`}
              >
                {post.attachments.map((media, index) => (
                  <div
                    key={index}
                    className="relative overflow-hidden rounded-lg group cursor-pointer"
                    onClick={() => handleMediaClick(media)}
                  >
                    {media.type === "image" ? (
                      <img
                        src={getMediaUrl(media.url)}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-auto sm:max-h-80 object-cover transform transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={getMediaUrl(media.url)}
                        className="w-full h-auto object-cover"
                        controls
                        preload="metadata"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-white text-xs">Nhấn để xem</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Expanded media modal */}
            {expandedMedia && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div className="relative max-w-4xl w-full max-h-[90vh] overflow-auto media-content">
                  <button
                    onClick={() => setExpandedMedia(null)}
                    className="absolute top-2 right-2 p-2 text-white hover:text-gray-300 bg-black/50 rounded-full z-10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                  {expandedMedia.type === "image" ? (
                    <img
                      src={getMediaUrl(expandedMedia.url)}
                      alt="Expanded media"
                      className="max-w-full max-h-[90vh] object-contain mx-auto"
                    />
                  ) : (
                    <video
                      src={getMediaUrl(expandedMedia.url)}
                      className="max-w-full max-h-[90vh] mx-auto"
                      controls
                      autoPlay
                    />
                  )}
                </div>
              </div>
            )}

            {/* Polls section */}
            {post.polls?.length > 0 && (
              <div className="mb-5">
                <PollSection
                  polls={post.polls}
                  postId={post._id}
                  onVote={onVotePoll}
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-6 mt-4 pt-4 border-t border-gray-100 post-actions">
              <AnimatedComponent
                onClick={handleLike}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isLiked
                    ? "text-red-500 bg-red-50 hover:bg-red-100"
                    : "text-gray-500 hover:text-red-500 hover:bg-red-50"
                } ${isAnimatingLike ? "animate-pulse" : ""}`}
                animation={isAnimatingLike ? "bounceIn" : "fadeIn"}
                duration={isAnimatingLike ? 500 : 200}
              >
                {isLiked ? (
                  <>
                    <Heart
                      size={17}
                      className={`${isAnimatingLike ? "animate-heartbeat" : ""}`}
                      fill="#f43f5e"
                    />

                    <span className="text-sm font-medium">
                      {likesCount || 0}
                    </span>
                  </>
                ) : (
                  <>
                    <ThumbsUp size={17} />
                    <span className="text-sm font-medium">
                      {likesCount || 0}
                    </span>
                  </>
                )}
              </AnimatedComponent>

              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <MessageSquare size={17} />
                <span className="text-sm font-medium">
                  {post.comments?.length || 0}
                </span>
              </button>

              {/* Translation Button */}
              <AnimatedComponent
                onClick={handleTranslate}
                disabled={isTranslating}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors duration-200"
                animation="fadeIn"
                duration={200}
              >
                {isTranslating ? (
                  <>
                    <Loader size={17} className="animate-spin" />

                    <span className="text-sm font-medium">Đang dịch...</span>
                  </>
                ) : isTranslated ? (
                  <>
                    <Check size={17} />
                    <span className="text-sm font-medium">Đã dịch</span>
                  </>
                ) : (
                  <>
                    <Globe size={17} />
                    <span className="text-sm font-medium">Dịch</span>
                  </>
                )}
              </AnimatedComponent>

              {isAuthor && (
                <button
                  onClick={() => setShowPollForm(!showPollForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors ml-auto"
                >
                  <PieChart size={17} />
                  <span className="text-sm font-medium">Thêm bình chọn</span>
                </button>
              )}
            </div>

            {/* Likes summary line */}
            {post?.likes?.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={handleLikesClick}
                  className="text-xs sm:text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  <div className="flex -space-x-1 mr-1">
                    {post?.likes?.slice(0, 3).map((like, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-full ring-1 ring-white overflow-hidden"
                      >
                        {like?.user?.avatar ? (
                          <img
                            src={`${url}${like.user.avatar}`}
                            alt={like.user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-[8px] text-gray-500">
                              {like?.user?.username?.charAt(0).toUpperCase() ||
                                "?"}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  Đã thích bởi{" "}
                  <span className="font-medium">
                    {post?.likes?.[0]?.user?.username || "Người dùng"}{" "}
                  </span>
                  {post?.likes?.length > 1 &&
                    `và ${post?.likes?.length - 1} người khác`}
                </button>
              </div>
            )}

            {/* Likes list modal */}
            <LikesList
              isOpen={showLikesList}
              onClose={() => setShowLikesList(false)}
              likes={post.likes}
            />

            {/* Comments section - conditionally shown */}
            {showComments && (
              <div className="mt-4">
                <CommentSection
                  comments={post.comments}
                  postId={post._id}
                  onComment={onAddComment}
                />
              </div>
            )}

            {/* Create poll form */}
            {showPollForm && (
              <AnimatedComponent
                className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
                animation="slideInUp"
                duration={300}
              >
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                  Tạo bình chọn mới
                </h4>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="pollQuestion"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Câu hỏi
                    </label>
                    <input
                      id="pollQuestion"
                      type="text"
                      placeholder="Nhập câu hỏi của bạn"
                      value={pollData.question}
                      onChange={(e) =>
                        setPollData({ ...pollData, question: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Các lựa chọn
                    </label>
                    <div className="grid gap-2">
                      {[1, 2, 3, 4].map((num, index) => (
                        <div key={num} className="relative">
                          <input
                            type="text"
                            placeholder={`Lựa chọn ${num}`}
                            value={pollData.options[index] || ""}
                            onChange={(e) => {
                              const options = [...pollData.options];
                              options[index] = e.target.value;
                              setPollData({
                                ...pollData,
                                options: options.filter(Boolean),
                              });
                            }}
                            className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />

                          <span className="absolute right-3 top-2 text-sm text-gray-400">
                            {num}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setPollData({ question: "", options: [] });
                        setShowPollForm(false);
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => {
                        if (pollData.question && pollData.options.length >= 2) {
                          onAddPoll(post._id, pollData);
                          setPollData({ question: "", options: [] });
                          setShowPollForm(false);
                        }
                      }}
                      disabled={
                        !pollData.question || pollData.options.length < 2
                      }
                      className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Tạo bình chọn
                    </button>
                  </div>
                </div>
              </AnimatedComponent>
            )}

            {/* Delete confirmation dialog */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <AnimatedComponent
                  className="bg-white rounded-lg p-6 max-w-md w-full"
                  animation="scaleIn"
                  duration={300}
                >
                  <div className="flex items-center mb-4 text-red-600">
                    <AlertTriangle size={24} className="mr-2" />

                    <h3 className="text-lg font-semibold">Xác nhận xóa</h3>
                  </div>

                  <p className="text-gray-700 mb-6">
                    Bạn có chắc chắn muốn xóa bài viết này? Hành động này không
                    thể hoàn tác.
                  </p>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Xóa bài viết
                    </button>
                  </div>
                </AnimatedComponent>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Load more button - only shown when appropriate */}
      {hasMore && (
        <div className="flex justify-center mt-4 pb-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Đang tải...</span>
              </div>
            ) : (
              <span>Xem thêm</span>
            )}
          </button>
        </div>
      )}
    </AnimatedComponent>
  );
};

export default PostCard;
