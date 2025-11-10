import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Purchase = {
  id: string;
  price: number;
  status: string;
  created_at: string;
  products: {
    title: string;
    image_url: string | null;
  };
};

export default function Purchases() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
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

    loadPurchases();
  };

  const loadPurchases = async () => {
    const { data } = await supabase
      .from("purchases")
      .select("*, products(title, image_url)")
      .order("created_at", { ascending: false });

    setPurchases(data || []);
    setLoading(false);
  };

  if (loading) {
    return <div className="container mx-auto py-8 px-4">Загрузка...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">История покупок</h1>
      
      {purchases.length === 0 ? (
        <p className="text-muted-foreground">У вас пока нет покупок</p>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <Card key={purchase.id}>
              <CardHeader>
                <CardTitle className="text-lg">{purchase.products.title}</CardTitle>
                <CardDescription>
                  {new Date(purchase.created_at).toLocaleDateString()} • {purchase.price} ₽
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge>{purchase.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
