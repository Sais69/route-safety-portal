
import { GOOGLE_MAPS_API_KEY } from "@/constants";

// Function to load the Google Maps script
export const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps API already loaded');
      resolve();
      return;
    }

    // Create a div to track script loading status
    const mapTrackingDiv = document.createElement('div');
    mapTrackingDiv.id = 'google-maps-loading-status';
    document.body.appendChild(mapTrackingDiv);

    console.log('Loading Google Maps with API key:', GOOGLE_MAPS_API_KEY ? 'Available' : 'Not available');

    try {
      // Remove any existing script tags to prevent duplicates
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      existingScripts.forEach(script => script.remove());

      // Set a global callback that will be called when the API loads
      window.initMap = () => {
        console.log('Google Maps API loaded via callback');
        if (document.body.contains(mapTrackingDiv)) {
          document.body.removeChild(mapTrackingDiv);
        }
        resolve();
      };

      // Create the script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap&v=weekly`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-script';
      script.crossOrigin = "anonymous";
      script.type = "text/javascript";
      
      // Handle success and error cases
      script.onload = () => {
        console.log('Google Maps script tag loaded (onload event)');
        
        // Sometimes the callback might not get called, so we'll set a backup timer
        setTimeout(() => {
          if (window.google && window.google.maps && !document.body.contains(mapTrackingDiv)) {
            // Already resolved
            return;
          }
          
          if (window.google && window.google.maps) {
            console.log('Google Maps API loaded but callback not triggered. Resolving manually.');
            if (document.body.contains(mapTrackingDiv)) {
              document.body.removeChild(mapTrackingDiv);
            }
            resolve();
          }
        }, 1000);
      };

      script.onerror = (error) => {
        console.error('Failed to load Google Maps API:', error);
        if (document.body.contains(mapTrackingDiv)) {
          document.body.removeChild(mapTrackingDiv);
        }
        reject(new Error('Failed to load Google Maps API - Network Error'));
      };

      // Add the script to the document
      document.head.appendChild(script);
      
      // Set a timeout to catch cases where the script loads but doesn't initialize properly
      setTimeout(() => {
        if (!window.google || !window.google.maps) {
          console.error('Google Maps API failed to initialize within timeout period');
          if (document.body.contains(mapTrackingDiv)) {
            document.body.removeChild(mapTrackingDiv);
          }
          reject(new Error('Google Maps API initialization timed out'));
        }
      }, 20000); // 20 seconds timeout (increased from 15)
    } catch (error) {
      console.error('Error setting up Google Maps script:', error);
      if (document.body.contains(mapTrackingDiv)) {
        document.body.removeChild(mapTrackingDiv);
      }
      reject(error);
    }
  });
};

// Function to check if Google Maps is loaded
export const isGoogleMapsLoaded = (): boolean => {
  const isLoaded = !!(window.google && window.google.maps);
  console.log('Checking if Google Maps is loaded:', isLoaded);
  return isLoaded;
};

// Add global initMap type to window
declare global {
  interface Window {
    initMap: () => void;
  }
}
