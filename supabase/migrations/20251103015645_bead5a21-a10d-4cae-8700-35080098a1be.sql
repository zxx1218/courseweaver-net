-- 删除旧的课程查询策略
DROP POLICY IF EXISTS "认证用户可以查看课程基本信息" ON courses;

-- 创建新的策略，明确允许所有人（包括未登录用户）查看课程基本信息
CREATE POLICY "所有人可以查看课程基本信息"
ON courses
FOR SELECT
TO public
USING (true);