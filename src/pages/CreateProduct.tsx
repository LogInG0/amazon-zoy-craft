import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";
import { Upload } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const productSchema = z.object({
  title: z.string().min(3, "Название должно быть минимум 3 символа").max(100),
  description: z.string().min(10, "Описание должно быть минимум 10 символов").max(1000),
  price: z.number().min(0, "Цена должна быть положительной"),
  category: z.string().min(1, "Выберите категорию"),
  stock: z.number().min(0, "Количество должно быть положительным"),
  image_url: z.string().nullable(),
});

const CreateProduct = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Файл слишком большой. Максимум 5MB");
        return;
      }
      setImageFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast.error("Примите правила и оферту");
      return;
    }

    try {
      const validated = productSchema.parse({
        title,
        description,
        price: parseFloat(price),
        category,
        stock: parseInt(stock),
        image_url: null,
      });

      setLoading(true);

      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase.from("products").insert({
        seller_id: user.id,
        title: validated.title,
        description: validated.description,
        price: validated.price,
        category: validated.category,
        stock: validated.stock,
        image_url: imageUrl,
        agreed_to_terms: true,
        is_active: true,
      });

      setLoading(false);

      if (error) {
        toast.error("Ошибка при создании товара");
        console.error(error);
      } else {
        toast.success("Товар успешно создан!");
        navigate("/profile");
      }
    } catch (error) {
      setLoading(false);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Добавить новый товар</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Название товара</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Например: Алмазный меч"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Подробное описание товара..."
                    rows={5}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Цена (Q)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="100"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Количество</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Категория</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Оружие">Оружие</SelectItem>
                      <SelectItem value="Броня">Броня</SelectItem>
                      <SelectItem value="Инструменты">Инструменты</SelectItem>
                      <SelectItem value="Блоки">Блоки</SelectItem>
                      <SelectItem value="Ресурсы">Ресурсы</SelectItem>
                      <SelectItem value="Декор">Декор</SelectItem>
                      <SelectItem value="Разное">Разное</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Изображение товара</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Label
                      htmlFor="image"
                      className="flex items-center gap-2 px-4 py-2 border border-input rounded-md cursor-pointer hover:bg-accent"
                    >
                      <Upload className="h-4 w-4" />
                      Выбрать файл
                    </Label>
                    {imageFile && (
                      <span className="text-sm text-muted-foreground">
                        {imageFile.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2 pt-4 border-t">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Согласен с правилами маркетплейса и офертой
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Вы подтверждаете, что ознакомлены с правилами маркетплейса и договором оферты
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Создание..." : "Создать товар"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/profile")}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreateProduct;
