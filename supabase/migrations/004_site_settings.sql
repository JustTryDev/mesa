-- ====================================
-- 사이트 설정 (싱글톤)
-- ====================================
CREATE TABLE site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  site_name TEXT NOT NULL DEFAULT 'My Site',
  site_description TEXT NOT NULL DEFAULT '',
  company_name TEXT,
  ceo_name TEXT,
  business_number TEXT,
  phone TEXT,
  email TEXT,
  fax TEXT,
  address TEXT,
  address_detail TEXT,
  og_image_url TEXT,
  favicon_url TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 기본값 삽입
INSERT INTO site_settings (id, site_name, site_description)
VALUES ('default', 'My Site', 'Next.js Admin Starter Kit')
ON CONFLICT (id) DO NOTHING;
