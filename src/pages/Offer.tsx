import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Offer = () => {
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
              <CardTitle className="text-3xl">Договор оферты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Предмет договора</h2>
                <p className="text-muted-foreground">
                  Настоящий договор определяет условия использования маркетплейса Amazon Zoy и регулирует отношения между администрацией платформы и пользователями.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Принятие условий</h2>
                <p className="text-muted-foreground">
                  Регистрируясь на платформе и размещая товары, вы автоматически принимаете условия данной оферты. 
                  Если вы не согласны с условиями, пожалуйста, не используйте наш сервис.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Права и обязанности продавца</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2">Права продавца:</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Размещать неограниченное количество товаров</li>
                      <li>Устанавливать цены на свои товары</li>
                      <li>Редактировать и удалять свои товары</li>
                      <li>Общаться с покупателями</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Обязанности продавца:</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Предоставлять точную информацию о товарах</li>
                      <li>Передавать товар покупателю в оговоренные сроки</li>
                      <li>Отвечать на вопросы покупателей</li>
                      <li>Соблюдать правила маркетплейса</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Права и обязанности покупателя</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2">Права покупателя:</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Просматривать все доступные товары</li>
                      <li>Оставлять отзывы о товарах</li>
                      <li>Подавать жалобы на товары</li>
                      <li>Добавлять товары в избранное</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Обязанности покупателя:</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Оплачивать товары в установленные сроки</li>
                      <li>Не распространять ложную информацию</li>
                      <li>Соблюдать правила маркетплейса</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Валюта и расчеты</h2>
                <p className="text-muted-foreground">
                  Все расчеты на маркетплейсе производятся в игровой валюте Q (Queue). 
                  Оплата товаров осуществляется на игровом сервере после согласования условий с продавцом.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Конфиденциальность</h2>
                <p className="text-muted-foreground">
                  Мы обязуемся защищать вашу личную информацию и не передавать её третьим лицам без вашего согласия. 
                  Исключение составляют случаи, предусмотренные законодательством.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Ответственность сторон</h2>
                <p className="text-muted-foreground">
                  Администрация не несет ответственности за сделки между пользователями, но обязуется содействовать 
                  в разрешении споров. Пользователи самостоятельно несут ответственность за свои действия на платформе.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Изменение условий</h2>
                <p className="text-muted-foreground">
                  Администрация оставляет за собой право изменять условия оферты. 
                  Актуальная версия всегда доступна на данной странице. Продолжение использования сервиса после 
                  внесения изменений означает принятие новых условий.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Срок действия договора</h2>
                <p className="text-muted-foreground">
                  Договор вступает в силу с момента регистрации пользователя и действует бессрочно до момента 
                  удаления аккаунта или блокировки пользователя администрацией.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Offer;
