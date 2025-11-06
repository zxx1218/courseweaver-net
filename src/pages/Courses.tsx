import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, LogOut, BookOpen } from "lucide-react";
// import type { User } from "@supabase/supabase-js";
// import { db } from "@/integrations/mysql/client";

interface User {
  id: string;
  username: string;
}

interface Course {
  id: string;
  name: string;
  description: string;
  cover_image: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL; // 后端接口地址

const Courses = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchCourses(parsedSession.user.id);
  }, [navigate]);

  const fetchCourses = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '获取课程列表失败');
      }
      
      setCourses(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">长藤科技-在线培训系统</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">欢迎, {user.username}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              退出
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">我的课程</h1>
          <p className="text-muted-foreground">查看和管理您的培训课程</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : courses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无课程</h3>
              <p className="text-muted-foreground mb-4">您还没有被分配任何课程</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card 
                key={course.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/course/${course.id}`)}
              >
                <CardHeader>
                  {course.cover_image ? (
                    <img 
                      src={course.cover_image} 
                      alt={course.name}
                      className="w-full h-48 object-cover rounded-md"
                    />
                  ) : (
                    <div className="bg-muted aspect-video rounded-md flex items-center justify-center">
                      <GraduationCap className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <CardTitle className="line-clamp-1">{course.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-2">
                    {course.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Courses;