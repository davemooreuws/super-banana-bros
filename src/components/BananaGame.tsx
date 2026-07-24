import { useEffect, useRef } from 'react'
import kaplay from 'kaplay'

/**
 * Super Banana Bros - a tiny Mario-style platformer starring a banana.
 * Kaplay is browser-only (WebGL + DOM), so the engine is only ever
 * booted inside useEffect, never during SSR.
 */
export default function BananaGame() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const k = kaplay({
      root,
      width: 960,
      height: 540,
      letterbox: true,
      global: false,
      background: [135, 206, 235], // sky blue
      crisp: true,
    })

    // ---- tuning -----------------------------------------------------------
    const SPEED = 320
    const JUMP = 820
    const LEVEL_W = 3600
    const GROUND_TOP = 500 // y of the walkable ground surface

    k.setGravity(1800)

    // ---- level data -------------------------------------------------------
    // Ground segments with two pits to jump across.
    const groundSegments = [
      { x: 0, w: 900 },
      { x: 1080, w: 1200 },
      { x: 2460, w: LEVEL_W - 2460 },
    ]
    // Floating platforms {x, y, w}
    const platforms = [
      { x: 520, y: 360, w: 150 },
      { x: 950, y: 400, w: 170 }, // helps cross pit 1
      { x: 1500, y: 350, w: 160 },
      { x: 1820, y: 250, w: 150 },
      { x: 2320, y: 380, w: 170 }, // helps cross pit 2
      { x: 2760, y: 350, w: 170 },
    ]
    const coins = [
      { x: 300, y: 440 },
      { x: 560, y: 300 },
      { x: 600, y: 300 },
      { x: 985, y: 340 },
      { x: 1340, y: 440 },
      { x: 1560, y: 290 },
      { x: 1870, y: 190 },
      { x: 2360, y: 320 },
      { x: 2800, y: 290 },
      { x: 2850, y: 290 },
      { x: 3200, y: 440 },
      { x: 3380, y: 440 },
    ]
    const enemies = [
      { x: 650, min: 520, max: 800 },
      { x: 1600, min: 1300, max: 1950 },
      { x: 2950, min: 2700, max: 3150 },
    ]
    const GOAL_X = 3480

    // ---- helpers ----------------------------------------------------------
    function addGround(x: number, w: number) {
      // dirt
      k.add([
        k.rect(w, 120),
        k.pos(x, GROUND_TOP),
        k.color(120, 82, 45),
        k.area(),
        k.body({ isStatic: true }),
        'solid',
      ])
      // grass cap (decorative)
      k.add([k.rect(w, 14), k.pos(x, GROUND_TOP), k.color(86, 176, 74), k.z(1)])
    }

    function addPlatform(x: number, y: number, w: number) {
      k.add([
        k.rect(w, 22, { radius: 6 }),
        k.pos(x, y),
        k.color(150, 100, 55),
        k.outline(3, k.rgb(90, 60, 30)),
        k.area(),
        k.body({ isStatic: true }),
        'solid',
      ])
      k.add([k.rect(w, 6), k.pos(x, y), k.color(86, 176, 74), k.z(1)])
    }

    function addCloud(x: number, y: number) {
      k.add([k.circle(28), k.pos(x, y), k.color(255, 255, 255), k.opacity(0.9), k.z(-5)])
      k.add([k.circle(34), k.pos(x + 34, y + 6), k.color(255, 255, 255), k.opacity(0.9), k.z(-5)])
      k.add([k.circle(24), k.pos(x + 66, y + 10), k.color(255, 255, 255), k.opacity(0.9), k.z(-5)])
    }

    // ---- main scene -------------------------------------------------------
    k.scene('game', () => {
      let score = 0
      const totalCoins = coins.length

      // scenery
      addCloud(200, 90)
      addCloud(760, 140)
      addCloud(1500, 80)
      addCloud(2300, 120)
      addCloud(3100, 90)

      groundSegments.forEach((g) => addGround(g.x, g.w))
      platforms.forEach((p) => addPlatform(p.x, p.y, p.w))

      // player (a chunky banana)
      const player = k.add([
        k.rect(42, 58, { radius: 18 }),
        k.color(255, 214, 51),
        k.outline(4, k.rgb(150, 110, 0)),
        k.pos(120, 300),
        k.area(),
        k.body(),
        k.anchor('center'),
        k.rotate(0),
        k.z(10),
        'player',
      ])
      // little face
      player.add([k.circle(4), k.color(30, 30, 30), k.pos(-9, -10), k.anchor('center')])
      player.add([k.circle(4), k.color(30, 30, 30), k.pos(9, -10), k.anchor('center')])
      player.add([
        k.rect(16, 3, { radius: 2 }),
        k.color(30, 30, 30),
        k.pos(0, 6),
        k.anchor('center'),
      ])

      // coins
      coins.forEach((c) => {
        k.add([
          k.circle(11),
          k.color(255, 205, 0),
          k.outline(3, k.rgb(180, 130, 0)),
          k.pos(c.x, c.y),
          k.area(),
          k.anchor('center'),
          k.z(5),
          'coin',
        ])
      })

      // enemies (patrolling angry plums)
      enemies.forEach((e) => {
        k.add([
          k.rect(46, 42, { radius: 8 }),
          k.color(150, 60, 160),
          k.outline(4, k.rgb(80, 25, 90)),
          k.pos(e.x, GROUND_TOP),
          k.area(),
          k.anchor('bot'),
          k.z(6),
          'enemy',
          { dir: 1, min: e.min, max: e.max, speed: 95 },
        ])
      })

      // goal flag
      k.add([
        k.rect(10, 170),
        k.pos(GOAL_X, GROUND_TOP),
        k.color(220, 220, 220),
        k.anchor('bot'),
        k.area(),
        k.z(4),
        'goal',
      ])
      k.add([
        k.rect(70, 44),
        k.pos(GOAL_X + 5, GROUND_TOP - 170),
        k.color(0, 175, 80),
        k.z(4),
      ])

      // HUD
      const label = k.add([
        k.text(`Bananas: 0 / ${totalCoins}`, { size: 28 }),
        k.pos(24, 20),
        k.color(20, 20, 20),
        k.fixed(),
        k.z(100),
      ])

      // ---- controls -------------------------------------------------------
      const jump = () => {
        if (player.isGrounded()) player.jump(JUMP)
      }
      k.onKeyDown('left', () => player.move(-SPEED, 0))
      k.onKeyDown('a', () => player.move(-SPEED, 0))
      k.onKeyDown('right', () => player.move(SPEED, 0))
      k.onKeyDown('d', () => player.move(SPEED, 0))
      k.onKeyPress('space', jump)
      k.onKeyPress('up', jump)
      k.onKeyPress('w', jump)
      k.onMousePress(jump)

      // ---- enemy patrol ---------------------------------------------------
      k.onUpdate('enemy', (e: any) => {
        e.move(e.dir * e.speed, 0)
        if (e.pos.x > e.max) e.dir = -1
        if (e.pos.x < e.min) e.dir = 1
      })

      // ---- collisions -----------------------------------------------------
      player.onCollide('coin', (c: any) => {
        k.destroy(c)
        score += 1
        label.text = `Bananas: ${score} / ${totalCoins}`
      })

      player.onCollide('enemy', (e: any) => {
        const goingDown = player.vel ? player.vel.y > 0 : true
        const onTop = player.pos.y < e.pos.y - 34
        if (goingDown && onTop) {
          k.destroy(e)
          player.jump(JUMP * 0.55) // bounce
        } else {
          k.go('lose', { score, totalCoins })
        }
      })

      player.onCollide('goal', () => k.go('win', { score, totalCoins }))

      // ---- camera + fall death -------------------------------------------
      k.onUpdate(() => {
        const half = k.width() / 2
        const camX = Math.max(half, Math.min(player.pos.x, LEVEL_W - half))
        k.setCamPos(k.vec2(camX, 300))
        if (player.pos.y > 900) k.go('lose', { score, totalCoins })
      })
    })

    // ---- end scenes -------------------------------------------------------
    const endScene = (
      name: string,
      title: string,
      titleColor: [number, number, number],
      bg: [number, number, number],
    ) => {
      k.scene(name, ({ score, totalCoins }: { score: number; totalCoins: number }) => {
        k.add([k.rect(k.width(), k.height()), k.pos(0, 0), k.color(...bg)])
        k.add([
          k.text(title, { size: 64 }),
          k.pos(k.width() / 2, 190),
          k.anchor('center'),
          k.color(...titleColor),
        ])
        k.add([
          k.text(`Bananas collected: ${score} / ${totalCoins}`, { size: 28 }),
          k.pos(k.width() / 2, 280),
          k.anchor('center'),
          k.color(240, 240, 240),
        ])
        k.add([
          k.text('Press SPACE or click to play again', { size: 24 }),
          k.pos(k.width() / 2, 360),
          k.anchor('center'),
          k.color(200, 200, 200),
        ])
        const again = () => k.go('game')
        k.onKeyPress('space', again)
        k.onMousePress(again)
      })
    }

    endScene('win', 'YOU WIN!', [255, 214, 51], [26, 71, 42])
    endScene('lose', 'GAME OVER', [255, 90, 90], [40, 20, 26])

    k.go('game')

    // ---- cleanup (handles React StrictMode double-mount) ------------------
    return () => {
      k.quit()
      while (root.firstChild) root.removeChild(root.firstChild)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[960px] aspect-video overflow-hidden rounded-xl bg-sky-300 shadow-2xl ring-1 ring-black/40"
    />
  )
}
