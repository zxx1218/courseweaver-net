-- 创建管理员角色枚举
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 创建用户角色表
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 启用RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 创建安全检查函数（避免RLS递归）
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 用户角色表的RLS策略
CREATE POLICY "管理员可以查看所有角色"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "管理员可以管理角色"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 更新users表的RLS策略，允许管理员查看和管理所有用户
CREATE POLICY "管理员可以查看所有用户"
ON public.users
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "管理员可以更新所有用户"
ON public.users
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "管理员可以删除用户"
ON public.users
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 更新courses表的RLS策略，允许管理员完全管理
CREATE POLICY "管理员可以管理所有课程"
ON public.courses
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 更新course_resources表的RLS策略
CREATE POLICY "管理员可以管理所有资源"
ON public.course_resources
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 更新course_permissions表的RLS策略
CREATE POLICY "管理员可以管理所有权限"
ON public.course_permissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 更新storage bucket策略，允许管理员上传
CREATE POLICY "管理员可以上传资源"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-resources' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "管理员可以删除资源"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-resources' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "认证用户可以查看资源"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'course-resources');