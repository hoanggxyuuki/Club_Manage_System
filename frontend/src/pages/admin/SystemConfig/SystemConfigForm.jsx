import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const SystemConfigForm = ({ config, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    settingName: "",
    settingValue: "",
    description: "",
  });

  useEffect(() => {
    if (config) {
      setFormData({
        settingName: config.settingName || "",
        settingValue:
          config.settingValue !== undefined ? String(config.settingValue) : "",
        description: config.description || "",
      });
    } else {
      setFormData({
        settingName: "",
        settingValue: "",
        description: "",
      });
    }
  }, [config]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6">
          {config ? "Edit Setting" : "Add New Setting"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="settingName"
              className="block text-sm font-medium text-gray-700"
            >
              Setting Name
            </label>
            <input
              type="text"
              name="settingName"
              id="settingName"
              value={formData.settingName}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
              disabled={!!config} 
            />

            {!!config && (
              <p className="text-xs text-gray-500 mt-1">
                Setting name cannot be changed after creation.
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="settingValue"
              className="block text-sm font-medium text-gray-700"
            >
              Setting Value
            </label>
            <textarea
              name="settingValue"
              id="settingValue"
              value={formData.settingValue}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
            />

            <p className="text-xs text-gray-500 mt-1">
              Enter value as text. For booleans, use "true" or "false". For
              JSON, ensure valid format.
            </p>
          </div>

          <div className="mb-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {config ? "Save Changes" : "Create Setting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

SystemConfigForm.propTypes = {
  config: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SystemConfigForm;
