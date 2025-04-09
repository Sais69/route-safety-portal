
import React from 'react';
import { MapPin, Clock } from 'lucide-react';

interface RouteInfoProps {
  distance: number;
  duration?: string;
  className?: string;
}

const RouteInfo: React.FC<RouteInfoProps> = ({ distance, duration, className = '' }) => {
  return (
    <div className={`flex flex-wrap md:flex-nowrap md:items-center justify-between p-3 bg-slate-800/50 border border-blue-500/20 rounded-md ${className}`}>
      <div className="flex items-center mb-2 md:mb-0">
        <MapPin className="h-4 w-4 mr-2 text-blue-400" />
        <span className="text-gray-300">Distancia: <strong className="text-white">{distance.toFixed(1)} km</strong></span>
      </div>
      {duration && (
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-blue-400" />
          <span className="text-gray-300">Duración estimada: <strong className="text-white">{duration}</strong></span>
        </div>
      )}
    </div>
  );
};

export default RouteInfo;
