import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type FavoriteButtonProps = {
  productId: string;
};

export default function FavoriteButton({ productId }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, [productId]);

  const checkFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Войдите, чтобы добавить в избранное");
      return;
    }

    setLoading(true);

    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("product_id", productId)
        .eq("user_id", session.user.id);

      if (error) {
        toast.error("Ошибка удаления из избранного");
      } else {
        toast.success("Удалено из избранного");
        setIsFavorite(false);
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ product_id: productId, user_id: session.user.id });

      if (error) {
        toast.error("Ошибка добавления в избранное");
      } else {
        toast.success("Добавлено в избранное");
        setIsFavorite(true);
      }
    }

    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleFavorite}
      disabled={loading}
    >
      <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
    </Button>
  );
}
