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
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

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

  // 根据资源类型过滤资源
  const videoResources = resources.filter(resource => 
    resource.resource_type === 'video'
  );

  const documentResources = resources.filter(resource => 
    resource.resource_type === 'pdf' || resource.resource_type === 'ppt'
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) return null;

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
                    <CardTitle>{selectedResource.title}</CardTitle>
                    <CardDescription>
                      {selectedResource.resource_type === "video" ? "视频资源" : "文档资源"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedResource.resource_type === "video" ? (
                      <VideoPlayer url={selectedResource.file_path} />
                    ) : selectedResource.resource_type === "pdf" ? (
                      <PDFViewer url={selectedResource.file_path} />
                    ) : (
                      <PPTViewer url={selectedResource.file_path} />
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

                    <TabsContent value="videos" className="space-y-2 mt-4">
                      {videoResources.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          暂无视频资源
                        </p>
                      ) : (
                        videoResources.map((resource) => (
                          <Button
                            key={resource.id}
                            variant={selectedResource?.id === resource.id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => setSelectedResource(resource)}
                          >
                            <Video className="w-4 h-4 mr-2" />
                            {resource.title}
                          </Button>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-2 mt-4">
                      {documentResources.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          暂无文档资源
                        </p>
                      ) : (
                        documentResources.map((resource) => (
                          <Button
                            key={resource.id}
                            variant={selectedResource?.id === resource.id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => setSelectedResource(resource)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {resource.title}
                          </Button>
                        ))
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