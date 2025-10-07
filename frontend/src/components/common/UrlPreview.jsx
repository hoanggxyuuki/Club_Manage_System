import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  XCircle,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  X,
} from "lucide-react";

const SecurityWarningModal = ({
  isOpen,
  onClose,
  onConfirm,
  url,
  type,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full animate-scaleIn overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`p-4 ${type === "ssl" ? "bg-red-50" : "bg-yellow-50"} flex items-center justify-between`}
        >
          <div className="flex items-center">
            {type === "ssl" ? (
              <ShieldAlert className="w-6 h-6 text-red-500 mr-2" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
            )}
            <h3 className="text-lg font-medium">
              {type === "ssl"
                ? "Cảnh báo chứng chỉ bảo mật"
                : "Cảnh báo bảo mật"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-4">
            <p className="text-gray-800 mb-3">{message}</p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm break-all">
              <span className="font-mono text-gray-600">{url}</span>
            </div>
          </div>

          <div className="mt-5 mb-3">
            <p className="text-sm text-gray-500 italic">
              Việc truy cập vào trang web này có thể khiến thông tin cá nhân của
              bạn gặp rủi ro.
            </p>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 font-medium transition-colors"
            >
              Quay về
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 flex items-center rounded-md font-medium text-white ${
                type === "ssl"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-yellow-500 hover:bg-yellow-600"
              } transition-colors`}
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Vẫn truy cập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WarningMessage = ({ type, message, url }) => {
  const [showWarningModal, setShowWarningModal] = useState(false);

  const bgColor = type === "ssl" ? "bg-red-50" : "bg-yellow-50";
  const borderColor = type === "ssl" ? "border-red-300" : "border-yellow-300";
  const textColor = type === "ssl" ? "text-red-800" : "text-yellow-800";
  const iconColor = type === "ssl" ? "text-red-400" : "text-yellow-400";

  const handleVisitAnyway = () => {
    window.open(url, "_blank", "noopener,noreferrer");
    setShowWarningModal(false);
  };

  return (
    <>
      <div className={`rounded-md p-4 border ${bgColor} ${borderColor} mb-4`}>
        <div className="flex flex-col space-y-3">
          <div className="flex">
            <div className="flex-shrink-0">
              {type === "ssl" ? (
                <ShieldAlert className={`h-5 w-5 ${iconColor}`} />
              ) : (
                <AlertTriangle className={`h-5 w-5 ${iconColor}`} />
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${textColor}`}>
                {type === "ssl" ? "Cảnh báo chứng chỉ SSL" : "Cảnh báo bảo mật"}
              </h3>
              <div className={`mt-2 text-sm ${textColor}`}>
                <p>{message}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-dashed pt-3">
            <button
              onClick={() => setShowWarningModal(true)}
              className="group flex items-center w-full"
            >
              <div className="flex-1 truncate">
                <p
                  className={`text-sm ${textColor} group-hover:underline flex items-center`}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />

                  <span className="truncate">{url}</span>
                </p>
              </div>
              <div className="ml-2">
                <span
                  className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${textColor} bg-opacity-20 ${bgColor}`}
                >
                  Vẫn truy cập
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <SecurityWarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={handleVisitAnyway}
        url={url}
        type={type}
        message={message}
      />
    </>
  );
};

const UrlPreview = ({ url }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    const fetchPreview = async () => {
      if (!url) return;

      setLoading(true);
      setError(null);
      setWarning(null);

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_PROXY_API_URL}api/url-preview?url=${encodeURIComponent(url)}&_bypassSW=true&_nocache=${Date.now()}`,
        );

        if (response.data.warning) {
          setWarning({
            type: response.data.type,
            message: response.data.message,
          });
          setPreview(null);
        } else {
          setPreview(response.data);
          setWarning(null);
        }
      } catch (error) {
        if (error.response?.data?.warning) {
          setWarning({
            type: error.response.data.type,
            message: error.response.data.message,
          });
          setPreview(null);
        } else {
          setError("Failed to load preview");
          setPreview(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (!url) return null;

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex space-x-4">
          <div className="w-24 h-24 bg-gray-200 rounded"></div>
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm bg-red-50 p-4 rounded-lg">
        <i className="fas fa-exclamation-circle mr-2"></i>
        {error}
      </div>
    );
  }

  if (warning) {
    return (
      <WarningMessage type={warning.type} message={warning.message} url={url} />
    );
  }

  if (!preview) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 mb-4">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4"
      >
        <div className="flex">
          {preview.image && (
            <div className="flex-shrink-0 mr-4">
              <img
                src={preview.image}
                alt=""
                className="w-24 h-24 object-cover rounded-lg"
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-medium text-gray-900 truncate mb-1">
              {preview.title || "Untitled"}
            </h4>
            {preview.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                {preview.description}
              </p>
            )}
            <div className="flex items-center text-xs text-gray-400">
              <i className="fas fa-link mr-1"></i>
              <span className="truncate">
                {preview.siteName || new URL(url).hostname}
              </span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};

export default UrlPreview;
