
export interface Stop {
  id: string;
  placeName: string;
  location: google.maps.LatLngLiteral;
}

export interface MapSectionProps {
  origin: google.maps.LatLngLiteral | null;
  destination: google.maps.LatLngLiteral | null;
  setOrigin: (origin: google.maps.LatLngLiteral | null) => void;
  setDestination: (destination: google.maps.LatLngLiteral | null) => void;
  originPlace: string;
  destinationPlace: string;
  setOriginPlace: (place: string) => void;
  setDestinationPlace: (place: string) => void;
  intermediateStops: Array<Stop>;
  setIntermediateStops: React.Dispatch<React.SetStateAction<Stop[]>>;
  distance: number;
  setDistance: (distance: number) => void;
  isEditingMarkers: boolean;
  setIsEditingMarkers: (isEditing: boolean) => void;
  calculateRoute: () => void;
  duration?: string;
}
