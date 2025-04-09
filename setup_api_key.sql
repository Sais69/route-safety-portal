
-- Insertar o actualizar la API key de Google Maps
-- Reemplaza 'TU_API_KEY_AQUI' con tu API key real
INSERT INTO public.app_settings (key, value, description)
VALUES ('GOOGLE_MAPS_API_KEY', 'TU_API_KEY_AQUI', 'Google Maps API Key para la aplicación')
ON CONFLICT (key) 
DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Crear una función para upsert de configuraciones
CREATE OR REPLACE FUNCTION public.upsert_app_setting(
  p_key TEXT,
  p_value TEXT,
  p_description TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.app_settings (key, value, description)
  VALUES (p_key, p_value, p_description)
  ON CONFLICT (key)
  DO UPDATE SET 
    value = p_value,
    description = COALESCE(p_description, app_settings.description),
    updated_at = now();
END;
$$ LANGUAGE plpgsql;
