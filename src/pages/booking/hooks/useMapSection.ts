
import { useState } from 'react';
import { toast } from 'sonner';

const useMapSection = () => {
  const [isReloadingMap, setIsReloadingMap] = useState(false);

  // Function to reload the map if there are issues
  const handleReloadMap = () => {
    setIsReloadingMap(true);
    
    // Short timeout to ensure cleanup before recreating
    setTimeout(() => {
      setIsReloadingMap(false);
      toast("Recargando mapa. Por favor espere...");
    }, 500);
  };

  return {
    isReloadingMap,
    handleReloadMap
  };
};

export default useMapSection;
