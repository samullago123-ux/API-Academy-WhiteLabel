import React, { useState, useEffect } from 'react';
import { shuffle } from '../utils/shuffle';

export default function Quiz({ 
  questionsBank, 
  questionCount, 
  messages, 
  thresholds = { high: 80, medium: 60 },
  finalButtonText = "Ver Resultado Final →",
  restartButtonText = "🔄 Intentar de nuevo",
  gradient = "linear-gradient(90deg, #6366f1, #a78bfa)",
  primaryColor = "#6366f1"
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
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{emoji}</div>
        <div style={{ color: "#e4e4e7", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{score}/{questions.length}</div>
        <div style={{ color: pct >= thresholds.high ? "#10b981" : pct >= thresholds.medium ? "#f59e0b" : "#ef4444", fontSize: 48, fontWeight: 900, marginBottom: 12 }}>{pct}%</div>
        <div style={{ color: "#a1a1aa", fontSize: 15, marginBottom: 24 }}>{msg}</div>
        <button onClick={restart} style={{
          background: primaryColor, color: "#fff", border: "none", borderRadius: 10,
          padding: "12px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer",
        }}>
          {restartButtonText}
        </button>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ color: "#52525b", fontSize: 13 }}>Pregunta {current + 1} de {questions.length}</span>
        <span style={{ color: "#10b981", fontWeight: 700, fontSize: 14 }}>Score: {score}</span>
      </div>

      <div style={{ width: "100%", height: 3, background: "#27272a", borderRadius: 2, marginBottom: 24 }}>
        <div style={{ width: `${((current + 1) / questions.length) * 100}%`, height: 3, background: gradient, borderRadius: 2, transition: "width 0.3s" }} />
      </div>

      <div style={{ color: "#e4e4e7", fontSize: 17, fontWeight: 700, marginBottom: 24, lineHeight: 1.6 }}>{q.q}</div>

      <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
        {shuffledOpts.map((opt, idx) => {
          let bg = "#18181b", border = "#27272a", textColor = "#e4e4e7";
          if (selected !== null) {
            if (opt === q.correct) { bg = "#10b98118"; border = "#10b981"; textColor = "#10b981"; }
            else if (opt === selected && opt !== q.correct) { bg = "#ef444418"; border = "#ef4444"; textColor = "#ef4444"; }
          }
          return (
            <button key={idx} onClick={() => selectAnswer(opt)} style={{
              background: bg, border: `2px solid ${border}`, borderRadius: 10, padding: "14px 16px",
              color: textColor, fontSize: 14, cursor: selected !== null ? "default" : "pointer",
              textAlign: "left", fontFamily: opt.includes('{') ? "monospace" : "inherit", transition: "all 0.2s",
            }}>
              <span style={{ color: "#52525b", marginRight: 10, fontWeight: 700 }}>{String.fromCharCode(65 + idx)}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {showExplain && (
        <div style={{
          background: "#18181b", borderRadius: 10, padding: 16, marginBottom: 16,
          borderLeft: `4px solid ${selected === q.correct ? "#10b981" : "#f59e0b"}`,
        }}>
          <div style={{ color: selected === q.correct ? "#10b981" : "#f59e0b", fontWeight: 700, marginBottom: 6 }}>
            {selected === q.correct ? "✅ ¡Correcto!" : "❌ Incorrecto"}
          </div>
          <div style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 1.6 }}>{q.explain}</div>
        </div>
      )}

      {selected !== null && (
        <button onClick={nextQuestion} style={{
          background: primaryColor, color: "#fff", border: "none", borderRadius: 10,
          padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%",
        }}>
          {current + 1 >= questions.length ? finalButtonText : "Siguiente →"}
        </button>
      )}
    </div>
  );
}
