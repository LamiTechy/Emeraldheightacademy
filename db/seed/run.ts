import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { addDays, format, startOfDay, subDays } from "date-fns";
import type { DBTx } from "../index";
import * as s from "../schema";
import {
  ADMIN,
  ANNOUNCEMENTS,
  BATCHES,
  BATCH_ENROLLMENTS,
  BATCH_TUTORS,
  COURSES,
  CURRENT_YEAR,
  DEFAULT_PASSWORDS,
  EVENTS,
  FAQS,
  GALLERY,
  MATERIALS,
  NEWS,
  NON_ACTIVE_ENROLLMENTS,
  QUESTIONS,
  SETTINGS_DATA,
  STUDENT_NAMES,
  TESTIMONIALS,
  TUTORS,
} from "./content";
import { createRng, emailFromName, pick, slugify } from "./utils";

const SEED_VERSION = 1;

const WIPE_ORDER = [
  s.attemptAnswers,
  s.testAttempts,
  s.testQuestions,
  s.tests,
  s.questions,
  s.submissions,
  s.assignments,
  s.attendance,
  s.materials,
  s.enrollments,
  s.tutorAssignments,
  s.timetableSlots,
  s.batches,
  s.courses,
  s.messages,
  s.announcements,
  s.registrationRequests,
  s.contactMessages,
  s.news,
  s.events,
  s.galleryItems,
  s.testimonials,
  s.faqs,
  s.auditLogs,
  s.passwordResets,
  s.settings,
  s.students,
  s.tutors,
  s.admins,
  s.users,
] as const;

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

function isoDay(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Weighted attendance biased by the student's "ability" factor. */
function attendanceStatus(rng: () => number): (typeof s.attendanceStatusEnum.enumValues)[number] {
  const r = rng();
  if (r < 0.74) return "present";
  if (r < 0.85) return "late";
  if (r < 0.95) return "absent";
  return "excused";
}

export async function runSeed(client: DBTx): Promise<void> {
  await client.transaction(async (tx) => {
    const alreadySeeded = await tx.query.settings.findFirst({
      where: eq(s.settings.key, "seeded_at"),
    });

    if (alreadySeeded && !process.env.FORCE_SEED) {
      console.log("Database already seeded. Set FORCE_SEED=1 to wipe and re-seed.");
      return;
    }

    if (alreadySeeded) {
      console.log("FORCE_SEED=1 → wiping existing data...");
      for (const table of WIPE_ORDER) {
        await tx.delete(table);
      }
    }

    const rng = createRng(20261011);
    const today = startOfDay(new Date());
    const [adminHash, tutorHash, studentHash] = await Promise.all([
      bcrypt.hash(DEFAULT_PASSWORDS.admin, 12),
      bcrypt.hash(DEFAULT_PASSWORDS.tutor, 12),
      bcrypt.hash(DEFAULT_PASSWORDS.student, 12),
    ]);

    // ── Users ─────────────────────────────────────────────────────
    const [adminUser] = await tx
      .insert(s.users)
      .values({
        role: "admin",
        name: ADMIN.name,
        email: ADMIN.email,
        phone: ADMIN.phone,
        passwordHash: adminHash,
        status: "active",
      })
      .returning({ id: s.users.id });

    if (!adminUser) throw new Error("Failed to create admin user");
    await tx.insert(s.admins).values({ userId: adminUser.id, title: ADMIN.title });

    const tutorRows = await tx
      .insert(s.users)
      .values(
        TUTORS.map((tutor) => ({
          role: "tutor" as const,
          name: tutor.name,
          email: tutor.email,
          phone: tutor.phone,
          passwordHash: tutorHash,
          status: "active" as const,
        })),
      )
      .returning({ id: s.users.id, name: s.users.name });

    const tutorProfileRows = await tx
      .insert(s.tutors)
      .values(
        TUTORS.map((tutor, i) => ({
          userId: tutorRows[i]!.id,
          tutorId: `TUT-${pad(i + 1, 3)}`,
          bio: tutor.bio,
          qualifications: tutor.qualifications,
          specialties: [...tutor.specialties],
        })),
      )
      .returning({ id: s.tutors.id, tutorId: s.tutors.tutorId, userId: s.tutors.userId });

    const tutorByKeyIndex = (index: number) => tutorProfileRows[index]!;

    const studentUserRows = await tx
      .insert(s.users)
      .values(
        STUDENT_NAMES.map((name) => ({
          role: "student" as const,
          name,
          email: emailFromName(name),
          passwordHash: studentHash,
          status: "active" as const,
        })),
      )
      .returning({ id: s.users.id, name: s.users.name });

    const schools = [
      "Abeokuta Senior Grammar School",
      "Abeokuta Comprehensive Secondary School",
      "St. Clare's Primary School",
      "Kuto High School",
      "Greenfield International School",
    ];
    const streets = [
      "14 Oba Ademola Adetokunboh Avenue",
      "7 M.K.O. Abiola Way",
      "23 Ikija Road",
      "5 Sapon Road",
      "19 Kuto Road",
    ];

    const studentProfiles = STUDENT_NAMES.map((name, i) => {
      const n = i + 1;
      let educationLevel: (typeof s.educationLevelEnum.enumValues)[number];
      let age: number;
      if (n <= 17) {
        educationLevel = "senior_secondary";
        age = 16 + Math.floor(rng() * 3); // 16–18
      } else if (n <= 22) {
        educationLevel = "junior_secondary";
        age = 14 + Math.floor(rng() * 2); // 14–15
      } else {
        educationLevel = "primary";
        age = 9 + Math.floor(rng() * 3); // 9–11
      }
      const isMinor = age < 18;
      const surname = name.split(" ").slice(-1)[0]!;
      return {
        educationLevel,
        age,
        isMinor,
        gender: (n % 2 === 0 ? "male" : "female") as (typeof s.genderEnum.enumValues)[number],
        dateOfBirth: isoDay(new Date(CURRENT_YEAR - age, (n * 3) % 12, ((n * 7) % 27) + 1)),
        school: pick(rng, schools),
        address: `${pick(rng, streets)}, Abeokuta, Ogun State`,
        guardianName: isMinor ? `Mr. & Mrs. ${surname}` : null,
        guardianPhone: isMinor ? `+23480${pad(3000000 + n * 137, 7)}` : null,
        guardianRelationship: isMinor ? "Parent" : null,
      };
    });

    const studentRows = await tx
      .insert(s.students)
      .values(
        studentUserRows.map((user, i) => {
          const profile = studentProfiles[i]!;
          return {
            userId: user.id,
            studentId: `STU-${CURRENT_YEAR}-${pad(i + 1, 4)}`,
            educationLevel: profile.educationLevel,
            gender: profile.gender,
            dateOfBirth: profile.dateOfBirth,
            school: profile.school,
            address: profile.address,
            guardianName: profile.guardianName,
            guardianPhone: profile.guardianPhone,
            guardianRelationship: profile.guardianRelationship,
            isMinor: profile.isMinor,
          };
        }),
      )
      .returning({ id: s.students.id, userId: s.students.userId });

    // ── Courses & batches ─────────────────────────────────────────
    const courseRows = await tx
      .insert(s.courses)
      .values(
        COURSES.map((course) => ({
          code: course.code,
          name: course.name,
          slug: course.slug,
          category: course.category,
          description: course.description,
          longDescription: course.longDescription,
          durationWeeks: course.durationWeeks,
          scheduleSummary: course.scheduleSummary,
          mode: course.mode,
          syllabus: [...course.syllabus],
          imageUrl: `https://picsum.photos/seed/${course.slug}/800/500`,
          status: "active" as const,
          featured: course.featured,
          sortOrder: course.sortOrder,
        })),
      )
      .returning({ id: s.courses.id, code: s.courses.code });

    const courseIdByKey = new Map<string, string>();
    COURSES.forEach((course, i) => courseIdByKey.set(course.key, courseRows[i]!.id));
    const courseLeadTutor: Record<string, string> = {
      jamb: tutorByKeyIndex(0).id,
      waec: tutorByKeyIndex(1).id,
      primary: tutorByKeyIndex(2).id,
    };

    const batchStart = subDays(today, 56);
    const batchEnd = addDays(today, 84);

    const batchRows = await tx
      .insert(s.batches)
      .values(
        BATCHES.map((batch) => ({
          courseId: courseIdByKey.get(batch.courseKey)!,
          name: batch.name,
          code: batch.code,
          daysOfWeek: [...batch.daysOfWeek],
          startTime: batch.startTime,
          endTime: batch.endTime,
          mode: batch.mode,
          room: batch.room,
          meetingUrl: batch.meetingUrl ?? null,
          capacity: batch.capacity,
          startDate: isoDay(batchStart),
          endDate: isoDay(batchEnd),
          status: "active" as const,
        })),
      )
      .returning({ id: s.batches.id, code: s.batches.code });

    const batchIdByKey = new Map<string, string>();
    BATCHES.forEach((batch, i) => batchIdByKey.set(batch.key, batchRows[i]!.id));

    // ── Tutor assignments & timetable slots ───────────────────────
    await tx.insert(s.tutorAssignments).values(
      BATCHES.map((batch) => ({
        tutorId: tutorByKeyIndex(BATCH_TUTORS[batch.key]!).id,
        batchId: batchIdByKey.get(batch.key)!,
        role: "lead",
      })),
    );

    const slotRows = await tx
      .insert(s.timetableSlots)
      .values(
        BATCHES.flatMap((batch) =>
          batch.daysOfWeek.map((day) => ({
            batchId: batchIdByKey.get(batch.key)!,
            tutorId: tutorByKeyIndex(BATCH_TUTORS[batch.key]!).id,
            dayOfWeek: day,
            startTime: batch.startTime,
            endTime: batch.endTime,
            room: batch.room,
            meetingUrl: batch.meetingUrl ?? null,
            validFrom: isoDay(batchStart),
            validTo: isoDay(batchEnd),
          })),
        ),
      )
      .returning({
        id: s.timetableSlots.id,
        batchId: s.timetableSlots.batchId,
        dayOfWeek: s.timetableSlots.dayOfWeek,
      });

    // ── Enrollments ───────────────────────────────────────────────
    const enrollmentValues: (typeof s.enrollments.$inferInsert)[] = [];
    for (const [batchKey, studentNumbers] of Object.entries(BATCH_ENROLLMENTS)) {
      for (const number of studentNumbers) {
        enrollmentValues.push({
          studentId: studentRows[number - 1]!.id,
          batchId: batchIdByKey.get(batchKey)!,
          status: "active",
        });
      }
    }
    for (const item of NON_ACTIVE_ENROLLMENTS) {
      enrollmentValues.push({
        studentId: studentRows[item.studentNumber - 1]!.id,
        batchId: batchIdByKey.get(item.batchKey)!,
        status: item.status,
        droppedAt: item.status === "dropped" ? subDays(today, 20) : null,
      });
    }
    await tx.insert(s.enrollments).values(enrollmentValues);

    // ── Attendance history ────────────────────────────────────────
    const attendanceValues: (typeof s.attendance.$inferInsert)[] = [];
    for (const [batchKey, studentNumbers] of Object.entries(BATCH_ENROLLMENTS)) {
      const batch = BATCHES.find((b) => b.key === batchKey)!;
      const batchId = batchIdByKey.get(batchKey)!;
      const markedBy = tutorRows[BATCH_TUTORS[batchKey]!]!.id;
      for (let d = 0; d < 56; d++) {
        const day = subDays(today, d + 1); // up to yesterday
        if (!(batch.daysOfWeek as readonly number[]).includes(day.getDay())) continue;
        const slot = slotRows.find((sl) => sl.batchId === batchId && sl.dayOfWeek === day.getDay());
        for (const number of studentNumbers) {
          attendanceValues.push({
            studentId: studentRows[number - 1]!.id,
            batchId,
            slotId: slot?.id ?? null,
            day: isoDay(day),
            status: attendanceStatus(rng),
            markedBy,
          });
        }
      }
    }
    await tx.insert(s.attendance).values(attendanceValues);

    // ── Materials (placeholder files live in /public/downloads) ───
    await tx.insert(s.materials).values(
      MATERIALS.map((material) => {
        const fileName = `${slugify(material.title)}.txt`;
        return {
          courseId: courseIdByKey.get(material.courseKey)!,
          batchId: null,
          tutorId: courseLeadTutor[material.courseKey]!,
          title: material.title,
          description: material.description,
          type: material.type,
          url: `/downloads/${fileName}`,
          fileName,
          fileSize: 512,
          tags: [...material.tags],
        };
      }),
    );

    // ── Assignments & submissions ─────────────────────────────────
    const assignmentTitles: Record<string, [string, string]> = {
      jamb: [
        "Algebra Drill 1 — Simultaneous Equations",
        "Use of English Paper 1: 50 Past Questions",
      ],
      waec: [
        "Summary Writing Practice — Passage 1",
        "Biology: Labelled Diagrams & Short Notes",
      ],
      primary: ["Times Tables Practice Sheet 1", "Spelling & Comprehension — Week 3"],
    };

    const submissionValues: (typeof s.submissions.$inferInsert)[] = [];
    const assignmentRows: { id: string; batchKey: string }[] = [];

    for (const batch of BATCHES) {
      const batchKey = batch.key;
      const batchId = batchIdByKey.get(batchKey)!;
      const tutorId = tutorByKeyIndex(BATCH_TUTORS[batchKey]!).id;
      const [title1, title2] = assignmentTitles[batch.courseKey]!;

      const first = await tx
        .insert(s.assignments)
        .values({
          batchId,
          tutorId,
          title: title1,
          instructions:
            "Work through every question, show your steps clearly, and upload a photo or PDF of your work before the deadline. Neatness and method earn marks.",
          dueAt: subDays(today, 8),
          points: 20,
          status: "published",
        })
        .returning({ id: s.assignments.id });

      const second = await tx
        .insert(s.assignments)
        .values({
          batchId,
          tutorId,
          title: title2,
          instructions:
            "Complete all questions. Type your answers in the submission box or upload a scanned copy.",
          dueAt: addDays(today, 5),
          points: 20,
          status: "published",
        })
        .returning({ id: s.assignments.id });

      assignmentRows.push({ id: first[0]!.id, batchKey }, { id: second[0]!.id, batchKey });

      const activeStudents = BATCH_ENROLLMENTS[batchKey]!;
      for (const number of activeStudents) {
        const studentId = studentRows[number - 1]!.id;
        // Past assignment: most submitted, most graded.
        if (rng() < 0.88) {
          const graded = rng() < 0.82;
          const score = graded ? Math.round(11 + rng() * 9) : null; // out of 20
          submissionValues.push({
            assignmentId: first[0]!.id,
            studentId,
            content:
              "Please find my answers attached. I attempted every question and showed my working for the word problems.",
            status: graded ? "graded" : "submitted",
            score: score !== null ? score.toFixed(2) : null,
            feedback: graded
              ? pick(rng, [
                  "Good work — method is clear. Watch your rounding.",
                  "Well done. A few careless errors on the last two questions.",
                  "Excellent. Keep this standard up.",
                  "Passable. Revise the topics we marked in red.",
                ])
              : null,
            gradedBy: graded ? tutorRows[BATCH_TUTORS[batchKey]!]!.id : null,
            gradedAt: graded ? subDays(today, 5) : null,
          });
        }
        // Upcoming assignment: some submitted early.
        if (rng() < 0.4) {
          submissionValues.push({
            assignmentId: second[0]!.id,
            studentId,
            content: "Early submission — please review before the deadline.",
            status: "submitted",
          });
        }
      }
    }
    await tx.insert(s.submissions).values(submissionValues);

    // ── Question bank ─────────────────────────────────────────────
    const questionRows = await tx
      .insert(s.questions)
      .values(
        QUESTIONS.map((question) => ({
          courseId: courseIdByKey.get(question.courseKey)!,
          tutorId: courseLeadTutor[question.courseKey]!,
          type: question.type,
          difficulty: question.difficulty,
          topic: question.topic,
          stem: question.stem,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
        })),
      )
      .returning({ id: s.questions.id, courseId: s.questions.courseId, type: s.questions.type });

    const questionIndexByCourse = new Map<string, number[]>();
    QUESTIONS.forEach((question, i) => {
      const list = questionIndexByCourse.get(question.courseKey) ?? [];
      list.push(i);
      questionIndexByCourse.set(question.courseKey, list);
    });

    // ── Tests ─────────────────────────────────────────────────────
    async function createTest(input: {
      courseKey: string;
      batchKey: string | null;
      tutorId: string;
      title: string;
      description: string;
      durationMinutes: number;
      attemptsAllowed: number;
      status: "draft" | "published";
      questionIndexes: number[];
    }) {
      const testRows = await tx
        .insert(s.tests)
        .values({
          courseId: courseIdByKey.get(input.courseKey)!,
          batchId: input.batchKey ? batchIdByKey.get(input.batchKey)! : null,
          tutorId: input.tutorId,
          title: input.title,
          description: input.description,
          durationMinutes: input.durationMinutes,
          attemptsAllowed: input.attemptsAllowed,
          startsAt: subDays(today, 7),
          endsAt: addDays(today, 14),
          shuffleQuestions: true,
          shuffleOptions: true,
          showAnswersAfter: true,
          status: input.status,
        })
        .returning({ id: s.tests.id });

      const testId = testRows[0]!.id;
      await tx.insert(s.testQuestions).values(
        input.questionIndexes.map((qIndex, order) => ({
          testId,
          questionId: questionRows[qIndex]!.id,
          orderIndex: order,
          marks: "1.00",
        })),
      );
      return testId;
    }

    const jambQs = questionIndexByCourse.get("jamb")!;
    const waecQs = questionIndexByCourse.get("waec")!;

    const test1 = await createTest({
      courseKey: "jamb",
      batchKey: "jamb-morning",
      tutorId: tutorByKeyIndex(0).id,
      title: "JAMB Mathematics & English Mock 1",
      description:
        "A timed mix of maths and use-of-English questions in UTME style. Answers and explanations are released after submission.",
      durationMinutes: 30,
      attemptsAllowed: 1,
      status: "published",
      questionIndexes: jambQs,
    });

    const test2 = await createTest({
      courseKey: "waec",
      batchKey: "waec-weekend",
      tutorId: tutorByKeyIndex(1).id,
      title: "WAEC Practice Quiz — English & Maths",
      description: "Short practice quiz covering grammar, comprehension and basic maths.",
      durationMinutes: 20,
      attemptsAllowed: 2,
      status: "published",
      questionIndexes: waecQs,
    });

    await createTest({
      courseKey: "jamb",
      batchKey: null,
      tutorId: tutorByKeyIndex(0).id,
      title: "JAMB Diagnostic Test (Draft)",
      description: "Diagnostic paper to place new students. Not yet published.",
      durationMinutes: 45,
      attemptsAllowed: 1,
      status: "draft",
      questionIndexes: jambQs.slice(0, 5),
    });

    // ── Attempts & answers ────────────────────────────────────────
    const ability = new Map<string, number>();
    for (const row of studentRows) ability.set(row.id, 0.55 + rng() * 0.4);

    const answerValues: (typeof s.attemptAnswers.$inferInsert)[] = [];
    const attemptValues: (typeof s.testAttempts.$inferInsert)[] = [];

    type PendingAttempt = { testId: string; studentId: string; status: "graded" | "submitted"; answers: (typeof s.attemptAnswers.$inferInsert)[] };
    const pendingAttempts: PendingAttempt[] = [];

    function buildAttempt(testId: string, studentId: string, qIndexes: number[]): PendingAttempt {
      const skill = ability.get(studentId) ?? 0.7;
      const answers: (typeof s.attemptAnswers.$inferInsert)[] = [];
      let awaitingManual = false;

      for (const qIndex of qIndexes) {
        const question = QUESTIONS[qIndex]!;
        const questionId = questionRows[qIndex]!.id;
        const correct = rng() < skill;

        if (question.type === "mcq") {
          const chosenKey = correct
            ? question.correctAnswer.key!
            : pick(rng, question.options.filter((o) => o.key !== question.correctAnswer.key)).key;
          answers.push({
            attemptId: "", // filled below
            questionId,
            answer: { key: chosenKey },
            isCorrect: correct,
            awardedMarks: (correct ? 1 : 0).toFixed(2),
          });
        } else if (question.type === "true_false") {
          const value = correct ? question.correctAnswer.value! : !question.correctAnswer.value;
          answers.push({
            attemptId: "",
            questionId,
            answer: { value },
            isCorrect: correct,
            awardedMarks: (correct ? 1 : 0).toFixed(2),
          });
        } else {
          // short answer
          const accepted = question.correctAnswer.accepted ?? [];
          const looksRight = rng() < skill;
          if (looksRight) {
            answers.push({
              attemptId: "",
              questionId,
              answer: { text: accepted[0] ?? "" },
              isCorrect: true,
              awardedMarks: "1.00",
              feedback: "Correct.",
            });
          } else if (rng() < 0.4) {
            awaitingManual = true;
            answers.push({
              attemptId: "",
              questionId,
              answer: { text: pick(rng, ["not sure", "7 I think", "because the teacher said so"]) },
              isCorrect: null,
              awardedMarks: "0.00",
            });
          } else {
            answers.push({
              attemptId: "",
              questionId,
              answer: { text: pick(rng, ["0", "5", "24"]) },
              isCorrect: false,
              awardedMarks: "0.00",
              feedback: "Incorrect — check the worked example in your notes.",
            });
          }
        }
      }

      return {
        testId,
        studentId,
        status: awaitingManual ? "submitted" : "graded",
        answers,
      };
    }

    const publishedTests: {
      testId: string;
      batchKey: string;
      qIndexes: number[];
      maxScore: number;
      durationMinutes: number;
    }[    ] = [
      { testId: test1, batchKey: "jamb-morning", qIndexes: jambQs, maxScore: jambQs.length, durationMinutes: 30 },
      { testId: test2, batchKey: "waec-weekend", qIndexes: waecQs, maxScore: waecQs.length, durationMinutes: 20 },
    ];

    for (const test of publishedTests) {
      const activeStudents = BATCH_ENROLLMENTS[test.batchKey]!;
      // All but the last student have submitted; the last has an active attempt.
      for (let i = 0; i < activeStudents.length; i++) {
        const studentId = studentRows[activeStudents[i]! - 1]!.id;
        const isLast = i === activeStudents.length - 1;

        if (isLast) {
          attemptValues.push({
            testId: test.testId,
            studentId,
            attemptNumber: 1,
            status: "in_progress",
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 12 * 60 * 1000),
            maxScore: test.maxScore.toFixed(2),
            tabSwitchCount: Math.floor(rng() * 2),
          });
          continue;
        }

        const built = buildAttempt(test.testId, studentId, test.qIndexes);
        pendingAttempts.push(built);
        const startedAt = subDays(today, 3);
        attemptValues.push({
          testId: test.testId,
          studentId,
          attemptNumber: 1,
          status: built.status,
          startedAt,
          expiresAt: new Date(startedAt.getTime() + test.durationMinutes * 60 * 1000),
          submittedAt: startedAt,
          autoSubmitted: false,
          totalScore: built.answers.reduce((sum, a) => sum + Number(a.awardedMarks ?? 0), 0).toFixed(2),
          maxScore: test.maxScore.toFixed(2),
          tabSwitchCount: Math.floor(rng() * 3),
        });
      }
    }

    const insertedAttempts = await tx.insert(s.testAttempts).values(attemptValues).returning({
      id: s.testAttempts.id,
      testId: s.testAttempts.testId,
      studentId: s.testAttempts.studentId,
    });

    for (const built of pendingAttempts) {
      const attempt = insertedAttempts.find(
        (a) => a.testId === built.testId && a.studentId === built.studentId,
      );
      if (!attempt) continue;
      for (const answer of built.answers) {
        answerValues.push({ ...answer, attemptId: attempt.id });
      }
    }
    if (answerValues.length > 0) {
      await tx.insert(s.attemptAnswers).values(answerValues);
    }
    // ── Announcements ─────────────────────────────────────────────
    await tx.insert(s.announcements).values(
      ANNOUNCEMENTS.map((announcement, i) => ({
        authorId: adminUser.id,
        title: announcement.title,
        body: announcement.body,
        scope: announcement.scope,
        courseId:
          "courseKey" in announcement && announcement.courseKey
            ? (courseIdByKey.get(announcement.courseKey) ?? null)
            : null,
        batchId:
          "batchKey" in announcement && announcement.batchKey
            ? (batchIdByKey.get(announcement.batchKey) ?? null)
            : null,
        pinned: announcement.pinned,
        publishAt: subDays(today, i * 2),
      })),
    );

    // ── Messages ──────────────────────────────────────────────────
    await tx.insert(s.messages).values([
      {
        senderId: adminUser.id,
        recipientId: studentUserRows[0]!.id,
        subject: "Welcome to your student portal",
        body: `Welcome Aisha! Your login details are in your approval email. Use the portal to check your timetable, download materials and view your scores. If you forget your password, use "Forgot password" on the login page.`,
        readAt: null,
      },
      {
        senderId: tutorRows[0]!.id,
        recipientId: studentUserRows[4]!.id,
        subject: "Feedback on your algebra drill",
        body: "Well done on your submission, Folake. Your method on questions 4 and 7 was excellent. Please redo question 9 — revisit simultaneous equations using substitution.",
        readAt: subDays(today, 1),
      },
      {
        senderId: studentUserRows[2]!.id,
        recipientId: tutorRows[0]!.id,
        subject: "Question about Thursday's class",
        body: "Good afternoon sir, will Thursday's evening class cover quadratic graphs? I may not be able to attend because of a school event.",
        readAt: null,
      },
    ]);

    // ── Public form submissions ───────────────────────────────────
    await tx.insert(s.registrationRequests).values([
      {
        fullName: "Kehinde Williams",
        email: "kehinde.williams@example.com",
        phone: "+2348021110001",
        courseIds: [courseIdByKey.get("jamb")!],
        preferredSchedule: "Morning batch",
        educationLevel: "senior_secondary",
        guardianName: "Mrs. Funke Williams",
        guardianPhone: "+2348021110002",
        guardianRelationship: "Parent",
        message: "My son wrote JAMB last year and wants to retake. Please advise on the morning batch.",
        status: "pending",
      },
      {
        fullName: "Olamide Fakeye",
        email: "olamide.fakeye@example.com",
        phone: "+2348021110003",
        courseIds: [courseIdByKey.get("waec")!],
        preferredSchedule: "Weekend only",
        educationLevel: "junior_secondary",
        message: "I work during the week. Is the Saturday batch enough to pass WAEC?",
        status: "pending",
      },
      {
        fullName: "Chinelo Eze",
        phone: "+2348021110004",
        courseIds: [courseIdByKey.get("primary")!],
        preferredSchedule: "Afternoon",
        educationLevel: "primary",
        guardianName: "Mr. Obi Eze",
        guardianPhone: "+2348021110005",
        guardianRelationship: "Parent",
        message: "Primary 5 pupil struggling with fractions. Please call me.",
        status: "pending",
      },
      {
        fullName: "Test Person",
        phone: "+2348021110006",
        courseIds: [courseIdByKey.get("jamb")!],
        educationLevel: "adult",
        message: "Testing the form.",
        status: "rejected",
        rejectionReason: "Duplicate/test submission — please register with real details.",
        reviewedBy: adminUser.id,
        reviewedAt: subDays(today, 4),
      },
      {
        fullName: "Ifeanyi Obiora",
        email: "ifeanyi.obiora@example.com",
        phone: "+2348021110007",
        courseIds: [courseIdByKey.get("primary")!],
        preferredSchedule: "Afternoon A",
        educationLevel: "primary",
        guardianName: "Mr. Paul Obiora",
        guardianPhone: "+2348021110008",
        guardianRelationship: "Parent",
        message: "Please enrol my son in the primary batch.",
        status: "approved",
        reviewedBy: adminUser.id,
        reviewedAt: subDays(today, 30),
        studentId: studentRows[24]!.id,
      },
    ]);

    await tx.insert(s.contactMessages).values([
      {
        name: "Uche Okoro",
        email: "uche.okoro@example.com",
        phone: "+2348043330001",
        subject: "Holiday programme?",
        message: "Do you run any holiday classes in August for secondary students?",
        status: "new",
      },
      {
        name: "Mrs. Halima Sanni",
        email: "halima.sanni@example.com",
        subject: "Fee schedule request",
        message: "Please share the current fee schedule for JAMB morning batch.",
        status: "read",
      },
      {
        name: "David Ogu",
        email: "david.ogu@example.com",
        phone: "+2348043330003",
        subject: "Lost ID card",
        message: "My ward misplaced her student ID card. How can she get a replacement?",
        status: "replied",
        repliedAt: subDays(today, 2),
      },
    ]);

    // ── CMS content ───────────────────────────────────────────────
    await tx.insert(s.news).values(
      NEWS.map((item, i) => ({
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        body: item.body,
        coverImageUrl: item.imageUrl,
        authorId: adminUser.id,
        published: item.published,
        publishedAt: item.published ? subDays(today, 6 - i) : null,
      })),
    );

    await tx.insert(s.events).values(
      EVENTS.map((item) => {
        const startsAt = addDays(today, item.daysFromNow);
        startsAt.setHours(10, 0, 0, 0);
        return {
          title: item.title,
          slug: item.slug,
          description: item.description,
          location: item.location,
          startsAt,
          endsAt: new Date(startsAt.getTime() + 3 * 60 * 60 * 1000),
          status: item.status,
        };
      }),
    );

    await tx.insert(s.galleryItems).values(
      GALLERY.map((item, i) => ({
        title: item.title,
        imageUrl: `https://picsum.photos/seed/${item.seed}/1000/750`,
        category: item.category,
        sortOrder: i,
      })),
    );

    await tx.insert(s.testimonials).values(
      TESTIMONIALS.map((item, i) => ({
        name: item.name,
        program: item.program,
        quote: item.quote,
        rating: item.rating,
        featured: item.featured,
        approved: item.approved,
        sortOrder: i,
      })),
    );

    await tx.insert(s.faqs).values(
      FAQS.map((item, i) => ({
        question: item.question,
        answer: item.answer,
        category: item.category,
        sortOrder: i,
        active: true,
      })),
    );

    // ── Settings & audit trail ────────────────────────────────────
    await tx.insert(s.settings).values([
      ...Object.entries(SETTINGS_DATA).map(([key, value]) => ({
        key,
        value,
        updatedBy: adminUser.id,
      })),
      {
        key: "seeded_at",
        value: { at: new Date().toISOString(), version: SEED_VERSION },
        updatedBy: adminUser.id,
      },
    ]);

    await tx.insert(s.auditLogs).values([
      {
        actorId: adminUser.id,
        actorRole: "admin",
        action: "system.seed",
        entityType: "database",
        summary: "Seeded the database with demo centres, users and content.",
        metadata: {
          students: studentRows.length,
          tutors: tutorProfileRows.length,
          courses: courseRows.length,
          batches: batchRows.length,
          attendanceRows: attendanceValues.length,
        },
      },
      {
        actorId: adminUser.id,
        actorRole: "admin",
        action: "registration.approve",
        entityType: "registration_request",
        summary: "Approved Ifeanyi Obiora's registration and created the student account.",
        metadata: { studentId: studentRows[24]!.id },
        createdAt: subDays(today, 30),
      },
    ]);

    console.log("✓ Seed complete.");
    console.log(`  users: 1 admin, ${TUTORS.length} tutors, ${STUDENT_NAMES.length} students`);
    console.log(`  academics: ${COURSES.length} courses, ${BATCHES.length} batches, ${enrollmentValues.length} enrollments`);
    console.log(`  history: ${attendanceValues.length} attendance rows, ${submissionValues.length} submissions`);
    console.log(`  tests: 2 published + 1 draft, question bank: ${QUESTIONS.length} questions`);
  });
}
