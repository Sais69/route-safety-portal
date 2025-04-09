
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Pencil, AlertCircle, FileWarning, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { GOOGLE_MAPS_API_KEY } from '@/constants';

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
  const [isContainerReady, setIsContainerReady] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [manualRefreshCount, setManualRefreshCount] = useState(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const hasApiKey = Boolean(GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 20);

  // Use IntersectionObserver to detect when map is visible in viewport
  useEffect(() => {
    if (!mapRef.current) return;
    
    setIsContainerReady(true);
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsMapVisible(true);
          observer.unobserve(entry.target);
          
          // When map becomes visible, force a resize event
          setTimeout(() => {
            if (window.google && window.google.maps && mapRef.current) {
              console.log('Map is visible - triggering resize event');
              window.google.maps.event.trigger(mapRef.current, 'resize');
              
              // Add a debug marker to the center of the map
              try {
                // Try to find the map instance using DOM traversal
                const mapDiv = mapRef.current.querySelector('div[aria-roledescription="map"]');
                if (mapDiv) {
                  // Look for a map instance associated with this element
                  const mapInstance = window.google.maps.Map ? 
                    Array.from(window.google.maps.Map.prototype.constructor.instances || [])
                      .find((map: any) => map.getDiv() === mapDiv) : 
                    null;
                    
                  if (mapInstance) {
                    // Force center to Quito and add a marker
                    const center = { lat: -0.1807, lng: -78.4678 };
                    mapInstance.setCenter(center);
                    
                    // Create a debug marker
                    new window.google.maps.Marker({
                      position: center,
                      map: mapInstance,
                      title: "Debug marker - Map center"
                    });
                  }
                }
              } catch (e) {
                console.error("Error adding debug marker:", e);
              }
            }
          }, 100);
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

  // Effect to force manual refresh of map if it appears gray
  useEffect(() => {
    if (!mapRef.current || !isMapVisible || !window.google || !window.google.maps) return;
    
    // Schedule periodic attempts to refresh the map
    const refreshTimer = setTimeout(() => {
      if (window.google && window.google.maps) {
        console.log('Forcing map refresh (manual timer)');
        window.google.maps.event.trigger(mapRef.current, 'resize');
        
        // Try to access the map instance using DOM traversal (safer approach)
        try {
          // Find the first map instance in this container
          const mapDiv = mapRef.current.querySelector('div[aria-roledescription="map"]');
          if (mapDiv) {
            // Look for a map instance associated with this element
            const mapInstance = window.google.maps.Map ? 
              Array.from(window.google.maps.Map.prototype.constructor.instances || [])
                .find((map: any) => map.getDiv() === mapDiv) : 
              null;
            
            if (mapInstance) {
              mapInstance.setZoom(mapInstance.getZoom() || 11);
            }
          }
        } catch (e) {
          console.error("Error refreshing map:", e);
        }
        
        setManualRefreshCount(prev => prev + 1);
      }
    }, 2000);
    
    return () => clearTimeout(refreshTimer);
  }, [isMapVisible, manualRefreshCount, isContainerReady]);

  // Setup a resize observer to ensure map resizes when container does
  useEffect(() => {
    if (!mapRef.current || !isMapVisible) return;
    
    // Initialize resize observer to handle container size changes
    resizeObserverRef.current = new ResizeObserver((entries) => {
      if (entries[0] && window.google && window.google.maps) {
        console.log('Container resized - triggering map resize');
        window.google.maps.event.trigger(mapRef.current, 'resize');
      }
    });
    
    // Start observing the map container
    resizeObserverRef.current.observe(mapRef.current);
    
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [mapRef.current, isMapVisible]);

  // Make sure the map is properly sized when it becomes visible
  useEffect(() => {
    if (isMapVisible && isContainerReady && mapRef.current && window.google && window.google.maps) {
      console.log('Ensuring map is properly sized after becoming visible');
      
      // Force multiple resize events to ensure map renders properly
      const resizeTimes = [100, 300, 600, 1000, 2000]; // Try at different intervals
      
      resizeTimes.forEach(time => {
        setTimeout(() => {
          if (window.google?.maps?.event && mapRef.current) {
            window.google.maps.event.trigger(mapRef.current, 'resize');
            
            // Try to access the map instance using DOM traversal
            try {
              const mapDiv = mapRef.current.querySelector('div[aria-roledescription="map"]');
              if (mapDiv) {
                // Look for a map instance associated with this element
                const mapInstance = window.google.maps.Map ? 
                  Array.from(window.google.maps.Map.prototype.constructor.instances || [])
                    .find((map: any) => map.getDiv() === mapDiv) : 
                  null;
                  
                if (mapInstance) {
                  // Force a zoom change to trigger redraw
                  const currentZoom = mapInstance.getZoom();
                  if (currentZoom) {
                    mapInstance.setZoom(currentZoom);
                  }
                }
              }
            } catch (e) {
              console.warn("Error accessing map instance:", e);
            }
          }
        }, time);
      });
    }
  }, [isMapVisible, isContainerReady]);

  // Handle map reload with additional logging
  const handleReloadClick = () => {
    console.log('User requested map reload');
    setIsReloading(true);
    
    // Show toast
    toast.info('Recargando mapa. Por favor espere...');
    
    // Verify we have the API key
    console.log('API Key for reload:', GOOGLE_MAPS_API_KEY ? 'Available (length: ' + GOOGLE_MAPS_API_KEY.length + ')' : 'Not available');
    
    // Small timeout to show loading state
    setTimeout(() => {
      onReloadMap();
      setTimeout(() => {
        setIsReloading(false);
        
        // Increment manual refresh counter to trigger additional resize events
        setManualRefreshCount(prev => prev + 1);
      }, 1000);
    }, 300);
  };

  // Full page reload for persistent issues
  const handleFullReload = () => {
    toast.info('Recargando la página completa...');
    console.log('Performing full page reload with API key:', GOOGLE_MAPS_API_KEY ? 'Available' : 'Not available');
    localStorage.setItem('mapReloadAttempt', (parseInt(localStorage.getItem('mapReloadAttempt') || '0') + 1).toString());
    setTimeout(() => window.location.reload(), 500);
  };

  // Generate a suitable error message based on the number of attempts and API key status
  const getErrorMessage = () => {
    if (!mapInitError) return null;
    
    if (!hasApiKey) {
      return (
        <>
          <div className="flex items-center mb-3 text-red-400">
            <KeyRound className="mr-2 h-5 w-5" />
            <p className="font-semibold">Error de configuración: No se encontró la API key de Google Maps</p>
          </div>
          <p className="text-sm mt-2 text-gray-300">
            La aplicación no puede conectarse con Google Maps porque falta la API key o es inválida.
          </p>
          <p className="text-sm mt-2 text-blue-400">
            Estamos intentando recuperar la API key automáticamente...
          </p>
        </>
      );
    }
    
    // If we've had multiple attempts, provide more detailed guidance
    if (mapInitAttempts > 1) {
      return (
        <>
          <div className="flex items-center mb-3 text-red-400">
            <AlertCircle className="mr-2 h-5 w-5" />
            <p className="font-semibold">{mapInitError}</p>
          </div>
          <p className="text-sm mt-2 text-blue-400">Recomendamos:</p>
          <ul className="text-sm list-disc pl-5 mt-1 text-gray-300">
            <li>Verificar su conexión a internet</li>
            <li>Probar con otro navegador (Chrome, Firefox, Safari)</li>
            <li>Desactivar bloqueadores de anuncios o scripts</li>
            <li>Probar recargando la página completa</li>
          </ul>
        </>
      );
    }
    
    // Simple error message for first attempt
    return (
      <div className="flex items-center mb-3 text-red-400">
        <AlertCircle className="mr-2 h-5 w-5" />
        <p>{mapInitError}</p>
      </div>
    );
  };

  return (
    <div className="h-[400px] rounded-md overflow-hidden border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] relative">
      {mapInitError ? (
        <div className="w-full h-full flex items-center justify-center bg-slate-800/70">
          <div className="text-center p-4 max-w-md">
            {getErrorMessage()}
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
              <Button 
                onClick={handleReloadClick}
                variant="outline"
                className="border-blue-500/30 text-blue-400"
                disabled={isReloading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isReloading ? 'animate-spin' : ''}`} />
                {isReloading ? 'Recargando...' : 'Reintentar cargar mapa'}
              </Button>
              
              <Button
                variant="outline"
                className="border-blue-500/30 text-blue-400"
                onClick={handleFullReload}
              >
                Recargar página
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div 
            ref={mapRef} 
            className="w-full h-full bg-slate-200" 
            data-testid="map-container" 
            id="google-map-container" 
            style={{ width: '100%', height: '400px', minHeight: '400px' }}
          />
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
              onClick={handleReloadClick}
              title="Recargar mapa"
              disabled={isReloading}
            >
              <RefreshCw className={`h-4 w-4 ${isReloading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default MapDisplay;
