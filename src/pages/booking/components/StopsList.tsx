
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface Stop {
  id: string;
  placeName: string;
  location: google.maps.LatLngLiteral;
}

interface StopsListProps {
  stops: Stop[];
  onRemoveStop: (id: string) => void;
}

const StopsList: React.FC<StopsListProps> = ({ stops, onRemoveStop }) => {
  if (stops.length === 0) return null;
  
  return (
    <div className="space-y-2">
      <Label className="text-blue-400">Paradas Intermedias:</Label>
      <ul className="list-none space-y-1">
        {stops.map((stop) => (
          <li key={stop.id} className="flex items-center justify-between p-2 bg-slate-800/50 border border-blue-500/20 rounded-md">
            <span className="text-gray-300 break-words flex-1 mr-2">{stop.placeName}</span>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => onRemoveStop(stop.id)}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StopsList;
