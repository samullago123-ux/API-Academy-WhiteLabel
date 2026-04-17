import { Badge, BrandMark, Button, Card, CardBody, CardHeader, Container, ProgressBar, Tabs } from './ui'

export default function LabLayout({
  icon,
  title,
  subtitle,
  levelLabel,
  levelColor = 'indigo',
  titleClassName,
  progressBarClassName,
  lessons,
  activeLesson,
  visited,
  onNavigate,
  children,
}) {
  const currentIdx = lessons.findIndex((l) => l.id === activeLesson)
  const items = lessons.map((l) => ({
    value: l.id,
    icon: visited.includes(l.id) && l.id !== activeLesson ? '✅' : l.icon,
    label: l.title,
  }))

  const progress = lessons.length ? (visited.length / lessons.length) * 100 : 0
  const currentLesson = lessons[Math.max(0, currentIdx)] ?? lessons[0]

  return (
    <div className="min-h-screen">
      <div className="border-b border-zinc-800 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/20 py-5">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{icon}</div>
              <h1 className={titleClassName ?? 'text-xl font-black tracking-tight'}>{title}</h1>
              <Badge color={levelColor}>{levelLabel}</Badge>
            </div>
            <BrandMark compact />
          </div>
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>

          <div className="mt-3 flex items-center gap-3">
            <ProgressBar value={progress} barClassName={progressBarClassName} />
            <div className="text-xs text-zinc-500">
              {visited.length}/{lessons.length}
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-5">
        <Tabs value={activeLesson} onValueChange={onNavigate} items={items} className="mb-5" />

        <Card>
          <CardHeader>
            <div className="text-2xl">{currentLesson.icon}</div>
            <div>
              <h2 className="text-lg font-extrabold">{currentLesson.title}</h2>
              <p className="mt-1 text-xs text-zinc-400">{currentLesson.desc}</p>
            </div>
          </CardHeader>
          <CardBody>{children}</CardBody>
        </Card>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={() => onNavigate(lessons[Math.max(0, currentIdx - 1)].id)}
            disabled={currentIdx <= 0}
          >
            ← Anterior
          </Button>
          <Button
            onClick={() => onNavigate(lessons[Math.min(lessons.length - 1, currentIdx + 1)].id)}
            disabled={currentIdx >= lessons.length - 1}
          >
            Siguiente →
          </Button>
        </div>
      </Container>
    </div>
  )
}
