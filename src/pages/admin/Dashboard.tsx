import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, FileText, FolderOpen } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    resources: 0,
    folders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, coursesRes, resourcesRes] = await Promise.all([
          supabase.from("users").select("id", { count: "exact", head: true }),
          supabase.from("courses").select("id", { count: "exact", head: true }),
          supabase.from("course_resources").select("id, is_folder", { count: "exact" }),
        ]);

        const resources = resourcesRes.data || [];
        const folders = resources.filter(r => r.is_folder).length;
        const files = resources.filter(r => !r.is_folder).length;

        setStats({
          users: usersRes.count || 0,
          courses: coursesRes.count || 0,
          resources: files,
          folders: folders,
        });
      } catch (error) {
        console.error("获取统计数据失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: "用户总数", value: stats.users, icon: Users, color: "text-blue-500" },
    { title: "课程总数", value: stats.courses, icon: BookOpen, color: "text-green-500" },
    { title: "文件数量", value: stats.resources, icon: FileText, color: "text-orange-500" },
    { title: "文件夹数量", value: stats.folders, icon: FolderOpen, color: "text-purple-500" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">仪表盘</h1>
        <p className="text-muted-foreground mt-2">系统数据概览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? "..." : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="/admin/users" className="block p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
              <div className="font-medium">用户管理</div>
              <div className="text-sm text-muted-foreground">创建、编辑用户和配置课程权限</div>
            </a>
            <a href="/admin/courses" className="block p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
              <div className="font-medium">课程管理</div>
              <div className="text-sm text-muted-foreground">管理课程、上传资源文件</div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">系统版本</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">运行状态</span>
              <span className="font-medium text-green-500">正常</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
