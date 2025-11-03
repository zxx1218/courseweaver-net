import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, LogOut, BookOpen } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Course {
  id: string;
  name: string;
  description: string;
  cover_image: string | null;
}

const Courses = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        loadCourses();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadCourses = async () => {
    try {
      const { data: permissions, error: permError } = await supabase
        .from("course_permissions")
        .select("course_id");

      if (permError) throw permError;

      if (!permissions || permissions.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      const courseIds = permissions.map((p) => p.course_id);

      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .in("id", courseIds);

      if (coursesError) throw coursesError;

      setCourses(coursesData || []);
    } catch (error: any) {
      toast.error("加载课程失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("已退出登录");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/95 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              长藤科技-在线培训系统
            </h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">我的课程</h2>
          <p className="text-muted-foreground">
            您可以访问以下课程，点击课程卡片查看详情
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg" />
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">暂无可用课程</h3>
              <p className="text-muted-foreground">
                您当前没有被授权访问任何课程，请联系管理员开通课程权限
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] group"
                onClick={() => navigate(`/course/${course.id}`)}
              >
                <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  {course.cover_image ? (
                    <img
                      src={course.cover_image}
                      alt={course.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-16 h-16 text-primary" />
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {course.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description || "暂无课程描述"}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Courses;
