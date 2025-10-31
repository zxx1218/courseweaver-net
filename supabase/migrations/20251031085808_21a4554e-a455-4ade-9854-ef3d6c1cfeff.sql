-- 创建用户资料表
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能查看和更新自己的资料
CREATE POLICY "用户可以查看自己的资料" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的资料" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 创建课程表
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 课程对所有认证用户可见（权限通过 course_permissions 控制访问）
CREATE POLICY "认证用户可以查看课程基本信息" ON public.courses
  FOR SELECT TO authenticated USING (true);

-- 创建课程权限表（用户-课程关联）
CREATE TABLE public.course_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.course_permissions ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的课程权限
CREATE POLICY "用户可以查看自己的课程权限" ON public.course_permissions
  FOR SELECT USING (auth.uid() = user_id);

-- 创建课程资源表
CREATE TABLE public.course_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'ppt', 'pdf')),
  file_url TEXT NOT NULL,
  file_path TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;

-- 资源访问策略：用户只能查看有权限课程的资源
CREATE POLICY "用户可以查看有权限课程的资源" ON public.course_resources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_permissions
      WHERE course_permissions.course_id = course_resources.course_id
      AND course_permissions.user_id = auth.uid()
    )
  );

-- 创建存储桶用于存储课程资源（视频、PPT/PDF）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-resources',
  'course-resources',
  false,
  524288000, -- 500MB limit
  ARRAY['video/mp4', 'video/webm', 'application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
);

-- 存储桶 RLS 策略：用户只能访问有权限课程的资源
CREATE POLICY "用户可以访问有权限课程的资源文件" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'course-resources' 
    AND EXISTS (
      SELECT 1 FROM public.course_resources cr
      JOIN public.course_permissions cp ON cr.course_id = cp.course_id
      WHERE cr.file_path = storage.objects.name
      AND cp.user_id = auth.uid()
    )
  );

-- 创建触发器：自动创建用户资料
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 创建更新时间戳触发器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();