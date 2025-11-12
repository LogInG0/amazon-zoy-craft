import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/StarRating";
import { ReviewCard } from "@/components/ReviewCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FavoriteButton from "@/components/FavoriteButton";
import ComplaintDialog from "@/components/ComplaintDialog";
import { toast } from "sonner";
import { Star } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id]);

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, profiles!products_seller_id_fkey(username, avatar_url)")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching product:", error);
      toast.error("Товар не найден");
      navigate("/");
    } else {
      setProduct(data);
      setSeller(data.profiles);
    }
    setLoading(false);
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*, profiles(username, avatar_url)")
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
    } else {
      setReviews(data || []);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Войдите, чтобы оставить отзыв");
      navigate("/auth");
      return;
    }

    if (product.seller_id === user.id) {
      toast.error("Вы не можете оставить отзыв на свой собственный товар");
      return;
    }

    if (rating === 0) {
      toast.error("Пожалуйста, выберите рейтинг");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("reviews").insert({
      product_id: id,
      user_id: user.id,
      rating,
      comment: comment.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("Вы уже оставили отзыв на этот товар");
      } else {
        toast.error("Ошибка при отправке отзыва");
      }
    } else {
      toast.success("Отзыв добавлен!");
      setRating(0);
      setComment("");
      fetchReviews();
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  };

  const handleBuyClick = async () => {
    if (!user) {
      toast.error("Войдите, чтобы купить товар");
      navigate("/auth");
      return;
    }

    if (product.seller_id === user.id) {
      toast.error("Вы не можете купить свой собственный товар");
      return;
    }

    // Check if chat already exists
    const { data: existingChat } = await supabase
      .from("chats")
      .select("id")
      .eq("product_id", product.id)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (existingChat) {
      navigate(`/chat/${existingChat.id}`);
      return;
    }

    // Create new chat
    const { data: newChat, error } = await supabase
      .from("chats")
      .insert({
        product_id: product.id,
        buyer_id: user.id,
        seller_id: product.seller_id,
      })
      .select()
      .single();

    if (error) {
      toast.error("Ошибка создания чата");
      console.error(error);
    } else {
      navigate(`/chat/${newChat.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted border border-border">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Нет изображения
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <Badge className="mb-2">{product.category}</Badge>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="text-3xl font-bold flex-1">{product.title}</h1>
                  <div className="flex items-center gap-2">
                    <FavoriteButton productId={product.id} />
                    <ComplaintDialog productId={product.id} />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-warning text-warning" />
                    <span className="text-xl font-semibold">
                      {getAverageRating().toFixed(1)}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    ({reviews.length} отзывов)
                  </span>
                </div>
              </div>

              <div className="text-3xl font-bold">{product.price} Q</div>

              <div>
                <h2 className="font-semibold mb-2">Описание</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  В наличии: {product.stock} шт.
                </p>
              </div>

              <Card className="bg-gradient-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={seller?.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {seller?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-muted-foreground">Продавец</p>
                      <p className="font-semibold">{seller?.username}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {user && user.id !== product.seller_id && (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleBuyClick}
                >
                  Купить товар
                </Button>
              )}

              {user && user.id === product.seller_id && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Это ваш товар
                  </p>
                </div>
              )}

              {!user && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Войдите, чтобы купить товар
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Отзывы и рейтинги</h2>

              {user && (
                <Card className="bg-gradient-card border-border/50 mb-6">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold">Оставить отзыв</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Ваша оценка:</span>
                      <StarRating rating={rating} onChange={setRating} />
                    </div>
                    <Textarea
                      placeholder="Напишите ваш отзыв (необязательно)..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                    />
                    <Button onClick={handleSubmitReview} disabled={submitting}>
                      {submitting ? "Отправка..." : "Отправить отзыв"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {reviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Пока нет отзывов. Будьте первым!
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      username={review.profiles.username}
                      avatar_url={review.profiles.avatar_url}
                      rating={review.rating}
                      comment={review.comment}
                      created_at={review.created_at}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
