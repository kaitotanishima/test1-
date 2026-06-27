export type Domain = "statistics" | "econometrics" | "machine-learning";
export type Difficulty = "basic" | "standard" | "advanced";

export type Question = {
  id: string;
  domain: Domain;
  difficulty: Difficulty;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  lectureNote: string;
  termNote?: string;
  keywords: string[];
};

export type AnswerRecord = {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
};

export type SavedStats = {
  totalAnswered: number;
  totalCorrect: number;
  streak: number;
  bestStreak: number;
  byDomain: Record<Domain, { answered: number; correct: number }>;
  byDifficulty: Record<Difficulty, { answered: number; correct: number }>;
  recentSessions: Array<{
    date: string;
    score: number;
    total: number;
    domain: Domain;
    difficulty: Difficulty;
  }>;
};

export type QuizSettings = {
  domain: Domain;
  difficulty: Difficulty;
};
