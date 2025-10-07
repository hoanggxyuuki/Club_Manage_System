import React from "react";
import { useMultiUrlPreview } from "../../hooks/useMultiUrlPreview";
import UrlPreview from "./UrlPreview";
import {
  X,
  Eye,
  EyeOff,
  ShieldAlert,
  AlertTriangle,
  XCircle,
  Ban,
} from "lucide-react";

const PreviewSelector = ({ previews, selectedUrl, onSelect, onRemove }) => {
  if (previews.length <= 0) return null;

  return (
    <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
      {previews.map(({ url, preview }) => (
        <div key={url} className="flex items-center gap-1">
          <button
            onClick={() => onSelect(url)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
              ${
                selectedUrl === url
                  ? preview.warning
                    ? preview.type === "ssl"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : preview.type === "error"
                        ? "bg-gray-100 text-gray-700 border-gray-200"
                        : preview.type === "blacklist"
                          ? "bg-purple-100 text-purple-700 border-purple-200"
                          : "bg-yellow-100 text-yellow-700 border-yellow-200"
                    : "bg-blue-100 text-blue-700 border-blue-200"
                  : preview.warning
                    ? preview.type === "ssl"
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : preview.type === "error"
                        ? "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        : preview.type === "blacklist"
                          ? "bg-purple-50 text-purple-600 hover:bg-purple-100"
                          : "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
              border transition-colors whitespace-nowrap
            `}
          >
            {preview.warning ? (
              preview.type === "ssl" ? (
                <ShieldAlert className="w-4 h-4" />
              ) : preview.type === "error" ? (
                <XCircle className="w-4 h-4" />
              ) : preview.type === "blacklist" ? (
                <Ban className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )
            ) : (
              <img
                src={preview.image}
                alt=""
                className="w-4 h-4 object-cover rounded-sm"
                onError={(e) => (e.target.style.display = "none")}
              />
            )}
            <span className="truncate max-w-[150px]">
              {preview.warning ? "Warning" : preview.siteName}
            </span>
          </button>
          <button
            onClick={() => onRemove(url)}
            className="p-1 hover:bg-gray-200 rounded-full"
            title="Remove preview"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>
      ))}
    </div>
  );
};

const MultiUrlPreview = ({ content }) => {
  const {
    previews,
    selectedPreviewUrl,
    selectPreview,
    removePreview,
    hiddenPreviews,
    globalPreviewEnabled,
    toggleGlobalPreview,
  } = useMultiUrlPreview(content);

  const visiblePreviews = previews.filter(
    (p) => !hiddenPreviews.includes(p.url),
  );

  
  if (visiblePreviews.length === 0 && globalPreviewEnabled) return null;

  const selectedPreview = previews.find((p) => p.url === selectedPreviewUrl);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => toggleGlobalPreview(!globalPreviewEnabled)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
            ${
              globalPreviewEnabled
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }
            transition-colors
          `}
        >
          {globalPreviewEnabled ? (
            <>
              <Eye size={16} />
              Show Previews
            </>
          ) : (
            <>
              <EyeOff size={16} />
              Hide All Previews
            </>
          )}
        </button>
      </div>

      {globalPreviewEnabled && (
        <>
          <PreviewSelector
            previews={visiblePreviews}
            selectedUrl={selectedPreviewUrl}
            onSelect={selectPreview}
            onRemove={removePreview}
          />

          {selectedPreview &&
            !hiddenPreviews.includes(selectedPreview.url) &&
            (selectedPreview.preview.warning ? (
              <div
                className={`rounded-lg p-4 mb-4 ${
                  selectedPreview.preview.type === "ssl"
                    ? "bg-red-50 border border-red-200"
                    : selectedPreview.preview.type === "error"
                      ? "bg-gray-50 border border-gray-200"
                      : selectedPreview.preview.type === "blacklist"
                        ? "bg-purple-50 border border-purple-200"
                        : "bg-yellow-50 border border-yellow-200"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {selectedPreview.preview.type === "ssl" ? (
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                    ) : selectedPreview.preview.type === "error" ? (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    ) : selectedPreview.preview.type === "blacklist" ? (
                      <Ban className="w-5 h-5 text-purple-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <h3
                      className={`text-sm font-medium ${
                        selectedPreview.preview.type === "ssl"
                          ? "text-red-800"
                          : selectedPreview.preview.type === "error"
                            ? "text-gray-800"
                            : selectedPreview.preview.type === "blacklist"
                              ? "text-purple-800"
                              : "text-yellow-800"
                      }`}
                    >
                      {selectedPreview.preview.type === "ssl"
                        ? "SSL Warning"
                        : selectedPreview.preview.type === "error"
                          ? "Preview Error"
                          : selectedPreview.preview.type === "blacklist"
                            ? "Blacklisted URL"
                            : "Security Warning"}
                    </h3>
                    <p
                      className={`mt-2 text-sm ${
                        selectedPreview.preview.type === "ssl"
                          ? "text-red-700"
                          : selectedPreview.preview.type === "error"
                            ? "text-gray-700"
                            : selectedPreview.preview.type === "blacklist"
                              ? "text-purple-700"
                              : "text-yellow-700"
                      }`}
                    >
                      {selectedPreview.preview.message}
                    </p>
                    <div className="mt-3">
                      <a
                        href={selectedPreview.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center text-sm font-medium ${
                          selectedPreview.preview.type === "ssl"
                            ? "text-red-600 hover:text-red-500"
                            : selectedPreview.preview.type === "error"
                              ? "text-gray-600 hover:text-gray-500"
                              : selectedPreview.preview.type === "blacklist"
                                ? "text-purple-600 hover:text-purple-500"
                                : "text-yellow-600 hover:text-yellow-500"
                        }`}
                      >
                        Visit anyway
                        <svg
                          className="ml-1 w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <UrlPreview url={selectedPreview.url} />
            ))}
        </>
      )}
    </div>
  );
};

export default MultiUrlPreview;
