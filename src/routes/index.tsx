import { createFileRoute } from '@tanstack/react-router'
import BananaGame from '../components/BananaGame'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-5 bg-slate-900 px-4 py-8 text-slate-100">
      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tight">🍌 Super Banana Bros</h1>
        <p className="mt-2 max-w-xl text-slate-400">
          A potassium boosting masterpiece. Arrow keys / WASD to move, Space to jump.
          Stomp the plums, grab the bananas, reach the flag.
        </p>
      </header>
      <BananaGame />
    </main>
  )
}
