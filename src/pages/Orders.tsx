import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Truck, MessageSquare } from "lucide-react";

type Order = {
  id: string;
  order_number: string;
  price: number;
  delivery_type: string;
  delivery_cost: number;
  total_price: number;
  status: string;
  delivery_address: string | null;
  created_at: string;
  chat_id: string;
  products: {
    title: string;
    image_url: string | null;
  };
};

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
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

    loadOrders();
    subscribeToOrders();
  };

  const loadOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, products(title, image_url)")
      .order("created_at", { ascending: false });

    setOrders(data || []);
    setLoading(false);
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel("orders-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getStatusText = (status: string) => {
    const statuses: { [key: string]: string } = {
      pending: "Ожидает подтверждения",
      confirmed: "Подтвержден",
      preparing: "Собирается на складе",
      at_pickup_point: "В пункте выдачи",
      in_transit: "В пути",
      ready_for_pickup: "Готов к получению",
      delivered: "Доставлен",
      completed: "Завершен",
      cancelled: "Отменен",
    };
    return statuses[status] || status;
  };

  const getStatusColor = (status: string) => {
    if (status === "completed") return "bg-green-500";
    if (status === "cancelled") return "bg-red-500";
    if (status === "pending") return "bg-yellow-500";
    return "bg-blue-500";
  };

  if (loading) {
    return <div className="container mx-auto py-8 px-4">Загрузка...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Мои заказы</h1>
      
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            У вас пока нет заказов
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    {order.products.image_url && (
                      <img
                        src={order.products.image_url}
                        alt={order.products.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg">{order.products.title}</CardTitle>
                      <CardDescription>
                        Заказ #{order.order_number}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      {order.delivery_type === "delivery" ? (
                        <>
                          <Truck className="w-4 h-4" />
                          <span>Доставка</span>
                        </>
                      ) : (
                        <>
                          <Package className="w-4 h-4" />
                          <span>Самовывоз</span>
                        </>
                      )}
                    </div>
                    {order.delivery_address && (
                      <p className="text-sm text-muted-foreground">
                        Адрес: {order.delivery_address}
                      </p>
                    )}
                    <p className="font-bold">{order.total_price} Q</p>
                  </div>
                  <Button
                    onClick={() => navigate(`/chat/${order.chat_id}`)}
                    variant="outline"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Перейти в чат
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
