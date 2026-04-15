import { useEffect, useState } from 'react'
import { shuffle } from '../utils/shuffle'
import { cn } from '../utils/cn'

export default function Quiz({ 
  questionsBank, 
  questionCount, 
  messages, 
  thresholds = { high: 80, medium: 60 },
  finalButtonText = "Ver Resultado Final →",
  restartButtonText = "🔄 Intentar de nuevo",
  gradientClassName = "accent-indigo-500",
  primaryClassName = "bg-indigo-500 hover:bg-indigo-400"
}) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [shuffledOpts, setShuffledOpts] = useState([]);

  useEffect(() => {
    const q = shuffle(questionsBank).slice(0, questionCount);
    setQuestions(q);
    if (q[0]) setShuffledOpts(shuffle(q[0].opts));
  }, [questionsBank, questionCount]);

  useEffect(() => {
    if (questions[current]) setShuffledOpts(shuffle(questions[current].opts));
  }, [current, questions]);

  function selectAnswer(opt) {
    if (selected !== null) return;
    setSelected(opt);
    setShowExplain(true);
    if (opt === questions[current].correct) setScore(score + 1);
  }

  function nextQuestion() {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent(current + 1);
      setSelected(null);
      setShowExplain(false);
    }
  }

  function restart() {
    const q = shuffle(questionsBank).slice(0, questionCount);
    setQuestions(q);
    if (q[0]) setShuffledOpts(shuffle(q[0].opts));
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setShowExplain(false);
  }

  if (questions.length === 0) return null;

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const emoji = pct >= thresholds.high ? "🏆" : pct >= thresholds.medium ? "👍" : "📚";
    const msg = pct >= thresholds.high ? messages.high : pct >= thresholds.medium ? messages.medium : messages.low;
    return (
      <div className="py-10 text-center">
        <div className="text-6xl">{emoji}</div>
        <div className="mt-4 text-2xl font-extrabold text-zinc-100">
          {score}/{questions.length}
        </div>
        <div
          className={cn(
            'mt-2 text-5xl font-black',
            pct >= thresholds.high ? 'text-emerald-400' : pct >= thresholds.medium ? 'text-amber-400' : 'text-red-400',
          )}
        >
          {pct}%
        </div>
        <div className="mt-3 text-sm text-zinc-400">{msg}</div>
        <button
          onClick={restart}
          className={cn(
            'mt-6 inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-bold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70',
            primaryClassName,
          )}
        >
          {restartButtonText}
        </button>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-zinc-500">
          Pregunta {current + 1} de {questions.length}
        </span>
        <span className="text-sm font-bold text-emerald-400">Score: {score}</span>
      </div>

      <progress
        max={questions.length}
        value={current + 1}
        className={cn('mb-6 h-1 w-full overflow-hidden rounded-full bg-zinc-800', gradientClassName)}
      />

      <div className="mb-6 text-base font-bold leading-relaxed text-zinc-100">{q.q}</div>

      <div className="mb-5 grid gap-3">
        {shuffledOpts.map((opt, idx) => {
          let base = 'bg-zinc-900 border-zinc-800 text-zinc-100'
          if (selected !== null) {
            if (opt === q.correct) base = 'bg-emerald-500/10 border-emerald-400 text-emerald-300'
            else if (opt === selected && opt !== q.correct) base = 'bg-red-500/10 border-red-400 text-red-300'
          }
          return (
            <button
              key={idx}
              onClick={() => selectAnswer(opt)}
              disabled={selected !== null}
              className={cn(
                'rounded-xl border-2 px-4 py-4 text-left text-sm font-medium transition-colors',
                base,
                selected !== null ? 'cursor-default opacity-90' : 'hover:bg-zinc-800',
                opt.includes('{') ? 'font-mono' : 'font-sans',
              )}
            >
              <span className="mr-2 font-bold text-zinc-500">{String.fromCharCode(65 + idx)}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {showExplain && (
        <div
          className={cn(
            'mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4',
            selected === q.correct ? 'border-l-4 border-l-emerald-400' : 'border-l-4 border-l-amber-400',
          )}
        >
          <div className={cn('mb-1 font-bold', selected === q.correct ? 'text-emerald-400' : 'text-amber-400')}>
            {selected === q.correct ? "✅ ¡Correcto!" : "❌ Incorrecto"}
          </div>
          <div className="text-sm leading-relaxed text-zinc-400">{q.explain}</div>
        </div>
      )}

      {selected !== null && (
        <button
          onClick={nextQuestion}
          className={cn(
            'inline-flex h-11 w-full items-center justify-center rounded-xl px-6 text-sm font-bold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70',
            primaryClassName,
          )}
        >
          {current + 1 >= questions.length ? finalButtonText : "Siguiente →"}
        </button>
      )}
    </div>
  );
}
