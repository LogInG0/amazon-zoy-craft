import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Navbar } from "@/components/Navbar";

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string;
  seller_id: string;
};

type Favorite = {
  id: string;
  products: Product;
};

export default function Favorites() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    loadFavorites();
  };

  const loadFavorites = async () => {
    const { data } = await supabase
      .from("favorites")
      .select("*, products(*)")
      .order("created_at", { ascending: false });

    setFavorites(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} />
        <div className="container mx-auto py-8 px-4">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Избранное</h1>
      
      {favorites.length === 0 ? (
        <p className="text-muted-foreground">У вас пока нет избранных товаров</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => (
            <ProductCard
              key={fav.id}
              id={fav.products.id}
              title={fav.products.title}
              description={fav.products.description}
              price={fav.products.price}
              image_url={fav.products.image_url || undefined}
              category={fav.products.category}
            />
          ))}
        </div>
      )}
      </main>
    </div>
  );
}
