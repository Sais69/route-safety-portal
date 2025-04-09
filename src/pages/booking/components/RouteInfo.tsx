
import React from 'react';
import { MapPin } from 'lucide-react';

interface RouteInfoProps {
  distance: number;
  duration?: string;
}

const RouteInfo: React.FC<RouteInfoProps> = ({ distance, duration }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-blue-500/20 rounded-md">
      <div className="flex items-center">
        <MapPin className="h-4 w-4 mr-2 text-blue-400" />
        <span className="text-gray-300">Distancia: <strong className="text-white">{distance.toFixed(1)} km</strong></span>
      </div>
      {duration && (
        <div className="flex items-center">
          <span className="text-gray-300">Duración: <strong className="text-white">{duration}</strong></span>
        </div>
      )}
    </div>
  );
};

export default RouteInfo;
