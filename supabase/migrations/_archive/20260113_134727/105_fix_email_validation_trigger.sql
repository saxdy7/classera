-- =====================================================
-- FIX EMAIL DOMAIN VALIDATION TRIGGER
-- =====================================================
-- This migration updates the validation function to skip check if university_id is NULL.
-- This allows users to sign up first, then select university during onboarding.

CREATE OR REPLACE FUNCTION validate_user_email_domain()
RETURNS TRIGGER AS $$
DECLARE
  user_domain TEXT;
  is_valid BOOLEAN;
BEGIN
  -- SKIP VALIDATION IF UNIVERSITY_ID IS NULL (User hasn't completed onboarding)
  IF NEW.university_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Extract domain from email (everything after @)
  user_domain := '@' || split_part(NEW.email, '@', 2);
  
  -- Check if domain exists for the user's university
  SELECT EXISTS (
    SELECT 1 FROM university_email_domains
    WHERE university_id = NEW.university_id
    AND domain = user_domain
    AND verified = true
  ) INTO is_valid;
  
  -- If domain is not valid, raise exception
  IF NOT is_valid THEN
    RAISE EXCEPTION 'Email domain % is not authorized for the selected university. Please use your official university email.', user_domain;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
