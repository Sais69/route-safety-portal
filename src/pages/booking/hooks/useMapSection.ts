
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { GOOGLE_MAPS_API_KEY, initializeApiKeys } from '@/constants';

const useMapSection = () => {
  const [isReloadingMap, setIsReloadingMap] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [lastApiKeyUpdate, setLastApiKeyUpdate] = useState<number>(0);
  const [isDbKeyLoaded, setIsDbKeyLoaded] = useState(false);

  // Check if the API key has been updated in the last 30 seconds
  const hasRecentlyUpdated = useCallback(() => {
    return (Date.now() - lastApiKeyUpdate) < 30000;
  }, [lastApiKeyUpdate]);

  // Attempt to load the API key on mount
  useEffect(() => {
    const loadApiKey = async () => {
      // We already have a valid API key set statically now
      setIsDbKeyLoaded(true);
    };
    
    loadApiKey();
  }, []);

  // Function to reload the map if there are issues
  const handleReloadMap = useCallback(async () => {
    if (isInitializing || isReloadingMap) {
      console.log("Already initializing or reloading, skipping duplicate request");
      return;
    }

    console.log("Starting map reload process");
    setIsReloadingMap(true);
    setIsInitializing(true);
    
    try {
      // Key is already set statically now
      setLastApiKeyUpdate(Date.now());
      toast.success("Mapa inicializado correctamente. Recargando...");
      console.log("Using API key:", GOOGLE_MAPS_API_KEY.substring(0, 5) + '...');
      
      // Short timeout to ensure cleanup before recreating
      setTimeout(() => {
        setIsReloadingMap(false);
        toast.info("Recargando mapa. Por favor espere...");
      }, 800);
    } catch (error) {
      console.error("Error reloading map:", error);
      toast.error("Error al recargar el mapa. Por favor, intente nuevamente.");
      setIsReloadingMap(false);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, isReloadingMap, hasRecentlyUpdated]);

  // Function to check if we have a valid API key
  const checkApiKey = useCallback(() => {
    const hasKey = Boolean(GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 20);
    console.log("API key check result:", hasKey ? "Valid key present" : "No valid key");
    return hasKey;
  }, []);

  return {
    isReloadingMap,
    isInitializing,
    handleReloadMap,
    checkApiKey,
    hasRecentlyUpdated,
    isDbKeyLoaded
  };
};

export default useMapSection;
