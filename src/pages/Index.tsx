import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Video, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/courses");
      }
    });
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
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 inline-block">
              <div className="bg-gradient-to-br from-primary to-accent p-6 rounded-3xl shadow-2xl">
                <GraduationCap className="w-20 h-20 text-primary-foreground" />
              </div>
            </div>
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              欢迎来到-在线培训平台
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              专业的在线学习管理系统，为您提供高质量的培训课程和学习资源
            </p>
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 py-6">
              立即开始学习
            </Button>
          </div>
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
