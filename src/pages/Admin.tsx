import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, CheckCircle, XCircle } from "lucide-react";

type UserRole = {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    username: string;
  };
};

type Complaint = {
  id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  profiles: {
    username: string;
  };
  products: {
    title: string;
  };
};

export default function Admin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRole[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const hasAdmin = roles?.some(r => r.role === "admin");
    
    if (!hasAdmin) {
      toast.error("Доступ запрещен");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    loadData();
  };

  const loadData = async () => {
    setLoading(true);
    
    const { data: usersData } = await supabase
      .from("user_roles")
      .select("*, profiles(username)")
      .order("created_at", { ascending: false });

    const { data: complaintsData } = await supabase
      .from("complaints")
      .select("*, products(title)")
      .order("created_at", { ascending: false });
    
    // Fetch usernames separately
    const enrichedComplaints: Complaint[] = [];
    if (complaintsData) {
      const userIds = complaintsData.map(c => c.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);
      
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      complaintsData.forEach((complaint: any) => {
        enrichedComplaints.push({
          ...complaint,
          profiles: profilesMap.get(complaint.user_id) || { username: "Unknown" },
        });
      });
    }

    setUsers(usersData || []);
    setComplaints(enrichedComplaints);
    setLoading(false);
  };

  const updateComplaintStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("complaints")
      .update({ status, resolved_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Ошибка обновления жалобы");
      return;
    }

    toast.success("Статус жалобы обновлен");
    loadData();
  };

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      toast.error("Ошибка удаления товара");
      return;
    }

    toast.success("Товар удален");
    loadData();
  };

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Панель администратора</h1>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="complaints">Жалобы</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {loading ? (
            <p>Загрузка...</p>
          ) : (
            users.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{user.profiles?.username}</CardTitle>
                  <CardDescription>ID: {user.user_id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge>{user.role}</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="complaints" className="space-y-4">
          {loading ? (
            <p>Загрузка...</p>
          ) : (
            complaints.map((complaint) => (
              <Card key={complaint.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{complaint.products?.title}</CardTitle>
                  <CardDescription>
                    От: {complaint.profiles?.username} • {new Date(complaint.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold">Причина: {complaint.reason}</p>
                    <p className="text-sm text-muted-foreground mt-2">{complaint.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={complaint.status === "resolved" ? "default" : "secondary"}>
                      {complaint.status}
                    </Badge>
                    {complaint.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateComplaintStatus(complaint.id, "resolved")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Решено
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateComplaintStatus(complaint.id, "rejected")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Отклонить
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
