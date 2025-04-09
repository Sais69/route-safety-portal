
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Pencil } from 'lucide-react';

interface MapDisplayProps {
  mapRef: React.RefObject<HTMLDivElement>;
  isEditingMarkers: boolean;
  mapInitError: string | null;
  onReloadMap: () => void;
  onToggleEditMode: () => void;
  mapInitAttempts?: number;
}

const MapDisplay: React.FC<MapDisplayProps> = ({
  mapRef,
  isEditingMarkers,
  mapInitError,
  onReloadMap,
  onToggleEditMode,
  mapInitAttempts = 0
}) => {
  const [isMapVisible, setIsMapVisible] = useState(false);

  // Use IntersectionObserver to detect when map is visible in viewport
  useEffect(() => {
    if (!mapRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsMapVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(mapRef.current);
    
    return () => {
      if (mapRef.current) {
        observer.unobserve(mapRef.current);
      }
    };
  }, [mapRef.current]);

  // Make sure the map is properly sized when it becomes visible
  useEffect(() => {
    if (isMapVisible && mapRef.current && window.google && window.google.maps) {
      const map = mapRef.current;
      // Force a resize to ensure map renders properly
      setTimeout(() => {
        window.google?.maps?.event?.trigger(map, 'resize');
      }, 100);
    }
  }, [isMapVisible]);

  // Generate a suitable error message based on the number of attempts
  const getErrorMessage = () => {
    if (!mapInitError) return null;
    
    // If we've had multiple attempts, provide more detailed guidance
    if (mapInitAttempts > 1) {
      return (
        <>
          <div className="text-red-400 mb-3">
            <p>{mapInitError}</p>
            <p className="text-sm mt-2">Recomendamos:</p>
            <ul className="text-sm list-disc pl-5 mt-1">
              <li>Verificar su conexión a internet</li>
              <li>Probar con otro navegador (Chrome, Firefox, Safari)</li>
              <li>Desactivar bloqueadores de anuncios o scripts</li>
            </ul>
          </div>
        </>
      );
    }
    
    // Simple error message for first attempt
    return <div className="text-red-400 mb-2">{mapInitError}</div>;
  };

  return (
    <div className="h-[400px] rounded-md overflow-hidden border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] relative">
      {mapInitError ? (
        <div className="w-full h-full flex items-center justify-center bg-slate-800/70">
          <div className="text-center p-4 max-w-md">
            {getErrorMessage()}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button 
                onClick={onReloadMap}
                variant="outline"
                className="border-blue-500/30 text-blue-400"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar cargar mapa
              </Button>
              
              <Button
                variant="outline"
                className="border-blue-500/30 text-blue-400"
                onClick={() => {
                  // Attempt a full page reload as a last resort
                  window.location.reload();
                }}
              >
                Recargar página
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div ref={mapRef} className="w-full h-full" data-testid="map-container" id="google-map-container" />
          <div className="absolute top-2 right-2 flex gap-2 z-10">
            <Button 
              variant="outline" 
              size="icon" 
              className={`bg-slate-800/80 border-blue-500/30 text-blue-400 hover:bg-slate-700 ${isEditingMarkers ? 'ring-2 ring-blue-500' : ''}`}
              onClick={onToggleEditMode}
              title="Editar marcadores"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-slate-800/80 border-blue-500/30 text-blue-400 hover:bg-slate-700"
              onClick={onReloadMap}
              title="Recargar mapa"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default MapDisplay;
