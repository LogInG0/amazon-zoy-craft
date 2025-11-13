import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Heart, ShoppingCart, Bell, User as UserIcon, Shield, FileText, ScrollText, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface NavbarProps {
  user: any;
}

export const Navbar = ({ user }: NavbarProps) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    setIsAdmin(!!data);
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 animate-fade-in">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold hover-scale">
            <ShoppingBag className="w-6 h-6" />
            <span>Amazon Zoy</span>
          </Link>

          <div className="flex items-center gap-1">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/">Главная</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/chats">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Чаты
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/favorites">
                    <Heart className="w-4 h-4 mr-1" />
                    Избранное
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/purchases">
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Покупки
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/orders">
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Заказы
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/notifications">
                    <Bell className="w-4 h-4 mr-1" />
                    Уведомления
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/rules">
                    <FileText className="w-4 h-4 mr-1" />
                    Правила
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/offer">
                    <ScrollText className="w-4 h-4 mr-1" />
                    Оферта
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/profile">
                    <UserIcon className="w-4 h-4 mr-1" />
                    Профиль
                  </Link>
                </Button>
                {isAdmin && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin">
                      <Shield className="w-4 h-4 mr-1" />
                      Админ
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <Button asChild>
                <Link to="/auth">Войти</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
