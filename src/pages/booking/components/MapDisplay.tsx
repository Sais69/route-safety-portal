
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Pencil } from 'lucide-react';

interface MapDisplayProps {
  mapRef: React.RefObject<HTMLDivElement>;
  isEditingMarkers: boolean;
  mapInitError: string | null;
  onReloadMap: () => void;
  onToggleEditMode: () => void;
}

const MapDisplay: React.FC<MapDisplayProps> = ({
  mapRef,
  isEditingMarkers,
  mapInitError,
  onReloadMap,
  onToggleEditMode
}) => {
  return (
    <div className="h-[400px] rounded-md overflow-hidden border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] relative">
      {mapInitError ? (
        <div className="w-full h-full flex items-center justify-center bg-slate-800/70">
          <div className="text-center p-4">
            <div className="text-red-400 mb-2">{mapInitError}</div>
            <Button 
              onClick={onReloadMap}
              variant="outline"
              className="border-blue-500/30 text-blue-400"
            >
              Reintentar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div ref={mapRef} className="w-full h-full" />
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
