
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

    console.log('Loading Google Maps with API key:', GOOGLE_MAPS_API_KEY.substring(0, 5) + '...');

    try {
      // Remove any existing script tags to prevent duplicates
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      existingScripts.forEach(script => script.remove());

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap&v=weekly&loading=async`;
      script.async = true;
      script.defer = true;
      
      // Add additional script properties for better loading
      script.id = 'google-maps-script';
      script.crossOrigin = "anonymous";

      // Setup global callback that the API will call when loaded
      window.initMap = () => {
        console.log('Google Maps API loaded via callback');
        if (document.body.contains(mapTrackingDiv)) {
          document.body.removeChild(mapTrackingDiv);
        }
        resolve();
      };

      // Setup event handlers for success and failure
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
      }, 10000); // 10 seconds timeout
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
