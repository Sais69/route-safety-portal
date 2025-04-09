
-- Insertar o actualizar la API key de Google Maps
-- Reemplaza 'TU_API_KEY_AQUI' con tu API key real
INSERT INTO public.app_settings (key, value, description)
VALUES ('GOOGLE_MAPS_API_KEY', 'TU_API_KEY_AQUI', 'Google Maps API Key para la aplicación')
ON CONFLICT (key) 
DO UPDATE SET value = EXCLUDED.value, updated_at = now();
