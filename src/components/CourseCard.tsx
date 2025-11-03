import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CourseCardProps {
  name: string;
  description: string;
  coverImage?: string;
}

const CourseCard = ({ name, description, coverImage }: CourseCardProps) => {
  const [imageError, setImageError] = React.useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/auth");
  };

  return (
    <Card 
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer" 
      onClick={handleClick}
    >
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        {coverImage && !imageError ? (
          <img
            src={coverImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setImageError(true)}
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
    </Card>
  );
};

export default CourseCard;
