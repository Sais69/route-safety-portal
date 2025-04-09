
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { GOOGLE_MAPS_API_KEY, initializeApiKeys } from '@/constants';

const useMapSection = () => {
  const [isReloadingMap, setIsReloadingMap] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Function to reload the map if there are issues
  const handleReloadMap = useCallback(async () => {
    setIsReloadingMap(true);
    setIsInitializing(true);
    
    try {
      // Try to reinitialize the API key first
      const success = await initializeApiKeys();
      
      if (success) {
        toast.success("API key actualizada correctamente. Recargando mapa...");
      } else {
        toast.error("No se pudo obtener la API key. Reintentando cargar el mapa de todos modos...");
      }
      
      // Short timeout to ensure cleanup before recreating
      setTimeout(() => {
        setIsReloadingMap(false);
        toast.info("Recargando mapa. Por favor espere...");
      }, 500);
    } catch (error) {
      console.error("Error reloading map:", error);
      toast.error("Error al recargar el mapa. Por favor, intente nuevamente.");
      setIsReloadingMap(false);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Function to check if we have a valid API key
  const checkApiKey = useCallback(() => {
    return Boolean(GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 10);
  }, []);

  return {
    isReloadingMap,
    isInitializing,
    handleReloadMap,
    checkApiKey
  };
};

export default useMapSection;
