import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  type CarouselApi,
} from "@/components/ui/carousel";

interface Course {
  id: string;
  name: string;
  description: string;
  cover_image?: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  
  // 轮播图图片列表
  const carouselImages = [
    "/lunbo_img/1.jpg",
    "/lunbo_img/2.jpg",
    "/lunbo_img/3.jpg",
    "/lunbo_img/4.jpg",
    "/lunbo_img/5.jpg",
  ];

  // 自动轮播
  useEffect(() => {
    if (!carouselApi) return;

    const intervalId = setInterval(() => {
      carouselApi.scrollNext();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [carouselApi]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/courses");
      }
    });

    // Fetch courses
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("id, name, description, cover_image")
          .order("created_at", { ascending: true });

        if (error) throw error;
        setCourses(data || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
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
            setApi={setCarouselApi}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent>
              {carouselImages.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="relative w-full aspect-[16/6] rounded-2xl overflow-hidden shadow-2xl">
                    <img
                      src={image}
                      alt={`轮播图 ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='300'%3E%3Crect width='800' height='300' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23999'%3E图片加载失败%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </section>

        <section className="container mx-auto px-4 py-16">
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
          ) : (
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
