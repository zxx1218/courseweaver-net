import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, FileText, Video, GraduationCap } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import PDFViewer from "@/components/PDFViewer";
import PPTViewer from "@/components/PPTViewer";

interface Course {
  id: string;
  name: string;
  description: string;
  cover_image: string | null;
}

interface Resource {
  id: string;
  title: string;
  resource_type: string;
  file_path: string;
}

const API_BASE_URL = 'http://localhost:3001/api/auth';

const CourseDetail = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeResource, setActiveResource] = useState<string | null>(null);

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (!session) {
      navigate("/");
      return;
    }

    const parsedSession = JSON.parse(session);
    if (Date.now() > parsedSession.expires_at) {
      localStorage.removeItem('user_session');
      navigate("/");
      return;
    }

    setUser(parsedSession.user);
    if (courseId) {
      fetchCourseDetail(parsedSession.user.id, courseId);
    }
  }, [courseId, navigate]);

  const fetchCourseDetail = async (userId: string, courseId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${userId}/${courseId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '获取课程详情失败');
      }
      
      setCourse(data.course);
      setResources(data.resources);
    } catch (error: any) {
      toast.error(error.message);
      navigate("/courses");
    } finally {
      setLoading(false);
    }
  };

  // 处理图片加载错误
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/courses")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回课程列表
          </Button>
          <div className="ml-4">
            <h1 className="text-lg font-semibold">{course.name}</h1>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Course Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="p-0">
                {course.cover_image ? (
                  <img 
                    src={course.cover_image} 
                    alt={course.name}
                    className="w-full aspect-video object-cover rounded-t-md"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="bg-muted aspect-video rounded-t-md flex items-center justify-center">
                    <GraduationCap className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                <CardTitle>{course.name}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
                <div className="mt-4 text-sm text-muted-foreground">
                  {resources.length} 个学习资源
                </div>
              </CardContent>
            </Card>

            {/* Resources List */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">学习资源</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {resources.map((resource) => (
                    <Button
                      key={resource.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setActiveResource(resource.id)}
                    >
                      {resource.resource_type === 'video' ? (
                        <Video className="h-4 w-4 mr-2" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      <span className="line-clamp-1 text-left">{resource.title}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resource Viewer */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-6">
                {activeResource ? (
                  <Tabs defaultValue="view" className="w-full">
                    <TabsList>
                      <TabsTrigger value="view">查看</TabsTrigger>
                      <TabsTrigger value="info">信息</TabsTrigger>
                    </TabsList>
                    <TabsContent value="view" className="mt-6">
                      {(() => {
                        const resource = resources.find(r => r.id === activeResource);
                        if (!resource) return null;
                        
                        if (resource.resource_type === 'video') {
                          return <VideoPlayer url={resource.file_path} />;
                        } else if (resource.resource_type === 'pdf') {
                          return <PDFViewer url={resource.file_path} />;
                        } else if (resource.resource_type === 'ppt') {
                          return <PPTViewer url={resource.file_path} />;
                        }
                        return (
                          <div className="text-center py-8">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p>不支持预览此类型的文件</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              该文件类型暂不支持在线预览
                            </p>
                          </div>
                        );
                      })()}
                    </TabsContent>
                    <TabsContent value="info" className="mt-6">
                      {(() => {
                        const resource = resources.find(r => r.id === activeResource);
                        if (!resource) return null;
                        
                        return (
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-medium">标题</h3>
                              <p className="text-muted-foreground">{resource.title}</p>
                            </div>
                            <div>
                              <h3 className="font-medium">类型</h3>
                              <p className="text-muted-foreground capitalize">{resource.resource_type}</p>
                            </div>
                            <div>
                              <h3 className="font-medium">文件路径</h3>
                              <p className="text-muted-foreground text-sm break-all">{resource.file_path}</p>
                            </div>
                            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
                              <p className="text-sm text-yellow-800">
                                <strong>注意:</strong> 所有学习资源仅供在线查看，不提供下载功能。
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-12">
                    <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">选择学习资源</h3>
                    <p className="text-muted-foreground">
                      请从左侧列表中选择一个学习资源开始学习
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;