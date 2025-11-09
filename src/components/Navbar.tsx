import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, User, LogOut, Plus } from "lucide-react";
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
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
            <ShoppingBag className="w-8 h-8 text-primary" />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Amazon Zoy
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/create-product">
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить товар
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/profile">
                    <User className="w-4 h-4 mr-2" />
                    Профиль
                  </Link>
                </Button>
                <Button variant="ghost" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
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
