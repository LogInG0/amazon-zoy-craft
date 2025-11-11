import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, CheckCircle, XCircle, Ban, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

type Ban = {
  id: string;
  user_id: string;
  reason: string;
  banned_until: string | null;
  is_permanent: boolean;
  created_at: string;
  profiles: {
    username: string;
  };
};

export default function Admin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRole[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [bans, setBans] = useState<Ban[]>([]);
  const [banUserId, setBanUserId] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("permanent");

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

    const { data: bansData } = await supabase
      .from("bans")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch usernames for bans separately
    const enrichedBans: Ban[] = [];
    if (bansData) {
      const banUserIds = bansData.map(b => b.user_id);
      const { data: banProfilesData } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", banUserIds);
      
      const banProfilesMap = new Map(banProfilesData?.map(p => [p.id, p]) || []);
      bansData.forEach((ban: any) => {
        enrichedBans.push({
          ...ban,
          profiles: banProfilesMap.get(ban.user_id) || { username: "Unknown" },
        });
      });
    }

    setUsers(usersData || []);
    setComplaints(enrichedComplaints);
    setBans(enrichedBans);
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

  const handleBanUser = async () => {
    if (!banUserId || !banReason) {
      toast.error("Заполните все поля");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    let bannedUntil = null;
    if (banDuration !== "permanent") {
      const hours = parseInt(banDuration);
      bannedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    }

    const { error } = await supabase.from("bans").insert({
      user_id: banUserId,
      banned_by: session.user.id,
      reason: banReason,
      banned_until: bannedUntil,
      is_permanent: banDuration === "permanent",
    });

    if (error) {
      toast.error("Ошибка при создании бана");
      return;
    }

    toast.success("Пользователь заблокирован");
    setBanUserId("");
    setBanReason("");
    setBanDuration("permanent");
    loadData();
  };

  const handleUnbanUser = async (banId: string) => {
    const { error } = await supabase
      .from("bans")
      .delete()
      .eq("id", banId);

    if (error) {
      toast.error("Ошибка при разблокировке");
      return;
    }

    toast.success("Пользователь разблокирован");
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
          <TabsTrigger value="bans">Баны</TabsTrigger>
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

        <TabsContent value="bans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Заблокировать пользователя</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ID пользователя</Label>
                <Input
                  value={banUserId}
                  onChange={(e) => setBanUserId(e.target.value)}
                  placeholder="UUID пользователя"
                />
              </div>
              <div className="space-y-2">
                <Label>Причина бана</Label>
                <Input
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Опишите причину..."
                />
              </div>
              <div className="space-y-2">
                <Label>Длительность</Label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                >
                  <option value="permanent">Навсегда</option>
                  <option value="1">1 час</option>
                  <option value="24">24 часа</option>
                  <option value="168">7 дней</option>
                  <option value="720">30 дней</option>
                </select>
              </div>
              <Button onClick={handleBanUser}>
                <Ban className="h-4 w-4 mr-2" />
                Заблокировать
              </Button>
            </CardContent>
          </Card>

          {loading ? (
            <p>Загрузка...</p>
          ) : (
            bans.map((ban) => (
              <Card key={ban.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{ban.profiles?.username}</CardTitle>
                  <CardDescription>
                    ID: {ban.user_id} • {new Date(ban.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold">Причина: {ban.reason}</p>
                    {ban.is_permanent ? (
                      <Badge variant="destructive" className="mt-2">
                        <Ban className="h-3 w-3 mr-1" />
                        Постоянный бан
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="mt-2">
                        <Clock className="h-3 w-3 mr-1" />
                        До: {ban.banned_until ? new Date(ban.banned_until).toLocaleString() : "N/A"}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnbanUser(ban.id)}
                  >
                    Разблокировать
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
