-- =====================================================
-- 在线培训系统数据库完整导出
-- 导出时间: 2025-11-04
-- =====================================================

-- =====================================================
-- 1. 删除现有对象（如果存在）
-- =====================================================

-- 删除触发器
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 删除函数
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 删除表（按依赖顺序）
DROP TABLE IF EXISTS public.course_resources CASCADE;
DROP TABLE IF EXISTS public.course_permissions CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =====================================================
-- 2. 创建表结构
-- =====================================================

-- 创建 users 表
CREATE TABLE public.users (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT,
    organization TEXT,
    phone TEXT,
    password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 courses 表
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 course_permissions 表
CREATE TABLE public.course_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    course_id UUID NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 course_resources 表
CREATE TABLE public.course_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_path TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. 创建索引
-- =====================================================

CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_course_permissions_user_id ON public.course_permissions(user_id);
CREATE INDEX idx_course_permissions_course_id ON public.course_permissions(course_id);
CREATE INDEX idx_course_resources_course_id ON public.course_resources(course_id);

-- =====================================================
-- 4. 启用行级安全性 (RLS)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. 创建 RLS 策略
-- =====================================================

-- users 表策略
CREATE POLICY "允许查询用户名和密码用于登录验证"
    ON public.users
    FOR SELECT
    USING (true);

CREATE POLICY "用户可以查看自己的资料"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的资料"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- courses 表策略
CREATE POLICY "所有人可以查看课程基本信息"
    ON public.courses
    FOR SELECT
    USING (true);

-- course_permissions 表策略
CREATE POLICY "用户可以查看自己的课程权限"
    ON public.course_permissions
    FOR SELECT
    USING (auth.uid() = user_id);

-- course_resources 表策略
CREATE POLICY "用户可以查看有权限课程的资源"
    ON public.course_resources
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM course_permissions
            WHERE course_permissions.course_id = course_resources.course_id
            AND course_permissions.user_id = auth.uid()
        )
    );

-- =====================================================
-- 6. 创建函数
-- =====================================================

-- 创建更新 updated_at 的函数
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

-- 创建处理新用户的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- =====================================================
-- 7. 创建触发器
-- =====================================================

-- 创建 courses 表的 updated_at 自动更新触发器
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 创建新用户自动插入 users 表的触发器
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 8. 插入数据
-- =====================================================

-- 插入 users 数据
INSERT INTO public.users (id, username, full_name, organization, phone, password, created_at) VALUES
('5bac68ec-84c0-4e67-839f-8eec57bf59a5', 'zxx', '朱晓煊', NULL, NULL, '991218aa', '2025-10-31 09:02:00.240164+00'),
('ceaa78fe-4b8a-4390-8369-0c7f5e723371', 'admin', 'zxxxx', '大大哇', '112323423', '991218aa', '2025-10-31 09:13:31.843104+00');

-- 插入 courses 数据
INSERT INTO public.courses (id, name, description, cover_image, created_at, updated_at) VALUES
('79a6a8e6-79d0-4b5b-9d2b-e5f5aabb6843', 'Python基础编程', '从零开始学习Python编程语言，掌握基础语法和核心概念', NULL, '2025-10-31 09:25:57.521119+00', '2025-10-31 09:25:57.521119+00'),
('40fee1f7-fcf4-434e-a9fd-2d51c3d4c779', 'Web前端开发', '学习HTML、CSS、JavaScript，打造现代化网页应用', NULL, '2025-10-31 09:25:57.521119+00', '2025-10-31 09:25:57.521119+00'),
('5b059b7d-95d0-424f-a78e-2ce1fd22d980', '数据分析入门', '使用Python进行数据处理、分析和可视化', NULL, '2025-10-31 09:25:57.521119+00', '2025-10-31 09:25:57.521119+00'),
('6d955c8c-7b55-4570-9756-c566adb6fc4d', '项目管理实战', '掌握项目管理方法论和实践技巧', NULL, '2025-10-31 09:25:57.521119+00', '2025-10-31 09:25:57.521119+00'),
('56ec83b5-7bfd-49e1-8be0-d65131d1ed03', 'AI 智能家居套装', '通过智能家居套装学习人工智能基础知识，动手搭建智能化家居系统，培养创新思维和实践能力', '/course-covers/ai-smart-home.jpg', '2025-11-03 01:35:40.590568+00', '2025-11-03 01:35:40.590568+00'),
('614a8621-d0a2-415a-8f12-6ab2769c35ae', 'deepseek 智能机器人', '深入探索智能机器人技术，学习编程控制和AI算法，培养计算思维和问题解决能力', '/course-covers/deepseek-robot.jpg', '2025-11-03 01:35:40.590568+00', '2025-11-03 01:35:40.590568+00'),
('e963885d-455e-48c4-8237-f9e801c7630a', 'STEAM小实验', '融合科学、技术、工程、艺术、数学的综合性实验课程，激发创造力和探索精神', '/course-covers/steam-experiments.jpg', '2025-11-03 01:35:40.590568+00', '2025-11-03 01:35:40.590568+00'),
('674a4878-ec5b-4be3-8f21-e38a69a3fa79', 'AI自动驾驶机器人小车', '学习自动驾驶技术原理，动手制作智能小车，掌握传感器应用和路径规划算法', '/course-covers/self-driving-car.jpg', '2025-11-03 01:35:40.590568+00', '2025-11-03 01:35:40.590568+00'),
('5ffa17d0-22b4-48d9-8a08-8f911564cac7', '3D 打印笔电子造物套件', '运用3D打印笔技术进行创意设计和制作，培养空间思维和动手能力', '/course-covers/3d-printing-pen.jpg', '2025-11-03 01:35:40.590568+00', '2025-11-03 01:35:40.590568+00'),
('2018d5b3-24b9-4955-a0c6-ee3ac191f827', 'Hands-on 奇妙造物盒', '丰富的动手实践项目，培养创造力、想象力和工程思维', '/course-covers/hands-on-box.jpg', '2025-11-03 01:35:40.590568+00', '2025-11-03 01:35:40.590568+00'),
('33033ffd-64fd-4968-ad08-438cfb52b8b7', '劳动创意课堂', '结合劳动教育和创意设计，培养实践能力和创新精神', '/course-covers/creative-labor.jpg', '2025-11-03 01:35:40.590568+00', '2025-11-03 01:35:40.590568+00'),
('b8a0b65e-4f13-4a31-99b7-9368ba279622', '乐高系列', '通过乐高积木学习机械原理、编程和工程设计，培养逻辑思维和创造力', '/course-covers/lego-series.jpg', '2025-11-03 01:35:40.590568+00', '2025-11-03 01:35:40.590568+00'),
('bba0cce4-7fb0-47e2-b158-dfe4b434aef1', '无人机课程', '学习无人机操控技术和飞行原理，了解航空航天知识，培养科技素养', '/course-covers/drone-course.jpg', '2025-11-03 01:35:40.590568+00', '2025-11-03 01:35:40.590568+00');

-- 插入 course_permissions 数据
INSERT INTO public.course_permissions (id, user_id, course_id, granted_at) VALUES
('7561c7ea-9608-4d50-be0c-0d275798966d', '5bac68ec-84c0-4e67-839f-8eec57bf59a5', '79a6a8e6-79d0-4b5b-9d2b-e5f5aabb6843', '2025-10-31 09:25:57.521119+00'),
('d1672e3e-9b4c-42e4-9faf-cf312d444b6d', '5bac68ec-84c0-4e67-839f-8eec57bf59a5', '40fee1f7-fcf4-434e-a9fd-2d51c3d4c779', '2025-10-31 09:25:57.521119+00'),
('12e5320a-5492-4b11-9f10-e554bf6528c9', 'ceaa78fe-4b8a-4390-8369-0c7f5e723371', '79a6a8e6-79d0-4b5b-9d2b-e5f5aabb6843', '2025-10-31 09:25:57.521119+00'),
('9c5ba94b-5c26-4bb7-aeed-631eb218d77a', 'ceaa78fe-4b8a-4390-8369-0c7f5e723371', '40fee1f7-fcf4-434e-a9fd-2d51c3d4c779', '2025-10-31 09:25:57.521119+00'),
('5374e798-9555-4c8b-bf6c-d6d4146d90cb', 'ceaa78fe-4b8a-4390-8369-0c7f5e723371', '5b059b7d-95d0-424f-a78e-2ce1fd22d980', '2025-10-31 09:25:57.521119+00'),
('7a371873-df97-454c-8c53-f254c64632b9', 'ceaa78fe-4b8a-4390-8369-0c7f5e723371', '6d955c8c-7b55-4570-9756-c566adb6fc4d', '2025-10-31 09:25:57.521119+00');

-- 插入 course_resources 数据
INSERT INTO public.course_resources (id, course_id, name, type, file_url, file_path, order_index, created_at) VALUES
-- Python基础编程 课程资源
('b7b1aade-4dba-4a13-9f65-3952fb70541f', '79a6a8e6-79d0-4b5b-9d2b-e5f5aabb6843', '课程介绍PPT', 'pdf', 'https://gesp.ccf.org.cn/101/attach/1703972987469856.pdf', '/resources/course1/123.pdf', 1, '2025-10-31 09:25:57.521119+00'),
('ba3911a9-d326-41f3-ad31-2be9d06b3c4a', '79a6a8e6-79d0-4b5b-9d2b-e5f5aabb6843', '第一章：基础概念', 'video', '/resources/course1/aaa.mp4', 'chapter1.mp4', 2, '2025-10-31 09:25:57.521119+00'),
('b4e728bb-f1b9-405c-bfa0-0716ef016522', '79a6a8e6-79d0-4b5b-9d2b-e5f5aabb6843', '第二章：进阶内容', 'video', 'https://placeholder-url.com/chapter2.mp4', 'chapter2.mp4', 4, '2025-10-31 09:25:57.521119+00'),
('b816c46e-391c-4ce8-a2c4-be6834fffc87', '79a6a8e6-79d0-4b5b-9d2b-e5f5aabb6843', '第二章课件', 'pdf', 'https://gesp.ccf.org.cn/101/attach/1703973115396128.pdf', 'chapter2.pdf', 5, '2025-10-31 09:25:57.521119+00'),

-- Web前端开发 课程资源
('16c7a74b-4924-4a2f-94c8-79c16e01774d', '40fee1f7-fcf4-434e-a9fd-2d51c3d4c779', '课程介绍PPT', 'pdf', 'https://placeholder-url.com/intro.pdf', 'intro.pdf', 1, '2025-10-31 09:25:57.521119+00'),
('296b31a3-65a5-42be-9cc0-08cf28d785d2', '40fee1f7-fcf4-434e-a9fd-2d51c3d4c779', '第一章：基础概念', 'video', 'https://placeholder-url.com/chapter1.mp4', 'chapter1.mp4', 2, '2025-10-31 09:25:57.521119+00'),
('e5551bff-44bb-4ac0-acb6-ccc23f0e103b', '40fee1f7-fcf4-434e-a9fd-2d51c3d4c779', '第一章课件', 'pdf', 'https://placeholder-url.com/chapter1.pdf', 'chapter1.pdf', 3, '2025-10-31 09:25:57.521119+00'),
('d499ea5a-833f-48e3-810b-b0f12774cefd', '40fee1f7-fcf4-434e-a9fd-2d51c3d4c779', '第二章：进阶内容', 'video', 'https://placeholder-url.com/chapter2.mp4', 'chapter2.mp4', 4, '2025-10-31 09:25:57.521119+00'),
('087b3971-956a-4be1-a67e-3a7d3b9ccbfe', '40fee1f7-fcf4-434e-a9fd-2d51c3d4c779', '第二章课件', 'pdf', 'https://placeholder-url.com/chapter2.pdf', 'chapter2.pdf', 5, '2025-10-31 09:25:57.521119+00'),

-- 数据分析入门 课程资源
('7d2f941e-8e74-4b3d-ab57-aa7a574dece4', '5b059b7d-95d0-424f-a78e-2ce1fd22d980', '课程介绍PPT', 'pdf', 'https://placeholder-url.com/intro.pdf', 'intro.pdf', 1, '2025-10-31 09:25:57.521119+00'),
('d29e22fb-5992-4af2-8003-bbf40c33f2d8', '5b059b7d-95d0-424f-a78e-2ce1fd22d980', '第一章：基础概念', 'video', 'https://placeholder-url.com/chapter1.mp4', 'chapter1.mp4', 2, '2025-10-31 09:25:57.521119+00'),
('cc378b8f-0e84-43a0-a18e-dd27f0a6904b', '5b059b7d-95d0-424f-a78e-2ce1fd22d980', '第一章课件', 'pdf', 'https://placeholder-url.com/chapter1.pdf', 'chapter1.pdf', 3, '2025-10-31 09:25:57.521119+00'),
('9a0ca3f3-f900-423a-907c-9e4361daf5ab', '5b059b7d-95d0-424f-a78e-2ce1fd22d980', '第二章：进阶内容', 'video', 'https://placeholder-url.com/chapter2.mp4', 'chapter2.mp4', 4, '2025-10-31 09:25:57.521119+00'),
('034ffd07-5bfe-4ada-a22c-40512e6c610a', '5b059b7d-95d0-424f-a78e-2ce1fd22d980', '第二章课件', 'pdf', 'https://placeholder-url.com/chapter2.pdf', 'chapter2.pdf', 5, '2025-10-31 09:25:57.521119+00'),

-- 项目管理实战 课程资源
('b0253830-5194-479f-941a-e77e355dbfa5', '6d955c8c-7b55-4570-9756-c566adb6fc4d', '课程介绍PPT', 'pdf', 'https://placeholder-url.com/intro.pdf', 'intro.pdf', 1, '2025-10-31 09:25:57.521119+00'),
('9d38dece-d891-46b2-bfed-75495123bbdb', '6d955c8c-7b55-4570-9756-c566adb6fc4d', '第一章：基础概念', 'video', 'https://placeholder-url.com/chapter1.mp4', 'chapter1.mp4', 2, '2025-10-31 09:25:57.521119+00'),
('5b486d8d-95f1-488b-b80c-94fbecf62ecd', '6d955c8c-7b55-4570-9756-c566adb6fc4d', '第一章课件', 'pdf', 'https://placeholder-url.com/chapter1.pdf', 'chapter1.pdf', 3, '2025-10-31 09:25:57.521119+00'),
('c6f935c7-aa50-465d-aa92-93ccbba4b564', '6d955c8c-7b55-4570-9756-c566adb6fc4d', '第二章：进阶内容', 'video', 'https://placeholder-url.com/chapter2.mp4', 'chapter2.mp4', 4, '2025-10-31 09:25:57.521119+00'),
('2d865ea1-98c3-42da-92d7-d3ba15789ff2', '6d955c8c-7b55-4570-9756-c566adb6fc4d', '第二章课件', 'pdf', 'https://placeholder-url.com/chapter2.pdf', 'chapter2.pdf', 5, '2025-10-31 09:25:57.521119+00');

-- =====================================================
-- 9. 存储桶配置说明
-- =====================================================

-- 注意：存储桶需要在 Supabase 管理界面手动创建
-- 桶名称: course-resources
-- 公开访问: 否
-- 文件大小限制: 根据需求设置
-- 允许的文件类型: PDF, MP4, 等

-- =====================================================
-- 导出完成
-- =====================================================

-- 使用说明：
-- 1. 此SQL文件包含完整的表结构、RLS策略、函数、触发器和当前数据库的所有数据
-- 2. 可以在新的数据库中直接执行此文件来重建整个数据库
-- 3. 执行前会先删除现有的表和对象，请谨慎使用
-- 4. 注意：存储桶需要在后端管理界面手动创建
-- 5. 课程封面图片路径已包含在 cover_image 字段中
