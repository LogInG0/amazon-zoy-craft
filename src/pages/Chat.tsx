import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Package, Truck } from "lucide-react";

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
};

type ChatData = {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  products: {
    title: string;
    price: number;
    image_url: string | null;
  };
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  delivery_type: string;
  total_price: number;
  buyer_confirmed: boolean;
  seller_confirmed: boolean;
  delivery_address: string | null;
};

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [chat, setChat] = useState<ChatData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });
  }, [navigate]);

  useEffect(() => {
    if (id && user) {
      loadChat();
      loadMessages();
      loadOrder();
      subscribeToMessages();
      subscribeToOrders();
    }
  }, [id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChat = async () => {
    const { data, error } = await supabase
      .from("chats")
      .select("*, products(title, price, image_url)")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Ошибка загрузки чата");
      navigate("/");
    } else {
      setChat(data);
    }
  };

  const loadMessages = async () => {
    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", id)
      .order("created_at", { ascending: true });

    if (messagesData) {
      const senderIds = [...new Set(messagesData.map(m => m.sender_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", senderIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const enrichedMessages = messagesData.map(msg => ({
        ...msg,
        profiles: profilesMap.get(msg.sender_id) || { username: "Unknown", avatar_url: null }
      }));

      setMessages(enrichedMessages);
    }
  };

  const loadOrder = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("chat_id", id)
      .maybeSingle();

    setOrder(data);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${id}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", (payload.new as any).sender_id)
            .single();

          setMessages((prev) => [...prev, { ...payload.new as any, profiles: data }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel(`orders-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `chat_id=eq.${id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            setOrder(payload.new as Order);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase.from("messages").insert({
      chat_id: id,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    if (error) {
      toast.error("Ошибка отправки сообщения");
    } else {
      setNewMessage("");
    }
  };

  const handleSellerCreateOrder = async () => {
    if (!chat || !user || user.id !== chat.seller_id) return;

    const deliveryCost = deliveryType === "delivery" ? 180 : 0;
    const totalPrice = Number(chat.products.price) + deliveryCost;

    const { error } = await supabase.from("orders").insert({
      order_number: "",
      chat_id: id,
      product_id: chat.product_id,
      buyer_id: chat.buyer_id,
      seller_id: chat.seller_id,
      price: chat.products.price,
      delivery_type: deliveryType,
      delivery_cost: deliveryCost,
      total_price: totalPrice,
      delivery_address: deliveryType === "delivery" ? deliveryAddress : null,
      seller_confirmed: true,
    });

    if (error) {
      toast.error("Ошибка создания заказа");
    } else {
      toast.success("Заказ создан! Ожидайте подтверждения покупателя");
    }
  };

  const handleBuyerConfirm = async () => {
    if (!order || !user || user.id !== chat?.buyer_id) return;

    const { error } = await supabase
      .from("orders")
      .update({ buyer_confirmed: true, status: "confirmed" })
      .eq("id", order.id);

    if (error) {
      toast.error("Ошибка подтверждения заказа");
    } else {
      toast.success("Заказ подтвержден!");
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order || !user || user.id !== chat?.seller_id) return;

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", order.id);

    if (error) {
      toast.error("Ошибка обновления статуса");
    } else {
      toast.success("Статус обновлен");
    }
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

  if (!chat || !user) return null;

  const isSeller = user.id === chat.seller_id;
  const isBuyer = user.id === chat.buyer_id;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="flex flex-col h-[600px]">
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  {chat.products.image_url && (
                    <img
                      src={chat.products.image_url}
                      alt={chat.products.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <h2 className="font-bold">{chat.products.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {chat.products.price} Q
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.sender_id === user.id ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.profiles?.avatar_url || ""} />
                      <AvatarFallback>
                        {message.profiles?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`rounded-lg p-3 max-w-[70%] ${
                        message.sender_id === user.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            {!order && isSeller && (
              <Card className="p-4 space-y-4">
                <h3 className="font-bold">Создать заказ</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Способ получения</label>
                    <Select value={deliveryType} onValueChange={(v: any) => setDeliveryType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pickup">
                          Самовывоз (бесплатно)
                        </SelectItem>
                        <SelectItem value="delivery">
                          Доставка (+180 Q)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {deliveryType === "delivery" && (
                    <div>
                      <label className="text-sm font-medium">Адрес доставки</label>
                      <Textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Введите адрес..."
                      />
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <div className="flex justify-between mb-2">
                      <span>Товар:</span>
                      <span>{chat.products.price} Q</span>
                    </div>
                    {deliveryType === "delivery" && (
                      <div className="flex justify-between mb-2">
                        <span>Доставка:</span>
                        <span>180 Q</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold">
                      <span>Итого:</span>
                      <span>
                        {Number(chat.products.price) + (deliveryType === "delivery" ? 180 : 0)} Q
                      </span>
                    </div>
                  </div>

                  <Button onClick={handleSellerCreateOrder} className="w-full">
                    Отправить заказ покупателю
                  </Button>
                </div>
              </Card>
            )}

            {order && (
              <Card className="p-4 space-y-4">
                <div>
                  <h3 className="font-bold mb-2">Заказ #{order.order_number}</h3>
                  <Badge>{getStatusText(order.status)}</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Способ получения:</span>
                    <span>
                      {order.delivery_type === "delivery" ? (
                        <span className="flex items-center gap-1">
                          <Truck className="w-4 h-4" />
                          Доставка
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          Самовывоз
                        </span>
                      )}
                    </span>
                  </div>
                  {order.delivery_address && (
                    <div>
                      <span className="font-medium">Адрес:</span>
                      <p className="text-muted-foreground">{order.delivery_address}</p>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Итого:</span>
                    <span>{order.total_price} Q</span>
                  </div>
                </div>

                {isBuyer && order.seller_confirmed && !order.buyer_confirmed && (
                  <Button onClick={handleBuyerConfirm} className="w-full">
                    Подтвердить покупку
                  </Button>
                )}

                {isSeller && order.buyer_confirmed && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Обновить статус</label>
                    <Select
                      value={order.status}
                      onValueChange={handleUpdateStatus}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Подтвержден</SelectItem>
                        <SelectItem value="preparing">Собирается на складе</SelectItem>
                        <SelectItem value="at_pickup_point">В пункте выдачи</SelectItem>
                        <SelectItem value="in_transit">В пути</SelectItem>
                        <SelectItem value="ready_for_pickup">Готов к получению</SelectItem>
                        <SelectItem value="delivered">Доставлен</SelectItem>
                        <SelectItem value="completed">Завершен</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
