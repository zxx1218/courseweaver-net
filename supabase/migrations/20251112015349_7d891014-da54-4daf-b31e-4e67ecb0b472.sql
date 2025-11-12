-- 为 course_resources 表添加层级结构支持
ALTER TABLE public.course_resources
ADD COLUMN parent_id uuid REFERENCES public.course_resources(id) ON DELETE CASCADE,
ADD COLUMN is_folder boolean DEFAULT false;

-- 为 parent_id 创建索引以提高查询性能
CREATE INDEX idx_course_resources_parent_id ON public.course_resources(parent_id);

-- 更新现有的非文件夹资源
UPDATE public.course_resources SET is_folder = false WHERE is_folder IS NULL;