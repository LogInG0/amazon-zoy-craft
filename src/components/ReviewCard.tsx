import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface ReviewCardProps {
  username: string;
  avatar_url?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export const ReviewCard = ({
  username,
  avatar_url,
  rating,
  comment,
  created_at,
}: ReviewCardProps) => {
  return (
    <Card className="bg-gradient-card border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src={avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h4 className="font-semibold">{username}</h4>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(created_at), {
                  addSuffix: true,
                  locale: ru,
                })}
              </span>
            </div>
            <StarRating rating={rating} readonly size="sm" />
            {comment && (
              <p className="mt-2 text-sm text-muted-foreground">{comment}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
