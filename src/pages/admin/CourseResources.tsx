import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Folder, 
  FileVideo, 
  FileText, 
  Upload, 
  Loader2,
  FolderPlus,
  ChevronRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Resource {
  id: string;
  name: string;
  type: string;
  file_url: string;
  file_path: string | null;
  is_folder: boolean;
  parent_id: string | null;
  order_index: number;
  created_at: string | null;
  children?: Resource[];
}

interface Course {
  id: string;
  name: string;
}

const CourseResources = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [course, setCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Resource[]>([]);

  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);

  const [newFolderName, setNewFolderName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [selectedType, setSelectedType] = useState<string>("video");

  const fetchCourse = async () => {
    if (!courseId) return;

    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, name")
        .eq("id", courseId)
        .single();

      if (error) throw error;
      setCourse(data);
    } catch (error) {
      console.error("获取课程失败:", error);
      toast.error("获取课程信息失败");
      navigate("/admin/courses");
    }
  };

  const fetchResources = async () => {
    if (!courseId) return;

    try {
      const { data, error } = await supabase
        .from("course_resources")
        .select("*")
        .eq("course_id", courseId)
        .order("is_folder", { ascending: false })
        .order("order_index")
        .order("name");

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error("获取资源失败:", error);
      toast.error("获取课程资源失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
    fetchResources();
  }, [courseId]);

  // 构建面包屑导航
  useEffect(() => {
    if (!currentFolder) {
      setBreadcrumbs([]);
      return;
    }

    const buildBreadcrumbs = (folderId: string): Resource[] => {
      const folder = resources.find((r) => r.id === folderId);
      if (!folder) return [];

      if (folder.parent_id) {
        return [...buildBreadcrumbs(folder.parent_id), folder];
      }
      return [folder];
    };

    setBreadcrumbs(buildBreadcrumbs(currentFolder));
  }, [currentFolder, resources]);

  // 获取当前文件夹下的资源
  const currentResources = resources.filter(
    (r) => r.parent_id === currentFolder
  );

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !courseId) {
      toast.error("文件夹名称不能为空");
      return;
    }

    try {
      const { error } = await supabase.from("course_resources").insert({
        course_id: courseId,
        name: newFolderName.trim(),
        type: "folder",
        file_url: "",
        is_folder: true,
        parent_id: currentFolder,
        order_index: currentResources.length,
      });

      if (error) throw error;

      toast.success("文件夹创建成功");
      setFolderDialogOpen(false);
      setNewFolderName("");
      fetchResources();
    } catch (error: any) {
      toast.error(error.message || "创建文件夹失败");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
      setUploadDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || !courseId) return;

    setUploading(true);
    setUploadProgress(0);

    const totalFiles = selectedFiles.length;
    let uploadedCount = 0;

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${courseId}/${fileName}`;

        // 上传到存储
        const { error: uploadError } = await supabase.storage
          .from("course-resources")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 获取公开URL
        const { data: urlData } = supabase.storage
          .from("course-resources")
          .getPublicUrl(filePath);

        // 保存到数据库
        const { error: dbError } = await supabase.from("course_resources").insert({
          course_id: courseId,
          name: file.name,
          type: selectedType,
          file_url: urlData.publicUrl,
          file_path: filePath,
          is_folder: false,
          parent_id: currentFolder,
          order_index: currentResources.length + i,
        });

        if (dbError) throw dbError;

        uploadedCount++;
        setUploadProgress((uploadedCount / totalFiles) * 100);
      }

      toast.success(`成功上传 ${uploadedCount} 个文件`);
      setUploadDialogOpen(false);
      setSelectedFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fetchResources();
    } catch (error: any) {
      toast.error(error.message || "上传失败");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteResource = async () => {
    if (!resourceToDelete) return;

    try {
      // 如果是文件，先从存储删除
      if (!resourceToDelete.is_folder && resourceToDelete.file_path) {
        await supabase.storage
          .from("course-resources")
          .remove([resourceToDelete.file_path]);
      }

      // 如果是文件夹，递归删除子资源
      if (resourceToDelete.is_folder) {
        const deleteChildren = async (folderId: string) => {
          const children = resources.filter((r) => r.parent_id === folderId);
          for (const child of children) {
            if (child.is_folder) {
              await deleteChildren(child.id);
            } else if (child.file_path) {
              await supabase.storage
                .from("course-resources")
                .remove([child.file_path]);
            }
          }
          // 删除子资源记录
          await supabase
            .from("course_resources")
            .delete()
            .eq("parent_id", folderId);
        };

        await deleteChildren(resourceToDelete.id);
      }

      // 删除资源记录
      const { error } = await supabase
        .from("course_resources")
        .delete()
        .eq("id", resourceToDelete.id);

      if (error) throw error;

      toast.success("删除成功");
      setDeleteDialogOpen(false);
      setResourceToDelete(null);
      fetchResources();
    } catch (error: any) {
      toast.error(error.message || "删除失败");
    }
  };

  const getResourceIcon = (resource: Resource) => {
    if (resource.is_folder) {
      return <Folder className="w-5 h-5 text-yellow-500" />;
    }
    if (resource.type === "video") {
      return <FileVideo className="w-5 h-5 text-blue-500" />;
    }
    return <FileText className="w-5 h-5 text-green-500" />;
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/courses")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{course?.name || "加载中..."}</h1>
          <p className="text-muted-foreground mt-1">管理课程资源</p>
        </div>
      </div>

      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <button
          onClick={() => setCurrentFolder(null)}
          className={`hover:text-primary transition-colors ${
            !currentFolder ? "text-primary font-medium" : "text-muted-foreground"
          }`}
        >
          根目录
        </button>
        {breadcrumbs.map((folder) => (
          <div key={folder.id} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <button
              onClick={() => setCurrentFolder(folder.id)}
              className={`hover:text-primary transition-colors ${
                currentFolder === folder.id
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {folder.name}
            </button>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>资源列表</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setFolderDialogOpen(true)}
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                新建文件夹
              </Button>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                上传文件
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*,.pdf,.doc,.docx,.ppt,.pptx"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : currentResources.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>此文件夹为空</p>
              <p className="text-sm mt-2">点击上方按钮创建文件夹或上传文件</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentResources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => {
                      if (resource.is_folder) {
                        setCurrentFolder(resource.id);
                      }
                    }}
                  >
                    {getResourceIcon(resource)}
                    <div>
                      <p className="font-medium">{resource.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {resource.is_folder
                          ? "文件夹"
                          : resource.type === "video"
                          ? "视频"
                          : "文档"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setResourceToDelete(resource);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新建文件夹对话框 */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>文件夹名称</Label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="请输入文件夹名称"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateFolder}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 上传对话框 */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传文件</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>已选择 {selectedFiles?.length || 0} 个文件</Label>
              {selectedFiles && (
                <div className="mt-2 max-h-32 overflow-y-auto text-sm text-muted-foreground">
                  {Array.from(selectedFiles).map((file, i) => (
                    <div key={i}>{file.name}</div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>资源类型</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">视频</SelectItem>
                  <SelectItem value="document">文档</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {uploading && (
              <div>
                <Label>上传进度</Label>
                <Progress value={uploadProgress} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFiles(null);
              }}
              disabled={uploading}
            >
              取消
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  上传中...
                </>
              ) : (
                "开始上传"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除{resourceToDelete?.is_folder ? "文件夹" : "文件"} "
              {resourceToDelete?.name}" 吗？
              {resourceToDelete?.is_folder && "这将同时删除文件夹内的所有内容。"}
              此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteResource}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseResources;
