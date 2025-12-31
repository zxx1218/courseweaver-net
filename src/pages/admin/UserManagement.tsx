import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Settings, Loader2, Search } from "lucide-react";

interface User {
  id: string;
  username: string;
  full_name: string | null;
  organization: string | null;
  phone: string | null;
  created_at: string | null;
}

interface Course {
  id: string;
  name: string;
}

interface CoursePermission {
  course_id: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    fullName: "",
    organization: "",
    phone: "",
  });

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("获取用户失败:", error);
      toast.error("获取用户列表失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("获取课程失败:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCourses();
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast.error("用户名和密码不能为空");
      return;
    }

    setCreating(true);
    try {
      // 使用Supabase Auth创建用户
      const { data, error } = await supabase.auth.signUp({
        email: `${newUser.username}@system.local`,
        password: newUser.password,
        options: {
          data: {
            username: newUser.username,
            full_name: newUser.fullName,
            organization: newUser.organization,
            phone: newUser.phone,
            password: newUser.password,
          },
        },
      });

      if (error) throw error;

      toast.success("用户创建成功");
      setCreateDialogOpen(false);
      setNewUser({
        username: "",
        password: "",
        fullName: "",
        organization: "",
        phone: "",
      });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "创建用户失败");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) throw error;

      toast.success("用户已删除");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "删除用户失败");
    }
  };

  const openPermissionDialog = async (user: User) => {
    setSelectedUser(user);
    setPermissionDialogOpen(true);

    try {
      const { data, error } = await supabase
        .from("course_permissions")
        .select("course_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setUserPermissions((data || []).map((p: CoursePermission) => p.course_id));
    } catch (error) {
      console.error("获取用户权限失败:", error);
      setUserPermissions([]);
    }
  };

  const toggleCoursePermission = (courseId: string) => {
    setUserPermissions((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const savePermissions = async () => {
    if (!selectedUser) return;

    setSavingPermissions(true);
    try {
      // 先删除现有权限
      await supabase
        .from("course_permissions")
        .delete()
        .eq("user_id", selectedUser.id);

      // 添加新权限
      if (userPermissions.length > 0) {
        const newPermissions = userPermissions.map((courseId) => ({
          user_id: selectedUser.id,
          course_id: courseId,
        }));

        const { error } = await supabase
          .from("course_permissions")
          .insert(newPermissions);

        if (error) throw error;
      }

      toast.success("权限保存成功");
      setPermissionDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "保存权限失败");
    } finally {
      setSavingPermissions(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.organization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">用户管理</h1>
          <p className="text-muted-foreground mt-2">管理系统用户和课程权限</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              创建用户
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新用户</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>用户名 *</Label>
                <Input
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  placeholder="请输入用户名"
                />
              </div>
              <div className="space-y-2">
                <Label>密码 *</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder="请输入密码（至少6位）"
                />
              </div>
              <div className="space-y-2">
                <Label>姓名</Label>
                <Input
                  value={newUser.fullName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, fullName: e.target.value })
                  }
                  placeholder="请输入姓名"
                />
              </div>
              <div className="space-y-2">
                <Label>所属机构</Label>
                <Input
                  value={newUser.organization}
                  onChange={(e) =>
                    setNewUser({ ...newUser, organization: e.target.value })
                  }
                  placeholder="请输入所属机构"
                />
              </div>
              <div className="space-y-2">
                <Label>电话</Label>
                <Input
                  value={newUser.phone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone: e.target.value })
                  }
                  placeholder="请输入电话号码"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handleCreateUser} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  "创建"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索用户..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>机构</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      暂无用户数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.full_name || "-"}</TableCell>
                      <TableCell>{user.organization || "-"}</TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPermissionDialog(user)}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            权限
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除用户 "{user.username}" 吗？此操作不可撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 权限配置对话框 */}
      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>配置课程权限 - {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-96 overflow-y-auto">
            {courses.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">暂无课程</p>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      id={course.id}
                      checked={userPermissions.includes(course.id)}
                      onCheckedChange={() => toggleCoursePermission(course.id)}
                    />
                    <label
                      htmlFor={course.id}
                      className="flex-1 cursor-pointer font-medium"
                    >
                      {course.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPermissionDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={savePermissions} disabled={savingPermissions}>
              {savingPermissions ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
