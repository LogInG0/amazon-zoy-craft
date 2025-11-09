import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url?: string;
  category: string;
  rating?: number;
  reviewCount?: number;
}

export const ProductCard = ({
  id,
  title,
  description,
  price,
  image_url,
  category,
  rating = 0,
  reviewCount = 0,
}: ProductCardProps) => {
  return (
    <Link to={`/product/${id}`}>
      <Card className="overflow-hidden hover:shadow-glow transition-all duration-300 bg-gradient-card border-border/50 h-full">
        <div className="aspect-video w-full overflow-hidden bg-muted">
          {image_url ? (
            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Нет изображения
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-lg line-clamp-1">{title}</h3>
            <Badge variant="secondary" className="shrink-0">
              {category}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {description}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span className="font-medium">{rating.toFixed(1)}</span>
            </div>
            <span className="text-muted-foreground">({reviewCount})</span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <div className="text-2xl font-bold text-primary">{price} ₽</div>
        </CardFooter>
      </Card>
    </Link>
  );
};
