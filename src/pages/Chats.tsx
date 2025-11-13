import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";

type Chat = {
  id: string;
  created_at: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  products: {
    title: string;
    image_url: string | null;
    price: number;
  };
  buyer_profile?: {
    username: string;
    avatar_url: string | null;
  };
  seller_profile?: {
    username: string;
    avatar_url: string | null;
  };
  messages: {
    content: string;
    created_at: string;
  }[];
};

export default function Chats() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<Chat[]>([]);
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
    loadChats(session.user.id);
  };

  const loadChats = async (userId: string) => {
    const { data } = await supabase
      .from("chats")
      .select(`
        *,
        products(title, image_url, price),
        messages(content, created_at)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (data) {
      // Load profiles for each chat
      const chatsWithProfiles = await Promise.all(
        data.map(async (chat) => {
          const { data: buyerProfile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", chat.buyer_id)
            .single();

          const { data: sellerProfile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", chat.seller_id)
            .single();

          return {
            ...chat,
            buyer_profile: buyerProfile,
            seller_profile: sellerProfile,
          };
        })
      );

      setChats(chatsWithProfiles);
    }
    setLoading(false);
  };

  const getLastMessage = (messages: { content: string; created_at: string }[]) => {
    if (!messages || messages.length === 0) return "Нет сообщений";
    const sorted = [...messages].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0].content;
  };

  const getOtherUser = (chat: Chat) => {
    if (!user) return null;
    return user.id === chat.buyer_id ? chat.seller_profile : chat.buyer_profile;
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
        <h1 className="text-3xl font-bold mb-8">Мои чаты</h1>
        
        {chats.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">У вас пока нет чатов</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => {
              const otherUser = getOtherUser(chat);
              return (
                <Card
                  key={chat.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/chat/${chat.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={otherUser?.avatar_url || undefined} />
                        <AvatarFallback>
                          {otherUser?.username?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {otherUser?.username || "Пользователь"}
                        </CardTitle>
                        <CardDescription>{chat.products.title}</CardDescription>
                      </div>
                      <Badge variant="secondary">{chat.products.price} Q</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground truncate">
                      {getLastMessage(chat.messages)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
