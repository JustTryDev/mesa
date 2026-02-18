-- ====================================
-- 어드민 사이드바 설정 (싱글톤)
-- ====================================
CREATE TABLE admin_sidebar_config (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  config JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  updated_by UUID REFERENCES employees(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================
-- 사용자 즐겨찾기 (사이드바)
-- ====================================
CREATE TABLE user_sidebar_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_ids TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
