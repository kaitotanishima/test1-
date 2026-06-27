import type { AnswerRecord, Difficulty, Domain, Question, SavedStats } from "./types";

const STORAGE_KEY = "stats-loop-progress-v2";

const emptyBucket = () => ({ answered: 0, correct: 0 });

export const createEmptyStats = (): SavedStats => ({
  totalAnswered: 0,
  totalCorrect: 0,
  streak: 0,
  bestStreak: 0,
  byDomain: {
    statistics: emptyBucket(),
    econometrics: emptyBucket(),
    "machine-learning": emptyBucket(),
  },
  byDifficulty: {
    basic: emptyBucket(),
    standard: emptyBucket(),
    advanced: emptyBucket(),
  },
  recentSessions: [],
});

export const loadStats = (): SavedStats => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyStats();
    return { ...createEmptyStats(), ...JSON.parse(raw) } as SavedStats;
  } catch {
    return createEmptyStats();
  }
};

export const saveStats = (stats: SavedStats) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
};

export const applySession = (
  previous: SavedStats,
  questions: Question[],
  answers: AnswerRecord[],
  domain: Domain,
  difficulty: Difficulty,
): SavedStats => {
  const next: SavedStats = JSON.parse(JSON.stringify(previous));
  let streak = next.streak;
  const questionById = new Map(questions.map((question) => [question.id, question]));

  answers.forEach((answer) => {
    const question = questionById.get(answer.questionId);
    if (!question) return;

    next.totalAnswered += 1;
    next.byDomain[question.domain].answered += 1;
    next.byDifficulty[question.difficulty].answered += 1;

    if (answer.isCorrect) {
      next.totalCorrect += 1;
      next.byDomain[question.domain].correct += 1;
      next.byDifficulty[question.difficulty].correct += 1;
      streak += 1;
      next.bestStreak = Math.max(next.bestStreak, streak);
    } else {
      streak = 0;
    }
  });

  next.streak = streak;
  next.recentSessions = [
    {
      date: new Date().toISOString(),
      score: answers.filter((answer) => answer.isCorrect).length,
      total: answers.length,
      domain,
      difficulty,
    },
    ...next.recentSessions,
  ].slice(0, 5);

  return next;
};
