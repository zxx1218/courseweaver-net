import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [signupData, setSignupData] = useState({ 
    username: "", 
    email: "", 
    password: "", 
    fullName: "" 
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/courses");
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", loginData.username)
        .single();

      if (!profile) {
        toast.error("用户名不存在");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${loginData.username}@system.local`,
        password: loginData.password,
      });

      if (error) throw error;

      if (data.session) {
        toast.success("登录成功！");
        navigate("/courses");
      }
    } catch (error: any) {
      toast.error(error.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: `${signupData.username}@system.local`,
        password: signupData.password,
        options: {
          data: {
            username: signupData.username,
            full_name: signupData.fullName,
          },
          emailRedirectTo: `${window.location.origin}/courses`,
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success("注册成功！正在跳转...");
        setTimeout(() => navigate("/courses"), 1000);
      }
    } catch (error: any) {
      toast.error(error.message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-primary to-accent p-4 rounded-2xl shadow-lg">
              <GraduationCap className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            在线培训系统
          </h1>
          <p className="text-muted-foreground">欢迎来到学习平台</p>
        </div>

        <Card className="shadow-xl border-none bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle>账户登录</CardTitle>
            <CardDescription>使用您的账户登录或创建新账户</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">登录</TabsTrigger>
                <TabsTrigger value="signup">注册</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">用户名</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="请输入用户名"
                      value={loginData.username}
                      onChange={(e) =>
                        setLoginData({ ...loginData, username: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">密码</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="请输入密码"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "登录中..." : "登录"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">用户名</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="请输入用户名"
                      value={signupData.username}
                      onChange={(e) =>
                        setSignupData({ ...signupData, username: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-fullname">姓名</Label>
                    <Input
                      id="signup-fullname"
                      type="text"
                      placeholder="请输入真实姓名"
                      value={signupData.fullName}
                      onChange={(e) =>
                        setSignupData({ ...signupData, fullName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">密码</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="请设置密码（至少6位）"
                      value={signupData.password}
                      onChange={(e) =>
                        setSignupData({ ...signupData, password: e.target.value })
                      }
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "注册中..." : "注册"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
