import { useState, useRef } from "react";
import { FormControlLabel, Switch } from "@mui/material";
import { ImageIcon, VideoIcon, X, Upload } from "lucide-react";
import MultiUrlPreview from "../../../components/common/MultiUrlPreview";

const CreatePostModal = ({ isOpen, onClose, onSubmit }) => {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef();

  const categories = [
    { value: "general", label: "Chung", description: "Thảo luận chung" },
    { value: "qa", label: "Hỏi đáp", description: "Hỏi đáp" },
    { value: "event", label: "Sự kiện", description: "Sự kiện" },
    { value: "project", label: "Dự án", description: "Dự án" },
    { value: "resource", label: "Tài nguyên", description: "Tài nguyên" },
    { value: "technical", label: "Kĩ thuật", description: "Kỹ thuật" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();

    
    

    
    formData.append("description", description);
    formData.append("category", category);
    formData.append("tags", JSON.stringify([]));
    formData.append("isAnonymous", isAnonymous);

    mediaFiles.forEach((file, index) => {
      formData.append(`media_${index}`, file);
    });

    formData.append("mediaCount", mediaFiles.length.toString());

    onSubmit(formData);
    resetForm();
  };

  const resetForm = () => {
    setDescription("");
    setCategory("general");
    setMediaFiles([]);
    setMediaPreviews([]);
    setIsAnonymous(false);
    onClose();
  };

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter((file) => {
      const type = file.type.split("/")[0];
      const isValidType = type === "image" || type === "video";
      const isValidSize = file.size <= 50 * 1024 * 1024; 
      return isValidType && isValidSize;
    });

    if (validFiles.length + mediaFiles.length > 10) {
      alert("Bạn chỉ có thể tải lên tối đa 10 file");
      return;
    }

    setMediaFiles((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreviews((prev) => [
            ...prev,
            { type: "image", url: reader.result },
          ]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        const videoUrl = URL.createObjectURL(file);
        setMediaPreviews((prev) => [...prev, { type: "video", url: videoUrl }]);
      }
    });
  };

  const removeMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-2xl transform rounded-xl bg-white shadow-xl transition-all">
          <div className="relative">
            <button
              onClick={resetForm}
              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="px-6 py-5 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Tạo bài viết mới
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Chia sẻ ý tưởng, đặt câu hỏi hoặc thảo luận với cộng đồng
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <textarea
                    placeholder="Bạn đang nghĩ gì?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="6"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y placeholder-gray-400 text-lg"
                    required
                  />

                  {/* URL Preview section */}
                  {/* <div className="mt-2">
                               <MultiUrlPreview content={description} />
                            </div> */}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chủ đề
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label} - {cat.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />

                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md font-semibold text-blue-600 hover:text-blue-500"
                      >
                        <span>Tải lên tệp</span>
                        <input
                          id="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          accept="image/*,video/*"
                          onChange={(e) => handleFileSelect(e.target.files)}
                          ref={fileInputRef}
                        />
                      </label>
                      <p className="pl-1">hoặc kéo thả vào đây</p>
                    </div>
                    <p className="text-xs leading-5 text-gray-600">
                      Hỗ trợ PNG, JPG, GIF hoặc MP4 (tối đa 50MB)
                    </p>
                  </div>

                  {mediaPreviews.length > 0 && (
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      {mediaPreviews.map((media, index) => (
                        <div key={index} className="relative group">
                          {media.type === "image" ? (
                            <img
                              src={media.url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          ) : (
                            <video
                              src={media.url}
                              className="w-full h-48 object-cover rounded-lg"
                              controls
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="absolute top-2 right-2 p-1 bg-gray-900 bg-opacity-50 hover:bg-opacity-75 rounded-full text-white transition-opacity opacity-0 group-hover:opacity-100"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ImageIcon size={20} />
                      <span>Thêm ảnh</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <VideoIcon size={20} />
                      <span>Thêm video</span>
                    </button>
                  </div>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        color="primary"
                        size="small"
                      />
                    }
                    label="Đăng ẩn danh"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Đăng bài
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
