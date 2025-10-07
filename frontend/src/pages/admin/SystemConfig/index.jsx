import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheckIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useNotification } from "../../../context/NotificationContext";
import {
  getSystemConfig,
  updateSystemConfigById,
} from "../../../services/systemConfig"; 

const SystemConfigManagement = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null); 
  const [editValue, setEditValue] = useState("");
  const { showToast } = useNotification();

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const responseData = await getSystemConfig(); 
      if (Array.isArray(responseData)) {
        setConfigs(
          responseData.map((c) => ({ ...c, originalValue: c.settingValue })),
        );
      } else {
        console.error(
          "Received non-array data from getSystemConfig:",
          responseData,
        );
        setError(
          "Failed to fetch system configurations: Invalid data format received.",
        );
        showToast(
          "Error: Invalid data format from server for system configurations.",
          "error",
        );
        setConfigs([]); 
      }
    } catch (err) {
      setError("Failed to fetch system configurations.");
      showToast(err.message || "Failed to fetch configurations", "error");
      console.error(err);
      setConfigs([]); 
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleEdit = (config) => {
    setEditingId(config._id); 
    setEditValue(config.settingValue);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSave = async (configId) => {
    const configToUpdate = configs.find((c) => c._id === configId);
    if (!configToUpdate) {
      showToast("Error: Could not find configuration to update.", "error");
      return;
    }

    if (configToUpdate.type === "number" && isNaN(Number(editValue))) {
      showToast(
        "Invalid number format for " + configToUpdate.settingName,
        "error",
      );
      return;
    }

    let finalValue = editValue;
    if (configToUpdate.type === "boolean") {
      if (typeof editValue === "string") {
        finalValue = editValue.toLowerCase() === "true";
      } else {
        finalValue = Boolean(editValue);
      }
    } else if (configToUpdate.type === "number") {
      finalValue = Number(editValue);
    } else if (configToUpdate.type === "json") {
      try {
        
        
        finalValue =
          typeof editValue === "string"
            ? JSON.parse(editValue)
            : JSON.parse(JSON.stringify(editValue));
      } catch (e) {
        showToast(
          `Invalid JSON format for ${configToUpdate.settingName}. ${e.message}`,
          "error",
        );
        return;
      }
    }

    setLoading(true);
    try {
      const updatePayload = {
        settingValue: finalValue,
        
        
      };

      const result = await updateSystemConfigById(configId, updatePayload); 

      
      
      if (result && result.config) {
        showToast(
          result.message || "Configuration updated successfully!",
          "success",
        );
        setEditingId(null);

        setConfigs((prevConfigs) =>
          prevConfigs.map((c) =>
            c._id === configId
              ? { ...result.config, originalValue: result.config.settingValue } 
              : c,
          ),
        );
      } else {
        
        showToast(
          "Configuration updated, but response was unexpected.",
          "warning",
        );
        setEditingId(null);
        
        fetchConfigs();
      }
    } catch (err) {
      showToast(err.message || "Failed to update configuration.", "error");
      console.error(err);
      
      
    } finally {
      setLoading(false);
    }
  };

  const renderValueInput = (config) => {
    if (config.type === "boolean") {
      return (
        <select
          
          value={String(editValue)}
          onChange={(e) => setEditValue(e.target.value === "true")}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }
    if (config.type === "number") {
      return (
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      );
    }
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    );
  };

  if (loading && configs.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-4 text-lg font-medium text-gray-700">
          Loading Configurations...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <ShieldCheckIcon className="h-8 w-8 mr-3 text-indigo-600" />
          System Configuration Management
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          View and update system-wide settings. Changes may impact system
          behavior.
        </p>
      </header>

      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Setting Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Value
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Last Updated By
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {configs.map((config) => (
                <tr
                  key={config._id}
                  className={editingId === config._id ? "bg-indigo-50" : ""}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {config.settingName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === config._id ? (
                      renderValueInput(config)
                    ) : (
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          typeof config.settingValue === "boolean"
                            ? config.settingValue
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {String(config.settingValue)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className="text-sm text-gray-600 max-w-xs truncate"
                      title={config.description}
                    >
                      {config.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {config.lastUpdatedBy
                      ? config.lastUpdatedBy.username
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {editingId === config._id ? (
                      <>
                        <button
                          onClick={() => handleSave(config._id)}
                          disabled={loading}
                          className="text-green-600 hover:text-green-900 mr-3 disabled:opacity-50"
                          title="Save"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-red-600 hover:text-red-900"
                          title="Cancel"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEdit(config)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {configs.length === 0 && !loading && !error && (
        <div className="text-center py-10 text-gray-500">
          <InformationCircleIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          No system configurations found.
        </div>
      )}
    </div>
  );
};

export default SystemConfigManagement;
