
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { GOOGLE_MAPS_API_KEY, initializeApiKeys, storeGoogleMapsApiKey } from '@/constants';
import { supabase } from '@/integrations/supabase/client';

const useMapSection = () => {
  const [isReloadingMap, setIsReloadingMap] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [lastApiKeyUpdate, setLastApiKeyUpdate] = useState<number>(0);
  const [isDbKeyLoaded, setIsDbKeyLoaded] = useState(false);

  // Check if the API key has been updated in the last 30 seconds
  const hasRecentlyUpdated = useCallback(() => {
    return (Date.now() - lastApiKeyUpdate) < 30000;
  }, [lastApiKeyUpdate]);

  // Attempt to load the API key from database on mount
  useEffect(() => {
    const loadDbApiKey = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'GOOGLE_MAPS_API_KEY')
          .single();
        
        if (!error && data && data.value) {
          console.log('Retrieved API key from database on init');
          setIsDbKeyLoaded(true);
        }
      } catch (err) {
        console.warn('Could not check for API key in database:', err);
      }
    };
    
    loadDbApiKey();
  }, []);

  // Initialize the API key on component mount if needed
  useEffect(() => {
    const loadApiKey = async () => {
      // Only attempt to load if we haven't recently updated
      if (!checkApiKey() && !hasRecentlyUpdated() && !isInitializing) {
        console.log("No valid API key found on initial load, attempting to load one");
        await handleReloadMap();
      }
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
      // Try to reinitialize the API key first
      toast.info("Obteniendo API key de Google Maps...");
      
      const success = await initializeApiKeys();
      
      if (success) {
        setLastApiKeyUpdate(Date.now());
        toast.success("API key actualizada correctamente. Recargando mapa...");
        console.log("API key initialization successful");
        
        // Si obtuvimos la key de la función Edge pero no está en la base de datos,
        // intentamos guardarla para futuros usos
        if (!isDbKeyLoaded && GOOGLE_MAPS_API_KEY) {
          console.log("Storing API key in database for future use");
          const stored = await storeGoogleMapsApiKey(GOOGLE_MAPS_API_KEY);
          if (stored) {
            setIsDbKeyLoaded(true);
            console.log("API key stored in database successfully");
          }
        }
      } else {
        toast.error("No se pudo obtener la API key. Reintentando cargar el mapa...");
        console.error("Failed to initialize API key");
      }
      
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
  }, [isInitializing, isReloadingMap, hasRecentlyUpdated, isDbKeyLoaded]);

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
