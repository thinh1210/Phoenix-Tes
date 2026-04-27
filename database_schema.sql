-- ==========================================
-- BẢNG 1: USERS (Quản lý tài khoản đăng nhập)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Tài khoản mặc định: admin / Admin@123
INSERT INTO public.users (username, email, password, role)
VALUES ('admin', 'admin@phoenix.com', '$2b$10$X8aH6z2B5xG6R7/6yG0Z.eN1F8G6z2B5xG6R7/6yG0Z.eN1F8G6', 'admin')
ON CONFLICT DO NOTHING;

-- ==========================================
-- BẢNG 2: PROJECTS (Các dự án firmware)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.projects (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ==========================================
-- BẢNG 3: FIRMWARE_VERSIONS (Lịch sử các phiên bản)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.firmware_versions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id    UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    version       VARCHAR(50) NOT NULL,
    bin_url       TEXT        NOT NULL,
    state_url     TEXT        NOT NULL,
    release_notes TEXT,
    uploaded_by   UUID        REFERENCES public.users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_firmware_project_date 
    ON public.firmware_versions (project_id, created_at DESC);

-- ==========================================
-- View: Lấy firmware mới nhất mỗi project
-- ==========================================
CREATE OR REPLACE VIEW public.latest_firmwares AS
SELECT DISTINCT ON (fv.project_id)
    fv.*,
    p.name AS project_name
FROM public.firmware_versions fv
JOIN public.projects p ON p.id = fv.project_id
ORDER BY fv.project_id, fv.created_at DESC;
