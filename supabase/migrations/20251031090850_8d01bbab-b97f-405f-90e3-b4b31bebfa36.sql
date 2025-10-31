-- 重命名profiles表为users
ALTER TABLE public.profiles RENAME TO users;

-- 添加新字段
ALTER TABLE public.users ADD COLUMN organization TEXT;
ALTER TABLE public.users ADD COLUMN phone TEXT;
ALTER TABLE public.users ADD COLUMN password TEXT;

-- 更新RLS策略名称以反映新表名
DROP POLICY IF EXISTS "用户可以查看自己的资料" ON public.users;
DROP POLICY IF EXISTS "用户可以更新自己的资料" ON public.users;

CREATE POLICY "用户可以查看自己的资料" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的资料" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- 更新handle_new_user函数以包含新字段
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
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