import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, LogOut, Plus, Heart, ShoppingCart, Bell, User as UserIcon, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface NavbarProps {
  user: any;
}

export const Navbar = ({ user }: NavbarProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Ошибка при выходе");
    } else {
      toast.success("Вы вышли из аккаунта");
      navigate("/auth");
    }
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
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
                  <Link to="/notifications">
                    <Bell className="w-4 h-4 mr-1" />
                    Уведомления
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/profile">
                    <UserIcon className="w-4 h-4 mr-1" />
                    Профиль
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/create-product">
                    <Plus className="w-4 h-4 mr-1" />
                    Создать
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin">
                    <Shield className="w-4 h-4 mr-1" />
                    Админ
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Выйти
                </Button>
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
