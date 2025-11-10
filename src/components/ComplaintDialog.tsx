import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ComplaintDialogProps = {
  productId: string;
};

export default function ComplaintDialog({ productId }: ComplaintDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Войдите, чтобы отправить жалобу");
      return;
    }

    if (!reason) {
      toast.error("Выберите причину жалобы");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("complaints")
      .insert({
        user_id: session.user.id,
        product_id: productId,
        reason,
        description,
      });

    if (error) {
      toast.error("Ошибка отправки жалобы");
    } else {
      toast.success("Жалоба отправлена");
      setOpen(false);
      setReason("");
      setDescription("");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Flag className="h-4 w-4 mr-2" />
          Пожаловаться
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Пожаловаться на товар</DialogTitle>
          <DialogDescription>
            Опишите проблему с этим товаром
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Причина</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите причину" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Спам</SelectItem>
                <SelectItem value="fraud">Мошенничество</SelectItem>
                <SelectItem value="inappropriate">Неприемлемый контент</SelectItem>
                <SelectItem value="copyright">Нарушение авторских прав</SelectItem>
                <SelectItem value="other">Другое</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите проблему подробнее..."
              rows={4}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Отправка..." : "Отправить жалобу"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
