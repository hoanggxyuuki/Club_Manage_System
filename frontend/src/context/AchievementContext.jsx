import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getAllAchievements,
  getMemberAchievements,
} from "../services/achievement";
import { useAuth } from "./AuthContext";

const AchievementContext = createContext();

export const useAchievement = () => useContext(AchievementContext);

export const AchievementProvider = ({ children }) => {
  const [achievements, setAchievements] = useState([]);
  const [memberAchievements, setMemberAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  
  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const data = await getAllAchievements();
      setAchievements(data);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  
  const fetchMemberAchievements = async (memberId) => {
    try {
      setLoading(true);
      const data = await getMemberAchievements(memberId);
      setMemberAchievements(data);
    } catch (error) {
      console.error("Error fetching member achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    fetchAchievements();
    if (user?._id) {
      fetchMemberAchievements(user._id);
    }
  }, [user?._id]);

  const value = {
    achievements,
    memberAchievements,
    loading,
    fetchAchievements,
    fetchMemberAchievements,
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
};
