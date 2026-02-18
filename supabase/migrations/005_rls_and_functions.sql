-- ====================================
-- updated_at 자동 갱신 트리거
-- ====================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
CREATE TRIGGER set_updated_at_employees
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_customers
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_notices
  BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_site_settings
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_user_ui_settings
  BEFORE UPDATE ON user_ui_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- customer_code 자동 생성 함수
-- 형식: C + 연도2자리 + 순번4자리 (예: C240001)
-- ====================================
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  max_seq INTEGER;
  new_code TEXT;
BEGIN
  year_prefix := 'C' || TO_CHAR(NOW(), 'YY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_code FROM 4) AS INTEGER)), 0)
  INTO max_seq
  FROM customers
  WHERE customer_code LIKE year_prefix || '%';

  new_code := year_prefix || LPAD((max_seq + 1)::TEXT, 4, '0');
  NEW.customer_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_customer_code
  BEFORE INSERT ON customers
  FOR EACH ROW
  WHEN (NEW.customer_code IS NULL OR NEW.customer_code = '')
  EXECUTE FUNCTION generate_customer_code();

-- ====================================
-- RLS 정책 (Row Level Security)
-- ====================================

-- employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_select_own" ON employees
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "employees_select_admin" ON employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = auth.uid()
      AND e.role IN ('super_admin', 'admin')
    )
  );

-- customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select_own" ON customers
  FOR SELECT USING (auth.uid() = id);

-- notices (공개 읽기 허용)
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notices_select_published" ON notices
  FOR SELECT USING (is_published = true);

-- site_settings (공개 읽기 허용)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_select_all" ON site_settings
  FOR SELECT USING (true);

-- user_ui_settings
ALTER TABLE user_ui_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ui_settings_own" ON user_ui_settings
  FOR ALL USING (auth.uid() = user_id);

-- user_sidebar_favorites
ALTER TABLE user_sidebar_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sidebar_favorites_own" ON user_sidebar_favorites
  FOR ALL USING (auth.uid() = user_id);
