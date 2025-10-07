import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const SystemConfigForm = ({ initialData, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (initialData) {
      
      const { _id, __v, ...editableData } = initialData;
      setFormData(editableData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderFormField = (key, value) => {
    const type = typeof value;
    if (type === "boolean") {
      return (
        <div key={key} className="mb-4">
          <label
            htmlFor={key}
            className="block text-sm font-medium text-gray-700 capitalize mb-1"
          >
            {key.replace(/([A-Z])/g, " $1")}
          </label>
          <input
            type="checkbox"
            id={key}
            name={key}
            checked={formData[key] || false}
            onChange={handleChange}
            className="mt-1 h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
        </div>
      );
    } else if (type === "number") {
      return (
        <div key={key} className="mb-4">
          <label
            htmlFor={key}
            className="block text-sm font-medium text-gray-700 capitalize"
          >
            {key.replace(/([A-Z])/g, " $1")}
          </label>
          <input
            type="number"
            id={key}
            name={key}
            value={formData[key] || ""}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      );
    } else if (type === "string") {
      
      if (/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
        return (
          <div key={key} className="mb-4">
            <label
              htmlFor={key}
              className="block text-sm font-medium text-gray-700 capitalize"
            >
              {key.replace(/([A-Z])/g, " $1")}
            </label>
            <input
              type="color"
              id={key}
              name={key}
              value={formData[key] || ""}
              onChange={handleChange}
              className="mt-1 block w-full h-10 px-1 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        );
      }
      return (
        <div key={key} className="mb-4">
          <label
            htmlFor={key}
            className="block text-sm font-medium text-gray-700 capitalize"
          >
            {key.replace(/([A-Z])/g, " $1")}
          </label>
          <input
            type="text"
            id={key}
            name={key}
            value={formData[key] || ""}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      );
    } else if (Array.isArray(value)) {
      return (
        <div key={key} className="mb-4">
          <label
            htmlFor={key}
            className="block text-sm font-medium text-gray-700 capitalize"
          >
            {key.replace(/([A-Z])/g, " $1")} (comma-separated)
          </label>
          <textarea
            id={key}
            name={key}
            value={Array.isArray(formData[key]) ? formData[key].join(", ") : ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                [key]: e.target.value.split(",").map((item) => item.trim()),
              })
            }
            rows="3"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      );
    }
    
    return null;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4"
    >
      {Object.entries(formData).map(([key, value]) =>
        renderFormField(key, value),
      )}
      <div className="flex items-center justify-end mt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              Saving...
            </div>
          ) : (
            "Save Configuration"
          )}
        </button>
      </div>
    </form>
  );
};

SystemConfigForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

SystemConfigForm.defaultProps = {
  initialData: {},
  isLoading: false,
};

export default SystemConfigForm;
