import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";

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
    <Card className="overflow-hidden hover:border-foreground/20 transition-all h-full">
      <Link to={`/product/${id}`}>
        <div className="aspect-video w-full overflow-hidden bg-muted">
          {image_url ? (
            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Нет изображения
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link to={`/product/${id}`}>
            <h3 className="font-semibold line-clamp-1 hover:underline">{title}</h3>
          </Link>
          <FavoriteButton productId={id} />
        </div>
        <Badge variant="secondary" className="mb-2">{category}</Badge>
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
        <div className="text-xl font-bold">{price} Q</div>
      </CardFooter>
    </Card>
  );
};
