"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { apiRequest } from "@/lib/client-api";
import type { QuizQuestionPayload } from "@/lib/queries/tutor-tests";
import { AlertTriangleIcon, CheckIcon } from "lucide-react";

type AnswerMap = Record<string, { key?: string; value?: boolean; text?: string }>;
export type { AnswerMap };

export function QuizRunner({
  testId,
  testTitle,
  questions: initialQuestions,
  initialSaved,
  attemptId: initialAttemptId,
  expiresAt: initialExpiresAt,
}: {
  testId: string;
  testTitle: string;
  questions: QuizQuestionPayload[] | null;
  initialSaved: AnswerMap;
  attemptId: string | null;
  expiresAt: string | null;
}) {
  const router = useRouter();
  const [attemptId, setAttemptId] = React.useState<string | null>(initialAttemptId);
  const [questions, setQuestions] = React.useState<QuizQuestionPayload[]>(initialQuestions ?? []);
  const [answers, setAnswers] = React.useState<AnswerMap>(initialSaved);
  const [current, setCurrent] = React.useState(0);
  const [starting, setStarting] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmSubmit, setConfirmSubmit] = React.useState(false);
  const [remaining, setRemaining] = React.useState<number | null>(() => {
    if (!initialExpiresAt) return null;
    const ms = new Date(initialExpiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(ms / 1000));
  });
  const [tabWarnings, setTabWarnings] = React.useState(0);
  const warnedRef = React.useRef(false);

  // Countdown timer — auto-submits at zero.
  React.useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) {
      void submit();
      return;
    }
    const t = window.setTimeout(() => setRemaining((r) => (r === null ? null : r - 1)), 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  // Tab-switch nudge (visibility change).
  React.useEffect(() => {
    if (!attemptId) return;
    function onVisibility() {
      if (document.visibilityState === "hidden" && !warnedRef.current) {
        warnedRef.current = true;
        void apiRequest(`/api/student/attempts/${attemptId}/answer`, { method: "PATCH" }).then(
          (r) => {
            if (r.ok && r.data && typeof r.data.count === "number") {
              setTabWarnings(r.data.count);
              toast.warning("Leaving the tab was recorded — stay on the test please.");
            }
          },
        );
        window.setTimeout(() => {
          warnedRef.current = false;
        }, 3000);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [attemptId]);

  async function start() {
    setStarting(true);
    try {
      const result = await apiRequest<{ id: string; expiresAt: string; resumed: boolean }>(
        `/api/student/tests/${testId}/start`,
        { method: "POST" },
      );
      if (!result.ok || !result.data) {
        toast.error(result.error ?? "Could not start the test");
        return;
      }
      setAttemptId(result.data.id);
      setRemaining(Math.max(0, Math.floor((new Date(result.data.expiresAt).getTime() - Date.now()) / 1000)));
      const quiz = await apiRequest<{
        questions: QuizQuestionPayload[];
        saved: AnswerMap;
      }>(`/api/student/tests/${testId}/quiz`, { method: "GET" });
      if (quiz.ok && quiz.data) {
        setQuestions(quiz.data.questions);
        setAnswers(quiz.data.saved ?? {});
        toast.success(result.data.resumed ? "Resumed your attempt" : "Test started — good luck!");
      }
    } finally {
      setStarting(false);
    }
  }

  function setAnswer(question: QuizQuestionPayload, value: { key?: string; value?: boolean; text?: string }) {
    setAnswers((a) => ({ ...a, [question.questionId]: value }));
    // Autosave (fire-and-forget).
    if (attemptId) {
      void apiRequest(`/api/student/attempts/${attemptId}/answer`, {
        method: "POST",
        body: {
          questionId: question.questionId,
          key: value.key ?? null,
          value: value.value ?? null,
          text: value.text ?? null,
        },
      });
    }
  }

  async function submit() {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([questionId, a]) => ({
        questionId,
        key: a.key ?? null,
        value: a.value ?? null,
        text: a.text ?? null,
      }));
      const result = await apiRequest<{
        status: string;
        totalScore: number;
        maxScore: number;
        pendingManual: number;
        autoSubmitted: boolean;
      }>(`/api/student/attempts/${attemptId}/submit`, {
        method: "POST",
        body: { answers: payload },
      });
      if (!result.ok) {
        toast.error(result.error ?? "Submit failed");
        return;
      }
      toast.success(
        result.data?.autoSubmitted
          ? "Time's up — your answers were submitted automatically"
          : "Test submitted!",
      );
      router.push(`/student/tests/${testId}/result`);
      router.refresh();
    } finally {
      setSubmitting(false);
      setConfirmSubmit(false);
    }
  }

  if (!attemptId) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Ready to begin?</CardTitle>
          <CardDescription>
            {questions.length > 0
              ? `${questions.length} questions. Once you start, the timer runs continuously.`
              : "Starting loads your questions and starts the countdown."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" onClick={() => void start()} disabled={starting}>
            {starting ? "Starting…" : "Start test"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="pt-6 text-sm text-muted-foreground">Loading questions…</CardContent>
      </Card>
    );
  }

  const q = questions[Math.min(current, questions.length - 1)]!;
  const answered = Object.keys(answers).length;
  const mm = remaining !== null ? Math.floor(remaining / 60) : null;
  const ss = remaining !== null ? remaining % 60 : null;
  const lowTime = remaining !== null && remaining <= 60;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
        <div className="font-mono text-lg font-semibold tabular-nums">
          {mm !== null && ss !== null
            ? `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
            : "—"}
        </div>
        <div className="min-w-0 flex-1">
          <Progress value={(answered / questions.length) * 100} className="h-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            {answered}/{questions.length} answered · {testTitle}
          </p>
        </div>
        {tabWarnings > 0 ? (
          <Badge variant="outline" className="gap-1 text-amber-600">
            <AlertTriangleIcon className="size-3" /> {tabWarnings} tab {tabWarnings === 1 ? "switch" : "switches"}
          </Badge>
        ) : null}
        <Button size="sm" onClick={() => setConfirmSubmit(true)} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit test"}
        </Button>
      </div>

      {lowTime ? (
        <p className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Less than a minute left — submit soon!
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">Q{q.order}</span>
            <Badge variant="secondary">{q.topic}</Badge>
            <span className="ml-auto text-xs text-muted-foreground">{q.marks} mark(s)</span>
          </div>
          <CardTitle className="whitespace-pre-wrap text-base">{q.stem}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {q.type === "mcq"
            ? q.options.map((o) => {
                const selected = answers[q.questionId]?.key === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setAnswer(q, { key: o.key })}
                    className={`flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors ${
                      selected
                        ? "border-primary bg-primary/5 font-medium"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs">
                      {selected ? <CheckIcon className="size-3.5" /> : o.key}
                    </span>
                    <span>{o.text}</span>
                  </button>
                );
              })
            : null}

          {q.type === "true_false"
            ? (
                <div className="flex gap-3">
                  {[
                    { value: true, label: "True" },
                    { value: false, label: "False" },
                  ].map((opt) => {
                    const selected = answers[q.questionId]?.value === opt.value;
                    return (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => setAnswer(q, { value: opt.value })}
                        className={`flex-1 rounded-md border p-4 text-sm font-medium transition-colors ${
                          selected ? "border-primary bg-primary/5" : "hover:bg-muted"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )
            : null}

          {q.type === "short_answer" ? (
            <Textarea
              rows={3}
              placeholder="Type your answer…"
              value={answers[q.questionId]?.text ?? ""}
              onChange={(e) => setAnswer(q, { text: e.target.value })}
            />
          ) : null}
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          ← Previous
        </Button>
        <div className="flex flex-wrap justify-center gap-1">
          {questions.map((qq, i) => {
            const done = answers[qq.questionId] !== undefined;
            return (
              <button
                key={qq.questionId}
                type="button"
                onClick={() => setCurrent(i)}
                className={`size-7 rounded-md border text-xs font-medium ${
                  i === current
                    ? "border-primary bg-primary text-primary-foreground"
                    : done
                      ? "border-primary/40 bg-brand-soft text-primary dark:border-primary/50 dark:bg-primary/20 dark:text-indigo-200"
                      : "text-muted-foreground hover:bg-muted"
                }`}
                aria-label={`Go to question ${i + 1}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
          disabled={current >= questions.length - 1}
        >
          Next →
        </Button>
      </div>

      <ConfirmDialog
        open={confirmSubmit}
        onOpenChange={setConfirmSubmit}
        title="Submit your test?"
        description={`You answered ${answered} of ${questions.length} questions. You cannot change answers after submitting.`}
        confirmLabel="Submit"
        onConfirm={() => void submit()}
      />
    </>
  );
}
