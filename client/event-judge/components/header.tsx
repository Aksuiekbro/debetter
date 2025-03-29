import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary">Event</span>
            <span className="text-2xl font-bold text-foreground">Judge</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#problems" className="text-sm font-medium hover:underline">
            Проблемы
          </Link>
          <Link href="#solution" className="text-sm font-medium hover:underline">
            Решение
          </Link>
          <Link href="#features" className="text-sm font-medium hover:underline">
            Возможности
          </Link>
          <Link href="#results" className="text-sm font-medium hover:underline">
            Результаты
          </Link>
          <Link href="#partners" className="text-sm font-medium hover:underline">
            Партнеры
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="default" size="sm">
            Попробовать бесплатно
          </Button>
        </div>
      </div>
    </header>
  )
}

