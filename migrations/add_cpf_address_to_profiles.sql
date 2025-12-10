-- Migration: Add CPF and Address fields to profiles table
-- Date: 2024-12-10
-- Description: Adding CPF and address information to user profiles

-- Add CPF field
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cpf text NULL;

-- Add address fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address_street text NULL,
ADD COLUMN IF NOT EXISTS address_number text NULL,
ADD COLUMN IF NOT EXISTS address_complement text NULL,
ADD COLUMN IF NOT EXISTS address_neighborhood text NULL,
ADD COLUMN IF NOT EXISTS address_city text NULL,
ADD COLUMN IF NOT EXISTS address_state text NULL,
ADD COLUMN IF NOT EXISTS address_zipcode text NULL;

-- Create index for CPF (for performance and uniqueness checks)
CREATE INDEX IF NOT EXISTS idx_profiles_cpf 
ON public.profiles USING btree (cpf) 
TABLESPACE pg_default
WHERE cpf IS NOT NULL;

-- Create index for city/state (common search patterns)
CREATE INDEX IF NOT EXISTS idx_profiles_address_city_state 
ON public.profiles USING btree (address_city, address_state) 
TABLESPACE pg_default
WHERE address_city IS NOT NULL AND address_state IS NOT NULL;

-- Add constraint to ensure CPF format (11 digits, can have dots and dashes)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_cpf_format_check 
CHECK (cpf IS NULL OR cpf ~ '^[0-9]{3}\.?[0-9]{3}\.?[0-9]{3}-?[0-9]{2}$');

-- Add constraint for zipcode format (Brazilian CEP: 12345-678 or 12345678)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_zipcode_format_check 
CHECK (address_zipcode IS NULL OR address_zipcode ~ '^[0-9]{5}-?[0-9]{3}$');

-- Add constraint for state (Brazilian state codes)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_state_check 
CHECK (address_state IS NULL OR address_state IN (
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
));

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.cpf IS 'Brazilian CPF document number (format: 123.456.789-01)';
COMMENT ON COLUMN public.profiles.address_street IS 'Street name for user address';
COMMENT ON COLUMN public.profiles.address_number IS 'Street number for user address';
COMMENT ON COLUMN public.profiles.address_complement IS 'Address complement (apartment, suite, etc.)';
COMMENT ON COLUMN public.profiles.address_neighborhood IS 'Neighborhood/district name';
COMMENT ON COLUMN public.profiles.address_city IS 'City name';
COMMENT ON COLUMN public.profiles.address_state IS 'Brazilian state code (2 letters)';
COMMENT ON COLUMN public.profiles.address_zipcode IS 'Brazilian postal code (CEP format: 12345-678)';