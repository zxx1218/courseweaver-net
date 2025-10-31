import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, FileText, Video, GraduationCap } from "lucide-react";
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
      setResources((resourcesData || []) as Resource[]);

      if (resourcesData && resourcesData.length > 0) {
        setSelectedResource(resourcesData[0] as Resource);
      }
    } catch (error: any) {
      toast.error("加载课程详情失败: " + error.message);
      navigate("/courses");
    } finally {
      setLoading(false);
    }
  };

  const videoResources = resources.filter((r) => r.type === "video");
  const documentResources = resources.filter((r) => r.type === "ppt" || r.type === "pdf");

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
                          {resource.name}
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
                          {resource.name}
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
