import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Video, Shield } from "lucide-react";
import CourseCard from "@/components/CourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface Course {
  id: string;
  name: string;
  description: string;
  cover_image?: string;
}

const API_BASE_URL = 'http://localhost:3001/api/auth';

const Index = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 轮播图图片列表
  const carouselImages = [
    "lunbo_img/1.png",
    "lunbo_img/2.png",
    "lunbo_img/3.png"
  ];

  useEffect(() => {
    // 检查用户是否已经登录
    const session = localStorage.getItem('user_session');
    if (session) {
      const parsedSession = JSON.parse(session);
      if (Date.now() < parsedSession.expires_at) {
        navigate("/courses");
      } else {
        localStorage.removeItem('user_session');
      }
    }

    // Fetch courses
    const fetchCourses = async () => {
      try {
        // 由于这是首页，我们展示所有课程作为示例
        // 在实际应用中可能需要根据业务需求调整
        const response = await fetch(`${API_BASE_URL}/courses/sample`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Received courses data:', data);
        
        // 确保数据格式正确
        const formattedCourses = Array.isArray(data) ? data.map(course => ({
          id: course.id.toString(),
          name: course.name,
          description: course.description || "",
          cover_image: course.cover_image || undefined
        })) : [];
        
        setCourses(formattedCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
        // 如果API调用失败，可以显示一些默认课程或者空状态
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              长藤科技-在线培训系统
            </h1>
          </div>
          <Button onClick={() => navigate("/auth")}>登录 / 注册</Button>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-8">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 3000,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent>
              {carouselImages.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden shadow-elegant">
                    <img
                      src={image}
                      alt={`轮播图 ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='300'%3E%3Crect width='800' height='300' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23999'%3E图片加载失败%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-8 h-12 w-12" />
            <CarouselNext className="right-8 h-12 w-12" />
          </Carousel>
        </section>

        <section className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">丰富的课程资源</h3>
              <p className="text-muted-foreground">
                涵盖多个专业领域的精品课程，满足不同学习需求
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">高清视频教学</h3>
              <p className="text-muted-foreground">
                专业制作的教学视频，支持在线播放，随时随地学习
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">安全的权限管理</h3>
              <p className="text-muted-foreground">
                基于权限的课程访问控制，保护课程资源安全
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              精品课程
            </h2>
            <p className="text-xl text-muted-foreground">
              探索我们的专业课程体系，开启您的学习之旅
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  name={course.name}
                  description={course.description || ""}
                  coverImage={course.cover_image || undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">暂无课程数据</p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t bg-card/50 backdrop-blur mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 长藤科技-在线培训系统. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;