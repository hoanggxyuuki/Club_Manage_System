import React, { useEffect } from "react";
import { useMatch } from "../../context/MatchContext";

const MatchPreferences = () => {
  const { preferences, loadPreferences, updatePreferences, loading } =
    useMatch();

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      interestedIn: formData.get("interestedIn"),
      ageRange: {
        min: parseInt(formData.get("minAge")),
        max: parseInt(formData.get("maxAge")),
      },
      interests: formData
        .get("interests")
        .split(",")
        .map((i) => i.trim()),
      locationPreference: {
        sameCity: formData.get("sameCity") === "true",
        sameProvince: formData.get("sameProvince") === "true",
      },
    };
    await updatePreferences(data);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Match Preferences</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Interested In
          </label>
          <select
            name="interestedIn"
            defaultValue={preferences?.interestedIn}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Minimum Age
            </label>
            <input
              type="number"
              name="minAge"
              min="18"
              max="100"
              defaultValue={preferences?.ageRange?.min || 18}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Maximum Age
            </label>
            <input
              type="number"
              name="maxAge"
              min="18"
              max="100"
              defaultValue={preferences?.ageRange?.max || 100}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Interests (comma-separated)
          </label>
          <input
            type="text"
            name="interests"
            defaultValue={preferences?.interests?.join(", ")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="reading, music, sports..."
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="sameCity"
              value="true"
              defaultChecked={preferences?.locationPreference?.sameCity}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />

            <label className="ml-2 block text-sm text-gray-700">
              Match with people in the same city
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="sameProvince"
              value="true"
              defaultChecked={preferences?.locationPreference?.sameProvince}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />

            <label className="ml-2 block text-sm text-gray-700">
              Match with people in the same province
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Preferences"}
        </button>
      </form>
    </div>
  );
};

export default MatchPreferences;
