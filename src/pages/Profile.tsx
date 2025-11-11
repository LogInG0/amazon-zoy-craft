import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
        fetchRoles(session.user.id);
        fetchUserProducts(session.user.id);
      }
    });
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
      setUsername(data.username);
      setBio(data.bio || "");
      setAvatarUrl(data.avatar_url || "");
    }
    setLoading(false);
  };

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching roles:", error);
    } else {
      setRoles(data.map((r: any) => r.role));
    }
  };

  const fetchUserProducts = async (userId: string) => {
    const { data, error } = await supabase
      .from("products")
      .select("*, reviews(rating)")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts(data || []);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        bio,
        avatar_url: avatarUrl,
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      toast.error("Ошибка при обновлении профиля");
    } else {
      toast.success("Профиль обновлен!");
      fetchProfile(user.id);
    }
  };

  const handleChangePassword = async () => {
    const newPassword = prompt("Введите новый пароль (минимум 6 символов):");
    if (!newPassword || newPassword.length < 6) {
      toast.error("Пароль должен быть минимум 6 символов");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error("Ошибка при смене пароля");
    } else {
      toast.success("Пароль успешно изменен!");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      "Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо!"
    );
    if (!confirmed) return;

    // Delete user's data first
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      toast.error("Ошибка при удалении аккаунта");
      return;
    }

    // Sign out
    await supabase.auth.signOut();
    toast.success("Аккаунт удален");
    navigate("/auth");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Вы вышли из аккаунта");
    navigate("/auth");
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "moderator":
        return "secondary";
      default:
        return "default";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "moderator":
        return "Модератор";
      default:
        return "Пользователь";
    }
  };

  const getProductRating = (reviews: { rating: number }[]) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Профиль</TabsTrigger>
              <TabsTrigger value="products">Мои товары</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>Информация о профиле</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">{username}</h2>
                      <div className="flex gap-2 mt-2">
                        {roles.map((role) => (
                          <Badge key={role} variant={getRoleBadgeVariant(role)}>
                            {getRoleLabel(role)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Имя пользователя</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">О себе</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Расскажите о себе..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatar">URL аватара</Label>
                      <Input
                        id="avatar"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading}>
                        Сохранить изменения
                      </Button>
                      <Button type="button" variant="outline" onClick={() => navigate("/create-product")}>
                        Создать товар
                      </Button>
                    </div>
                  </form>

                  <div className="border-t pt-6 mt-6 space-y-3">
                    <h3 className="font-semibold mb-4">Управление аккаунтом</h3>
                    <Button variant="outline" onClick={handleChangePassword} className="w-full">
                      Сменить пароль
                    </Button>
                    <Button variant="outline" onClick={handleLogout} className="w-full">
                      Выйти из аккаунта
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteAccount} className="w-full">
                      Удалить аккаунт
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>Статистика</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-3xl font-bold text-primary">{products.length}</div>
                      <div className="text-sm text-muted-foreground">Товаров</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-3xl font-bold text-accent">
                        {products.reduce((sum, p) => sum + (p.reviews?.length || 0), 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Отзывов</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products">
              {products.length === 0 ? (
                <Card className="bg-gradient-card border-border/50">
                  <CardContent className="py-16 text-center">
                    <p className="text-muted-foreground">У вас пока нет товаров</p>
                    <Button className="mt-4" onClick={() => navigate("/create-product")}>
                      Добавить товар
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      title={product.title}
                      description={product.description}
                      price={product.price}
                      image_url={product.image_url}
                      category={product.category}
                      rating={getProductRating(product.reviews)}
                      reviewCount={product.reviews.length}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
