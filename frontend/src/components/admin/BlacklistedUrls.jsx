import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const BlacklistedUrls = () => {
  const [blacklistedUrls, setBlacklistedUrls] = useState([]);
  const [proxyUrls, setProxyUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("blacklist");
  const [newUrl, setNewUrl] = useState({
    url: "",
    reason: "",
    confidence: 100,
    bulkList: "",
  });
  const [bulkResults, setBulkResults] = useState(null);
  const [validationError, setValidationError] = useState("");

  const isValidProxyList = useCallback((list) => {
    if (!list?.trim()) return false;
    const lines = list.trim().split("\n");
    return lines.every((line) => {
      try {
        const url = new URL(line.trim());
        return ["http:", "https:"].includes(url.protocol);
      } catch {
        return false;
      }
    });
  }, []);
  const [selectedProxyId, setSelectedProxyId] = useState(null);
  const [proxyHealth, setProxyHealth] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  const getAuthToken = () => {
    return localStorage.getItem("token");
  };
  const apiurl = import.meta.env.VITE_API_URL;
  const getAuthConfig = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };
  useEffect(() => {
    if (activeTab === "blacklist") {
      fetchBlacklistedUrls();
    } else {
      fetchProxyUrls();
    }
    setLastUpdated(new Date());
  }, [activeTab]);

  
  useEffect(() => {
    let refreshInterval;
    if (autoRefresh && activeTab === "proxy") {
      refreshInterval = setInterval(() => {
        fetchProxyUrls();
        if (selectedProxyId) {
          fetchProxyHealth(selectedProxyId);
        }
        setLastUpdated(new Date());
      }, 30000); 

      
      setBulkResults(null);
    }
    return () => clearInterval(refreshInterval);
  }, [autoRefresh, activeTab, selectedProxyId]);

  const fetchProxyHealth = async (proxyId) => {
    try {
      const response = await axios.get(
        `${apiurl}/url-preview/proxy/${proxyId}/health`,
        getAuthConfig(),
      );
      setProxyHealth(response.data);
    } catch (error) {
      toast.error("Failed to fetch proxy health details");
    }
  };

  const fetchProxyUrls = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${apiurl}/url-preview/proxy`,
        getAuthConfig(),
      );
      setProxyUrls(response.data);

      
      if (bulkResults && !response.data.some((p) => p.status === "inactive")) {
        setBulkResults(null);
      }
    } catch (error) {
      toast.error("Failed to fetch proxy URLs");
      setBulkResults(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlacklistedUrls = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${apiurl}/url-preview/blacklist`,
        getAuthConfig(),
      );
      setBlacklistedUrls(response.data);
    } catch (error) {
      toast.error("Failed to fetch blacklisted URLs");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUrl = async (e) => {
    e.preventDefault();
    try {
      const endpoint = activeTab === "blacklist" ? "blacklist" : "proxy";
      const response = await axios.post(
        `${apiurl}/url-preview/${endpoint}`,
        newUrl,
        getAuthConfig(),
      );

      if (activeTab === "blacklist") {
        setBlacklistedUrls([...blacklistedUrls, response.data]);
      } else {
        setProxyUrls([...proxyUrls, response.data]);
      }

      setNewUrl({ url: "", reason: "", confidence: 100, bulkList: "" });
      toast.success(`URL added to ${activeTab}`);
    } catch (error) {
      toast.error(`Failed to add URL to ${activeTab}`);
    }
  };

  const handleRemoveUrl = async (id) => {
    try {
      const endpoint = activeTab === "blacklist" ? "blacklist" : "proxy";
      await axios.delete(
        `${apiurl}/url-preview/${endpoint}/${id}`,
        getAuthConfig(),
      );

      if (activeTab === "blacklist") {
        setBlacklistedUrls(blacklistedUrls.filter((url) => url?._id !== id));
      } else {
        setProxyUrls(proxyUrls.filter((url) => url?._id !== id));
      }

      toast.success(`URL removed from ${activeTab}`);
    } catch (error) {
      toast.error(`Failed to remove URL from ${activeTab}`);
    }
  };

  const handleUpdateProxyStatus = async (id, updates) => {
    try {
      const response = await axios.put(
        `${apiurl}/url-preview/proxy/${id}`,
        updates,
        getAuthConfig(),
      );
      setProxyUrls(
        proxyUrls.map((url) => (url._id === id ? response.data : url)),
      );
      toast.success("Proxy URL updated successfully");
    } catch (error) {
      toast.error("Failed to update proxy URL");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === "blacklist"
                ? "bg-accent-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("blacklist")}
          >
            Blacklisted URLs
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === "proxy"
                ? "bg-accent-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("proxy")}
          >
            Proxy URLs
          </button>
        </div>
        {activeTab === "proxy" && (
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 text-accent-600 rounded border-gray-300"
              />

              <label htmlFor="autoRefresh" className="text-sm text-gray-700">
                Auto-refresh
              </label>
            </div>
            <button
              onClick={() => {
                fetchProxyUrls();
                if (selectedProxyId) {
                  fetchProxyHealth(selectedProxyId);
                }
                setLastUpdated(new Date());
              }}
              className="p-2 text-gray-500 hover:text-gray-700"
              title="Refresh now"
            >
              <svg
                className="h-5 w-5"
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
            </button>
          </div>
        )}
      </div>

      {/* Summary cards for proxy stats */}
      {activeTab === "proxy" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="text-sm font-medium text-gray-500">
              Status Distribution
            </h4>
            <div className="mt-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    Hoạt động
                  </span>
                  <span className="font-semibold">
                    {proxyUrls.filter((p) => p.status === "active").length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-yellow-600 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                    Chờ
                  </span>
                  <span className="font-semibold">
                    {proxyUrls.filter((p) => p.status === "pending").length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-red-600 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                    Không hoạt động
                  </span>
                  <span className="font-semibold">
                    {proxyUrls.filter((p) => p.status === "inactive").length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                    Dương tính
                  </span>
                  <span className="font-semibold">
                    {
                      proxyUrls.filter((p) => p.status === "false_positive")
                        .length
                    }
                  </span>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="flex h-full">
                  <div
                    className="bg-green-500 h-full"
                    style={{
                      width: `${(proxyUrls.filter((p) => p.status === "active").length / (proxyUrls.length || 1)) * 100}%`,
                    }}
                  ></div>
                  <div
                    className="bg-yellow-500 h-full"
                    style={{
                      width: `${(proxyUrls.filter((p) => p.status === "pending").length / (proxyUrls.length || 1)) * 100}%`,
                    }}
                  ></div>
                  <div
                    className="bg-red-500 h-full"
                    style={{
                      width: `${(proxyUrls.filter((p) => p.status === "inactive").length / (proxyUrls.length || 1)) * 100}%`,
                    }}
                  ></div>
                  <div
                    className="bg-gray-500 h-full"
                    style={{
                      width: `${(proxyUrls.filter((p) => p.status === "false_positive").length / (proxyUrls.length || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="text-sm font-medium text-gray-500">
              Tỷ lệ thành công trung bình
            </h4>
            <p className="mt-2 text-3xl font-semibold text-blue-600">
              {proxyUrls.length > 0
                ? Math.round(
                    proxyUrls.reduce(
                      (acc, p) => acc + (p.metrics?.successRate || 0),
                      0,
                    ) / proxyUrls.length,
                  )
                : 0}
              %
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="text-sm font-medium text-gray-500">Health Issues</h4>
            <p className="mt-2 text-3xl font-semibold text-yellow-600">
              {
                proxyUrls.filter(
                  (p) =>
                    p.metrics?.health?.status === "warning" ||
                    p.metrics?.health?.status === "unhealthy",
                ).length
              }
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="text-sm font-medium text-gray-500">
              Total Requests
            </h4>
            <p className="mt-2 text-3xl font-semibold text-gray-600">
              {proxyUrls.reduce(
                (acc, p) => acc + (p.metrics?.totalRequests || 0),
                0,
              )}
            </p>
          </div>
        </div>
      )}

      {/* Bulk Import Form for Proxies */}
      {activeTab === "proxy" && (
        <>
          <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Bulk Import Proxies</h3>
              {loading && (
                <div className="text-sm text-gray-500 animate-pulse">
                  Processing...
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proxy List (one per line)
              </label>
              <textarea
                className={`w-full h-40 px-3 py-2 border rounded-lg transition-colors
                ${loading ? "bg-gray-50" : "bg-white"}
                ${
                  !newUrl.bulkList?.trim()
                    ? "border-gray-300"
                    : isValidProxyList(newUrl.bulkList)
                      ? "border-green-300 focus:ring-green-500 focus:border-green-500"
                      : "border-red-300 focus:ring-red-500 focus:border-red-500"
                }`}
                disabled={loading}
                placeholder="http://proxy1.example.com:8080
https://user:pass@proxy2.example.com:8080
..."
                value={newUrl.bulkList || ""}
                onChange={(e) => {
                  setNewUrl({ ...newUrl, bulkList: e.target.value });
                  setValidationError(""); 
                }}
              />
            </div>

            {validationError && (
              <div className="mb-4 text-sm text-red-600">{validationError}</div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={async (e) => {
                    e.preventDefault();

                    
                    if (!isValidProxyList(newUrl.bulkList)) {
                      setValidationError(
                        "Invalid proxy URLs found. Please check the format (http:// or https://).",
                      );
                      return;
                    }
                    setValidationError(""); 

                    try {
                      setLoading(true);
                      setBulkResults(null); 
                      const response = await axios.post(
                        `${apiurl}/url-preview/proxy/bulk?testImmediately=true`,
                        { urls: newUrl.bulkList }, 
                        getAuthConfig(),
                      );

                      const { added, skipped, errors } = response.data;

                      
                      const importSummary = {
                        timestamp: new Date(),
                        summary: {
                          added: { count: added.length, items: added },
                          skipped: { count: skipped.length, items: skipped },
                          errors: { count: errors.length, items: errors },
                        },
                      };
                      setBulkResults(importSummary);

                      toast.success(
                        <div className="space-y-1">
                          <div className="font-medium">Import Results</div>
                          <div className="text-sm space-y-0.5">
                            {added.length > 0 && (
                              <div className="text-green-700">
                                ✓ Imported {added.length}
                              </div>
                            )}
                            {skipped.length > 0 && (
                              <div className="text-yellow-700">
                                ⚠ Skipped {skipped.length} (duplicates)
                              </div>
                            )}
                            {errors.length > 0 && (
                              <div className="text-red-700">
                                ✕ Failed {errors.length}
                              </div>
                            )}
                          </div>
                        </div>,
                        { duration: 5000 },
                      );

                      
                      if (added.length > 0) {
                        toast.loading("Testing imported proxies...", {
                          id: "proxy-test-toast",
                        });
                        const testResponse = await axios.post(
                          `${apiurl}/url-preview/proxy/test`,
                          { autoRemove: true }, 
                          getAuthConfig(),
                        );

                        
                        const testSummaryText = [
                          `✅ ${testResponse.data.working} working`,
                          testResponse.data.failed > 0 &&
                            `❌ ${testResponse.data.failed} failed`,
                          testResponse.data.removedCount > 0 &&
                            `🗑️ ${testResponse.data.removedCount} removed`,
                        ]
                          .filter(Boolean)
                          .join(" • ");

                        toast.success(
                          `Proxy test complete: ${testSummaryText}`,
                          { id: "proxy-test-toast" },
                        );

                        
                        setBulkResults((prev) => ({
                          ...prev,
                          testResults: testResponse.data,
                        }));
                      }

                      setNewUrl({ ...newUrl, bulkList: "" }); 
                      fetchProxyUrls(); 
                    } catch (error) {
                      toast.error(
                        "Failed to import or test proxies. Check console for details.",
                      );
                      console.error(
                        "Import/Test error:",
                        error.response?.data || error.message,
                      );
                      toast.dismiss("proxy-test-toast");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || !newUrl.bulkList?.trim()}
                  type="button"
                  className={`px-4 py-2 rounded-lg text-white ${
                    loading || !newUrl.bulkList?.trim()
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-accent-600 hover:bg-accent-700"
                  }`}
                >
                  {loading ? "Processing..." : "Import & Test"}
                </button>
                <button
                  onClick={() => {
                    const text = prompt(
                      "Enter a sample proxy URL to validate format:",
                    );
                    if (text) {
                      try {
                        const url = new URL(text);
                        if (!["http:", "https:"].includes(url.protocol)) {
                          throw new Error("Invalid protocol");
                        }
                        setValidationError("Valid proxy URL format");
                        setTimeout(() => setValidationError(""), 3000);
                      } catch {
                        setValidationError(
                          "Invalid proxy URL format. Use http://host:port or https://host:port",
                        );
                      }
                    }
                  }}
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-900"
                >
                  Check Format
                </button>
              </div>

              <div className="text-sm text-gray-500">
                {newUrl.bulkList ? (
                  <>
                    <span
                      className={
                        isValidProxyList(newUrl.bulkList)
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {
                        newUrl.bulkList
                          .trim()
                          .split("\n")
                          .filter((line) => line.trim()).length
                      }
                    </span>{" "}
                    proxies entered
                  </>
                ) : (
                  "No proxies entered"
                )}
              </div>
            </div>
          </div>

          {/* Import Results Display */}
          {bulkResults?.summary && (
            <div className="mt-4 border-t pt-4 bg-white p-4 rounded-lg shadow-sm mb-8">
              <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
                <div>
                  Last Import Results (
                  {new Date(bulkResults.timestamp).toLocaleTimeString()})
                </div>
                {bulkResults.summary.errors.count > 0 && (
                  <button
                    onClick={() => {
                      const failedUrls = bulkResults.summary.errors.items
                        .map((e) => e.url) 
                        .join("\n");

                      setNewUrl((prev) => ({ ...prev, bulkList: failedUrls }));
                      toast.info(
                        `Loaded ${bulkResults.summary.errors.count} failed URLs for retry`,
                      );
                      setBulkResults(null); 
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <svg
                      className="h-4 w-4"
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
                    <span>Retry Failed</span>
                  </button>
                )}
              </div>

              {/* Results with expandable sections */}
              <div className="space-y-2">
                {Object.entries({
                  added: {
                    items: bulkResults.summary.added.items.map(
                      (item) => item.url,
                    ),
                    color: "green",
                    label: "Imported",
                  },
                  skipped: {
                    items: bulkResults.summary.skipped.items.map((s) => s.url),
                    color: "yellow",
                    label: "Skipped (Duplicates)",
                  },
                  errors: {
                    items: bulkResults.summary.errors.items.map(
                      (e) => `${e.url} (${e.error || "Failed"})`,
                    ),
                    color: "red",
                    label: "Failed to Import",
                  },
                }).map(
                  ([key, { items, color, label }]) =>
                    items.length > 0 && (
                      <div key={key} className="text-sm">
                        <span className={`font-medium text-${color}-700`}>
                          {label} ({items.length})
                        </span>
                        {items.length <= 10 ? (
                          <div className="mt-1 text-xs text-gray-500 font-mono">
                            {items.join(", ")}
                          </div>
                        ) : (
                          <details className="mt-1 text-xs text-gray-500">
                            <summary className="cursor-pointer font-mono hover:text-gray-700">
                              {items.slice(0, 3).join(", ")}... (Click to see
                              all {items.length})
                            </summary>
                            <pre className="font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto bg-gray-50 p-2 rounded mt-1">
                              {items.join("\n")}
                            </pre>
                          </details>
                        )}
                      </div>
                    ),
                )}
              </div>

              {/* Display Test Results if available */}
              {bulkResults.testResults && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-600 mb-1">
                    Test Results:
                  </h5>
                  <p className="text-sm">
                    <span className="text-green-700">
                      ✅ {bulkResults.testResults.working} Working
                    </span>{" "}
                    •
                    {bulkResults.testResults.failed > 0 && (
                      <span className="text-red-700 ml-2">
                        ❌ {bulkResults.testResults.failed} Failed
                      </span>
                    )}{" "}
                    •
                    {bulkResults.testResults.removedCount > 0 && (
                      <span className="text-gray-600 ml-2">
                        🗑️ {bulkResults.testResults.removedCount} Removed
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add new URL form (kept separate for single additions) */}
      <form
        onSubmit={handleAddUrl}
        className="mb-8 bg-white p-6 rounded-lg shadow-sm"
      >
        <h3 className="text-lg font-medium mb-4">
          Add Single{" "}
          {activeTab === "blacklist" ? "Blacklisted URL (RegExp)" : "Proxy URL"}
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {activeTab === "blacklist" ? "URL Pattern (RegExp)" : "Proxy URL"}
            </label>
            <input
              type="text"
              className="input w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-accent-500 focus:border-accent-500"
              value={newUrl.url}
              onChange={(e) => setNewUrl({ ...newUrl, url: e.target.value })}
              placeholder={
                activeTab === "blacklist"
                  ? "e.g., .*\\.malicious\\.com"
                  : "http://proxy.example.com:8080"
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason / Notes
            </label>
            <input
              type="text"
              className="input w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-accent-500 focus:border-accent-500"
              value={newUrl.reason}
              onChange={(e) => setNewUrl({ ...newUrl, reason: e.target.value })}
              placeholder={
                activeTab === "blacklist" ? "Malicious site" : "Optional notes"
              }
              required={activeTab === "blacklist"} 
            />
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <button
            type="submit"
            className="btn btn-primary px-4 py-2 rounded-lg bg-accent-600 text-white hover:bg-accent-700"
          >
            {activeTab === "blacklist"
              ? "Add to Blacklist"
              : "Add Single Proxy"}
          </button>
        </div>
      </form>

      {/* URLs list */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium">
            Current {activeTab === "blacklist" ? "Blacklist" : "Proxy List"}
          </h3>
        </div>

        {loading && !bulkResults ? ( 
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : (activeTab === "blacklist" ? blacklistedUrls : proxyUrls).length ===
          0 ? (
          <div className="p-4 text-gray-500">
            No {activeTab === "blacklist" ? "blacklisted" : "proxy"} URLs
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === "blacklist" ? "URL Pattern" : "Proxy URL"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === "blacklist" ? "Reason" : "Notes"}
                  </th>
                  {activeTab === "proxy" && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Health
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Success Rate
                      </th>
                    </>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                  {/* ---- START FIX ---- */}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-end space-x-4">
                      {/* Wrap conditional button and span in a Fragment */}
                      <>
                        {activeTab === "proxy" && (
                          <div className="flex items-center">
                            <div className="mr-4 text-left">
                              <div className="text-xs text-gray-500">
                                {
                                  proxyUrls.filter(
                                    (p) => p.status === "pending",
                                  ).length
                                }{" "}
                                pending
                              </div>
                              <div className="text-xs text-gray-500">
                                {
                                  proxyUrls.filter(
                                    (p) =>
                                      !p.metrics?.lastChecked ||
                                      new Date(p.metrics.lastChecked) <
                                        new Date(
                                          Date.now() - 24 * 60 * 60 * 1000,
                                        ),
                                  ).length
                                }{" "}
                                stale
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                const pendingCount = proxyUrls.filter(
                                  (p) => p.status === "pending",
                                ).length;
                                const staleCount = proxyUrls.filter(
                                  (p) =>
                                    !p.metrics?.lastChecked ||
                                    new Date(p.metrics.lastChecked) <
                                      new Date(
                                        Date.now() - 24 * 60 * 60 * 1000,
                                      ),
                                ).length;

                                const totalToTest = pendingCount + staleCount;

                                if (totalToTest === 0) {
                                  toast.info(
                                    "No pending or stale proxies to test.",
                                  );
                                  return;
                                }

                                const confirmed = window.confirm(
                                  `Test ${totalToTest} proxies?\n` +
                                    `- ${pendingCount} pending\n` +
                                    `- ${staleCount} not checked in 24h\n\n` +
                                    "Non-working proxies will be automatically removed.",
                                );

                                if (confirmed) {
                                  try {
                                    setLoading(true);
                                    toast.loading("Testing proxies...", {
                                      id: "table-test-toast",
                                    });
                                    const response = await axios.post(
                                      `${apiurl}/url-preview/proxy/test`,
                                      {
                                        autoRemove: true,
                                        testPending: true,
                                        testStale: true,
                                      }, 
                                      getAuthConfig(),
                                    );

                                    setBulkResults(response.data); 

                                    const summaryText = [
                                      `✅ ${response.data.working} working`,
                                      response.data.failed > 0 &&
                                        `❌ ${response.data.failed} failed`,
                                      response.data.removedCount > 0 &&
                                        `🗑️ ${response.data.removedCount} removed`,
                                    ]
                                      .filter(Boolean)
                                      .join(" • ");

                                    toast.success(
                                      `Test complete: ${summaryText}`,
                                      { id: "table-test-toast" },
                                    );
                                    fetchProxyUrls(); 
                                  } catch (error) {
                                    toast.error("Failed to test proxies", {
                                      id: "table-test-toast",
                                    });
                                    console.error(
                                      "Proxy test error:",
                                      error.response?.data || error.message,
                                    );
                                  } finally {
                                    setLoading(false);
                                  }
                                }
                              }}
                              disabled={loading}
                              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                loading
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : proxyUrls.some(
                                        (p) =>
                                          p.status === "pending" ||
                                          !p.metrics?.lastChecked ||
                                          new Date(p.metrics.lastChecked) <
                                            new Date(
                                              Date.now() - 24 * 60 * 60 * 1000,
                                            ),
                                      )
                                    ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                    : "bg-blue-50 text-blue-700 hover:bg-blue-100" 
                              }`}
                              title="Test pending and stale proxies (older than 24h)"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>
                                <span>
                                  {loading ? "Testing..." : "Test Proxies"}
                                </span>
                                {loading && (
                                  <svg
                                    className="animate-spin ml-1 h-4 w-4 text-yellow-700"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                )}
                              </span>
                            </button>
                          </div>
                        )}
                        <span>Actions</span>
                      </>
                    </div>
                  </th>
                  {/* ---- END FIX ---- */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(activeTab === "blacklist" ? blacklistedUrls : proxyUrls).map(
                  (url) => (
                    <tr key={url._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono break-all max-w-xs">
                        {url.url}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {url.reason || "-"}
                      </td>
                      {activeTab === "proxy" && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                               ${
                                 url.metrics?.health?.status === "healthy"
                                   ? "bg-green-100 text-green-800"
                                   : url.metrics?.health?.status === "warning"
                                     ? "bg-yellow-100 text-yellow-800"
                                     : url.metrics?.health?.status ===
                                         "unhealthy"
                                       ? "bg-red-100 text-red-800"
                                       : "bg-gray-100 text-gray-800"
                               }`}
                              >
                                {url.metrics?.health?.status || "unknown"}
                              </div>
                              <span className="text-xs text-gray-400">
                                ({url.metrics?.health?.score ?? "N/A"}%)
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Checked:{" "}
                              {url.metrics?.lastChecked
                                ? new Date(
                                    url.metrics.lastChecked,
                                  ).toLocaleString()
                                : "Never"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <select
                              value={url.status || "pending"}
                              onChange={(e) =>
                                handleUpdateProxyStatus(url._id, {
                                  status: e.target.value,
                                })
                              }
                              className={`border rounded px-2 py-1 text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-accent-500 ${
                                url.status === "active"
                                  ? "bg-green-50 border-green-200 text-green-700"
                                  : url.status === "pending"
                                    ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                                    : url.status === "inactive"
                                      ? "bg-red-50 border-red-200 text-red-700"
                                      : "bg-gray-50 border-gray-200 text-gray-700" 
                              }`}
                            >
                              {[
                                {
                                  value: "pending",
                                  label: "Pending",
                                  color: "bg-yellow-50 text-yellow-700",
                                },
                                {
                                  value: "active",
                                  label: "Active",
                                  color: "bg-green-50 text-green-700",
                                },
                                {
                                  value: "inactive",
                                  label: "Inactive",
                                  color: "bg-red-50 text-red-700",
                                },
                                {
                                  value: "false_positive",
                                  label: "False Positive",
                                  color: "bg-gray-50 text-gray-700",
                                },
                              ].map(({ value, label, color }) => (
                                <option
                                  key={value}
                                  value={value}
                                  className={color} 
                                >
                                  {label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {typeof url.metrics?.successRate === "number" ? (
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full ${
                                      url.metrics.successRate >= 80
                                        ? "bg-green-500"
                                        : url.metrics.successRate >= 50
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                    }`}
                                    style={{
                                      width: `${url.metrics.successRate}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs">
                                  {url.metrics.successRate.toFixed(0)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                No data
                              </span>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              Avg: {url.metrics?.averageResponseTime ?? "N/A"}ms
                            </div>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {url.addedBy?.email || "System"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(url.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3 justify-end">
                          {activeTab === "proxy" && (
                            <button
                              onClick={() => {
                                setSelectedProxyId(url._id);
                                fetchProxyHealth(url._id);
                              }}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                              title="View health details"
                            >
                              Details
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveUrl(url._id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                            title="Remove this URL"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proxy Health Modal */}
      {selectedProxyId && proxyHealth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-medium text-gray-800">
                Proxy Health Details
              </h3>
              <button
                onClick={() => {
                  setSelectedProxyId(null);
                  setProxyHealth(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                {proxyHealth.url}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Last Checked:{" "}
                {new Date(proxyHealth.metrics.lastChecked).toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded border">
                <h4 className="font-medium mb-2 text-gray-700">
                  Performance Metrics
                </h4>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-gray-500">Success Rate</dt>
                    <dd className="text-lg font-medium">
                      {proxyHealth.metrics.successRate}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Total Requests</dt>
                    <dd className="text-lg">
                      {proxyHealth.metrics.totalRequests}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Failed Requests</dt>
                    <dd className="text-lg text-red-600">
                      {proxyHealth.metrics.failedRequests}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">
                      Average Response Time
                    </dt>
                    <dd className="text-lg">
                      {proxyHealth.metrics.averageResponseTime}ms
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Timeout Rate</dt>
                    <dd className="text-lg">
                      {(proxyHealth.metrics.timeoutRate || 0).toFixed(1)}%
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-gray-50 p-4 rounded border">
                <h4 className="font-medium mb-2 text-gray-700">
                  Health Status
                </h4>
                <div className="mb-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold
                        ${
                          proxyHealth.metrics.health?.status === "healthy"
                            ? "bg-green-100 text-green-800"
                            : proxyHealth.metrics.health?.status === "warning"
                              ? "bg-yellow-100 text-yellow-800"
                              : proxyHealth.metrics.health?.status ===
                                  "unhealthy"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                  >
                    {proxyHealth.metrics.health?.status || "unknown"}
                  </span>
                </div>
                <div className="mb-3">
                  <dt className="text-sm text-gray-500">Health Score</dt>
                  <dd className="text-lg font-medium">
                    {proxyHealth.metrics.health?.score || 0}/100
                  </dd>
                </div>

                {proxyHealth.metrics.health?.reasons?.length > 0 && (
                  <div>
                    <dt className="text-sm text-gray-500 mb-1">
                      Contributing Factors:
                    </dt>
                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                      {proxyHealth.metrics.health.reasons.map(
                        (reason, index) => (
                          <li key={index}>{reason}</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {proxyHealth.recommendations?.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 text-gray-700">
                  Recommendations
                </h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {proxyHealth.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 border-t pt-4 flex justify-end">
              <button
                onClick={() => {
                  setSelectedProxyId(null);
                  setProxyHealth(null);
                }}
                className="btn btn-secondary px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {activeTab === "proxy" && proxyUrls.length > 0 && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg border">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-700">Bulk Actions</h4>
            <div className="text-sm text-gray-500">
              {
                proxyUrls.filter(
                  (p) => p.metrics?.health?.status === "unhealthy",
                ).length
              }{" "}
              unhealthy •{" "}
              {proxyUrls.filter((p) => p.status === "inactive").length} inactive
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={async () => {
                const unhealthyProxies = proxyUrls.filter(
                  (p) => p.metrics?.health?.status === "unhealthy",
                );
                if (unhealthyProxies.length === 0) {
                  toast.info("No unhealthy proxies to deactivate.");
                  return;
                }
                const confirmed = window.confirm(
                  `Deactivate ${unhealthyProxies.length} unhealthy proxies?`,
                );
                if (confirmed) {
                  setLoading(true);
                  toast.loading("Deactivating unhealthy proxies...", {
                    id: "bulk-deactivate",
                  });
                  let successCount = 0;
                  let failCount = 0;
                  for (const proxy of unhealthyProxies) {
                    
                    if (proxy.status !== "inactive") {
                      try {
                        await handleUpdateProxyStatus(proxy._id, {
                          status: "inactive",
                        });
                        successCount++;
                      } catch {
                        failCount++;
                      }
                    } else {
                      
                      successCount++;
                    }
                  }
                  setLoading(false);
                  if (failCount > 0) {
                    toast.error(
                      `Deactivated ${successCount}, failed for ${failCount}.`,
                      { id: "bulk-deactivate" },
                    );
                  } else {
                    toast.success(
                      `Deactivated ${successCount} unhealthy proxies.`,
                      { id: "bulk-deactivate" },
                    );
                  }
                  fetchProxyUrls();
                }
              }}
              disabled={
                loading ||
                !proxyUrls.some(
                  (p) => p.metrics?.health?.status === "unhealthy",
                )
              }
              className={`text-sm flex items-center space-x-1 px-3 py-1 rounded transition-colors ${
                loading ||
                !proxyUrls.some(
                  (p) => p.metrics?.health?.status === "unhealthy",
                )
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-red-50 text-red-600 hover:text-red-900 hover:bg-red-100"
              }`}
              title="Set status to 'inactive' for all proxies marked as unhealthy"
            >
              Deactivate Unhealthy (
              {
                proxyUrls.filter(
                  (p) => p.metrics?.health?.status === "unhealthy",
                ).length
              }
              )
            </button>
            <button
              onClick={async () => {
                const inactiveProxies = proxyUrls.filter(
                  (p) => p.status === "inactive",
                );
                if (inactiveProxies.length === 0) {
                  toast.info("No inactive proxies to remove.");
                  return;
                }
                const confirmed = window.confirm(
                  `Permanently remove ${inactiveProxies.length} inactive proxies? This cannot be undone.`,
                );
                if (confirmed) {
                  setLoading(true);
                  toast.loading("Removing inactive proxies...", {
                    id: "bulk-remove",
                  });
                  let successCount = 0;
                  let failCount = 0;
                  for (const proxy of inactiveProxies) {
                    try {
                      await handleRemoveUrl(proxy._id);
                      successCount++;
                    } catch {
                      failCount++;
                    }
                  }
                  setLoading(false);
                  if (failCount > 0) {
                    toast.error(
                      `Removed ${successCount}, failed for ${failCount}.`,
                      { id: "bulk-remove" },
                    );
                  } else {
                    toast.success(`Removed ${successCount} inactive proxies.`, {
                      id: "bulk-remove",
                    });
                  }
                  
                }
              }}
              disabled={
                loading || !proxyUrls.some((p) => p.status === "inactive")
              }
              className={`text-sm flex items-center space-x-1 px-3 py-1 rounded transition-colors ${
                loading || !proxyUrls.some((p) => p.status === "inactive")
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
              }`}
              title="Permanently delete all proxies with status 'inactive'"
            >
              Remove Inactive (
              {proxyUrls.filter((p) => p.status === "inactive").length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlacklistedUrls;
