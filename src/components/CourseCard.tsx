import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface CourseCardProps {
  name: string;
  description: string;
  coverImage?: string;
}

const CourseCard = ({ name, description, coverImage }: CourseCardProps) => {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        {coverImage ? (
          <img
            src={coverImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl opacity-20">📚</div>
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle className="text-xl group-hover:text-primary transition-colors">
          {name}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-primary font-medium group-hover:gap-2 transition-all">
          <span>了解详情</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
