-- ========================================
-- 在线培训系统数据库导出
-- 生成时间: 2025-10-31
-- ========================================

-- ========================================
-- 1. 创建数据表
-- ========================================

-- 用户表
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT,
    organization TEXT,
    phone TEXT,
    password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 课程表
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 课程权限表
CREATE TABLE IF NOT EXISTS public.course_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- 课程资源表
CREATE TABLE IF NOT EXISTS public.course_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_path TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. 创建索引
-- ========================================

CREATE INDEX IF NOT EXISTS idx_course_permissions_user_id ON public.course_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_course_permissions_course_id ON public.course_permissions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_resources_course_id ON public.course_resources(course_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- ========================================
-- 3. 启用行级安全 (RLS)
-- ========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. 创建 RLS 策略
-- ========================================

-- users 表策略
DROP POLICY IF EXISTS "用户可以查看自己的资料" ON public.users;
CREATE POLICY "用户可以查看自己的资料" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "用户可以更新自己的资料" ON public.users;
CREATE POLICY "用户可以更新自己的资料" ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "允许查询用户名和密码用于登录验证" ON public.users;
CREATE POLICY "允许查询用户名和密码用于登录验证" ON public.users
    FOR SELECT
    USING (true);

-- courses 表策略
DROP POLICY IF EXISTS "认证用户可以查看课程基本信息" ON public.courses;
CREATE POLICY "认证用户可以查看课程基本信息" ON public.courses
    FOR SELECT
    USING (true);

-- course_permissions 表策略
DROP POLICY IF EXISTS "用户可以查看自己的课程权限" ON public.course_permissions;
CREATE POLICY "用户可以查看自己的课程权限" ON public.course_permissions
    FOR SELECT
    USING (auth.uid() = user_id);

-- course_resources 表策略
DROP POLICY IF EXISTS "用户可以查看有权限课程的资源" ON public.course_resources;
CREATE POLICY "用户可以查看有权限课程的资源" ON public.course_resources
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.course_permissions
            WHERE course_permissions.course_id = course_resources.course_id
            AND course_permissions.user_id = auth.uid()
        )
    );

-- ========================================
-- 5. 创建函数和触发器
-- ========================================

-- 更新updated_at字段的函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 自动创建用户资料的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.users (id, username, full_name, organization, phone, password)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'organization', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'password', '')
    );
    RETURN NEW;
END;
$$;

-- 为courses表添加updated_at触发器
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 为auth.users表添加新用户触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 6. 插入样例数据
-- ========================================

-- 插入用户数据
INSERT INTO public.users (id, username, full_name, organization, phone, password, created_at) VALUES
    ('5bac68ec-84c0-4e67-839f-8eec57bf59a5', 'zxx', '朱晓煊', NULL, NULL, '123', '2025-10-31 09:02:00.240164+00'),
    ('ceaa78fe-4b8a-4390-8369-0c7f5e723371', 'admin', 'zxxxx', '大大哇', '112323423', '991218aa', '2025-10-31 09:13:31.843104+00')
ON CONFLICT (id) DO NOTHING;

-- 插入课程数据
INSERT INTO public.courses (id, name, description, cover_image, created_at, updated_at) VALUES
    ('79a6a8e6-79d0-4b5b-9d2b-e5f5aabb6843', 'Python基础编程', '从零开始学习Python编程语言，掌握基础语法和核心概念', NULL, '2025-10-31 09:25:57.521119+00', '2025-10-31 09:25:57.521119+00'),
    ('40fee1f7-fcf4-434e-a9fd-2d51c3d4c779', 'Web前端开发', '学习HTML、CSS、JavaScript，打造现代化网页应用', NULL, '2025-10-31 09:25:57.521119+00', '2025-10-31 09:25:57.521119+00'),
    ('5b059b7d-95d0-424f-a78e-2ce1fd22d980', '数据分析入门', '使用Python进行数据处理、分析和可视化', NULL, '2025-10-31 09:25:57.521119+00', '2025-10-31 09:25:57.521119+00'),
    ('6d955c8c-7b55-4570-9756-c566adb6fc4d', '项目管理实战', '掌握项目管理方法论和实践技巧', NULL, '2025-10-31 09:25:57.521119+00', '2025-10-31 09:25:57.521119+00')
ON CONFLICT (id) DO NOTHING;

-- 插入课程权限数据
INSERT INTO public.course_permissions (id, user_id, course_id, granted_at) VALUES
    ('7561c7ea-9608-4d50-be0c-0d275798966d', '5bac68ec-84c0-4e67-839f-8eec57bf59a5', '79a6a8e6-79d0-4b5b-9d2b-e5f5aabb6843', '2025-10-31 09:25:57.521119+00'),
    ('d1672e3e-9b4c-42e4-9faf-cf312d444b6d', '5bac68ec-84c0-4e67-839f-8eec57bf59a5', '40fee1f7-fcf4-434e-a9fd-2d51c3d4c779', '2025-10-31 09:25:57.521119+00'),
    ('12e5320a-5492-4b11-9f10-e554bf6528c9', 'ceaa78fe-4b8a-4390-8369-0c7f5e723371', '79a6a8e6-79d0-4b5b-9d2b-e5f5aabb6843', '2025-10-31 09:25:57.521119+00'),
    ('9c5ba94b-5c26-4bb7-aeed-631eb218d77a', 'ceaa78fe-4b8a-4390-8369-0c7f5e723371', '40fee1f7-fcf4-434e-a9fd-2d51c3d4c779', '2025-10-31 09:25:57.521119+00'),
    ('5374e798-9555-4c8b-bf6c-d6d4146d90cb', 'ceaa78fe-4b8a-4390-8369-0c7f5e723371', '5b059b7d-95d0-424f-a78e-2ce1fd22d980', '2025-10-31 09:25:57.521119+00'),
    ('7a371873-df97-454c-8c53-f254c64632b9', 'ceaa78fe-4b8a-4390-8369-0c7f5e723371', '6d955c8c-7b55-4570-9756-c566adb6fc4d', '2025-10-31 09:25:57.521119+00')
ON CONFLICT (id) DO NOTHING;

-- 插入课程资源数据（Python基础编程）
INSERT INTO public.course_resources (id, course_id, name, type, file_url, file_path, order_index, created_at) VALUES
    ('b7b1aade-4dba-4a13-9f65-3952fb70541f', '79a6a8e6-79d0-4b5b-9d2b-e5f5aabb6843', '课程介绍PPT', 'pdf', 'https://placeholder-url.com/intro.pdf', 'intro.pdf', 1, '2025-10-31 09:25:57.521119+00'),
    ('ba3911a9-d326-41f3-ad31-2be9d06b3c4a', '79a6a8e6-79d0-4b5b-9d2b-e5f5aabb6843', '第一章：基础概念', 'video', 'https://placeholder-url.com/chapter1.mp4', 'chapter1.mp4', 2, '2025-10-31 09:25:57.521119+00'),
    ('c8a6f4f8-1315-441d-8d16-b18d0cfe8f6b', '79a6a8e6-79d0-4b5b-9d2b-e5f5aabb6843', '第一章课件', 'pdf', 'https://placeholder-url.com/chapter1.pdf', 'chapter1.pdf', 3, '2025-10-31 09:25:57.521119+00'),
    ('b4e728bb-f1b9-405c-bfa0-0716ef016522', '79a6a8e6-79d0-4b5b-9d2b-e5f5aabb6843', '第二章：进阶内容', 'video', 'https://placeholder-url.com/chapter2.mp4', 'chapter2.mp4', 4, '2025-10-31 09:25:57.521119+00'),
    ('b816c46e-391c-4ce8-a2c4-be6834fffc87', '79a6a8e6-79d0-4b5b-9d2b-e5f5aabb6843', '第二章课件', 'pdf', 'https://placeholder-url.com/chapter2.pdf', 'chapter2.pdf', 5, '2025-10-31 09:25:57.521119+00')
ON CONFLICT (id) DO NOTHING;

-- 插入课程资源数据（Web前端开发）
INSERT INTO public.course_resources (id, course_id, name, type, file_url, file_path, order_index, created_at) VALUES
    ('16c7a74b-4924-4a2f-94c8-79c16e01774d', '40fee1f7-fcf4-434e-a9fd-2d51c3d4c779', '课程介绍PPT', 'pdf', 'https://placeholder-url.com/intro.pdf', 'intro.pdf', 1, '2025-10-31 09:25:57.521119+00'),
    ('296b31a3-65a5-42be-9cc0-08cf28d785d2', '40fee1f7-fcf4-434e-a9fd-2d51c3d4c779', '第一章：基础概念', 'video', 'https://placeholder-url.com/chapter1.mp4', 'chapter1.mp4', 2, '2025-10-31 09:25:57.521119+00'),
    ('e5551bff-44bb-4ac0-acb6-ccc23f0e103b', '40fee1f7-fcf4-434e-a9fd-2d51c3d4c779', '第一章课件', 'pdf', 'https://placeholder-url.com/chapter1.pdf', 'chapter1.pdf', 3, '2025-10-31 09:25:57.521119+00'),
    ('d499ea5a-833f-48e3-810b-b0f12774cefd', '40fee1f7-fcf4-434e-a9fd-2d51c3d4c779', '第二章：进阶内容', 'video', 'https://placeholder-url.com/chapter2.mp4', 'chapter2.mp4', 4, '2025-10-31 09:25:57.521119+00'),
    ('087b3971-956a-4be1-a67e-3a7d3b9ccbfe', '40fee1f7-fcf4-434e-a9fd-2d51c3d4c779', '第二章课件', 'pdf', 'https://placeholder-url.com/chapter2.pdf', 'chapter2.pdf', 5, '2025-10-31 09:25:57.521119+00')
ON CONFLICT (id) DO NOTHING;

-- 插入课程资源数据（数据分析入门）
INSERT INTO public.course_resources (id, course_id, name, type, file_url, file_path, order_index, created_at) VALUES
    ('7d2f941e-8e74-4b3d-ab57-aa7a574dece4', '5b059b7d-95d0-424f-a78e-2ce1fd22d980', '课程介绍PPT', 'pdf', 'https://placeholder-url.com/intro.pdf', 'intro.pdf', 1, '2025-10-31 09:25:57.521119+00'),
    ('d29e22fb-5992-4af2-8003-bbf40c33f2d8', '5b059b7d-95d0-424f-a78e-2ce1fd22d980', '第一章：基础概念', 'video', 'https://placeholder-url.com/chapter1.mp4', 'chapter1.mp4', 2, '2025-10-31 09:25:57.521119+00'),
    ('cc378b8f-0e84-43a0-a18e-dd27f0a6904b', '5b059b7d-95d0-424f-a78e-2ce1fd22d980', '第一章课件', 'pdf', 'https://placeholder-url.com/chapter1.pdf', 'chapter1.pdf', 3, '2025-10-31 09:25:57.521119+00'),
    ('9a0ca3f3-f900-423a-907c-9e4361daf5ab', '5b059b7d-95d0-424f-a78e-2ce1fd22d980', '第二章：进阶内容', 'video', 'https://placeholder-url.com/chapter2.mp4', 'chapter2.mp4', 4, '2025-10-31 09:25:57.521119+00'),
    ('034ffd07-5bfe-4ada-a22c-40512e6c610a', '5b059b7d-95d0-424f-a78e-2ce1fd22d980', '第二章课件', 'pdf', 'https://placeholder-url.com/chapter2.pdf', 'chapter2.pdf', 5, '2025-10-31 09:25:57.521119+00')
ON CONFLICT (id) DO NOTHING;

-- 插入课程资源数据（项目管理实战）
INSERT INTO public.course_resources (id, course_id, name, type, file_url, file_path, order_index, created_at) VALUES
    ('b0253830-5194-479f-941a-e77e355dbfa5', '6d955c8c-7b55-4570-9756-c566adb6fc4d', '课程介绍PPT', 'pdf', 'https://placeholder-url.com/intro.pdf', 'intro.pdf', 1, '2025-10-31 09:25:57.521119+00'),
    ('9d38dece-d891-46b2-bfed-75495123bbdb', '6d955c8c-7b55-4570-9756-c566adb6fc4d', '第一章：基础概念', 'video', 'https://placeholder-url.com/chapter1.mp4', 'chapter1.mp4', 2, '2025-10-31 09:25:57.521119+00'),
    ('5b486d8d-95f1-488b-b80c-94fbecf62ecd', '6d955c8c-7b55-4570-9756-c566adb6fc4d', '第一章课件', 'pdf', 'https://placeholder-url.com/chapter1.pdf', 'chapter1.pdf', 3, '2025-10-31 09:25:57.521119+00'),
    ('c6f935c7-aa50-465d-aa92-93ccbba4b564', '6d955c8c-7b55-4570-9756-c566adb6fc4d', '第二章：进阶内容', 'video', 'https://placeholder-url.com/chapter2.mp4', 'chapter2.mp4', 4, '2025-10-31 09:25:57.521119+00'),
    ('42c0cd46-ab48-45d6-beed-5b9e3f2df850', '6d955c8c-7b55-4570-9756-c566adb6fc4d', '第二章课件', 'pdf', 'https://placeholder-url.com/chapter2.pdf', 'chapter2.pdf', 5, '2025-10-31 09:25:57.521119+00')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 7. 创建存储桶（需要在Supabase管理界面执行）
-- ========================================

-- 创建课程资源存储桶
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('course-resources', 'course-resources', false);

-- ========================================
-- 数据库导出完成
-- ========================================

-- 使用说明：
-- 1. 此SQL文件包含完整的表结构、RLS策略、函数、触发器和样例数据
-- 2. 可以在新的数据库中直接执行此文件来重建整个数据库
-- 3. 注意：存储桶需要在Supabase后端管理界面手动创建
-- 4. 资源文件的URL是占位符，需要上传真实文件后更新file_url字段
