export type QuestionView = {
  id: string;
  courseId: string;
  courseName: string;
  type: string;
  difficulty: string;
  topic: string;
  stem: string;
  options: { key: string; text: string }[];
  correctAnswer: { key?: string; value?: boolean; accepted?: string[] };
  explanation: string | null;
  createdAt: string;
};

export type TestView = {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  courseName: string;
  batchId: string | null;
  batchCode: string | null;
  batchName: string | null;
  durationMinutes: number;
  attemptsAllowed: number;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
  questionCount: number;
  attemptCount: number;
  createdAt: string;
};

export type TestQuestionRow = {
  linkId: string;
  questionId: string;
  marks: number;
  orderIndex: number;
  stem: string;
  type: string;
  topic: string;
};

export type AttemptView = {
  id: string;
  studentName: string;
  studentCode: string;
  email: string;
  attemptNumber: number;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  autoSubmitted: boolean;
  totalScore: number | null;
  maxScore: number | null;
  tabSwitchCount: number;
};

export type AttemptAnswerView = {
  id: string;
  questionId: string;
  type: string;
  stem: string;
  options: { key: string; text: string }[];
  correctAnswer: { key?: string; value?: boolean; accepted?: string[] };
  explanation: string | null;
  marks: number;
  answerKey?: string;
  answerValue?: boolean;
  answerText?: string;
  isCorrect: boolean | null;
  awardedMarks: number;
  feedback: string | null;
  needsManual: boolean;
};
