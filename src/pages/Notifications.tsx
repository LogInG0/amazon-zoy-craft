import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

    loadNotifications();
  };

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    setNotifications(data || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    loadNotifications();
  };

  const markAllAsRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", session.user.id)
      .eq("read", false);

    loadNotifications();
  };

  if (loading) {
    return <div className="container mx-auto py-8 px-4">Загрузка...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Уведомления</h1>
        {notifications.some(n => !n.read) && (
          <Button variant="outline" onClick={markAllAsRead}>
            Отметить все прочитанными
          </Button>
        )}
      </div>
      
      {notifications.length === 0 ? (
        <p className="text-muted-foreground">У вас пока нет уведомлений</p>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <Card key={notif.id} className={notif.read ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{notif.title}</CardTitle>
                    <CardDescription>
                      {new Date(notif.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {!notif.read && <Badge>Новое</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{notif.message}</p>
                {!notif.read && (
                  <Button variant="outline" size="sm" onClick={() => markAsRead(notif.id)}>
                    Отметить прочитанным
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
