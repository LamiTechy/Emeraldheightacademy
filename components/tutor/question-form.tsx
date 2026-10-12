"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/client-api";
import type { QuestionView } from "@/components/tutor/test-types";
import type { CourseTreeNode } from "@/components/tutor/types";
import { PlusIcon, Trash2Icon } from "lucide-react";

const formSchema = z
  .object({
    courseId: z.string().min(1, "Select a course"),
    type: z.enum(["mcq", "true_false", "short_answer"]),
    difficulty: z.enum(["easy", "medium", "hard"]),
    topic: z.string().trim().min(2).max(80),
    stem: z.string().trim().min(3, "Question text is too short").max(5000),
    correctValue: z.string().optional(),
    accepted: z.string().optional(),
    explanation: z.string().trim().max(2000).optional(),
  })
  .refine((d) => d.type !== "true_false" || (d.correctValue === "true" || d.correctValue === "false"), {
    message: "Pick true or false",
    path: ["correctValue"],
  })
  .refine((d) => d.type !== "short_answer" || (d.accepted ?? "").trim().length > 0, {
    message: "Add at least one accepted answer",
    path: ["accepted"],
  });

type FormValues = z.infer<typeof formSchema>;

type OptionRow = { key: string; text: string };

function defaultOptions(): OptionRow[] {
  return [
    { key: "A", text: "" },
    { key: "B", text: "" },
    { key: "C", text: "" },
    { key: "D", text: "" },
  ];
}

export function QuestionForm({
  mode,
  question,
  courses,
  onDone,
}: {
  mode: "create" | "edit";
  question?: QuestionView;
  courses: CourseTreeNode[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [options, setOptions] = React.useState<OptionRow[]>(() => {
    if (mode === "edit" && question?.type === "mcq" && question.options.length > 0) {
      return question.options.map((o) => ({ key: o.key, text: o.text }));
    }
    return defaultOptions();
  });
  const [correctKey, setCorrectKey] = React.useState<string>(
    mode === "edit" && question?.type === "mcq" ? (question.correctAnswer.key ?? "") : "A",
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues:
      mode === "edit" && question
        ? {
            courseId: question.courseId,
            type: question.type as FormValues["type"],
            difficulty: question.difficulty as FormValues["difficulty"],
            topic: question.topic,
            stem: question.stem,
            correctValue:
              question.type === "true_false"
                ? String(question.correctAnswer.value ?? true)
                : undefined,
            accepted: question.type === "short_answer"
              ? (question.correctAnswer.accepted ?? []).join(", ")
              : "",
            explanation: question.explanation ?? "",
          }
        : {
            courseId: courses[0]?.id ?? "",
            type: "mcq",
            difficulty: "medium",
            topic: "",
            stem: "",
            correctValue: undefined,
            accepted: "",
            explanation: "",
          },
  });

  const watchedType = useWatch({ control: form.control, name: "type" });

  function updateOption(index: number, patch: Partial<OptionRow>) {
    setOptions((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addOption() {
    setOptions((rows) =>
      rows.length >= 8
        ? rows
        : [...rows, { key: String.fromCharCode(65 + rows.length), text: "" }],
    );
  }

  function removeOption(index: number) {
    setOptions((rows) => rows.filter((_, i) => i !== index));
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const type = values.type;
      const cleaned = options
        .map((o) => ({ key: o.key.trim(), text: o.text.trim() }))
        .filter((o) => o.key && o.text);
      if (type === "mcq" && cleaned.length < 2) {
        toast.error("MCQ needs at least 2 filled options");
        setSubmitting(false);
        return;
      }
      if (type === "mcq" && !cleaned.some((o) => o.key === correctKey)) {
        toast.error("Pick which option is correct");
        setSubmitting(false);
        return;
      }

      const body = {
        courseId: values.courseId,
        type,
        difficulty: values.difficulty,
        topic: values.topic,
        stem: values.stem,
        options: type === "mcq" ? cleaned : [],
        correctKey: type === "mcq" ? correctKey : null,
        correctValue: type === "true_false" ? values.correctValue === "true" : null,
        accepted:
          type === "short_answer"
            ? (values.accepted ?? "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        explanation: values.explanation?.trim() ? values.explanation.trim() : null,
      };

      const result =
        mode === "create"
          ? await apiRequest("/api/tutor/questions", { method: "POST", body })
          : await apiRequest(`/api/tutor/questions/${question!.id}`, { method: "PATCH", body });

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [key, messages] of Object.entries(result.fieldErrors)) {
            form.setError(key as never, { message: messages[0] });
          }
        }
        toast.error(result.error ?? "Something went wrong");
        return;
      }

      toast.success(mode === "create" ? "Question added" : "Question updated");
      onDone();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form form={form} onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          control={form.control}
          name="courseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Course" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="mcq">Multiple choice</SelectItem>
                  <SelectItem value="true_false">True / False</SelectItem>
                  <SelectItem value="short_answer">Short answer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="difficulty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Difficulty</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="topic"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Topic</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Quadratic equations" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="stem"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Question</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder="Type the question…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {watchedType === "mcq" ? (
        <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Options</p>
            <Button type="button" variant="outline" size="sm" onClick={addOption} disabled={options.length >= 8}>
              <PlusIcon /> Add option
            </Button>
          </div>
          {options.map((opt, i) => (
            <div key={opt.key} className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={correctKey === opt.key ? "default" : "outline"}
                className="h-9 w-10 shrink-0 font-mono"
                onClick={() => setCorrectKey(opt.key)}
                aria-label={`Mark option ${opt.key} correct`}
              >
                {opt.key}
              </Button>
              <Input
                value={opt.text}
                onChange={(e) => updateOption(i, { text: e.target.value })}
                placeholder={`Option ${opt.key}…`}
              />
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => removeOption(i)}
                aria-label={`Remove option ${opt.key}`}
                disabled={options.length <= 2}
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
          <p className="text-muted-foreground text-xs">Click a letter to mark the correct option.</p>
        </div>
      ) : null}

      {watchedType === "true_false" ? (
        <FormField
          control={form.control}
          name="correctValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correct answer</FormLabel>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pick…" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {watchedType === "short_answer" ? (
        <FormField
          control={form.control}
          name="accepted"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Accepted answers</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 6.5, 6.50" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>
                Comma-separated. Matching answers are auto-marked; others go to you for review.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      <FormField
        control={form.control}
        name="explanation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Explanation (optional)</FormLabel>
            <FormControl>
              <Textarea rows={2} {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Add question" : "Save changes"}
        </Button>
      </div>
    </Form>
  );
}
