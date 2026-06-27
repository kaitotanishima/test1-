import { ArrowLeft, BarChart3, BookOpen, Check, ChevronRight, RotateCcw, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  difficultyLabels,
  difficultyNotes,
  domainLabels,
  domainSubtitles,
  questions as questionBank,
} from "./content";
import { applySession, loadStats, saveStats } from "./storage";
import type { AnswerRecord, Difficulty, Domain, Question, QuizSettings, SavedStats } from "./types";

const domains: Domain[] = ["statistics", "econometrics", "machine-learning"];
const difficulties: Difficulty[] = ["basic", "standard", "advanced"];
const sessionLength = 10;

type Screen = "home" | "quiz" | "result";

const shuffle = <T,>(items: T[]) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
};

const pickSessionQuestions = ({ domain, difficulty }: QuizSettings) => {
  const exact = shuffle(questionBank.filter((question) => question.domain === domain && question.difficulty === difficulty));
  return exact.slice(0, sessionLength).map((question) => {
    const shuffledChoices = shuffle(
      question.choices.map((choice, originalIndex) => ({
        choice,
        originalIndex,
      })),
    );
    return {
      ...question,
      choices: shuffledChoices.map(({ choice }) => choice),
      correctIndex: shuffledChoices.findIndex(({ originalIndex }) => originalIndex === question.correctIndex),
    };
  });
};

const formatRate = (correct: number, answered: number) => {
  if (!answered) return "0%";
  return `${Math.round((correct / answered) * 100)}%`;
};

function App() {
  const [stats, setStats] = useState<SavedStats>(() => loadStats());
  const [settings, setSettings] = useState<QuizSettings>({
    domain: "statistics",
    difficulty: "basic",
  });
  const [screen, setScreen] = useState<Screen>("home");
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [savedResult, setSavedResult] = useState(false);

  const currentQuestion = sessionQuestions[currentIndex];
  const answeredCurrent = selectedIndex !== null;
  const currentAnswerIsCorrect = currentQuestion ? selectedIndex === currentQuestion.correctIndex : false;

  const weakDomain = useMemo(() => {
    return domains
      .filter((domain) => stats.byDomain[domain].answered > 0)
      .sort((a, b) => {
        const aRate = stats.byDomain[a].correct / stats.byDomain[a].answered;
        const bRate = stats.byDomain[b].correct / stats.byDomain[b].answered;
        return aRate - bRate;
      })[0];
  }, [stats]);

  const selectedPoolCount = useMemo(() => {
    return questionBank.filter(
      (question) => question.domain === settings.domain && question.difficulty === settings.difficulty,
    ).length;
  }, [settings.domain, settings.difficulty]);

  const startQuiz = () => {
    setSessionQuestions(pickSessionQuestions(settings));
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedIndex(null);
    setSavedResult(false);
    setScreen("quiz");
  };

  const answerQuestion = (choiceIndex: number) => {
    if (answeredCurrent || !currentQuestion) return;
    setSelectedIndex(choiceIndex);
    setAnswers((previous) => [
      ...previous,
      {
        questionId: currentQuestion.id,
        selectedIndex: choiceIndex,
        isCorrect: choiceIndex === currentQuestion.correctIndex,
      },
    ]);
  };

  const goNext = () => {
    if (currentIndex + 1 >= sessionQuestions.length) {
      setScreen("result");
      return;
    }
    setCurrentIndex((index) => index + 1);
    setSelectedIndex(null);
  };

  const finishAndSave = () => {
    if (savedResult) return;
    const nextStats = applySession(stats, sessionQuestions, answers, settings.domain, settings.difficulty);
    setStats(nextStats);
    saveStats(nextStats);
    setSavedResult(true);
  };

  useEffect(() => {
    if (screen === "result" && !savedResult) {
      finishAndSave();
    }
  }, [screen, savedResult]);

  const wrongAnswers = answers
    .filter((answer) => !answer.isCorrect)
    .map((answer) => sessionQuestions.find((question) => question.id === answer.questionId))
    .filter((question): question is Question => Boolean(question));

  const sessionScore = answers.filter((answer) => answer.isCorrect).length;

  return (
    <main className="app-shell">
      <section className="phone-frame">
        {screen === "home" && (
          <div className="screen home-screen">
            <header className="topbar">
              <div>
                <p className="eyebrow">Stats Loop</p>
                <h1>統計学学習</h1>
              </div>
              <div className="streak-pill" aria-label="連続正解">
                <Sparkles size={18} />
                {stats.streak}
              </div>
            </header>

            <section className="summary-grid" aria-label="学習状況">
              <div>
                <span>累計回答</span>
                <strong>{stats.totalAnswered}</strong>
              </div>
              <div>
                <span>正答率</span>
                <strong>{formatRate(stats.totalCorrect, stats.totalAnswered)}</strong>
              </div>
              <div>
                <span>最高連続</span>
                <strong>{stats.bestStreak}</strong>
              </div>
            </section>

            <section className="picker-section">
              <div className="section-heading">
                <BookOpen size={18} />
                <h2>分野</h2>
              </div>
              <div className="option-list">
                {domains.map((domain) => (
                  <button
                    className={`select-card ${settings.domain === domain ? "selected" : ""}`}
                    key={domain}
                    onClick={() => setSettings((previous) => ({ ...previous, domain }))}
                  >
                    <span>
                      <strong>{domainLabels[domain]}</strong>
                      <small>{domainSubtitles[domain]}</small>
                    </span>
                    <Check size={18} />
                  </button>
                ))}
              </div>
            </section>

            <section className="picker-section">
              <div className="section-heading">
                <BarChart3 size={18} />
                <h2>難易度</h2>
              </div>
              <div className="difficulty-tabs">
                {difficulties.map((difficulty) => (
                  <button
                    className={settings.difficulty === difficulty ? "active" : ""}
                    key={difficulty}
                    onClick={() => setSettings((previous) => ({ ...previous, difficulty }))}
                  >
                    <strong>{difficultyLabels[difficulty]}</strong>
                    <span>{difficultyNotes[difficulty]}</span>
                  </button>
                ))}
              </div>
            </section>

            {weakDomain && (
              <aside className="review-nudge">
                復習候補: {domainLabels[weakDomain]} の正答率が低めです
              </aside>
            )}

            <aside className="pool-note">
              {domainLabels[settings.domain]}・{difficultyLabels[settings.difficulty]}の問題プール {selectedPoolCount}
              問から、10問をランダムに出題します。
            </aside>

            <div className="bottom-action">
              <button className="primary-button" onClick={startQuiz}>
                10問ランダム出題
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {screen === "quiz" && currentQuestion && (
          <div className="screen quiz-screen">
            <header className="quiz-header">
              <button className="icon-button" onClick={() => setScreen("home")} aria-label="ホームに戻る">
                <ArrowLeft size={20} />
              </button>
              <div>
                <span>{domainLabels[currentQuestion.domain]}</span>
                <strong>
                  {currentIndex + 1}/{sessionQuestions.length}
                </strong>
              </div>
            </header>

            <div className="progress-track">
              <div style={{ width: `${((currentIndex + 1) / sessionQuestions.length) * 100}%` }} />
            </div>

            <section className="question-panel">
              <p className="difficulty-label">{difficultyLabels[currentQuestion.difficulty]}</p>
              <h2>{currentQuestion.prompt}</h2>
              <div className="keyword-row">
                {currentQuestion.keywords.map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
              </div>
            </section>

            <section className="choices" aria-label="選択肢">
              {currentQuestion.choices.map((choice, index) => {
                const isSelected = selectedIndex === index;
                const isCorrect = currentQuestion.correctIndex === index;
                const statusClass = answeredCurrent && isCorrect ? "correct" : answeredCurrent && isSelected ? "wrong" : "";
                return (
                  <button
                    className={`choice-button ${statusClass}`}
                    disabled={answeredCurrent}
                    key={choice}
                    onClick={() => answerQuestion(index)}
                  >
                    <span>{String.fromCharCode(65 + index)}</span>
                    <strong>{choice}</strong>
                  </button>
                );
              })}
            </section>

            {answeredCurrent && (
              <section className={`feedback ${currentAnswerIsCorrect ? "is-correct" : "is-wrong"}`}>
                <div className="feedback-title">
                  {currentAnswerIsCorrect ? <Check size={20} /> : <X size={20} />}
                  <strong>{currentAnswerIsCorrect ? "正解" : "もう一歩"}</strong>
                </div>
                <div className="mini-note explanation-note">
                  <span>解説</span>
                  <p>{currentQuestion.explanation}</p>
                </div>
                <div className="mini-note">
                  <span>理解のポイント</span>
                  <p>{currentQuestion.lectureNote}</p>
                </div>
                {currentQuestion.termNote && (
                  <div className="mini-note term-note">
                    <span>用語補足</span>
                    <p>{currentQuestion.termNote}</p>
                  </div>
                )}
              </section>
            )}

            <div className="bottom-action">
              <button className="primary-button" disabled={!answeredCurrent} onClick={goNext}>
                {currentIndex + 1 >= sessionQuestions.length ? "結果を見る" : "次の問題へ"}
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {screen === "result" && (
          <div className="screen result-screen">
            <header className="result-hero">
              <p className="eyebrow">Session Result</p>
              <h1>
                {sessionScore}/{answers.length}
              </h1>
              <span>{formatRate(sessionScore, answers.length)} 正解</span>
            </header>

            <section className="result-band">
              <div>
                <span>今回の分野</span>
                <strong>{domainLabels[settings.domain]}</strong>
              </div>
              <div>
                <span>難易度</span>
                <strong>{difficultyLabels[settings.difficulty]}</strong>
              </div>
            </section>

            <section className="review-list">
              <h2>復習リスト</h2>
              {wrongAnswers.length === 0 ? (
                <p className="empty-state">全問正解です。次は難易度を上げるとよさそうです。</p>
              ) : (
                wrongAnswers.map((question) => (
                  <article key={question.id}>
                    <strong>{question.prompt}</strong>
                    <p>{question.explanation}</p>
                  </article>
                ))
              )}
            </section>

            <section className="recent-sessions">
              <h2>最近の記録</h2>
              {stats.recentSessions.map((session) => (
                <div key={`${session.date}-${session.domain}-${session.difficulty}`}>
                  <span>{new Date(session.date).toLocaleDateString("ja-JP")}</span>
                  <strong>
                    {domainLabels[session.domain]} {session.score}/{session.total}
                  </strong>
                </div>
              ))}
            </section>

            <div className="bottom-action two-buttons">
              <button className="secondary-button" onClick={() => setScreen("home")}>
                <ArrowLeft size={19} />
                ホーム
              </button>
              <button className="primary-button" onClick={startQuiz}>
                <RotateCcw size={19} />
                もう一度
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
