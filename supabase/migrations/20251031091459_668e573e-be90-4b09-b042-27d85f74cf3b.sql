-- 添加策略允许所有人查询users表用于登录验证
CREATE POLICY "允许查询用户名和密码用于登录验证" ON public.users
  FOR SELECT
  USING (true);