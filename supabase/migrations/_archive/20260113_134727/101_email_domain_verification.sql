-- =====================================================
-- EMAIL DOMAIN WHITELIST FOR UNIVERSITIES
-- =====================================================
-- This migration adds support for university email domain verification

-- =====================================================
-- 1. CREATE EMAIL DOMAINS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS university_email_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL, -- e.g., '@lpu.co.in', '@student.lpu.co.in'
  is_primary BOOLEAN DEFAULT false, -- Primary domain for the university
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure domain format is correct (must start with @)
  CONSTRAINT domain_format CHECK (domain LIKE '@%'),
  
  -- Unique domain per university
  UNIQUE(university_id, domain)
);

-- =====================================================
-- 2. ADD RLS POLICIES FOR EMAIL DOMAINS
-- =====================================================

ALTER TABLE university_email_domains ENABLE ROW LEVEL SECURITY;

-- Only admins can manage email domains (for now, allow all authenticated users to view)
CREATE POLICY "Users can view email domains"
  ON university_email_domains FOR SELECT
  USING (true);

-- =====================================================
-- 3. CREATE FUNCTION TO VALIDATE EMAIL DOMAIN
-- =====================================================

CREATE OR REPLACE FUNCTION validate_user_email_domain()
RETURNS TRIGGER AS $$
DECLARE
  user_domain TEXT;
  is_valid BOOLEAN;
BEGIN
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
    RAISE EXCEPTION 'Email domain % is not authorized for this university. Please use your official university email.', user_domain;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. ADD TRIGGER TO VALIDATE EMAIL ON INSERT/UPDATE
-- =====================================================

-- Trigger on user creation
CREATE TRIGGER validate_email_domain_on_insert
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_email_domain();

-- Trigger on email update
CREATE TRIGGER validate_email_domain_on_update
  BEFORE UPDATE OF email, university_id ON users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.university_id IS DISTINCT FROM NEW.university_id)
  EXECUTE FUNCTION validate_user_email_domain();

-- =====================================================
-- 5. SEED INITIAL EMAIL DOMAINS (from universities table)
-- =====================================================

-- Copy existing domains from universities table to email_domains table
INSERT INTO university_email_domains (university_id, domain, is_primary, verified)
SELECT 
  id as university_id,
  '@' || domain as domain,
  true as is_primary,
  true as verified
FROM universities
WHERE domain IS NOT NULL
ON CONFLICT (university_id, domain) DO NOTHING;

-- =====================================================
-- 6. ADD ADDITIONAL COMMON EMAIL PATTERNS
-- =====================================================

-- For universities, students might have variations like:
-- @university.edu, @student.university.edu, @ug.university.edu

-- Example: Add student subdomain for each university
-- INSERT INTO university_email_domains (university_id, domain, verified)
-- SELECT 
--   id as university_id,
--   '@student.' || domain as domain,
--   true as verified
-- FROM universities
-- WHERE domain IS NOT NULL
-- ON CONFLICT (university_id, domain) DO NOTHING;

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_email_domains_university 
  ON university_email_domains(university_id);

CREATE INDEX IF NOT EXISTS idx_email_domains_domain 
  ON university_email_domains(domain);

-- =====================================================
-- 8. ADD COMMENTS
-- =====================================================

COMMENT ON TABLE university_email_domains IS 'Whitelist of authorized email domains for each university';
COMMENT ON COLUMN university_email_domains.domain IS 'Email domain (e.g., @lpu.co.in) - must start with @';
COMMENT ON COLUMN university_email_domains.is_primary IS 'Whether this is the primary domain for the university';
COMMENT ON FUNCTION validate_user_email_domain IS 'Validates user email domain matches university authorized domains';
