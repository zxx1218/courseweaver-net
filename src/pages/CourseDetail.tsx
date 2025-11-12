import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { ArrowLeft, FileText, Video, GraduationCap, Folder, FolderOpen } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import PDFViewer from "@/components/PDFViewer";

interface Course {
  id: string;
  name: string;
  description: string;
  cover_image: string | null;
}

interface Resource {
  id: string;
  name: string;
  type: "video" | "ppt" | "pdf";
  file_url: string;
  file_path: string | null;
  order_index: number;
  parent_id: string | null;
  is_folder: boolean;
  children?: Resource[];
}

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        loadCourseDetails();
      }
    });
  }, [courseId, navigate]);

  const loadCourseDetails = async () => {
    try {
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: resourcesData, error: resourcesError } = await supabase
        .from("course_resources")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      if (resourcesError) throw resourcesError;
      
      // 为 Storage 文件生成签名 URL
      const resourcesWithUrls = await Promise.all(
        (resourcesData || []).map(async (resource) => {
          // 如果 file_path 存在且是 Storage 路径，生成签名 URL
          if (resource.file_path && !resource.file_path.startsWith('http')) {
            const { data: urlData } = await supabase.storage
              .from('course-resources')
              .createSignedUrl(resource.file_path, 3600); // 1小时有效期
            
            if (urlData?.signedUrl) {
              return { ...resource, file_url: urlData.signedUrl };
            }
          }
          return resource;
        })
      );
      
      // 构建树形结构
      const resourceTree = buildResourceTree(resourcesWithUrls as Resource[]);
      setResources(resourceTree);

      // 选择第一个非文件夹资源
      const firstFile = findFirstFile(resourceTree);
      if (firstFile) {
        setSelectedResource(firstFile);
      }
    } catch (error: any) {
      toast.error("加载课程详情失败: " + error.message);
      navigate("/courses");
    } finally {
      setLoading(false);
    }
  };

  // 构建树形结构的辅助函数
  const buildResourceTree = (flatResources: Resource[]): Resource[] => {
    const map = new Map<string, Resource>();
    const roots: Resource[] = [];

    // 初始化 map
    flatResources.forEach((resource) => {
      map.set(resource.id, { ...resource, children: [] });
    });

    // 构建树形结构
    flatResources.forEach((resource) => {
      const node = map.get(resource.id)!;
      if (resource.parent_id && map.has(resource.parent_id)) {
        map.get(resource.parent_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  // 查找第一个文件（非文件夹）
  const findFirstFile = (resources: Resource[]): Resource | null => {
    for (const resource of resources) {
      if (!resource.is_folder) {
        return resource;
      }
      if (resource.children && resource.children.length > 0) {
        const found = findFirstFile(resource.children);
        if (found) return found;
      }
    }
    return null;
  };

  // 递归渲染资源树
  const renderResourceTree = (resources: Resource[], level = 0) => {
    const folders = resources.filter((r) => r.is_folder);
    const files = resources.filter((r) => !r.is_folder);

    return (
      <>
        {files.map((resource) => (
          <Button
            key={resource.id}
            variant={selectedResource?.id === resource.id ? "default" : "outline"}
            className="w-full justify-start"
            style={{ paddingLeft: `${(level + 1) * 0.75}rem` }}
            onClick={() => setSelectedResource(resource)}
          >
            {resource.type === "video" ? (
              <Video className="w-4 h-4 mr-2" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            {resource.name}
          </Button>
        ))}
        {folders.length > 0 && (
          <Accordion type="multiple" className="w-full">
            {folders.map((folder) => (
              <AccordionItem key={folder.id} value={folder.id} className="border-none">
                <AccordionTrigger 
                  className="hover:no-underline py-2 px-3 hover:bg-accent/50 rounded-md"
                  style={{ paddingLeft: `${(level + 1) * 0.75}rem` }}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{folder.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0 pt-1 space-y-1">
                  {folder.children && folder.children.length > 0 ? (
                    renderResourceTree(folder.children, level + 1)
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2" style={{ paddingLeft: `${(level + 2) * 0.75}rem` }}>
                      空文件夹
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </>
    );
  };

  // 检查文件夹是否包含视频资源
  const hasVideoChildren = (folder: Resource): boolean => {
    if (!folder.children) return false;
    return folder.children.some(
      (child) => child.type === "video" || (child.is_folder && hasVideoChildren(child))
    );
  };

  // 检查文件夹是否包含文档资源
  const hasDocumentChildren = (folder: Resource): boolean => {
    if (!folder.children) return false;
    return folder.children.some(
      (child) =>
        child.type === "ppt" ||
        child.type === "pdf" ||
        (child.is_folder && hasDocumentChildren(child))
    );
  };

  const videoResources = resources.filter((r) => !r.is_folder && r.type === "video");
  const documentResources = resources.filter((r) => !r.is_folder && (r.type === "ppt" || r.type === "pdf"));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/95 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/courses")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回课程列表
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-lg">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold">{course.name}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>课程介绍</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {course.description || "暂无课程介绍"}
                </p>
              </CardContent>
            </Card>

            {selectedResource && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedResource.name}</CardTitle>
                  <CardDescription>
                    {selectedResource.type === "video" ? "视频资源" : "文档资源"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedResource.type === "video" ? (
                    <VideoPlayer url={selectedResource.file_url} />
                  ) : (
                    <PDFViewer url={selectedResource.file_url} />
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>课程资源</CardTitle>
                <CardDescription>点击资源进行查看</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="videos" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="videos" className="flex-1">
                      <Video className="w-4 h-4 mr-2" />
                      视频
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex-1">
                      <FileText className="w-4 h-4 mr-2" />
                      文档
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="videos" className="space-y-1 mt-4">
                    {resources.filter(r => r.type === "video" || (r.is_folder && hasVideoChildren(r))).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        暂无视频资源
                      </p>
                    ) : (
                      renderResourceTree(resources.filter(r => r.type === "video" || (r.is_folder && hasVideoChildren(r))))
                    )}
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-1 mt-4">
                    {resources.filter(r => (r.type === "ppt" || r.type === "pdf") || (r.is_folder && hasDocumentChildren(r))).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        暂无文档资源
                      </p>
                    ) : (
                      renderResourceTree(resources.filter(r => (r.type === "ppt" || r.type === "pdf") || (r.is_folder && hasDocumentChildren(r))))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetail;
