import Image from "next/image"
import { ThemeToggle } from "./theme-toggle"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-8NbLnaGkPIB5Mh636TL1UhT63ocqK1.png"
          alt="GenAI Protos Logo"
          width={120}
          height={24}
          className="dark:brightness-200"
        />
        <ThemeToggle />
      </div>
    </header>
  )
}

