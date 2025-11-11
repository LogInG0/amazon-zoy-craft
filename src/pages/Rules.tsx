import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Rules = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Правила маркетплейса</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Общие положения</h2>
                <p className="text-muted-foreground">
                  Добро пожаловать на Amazon Zoy - маркетплейс для Minecraft проекта. Используя наш сервис, вы соглашаетесь соблюдать следующие правила.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Правила для продавцов</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Запрещено размещать товары, не связанные с игровым контентом</li>
                  <li>Все товары должны иметь точное описание и актуальную цену</li>
                  <li>Запрещен обман покупателей и завышение цен</li>
                  <li>Продавец обязан предоставить товар в течение 24 часов после покупки</li>
                  <li>Запрещено размещать дубликаты товаров</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Правила для покупателей</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Оплата производится на сервере после согласования с продавцом</li>
                  <li>Запрещены попытки обмана продавцов</li>
                  <li>Покупатель обязан проверить товар перед завершением сделки</li>
                  <li>Претензии принимаются в течение 48 часов после покупки</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Запрещенные действия</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Мошенничество и обман других пользователей</li>
                  <li>Продажа нелегальных или запрещенных игровых предметов</li>
                  <li>Оскорбления и токсичное поведение</li>
                  <li>Спам и реклама сторонних ресурсов</li>
                  <li>Использование багов и эксплойтов</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Ответственность</h2>
                <p className="text-muted-foreground">
                  Администрация оставляет за собой право заблокировать пользователя за нарушение правил. 
                  Блокировка может быть временной или постоянной в зависимости от серьезности нарушения.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Жалобы и споры</h2>
                <p className="text-muted-foreground">
                  При возникновении споров между продавцом и покупателем, обратитесь к администрации через систему жалоб. 
                  Мы рассмотрим вашу жалобу в течение 24-48 часов.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Изменение правил</h2>
                <p className="text-muted-foreground">
                  Администрация имеет право изменять правила без предварительного уведомления. 
                  Актуальная версия правил всегда доступна на этой странице.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Rules;
