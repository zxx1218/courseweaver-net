import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2 } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 登录验证
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        toast({
          variant: "destructive",
          title: "登录失败",
          description: authError.message,
        });
        setLoading(false);
        return;
      }

      if (!authData.user) {
        toast({
          variant: "destructive",
          title: "登录失败",
          description: "无法获取用户信息",
        });
        setLoading(false);
        return;
      }

      // 检查是否是管理员
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) {
        console.error("检查管理员角色失败:", roleError);
        await supabase.auth.signOut();
        toast({
          variant: "destructive",
          title: "登录失败",
          description: "权限验证失败",
        });
        setLoading(false);
        return;
      }

      if (!roleData) {
        // 不是管理员，退出登录
        await supabase.auth.signOut();
        toast({
          variant: "destructive",
          title: "访问被拒绝",
          description: "您没有管理员权限",
        });
        setLoading(false);
        return;
      }

      // 登录成功，跳转到管理后台
      toast({
        title: "登录成功",
        description: "欢迎回来，管理员",
      });
      navigate("/admin");
    } catch (err) {
      console.error("登录异常:", err);
      toast({
        variant: "destructive",
        title: "登录失败",
        description: "发生未知错误",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">管理员登录</CardTitle>
          <CardDescription>
            请使用管理员账号登录后台管理系统
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <a 
              href="/" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              返回首页
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
