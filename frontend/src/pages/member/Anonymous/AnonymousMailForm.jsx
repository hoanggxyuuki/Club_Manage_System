import { useState, useCallback, useRef } from "react";
import { sendAnonymousEmail } from "../../../services/anonymous";

const AnonymousMailForm = ({ onMailSent }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handlePaste = useCallback((e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    const imageItems = Array.from(items).filter(
      (item) => item.type.indexOf("image") !== -1,
    );

    imageItems.forEach((item) => {
      const file = item.getAsFile();
      handleFiles([file]);
    });
  }, []);

  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter(
      (file) => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024,
    );

    if (validFiles.length + files.length > 5) {
      setError("Maximum 5 files allowed");
      return;
    }

    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
    setError("");
  };

  const handleFileInput = (e) => {
    handleFiles(Array.from(e.target.files));
  };

  const handleImageUrlInput = (e) => {
    e.preventDefault();
    const url = e.target.value;
    if (url && imageUrls.length < 5) {
      setImageUrls((prev) => [...prev, url]);
      e.target.value = "";
    }
  };

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const removeImageUrl = (index) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);

      
      files.forEach((file, index) => {
        formData.append(`media_${index}`, file);
      });

      
      formData.append("imageUrls", JSON.stringify(imageUrls));

      await sendAnonymousEmail(formData);

      
      setTitle("");
      setDescription("");
      setFiles([]);
      setImageUrls([]);
      onMailSent();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Gửi thư ẩn danh</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tiêu đề
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nội dung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onPaste={handlePaste}
            className="w-full p-2 border rounded-md min-h-[100px]"
            required
          />
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="mb-4 p-4 border-2 border-dashed rounded-md text-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <p>Kéo thả file ảnh hoặc click để chọn</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept="image/*"
            multiple
            className="hidden"
          />
        </div>

        {/* Image URL Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thêm link ảnh
          </label>
          <input
            type="url"
            onBlur={handleImageUrlInput}
            placeholder="Nhập link ảnh và nhấn Enter"
            className="w-full p-2 border rounded-md"
          />
        </div>

        {/* Preview Section */}
        {(files.length > 0 || imageUrls.length > 0) && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Xem trước:
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {files.map((file, index) => (
                <div key={`file-${index}`} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index}`}
                    className="w-full h-24 object-cover rounded"
                  />

                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
              {imageUrls.map((url, index) => (
                <div key={`url-${index}`} className="relative">
                  <img
                    src={url}
                    alt={`URL Preview ${index}`}
                    className="w-full h-24 object-cover rounded"
                  />

                  <button
                    type="button"
                    onClick={() => removeImageUrl(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors
                        ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "Đang gửi..." : "Gửi thư"}
        </button>
      </form>
    </div>
  );
};

export default AnonymousMailForm;
