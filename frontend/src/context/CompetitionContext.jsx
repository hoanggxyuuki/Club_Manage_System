import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getAllCompetitions,
  getCompetitionById,
  joinCompetition,
} from "../services/competition";
import { useAuth } from "./AuthContext";

const CompetitionContext = createContext();

export const useCompetition = () => useContext(CompetitionContext);

export const CompetitionProvider = ({ children }) => {
  const [competitions, setCompetitions] = useState([]);
  const [activeCompetition, setActiveCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  
  const fetchCompetitions = async (filters = {}) => {
    try {
      setLoading(true);
      const data = await getAllCompetitions(filters);
      setCompetitions(data);
    } catch (error) {
      console.error("Error fetching competitions:", error);
    } finally {
      setLoading(false);
    }
  };

  
  const fetchCompetition = async (id) => {
    try {
      setLoading(true);
      const data = await getCompetitionById(id);
      setActiveCompetition(data);
    } catch (error) {
      console.error("Error fetching competition:", error);
    } finally {
      setLoading(false);
    }
  };

  
  const handleJoinCompetition = async (competitionId) => {
    try {
      setLoading(true);
      await joinCompetition(competitionId);
      
      await fetchCompetition(competitionId);
      
      await fetchCompetitions();
    } catch (error) {
      console.error("Error joining competition:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  
  const isParticipant = (competition) => {
    return competition?.participants.some((p) => p.member?._id === user?._id);
  };

  
  useEffect(() => {
    fetchCompetitions();
  }, []);

  const value = {
    competitions,
    activeCompetition,
    loading,
    fetchCompetitions,
    fetchCompetition,
    handleJoinCompetition,
    isParticipant,
  };

  return (
    <CompetitionContext.Provider value={value}>
      {children}
    </CompetitionContext.Provider>
  );
};
