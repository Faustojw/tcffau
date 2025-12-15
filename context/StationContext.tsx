import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Station } from '../types';
import { getStations } from '../services/mockData';

interface StationContextType {
  stations: Station[];
  isLoading: boolean;
  refreshStations: () => Promise<void>;
}

const StationContext = createContext<StationContextType | undefined>(undefined);

export const StationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStations = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate network request/refresh
      const data = await getStations();
      setStations(data);
    } catch (error) {
      console.error("Failed to fetch stations", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refreshStations();
  }, [refreshStations]);

  return (
    <StationContext.Provider value={{ stations, isLoading, refreshStations }}>
      {children}
    </StationContext.Provider>
  );
};

export const useStations = () => {
  const context = useContext(StationContext);
  if (context === undefined) {
    throw new Error('useStations must be used within a StationProvider');
  }
  return context;
};