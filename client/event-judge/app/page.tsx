import Image from "next/image"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertTriangle, MessageCircle, Clock, Star, FileSpreadsheet } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16 md:py-24">
        <div className="container grid gap-8 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
                Будущее соревнований начинается здесь
              </h1>
              <p className="mt-4 text-lg text-blue-100 md:text-xl">
                Универсальная платформа для организации, судейства и управления любыми соревнованиями —от дебатов до
                хакатон.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                Попробовать бесплатно
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-blue-700">
                Подробнее
              </Button>
            </div>
          </div>
          <div className="relative h-[400px] rounded-lg overflow-hidden">
            <Image
              src="/placeholder.svg?height=400&width=600"
              alt="EventJudge Platform"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section id="problems" className="py-16 bg-white">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Проблема: Неэффективность организации соревнований и мероприятий
          </h2>
          <p className="text-lg text-center mb-12 max-w-3xl mx-auto">
            С каждым годом в Казахстане и по всему миру проходит все больше интеллектуальных, образовательных и
            проектных соревнований — дебаты, кейсы, хакатоны, стартап-выставки, олимпиады и т.д. Несмотря на рост
            масштабов и важности этих мероприятий, инфраструктура их организации и судейства остается на уровне
            прошлого.
          </p>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold">Google Forms и Excel</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>• Регистрация участников через формы, экспорт в таблицах</li>
                  <li>• Ручное распределение по потокам</li>
                  <li>• Ошибки, потери данных, дублирование и сложность</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold">Чаты в мессенджерах</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>• Судьи получают сообщения с расписанием вручную</li>
                  <li>• Объявления теряются, участники не видят важные уведомления</li>
                  <li>• Нет централизованной коммуникации</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold">Таймеры через сайты</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>• Нет синхронизации</li>
                  <li>• Судьи не понимают, сколько времени осталось</li>
                  <li>• Участники превышают лимиты, нет контроля</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold">Обратная связь</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>• Нестр устная, без деталей</li>
                  <li>• Неструктурированная, субъективная</li>
                  <li>• Отсутствует механизм для анализа, обучения</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <h3 className="text-xl font-bold mb-4">Всё ещё Excel, ручки и голосовые чаты?</h3>
            <p className="text-lg max-w-3xl mx-auto">
              Организация соревнований всё ещё страдает от устаревших процессов.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-16 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold mb-6 text-center">
            Наше решение: Единая платформа для соревнований, судейства и обратной связи
          </h2>
          <p className="text-lg text-center mb-12 max-w-3xl mx-auto">
            Мы разработали инновационную веб-платформу, которая автоматизирует и улучшает каждый этап организации
            интеллектуальных соревнований и мероприятий — от регистрации до финальной обратной связи.
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-8">
              <h3 className="text-2xl font-bold">Ключевые возможности платформы:</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-2 rounded-full mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Единая регистрация участников и команд</h4>
                    <p className="text-gray-600">
                      Централизованная система регистрации с автоматической валидацией данных
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-2 rounded-full mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Панель участника</h4>
                    <p className="text-gray-600">Персональный доступ к расписанию, результатам и уведомлениям</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-2 rounded-full mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Автоматическая табуляция</h4>
                    <p className="text-gray-600">Мгновенный подсчет результатов и формирование рейтингов</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-2 rounded-full mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Обратная связь участникам</h4>
                    <p className="text-gray-600">Структурированная система отзывов и рекомендаций</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative rounded-lg overflow-hidden h-[400px]">
              <Image
                src="/placeholder.svg?height=400&width=600"
                alt="EventJudge Platform Features"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section id="results" className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">Результаты от Qamqor Cup I (Turan University):</h2>

          <div className="grid gap-8 md:grid-cols-3 text-center">
            <div className="space-y-2">
              <p className="text-5xl font-bold">6-8 часов</p>
              <p className="text-xl">сэкономлено на мероприятие</p>
            </div>

            <div className="space-y-2">
              <p className="text-5xl font-bold">100%</p>
              <p className="text-xl">судей использовали платформу</p>
            </div>

            <div className="space-y-2">
              <p className="text-5xl font-bold">500+</p>
              <p className="text-xl">отзывов автоматически отправлено</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-2xl font-bold">0 Excel файлов</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">Будущие разработки</h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Star className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold">Cross-platform</h3>
                </div>
                <p className="text-sm">Android и iOS приложения для мобильного доступа</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Star className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold">Интеграции</h3>
                </div>
                <p className="text-sm">Интеграция с Scopus / ResearchGate для проверки источников</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Star className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold">Обратная связь</h3>
                </div>
                <p className="text-sm">Модули обратной связи от аудитории и зрителей</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Star className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold">Личный прогресс</h3>
                </div>
                <p className="text-sm">Отслеживание личного роста участников по критериям</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-16 bg-blue-600 text-white">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">Партнеры и отзывы</h2>

          <p className="text-lg text-center mb-8">
            Наша платформа уже протестирована и используется в сотрудничестве с:
          </p>

          <div className="grid gap-8 md:grid-cols-2 max-w-2xl mx-auto">
            <div className="bg-white/10 p-6 rounded-lg text-center">
              <h3 className="text-xl font-bold mb-2">KIMEP Debate Club</h3>
              <p>Успешно использовали платформу для организации дебатных турниров</p>
            </div>

            <div className="bg-white/10 p-6 rounded-lg text-center">
              <h3 className="text-xl font-bold mb-2">Turan University Debate Club</h3>
              <p>Провели Qamqor Cup I с использованием нашей платформы</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">Готовы улучшить организацию ваших соревнований?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Присоединяйтесь к платформе, которая меняет будущее соревнований и мероприятий
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Попробовать бесплатно
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-white">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-400">Event</span>
                <span className="text-2xl font-bold">Judge</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">© 2025 EventJudge. Все права защищены.</p>
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-sm hover:text-blue-400">
                О нас
              </a>
              <a href="#" className="text-sm hover:text-blue-400">
                Контакты
              </a>
              <a href="#" className="text-sm hover:text-blue-400">
                Условия
              </a>
              <a href="#" className="text-sm hover:text-blue-400">
                Конфиденциальность
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

