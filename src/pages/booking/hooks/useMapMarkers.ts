import { useState, useEffect } from 'react';
import { Stop } from '../types/map';

interface UseMapMarkersProps {
  map: google.maps.Map | null;
  isEditingMarkers: boolean;
  setOrigin: (location: google.maps.LatLngLiteral | null) => void;
  setDestination: (location: google.maps.LatLngLiteral | null) => void;
  setOriginPlace: (place: string) => void;
  setDestinationPlace: (place: string) => void;
  setIntermediateStops: React.Dispatch<React.SetStateAction<Stop[]>>;
}

export const useMapMarkers = ({
  map,
  isEditingMarkers,
  setOrigin,
  setDestination,
  setOriginPlace,
  setDestinationPlace,
  setIntermediateStops
}: UseMapMarkersProps) => {
  const [originMarker, setOriginMarker] = useState<google.maps.Marker | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<google.maps.Marker | null>(null);
  const [stopMarkers, setStopMarkers] = useState<google.maps.Marker[]>([]);

  // Update markers to be draggable or not based on edit mode
  const updateMarkersForEditing = (draggable: boolean) => {
    if (originMarker) {
      originMarker.setDraggable(draggable);
    }
    
    if (destinationMarker) {
      destinationMarker.setDraggable(draggable);
    }
    
    stopMarkers.forEach(marker => {
      marker.setDraggable(draggable);
    });
  };

  // Reverse geocode to get address from coordinates
  const reverseGeocode = (location: google.maps.LatLngLiteral, callback: (address: string) => void) => {
    if (!window.google) return;
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        callback(results[0].formatted_address);
      } else {
        callback(`${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`);
      }
    });
  };

  // Create or update a marker
  const createOrUpdateMarker = (type: 'origin' | 'destination' | 'stop', position: google.maps.LatLngLiteral, title: string, stopId?: string) => {
    if (!map) return null;
    
    // Create marker icon based on type
    const createIcon = (fillColor: string) => {
      return {
        path: "M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z",
        fillColor: fillColor,
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#FFFFFF',
        scale: 1.5,
        anchor: new google.maps.Point(12, 22),
      };
    };
    
    // Set up marker properties based on type
    let marker: google.maps.Marker | null = null;
    let iconColor = '';
    
    if (type === 'origin') {
      iconColor = '#3b82f6'; // Blue
      
      // Remove existing marker if it exists
      if (originMarker) {
        originMarker.setMap(null);
      }
      
      // Create new marker
      marker = new window.google.maps.Marker({
        position,
        map,
        title: 'Origen: ' + title,
        draggable: isEditingMarkers,
        icon: createIcon(iconColor),
        zIndex: 10
      });
      
      // Add drag events
      marker.addListener('dragend', () => {
        if (!marker) return;
        const newPos = marker.getPosition();
        if (newPos) {
          const newLocation = { lat: newPos.lat(), lng: newPos.lng() };
          setOrigin(newLocation);
          
          // Update address through reverse geocoding
          reverseGeocode(newLocation, (address) => {
            setOriginPlace(address);
          });
        }
      });
      
      setOriginMarker(marker);
    } 
    else if (type === 'destination') {
      iconColor = '#16a34a'; // Green
      
      // Remove existing marker if it exists
      if (destinationMarker) {
        destinationMarker.setMap(null);
      }
      
      // Create new marker
      marker = new window.google.maps.Marker({
        position,
        map,
        title: 'Destino: ' + title,
        draggable: isEditingMarkers,
        icon: createIcon(iconColor),
        zIndex: 10
      });
      
      // Add drag events
      marker.addListener('dragend', () => {
        if (!marker) return;
        const newPos = marker.getPosition();
        if (newPos) {
          const newLocation = { lat: newPos.lat(), lng: newPos.lng() };
          setDestination(newLocation);
          
          // Update address through reverse geocoding
          reverseGeocode(newLocation, (address) => {
            setDestinationPlace(address);
          });
        }
      });
      
      setDestinationMarker(marker);
    }
    else if (type === 'stop' && stopId) {
      iconColor = '#f97316'; // Orange
      
      // Create new marker
      marker = new window.google.maps.Marker({
        position,
        map,
        title: 'Parada: ' + title,
        draggable: isEditingMarkers,
        icon: createIcon(iconColor),
        zIndex: 9
      });
      
      // Add drag events
      marker.addListener('dragend', () => {
        if (!marker || !stopId) return;
        const newPos = marker.getPosition();
        if (newPos) {
          const newLocation = { lat: newPos.lat(), lng: newPos.lng() };
          
          // Update the stop in the intermediate stops array
          setIntermediateStops(prevStops => 
            prevStops.map(stop => 
              stop.id === stopId 
                ? { ...stop, location: newLocation } 
                : stop
            )
          );
          
          // Update address through reverse geocoding
          reverseGeocode(newLocation, (address) => {
            setIntermediateStops(prevStops => 
              prevStops.map(stop => 
                stop.id === stopId 
                  ? { ...stop, placeName: address } 
                  : stop
              )
            );
          });
        }
      });
      
      // Add to stop markers array
      setStopMarkers(prev => [...prev.filter(m => m !== marker), marker as google.maps.Marker]);
    }
    
    return marker;
  };

  // Clean up markers on component unmount
  useEffect(() => {
    return () => {
      if (originMarker) originMarker.setMap(null);
      if (destinationMarker) destinationMarker.setMap(null);
      stopMarkers.forEach(marker => marker.setMap(null));
    };
  }, []);

  return {
    originMarker,
    destinationMarker,
    stopMarkers,
    setStopMarkers,
    updateMarkersForEditing,
    createOrUpdateMarker,
    reverseGeocode
  };
};

export default useMapMarkers;
