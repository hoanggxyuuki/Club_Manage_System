import React, { createContext, useContext, useState } from "react";
import * as matchService from "../services/match";

const MatchContext = createContext(null);

export const useMatch = () => {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error("useMatch must be used within a MatchProvider");
  }
  return context;
};

export const MatchProvider = ({ children }) => {
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPotentialMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await matchService.getPotentialMatches();

      if (data.message && data.matches) {
        
        setError(data.message);
        setPotentialMatches([]);
      } else {
        setPotentialMatches(data);
      }
    } catch (err) {
      setError(err.message);
      setPotentialMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await matchService.getMatches();
      setMatches(data);
    } catch (err) {
      setError(err.message);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const createMatch = async (user2Id) => {
    try {
      setLoading(true);
      setError(null);
      const match = await matchService.createMatch(user2Id);
      
      setPotentialMatches((prev) =>
        prev.filter((m) => m.user?._id !== user2Id),
      );
      
      setMatches((prev) => [...prev, match]);
      return match;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const respondToMatch = async (matchId, accepted) => {
    try {
      setLoading(true);
      setError(null);
      const updatedMatch = await matchService.respondToMatch(matchId, accepted);
      setMatches((prev) =>
        prev.map((match) => (match?._id === matchId ? updatedMatch : match)),
      );
      return updatedMatch;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    potentialMatches,
    matches,
    loading,
    error,
    loadPotentialMatches,
    loadMatches,
    createMatch,
    respondToMatch,
  };

  return (
    <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
  );
};
