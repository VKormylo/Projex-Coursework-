import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/error-handler";

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysFrom = (base: Date, n: number) =>
  new Date(base.getTime() + n * 86_400_000);

export async function seedDatabase() {
  const alreadySeeded = await prisma.project.findFirst({
    where: { name: "Projex Platform" },
  });
  if (alreadySeeded) throw new HttpError(409, "Already seeded");

  const roles = await prisma.role.findMany();
  const pmRole = roles.find((r) => r.name === "Project Manager");
  const devRole = roles.find((r) => r.name === "Developer");
  if (!pmRole || !devRole) throw new HttpError(500, "Roles missing");

  const hash = await bcrypt.hash("Password123", 10);

  const seedUsers = [
    {
      fullName: "Олена Петренко",
      email: "olena.petrenko@projex.dev",
      position: "Project Manager",
      roleId: pmRole.id,
    },
    {
      fullName: "Іван Коваленко",
      email: "ivan.kovalenko@projex.dev",
      position: "Frontend Developer",
      roleId: devRole.id,
    },
    {
      fullName: "Марина Сидоренко",
      email: "maryna.sydorenko@projex.dev",
      position: "Backend Developer",
      roleId: devRole.id,
    },
    {
      fullName: "Андрій Бондаренко",
      email: "andriy.bondarenko@projex.dev",
      position: "Full-Stack Developer",
      roleId: devRole.id,
    },
    {
      fullName: "Юлія Мельник",
      email: "yuliia.melnyk@projex.dev",
      position: "QA Engineer",
      roleId: devRole.id,
    },
  ];

  const createdUsers = await Promise.all(
    seedUsers.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { ...u, passwordHash: hash },
      }),
    ),
  );

  const adminUser = await prisma.user.findFirst({
    where: { role: { name: "Admin" } },
  });
  if (!adminUser) throw new HttpError(500, "Admin not found");

  const allUsers = [adminUser, ...createdUsers];
  const devs = createdUsers.filter((u) => u.roleId === devRole.id);

  const team = await prisma.team.create({
    data: {
      name: "Команда Alpha",
      teamMember: { create: allUsers.map((u) => ({ userId: u.id })) },
    },
  });

  const project = await prisma.project.create({
    data: {
      teamId: team.id,
      name: "Projex Platform",
      description: "Система управління проектами та завданнями команди",
      startDate: daysAgo(90),
      endDate: daysFrom(new Date(), 90),
      status: "active",
      createdBy: adminUser.id,
    },
  });

  // ── Sprints ────────────────────────────────────────────────────────────────

  const s1Start = daysAgo(75);
  const s1End = daysAgo(47);
  const s2Start = daysAgo(42);
  const s2End = daysAgo(14);
  const s3Start = daysAgo(7);
  const s3End = daysFrom(new Date(), 21);

  const sprint1 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: "Sprint 1 – Foundation",
      startDate: s1Start,
      endDate: s1End,
      goal: "Базова архітектура, авторизація та схема БД",
      status: "closed",
    },
  });
  const sprint2 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: "Sprint 2 – Core Features",
      startDate: s2Start,
      endDate: s2End,
      goal: "Управління проектами, спринтами та задачами",
      status: "closed",
    },
  });
  const sprint3 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: "Sprint 3 – Analytics",
      startDate: s3Start,
      endDate: s3End,
      goal: "Аналітика, PDF-звіти та релізи",
      status: "active",
    },
  });

  const d = devs;

  // ── Sprint 1 tasks (10, 8 done) ────────────────────────────────────────────

  type TS = "todo" | "in_progress" | "in_review" | "done" | "blocked";
  type TP = "low" | "medium" | "high" | "critical";

  const t1 = await prisma.$transaction([
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint1.id,
        title: "Налаштування CI/CD pipeline",
        priority: "high",
        status: "done",
        storyPoint: 5,
        assigneeId: d[0].id,
        reporterId: adminUser.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint1.id,
        title: "JWT авторизація та refresh токени",
        priority: "critical",
        status: "done",
        storyPoint: 8,
        assigneeId: d[1].id,
        reporterId: adminUser.id,
        dueDate: daysAgo(65),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint1.id,
        title: "Схема бази даних та міграції",
        priority: "critical",
        status: "done",
        storyPoint: 5,
        assigneeId: d[2].id,
        reporterId: adminUser.id,
        dueDate: daysAgo(68),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint1.id,
        title: "REST API для користувачів",
        priority: "high",
        status: "done",
        storyPoint: 3,
        assigneeId: d[1].id,
        reporterId: adminUser.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint1.id,
        title: "Frontend роутинг та layout",
        priority: "medium",
        status: "done",
        storyPoint: 3,
        assigneeId: d[0].id,
        reporterId: adminUser.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint1.id,
        title: "Dashboard layout та навігація",
        priority: "medium",
        status: "done",
        storyPoint: 2,
        assigneeId: d[3].id,
        reporterId: adminUser.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint1.id,
        title: "Prisma ORM та підключення до БД",
        priority: "high",
        status: "done",
        storyPoint: 3,
        assigneeId: d[2].id,
        reporterId: adminUser.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint1.id,
        title: "Unit тести авторизації",
        priority: "medium",
        status: "done",
        storyPoint: 3,
        assigneeId: d[3].id,
        reporterId: adminUser.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint1.id,
        title: "Документація Swagger API",
        priority: "low",
        status: "in_review",
        storyPoint: 2,
        assigneeId: d[0].id,
        reporterId: adminUser.id,
        dueDate: daysAgo(50),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint1.id,
        title: "Оптимізація індексів БД",
        priority: "high",
        status: "todo",
        storyPoint: 5,
        assigneeId: d[2].id,
        reporterId: adminUser.id,
        dueDate: daysAgo(49),
      },
    }),
  ]);

  // ── Sprint 2 tasks (12, 9 done) ────────────────────────────────────────────

  const t2 = await prisma.$transaction([
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint2.id,
        title: "CRUD проектів – backend",
        priority: "high",
        status: "done",
        storyPoint: 5,
        assigneeId: d[0].id,
        reporterId: adminUser.id,
        dueDate: daysAgo(35),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint2.id,
        title: "CRUD задач – backend та frontend",
        priority: "high",
        status: "done",
        storyPoint: 8,
        assigneeId: d[1].id,
        reporterId: adminUser.id,
        dueDate: daysAgo(30),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint2.id,
        title: "Управління командами",
        priority: "medium",
        status: "done",
        storyPoint: 3,
        assigneeId: d[2].id,
        reporterId: adminUser.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint2.id,
        title: "Спринти – створення та закриття",
        priority: "high",
        status: "done",
        storyPoint: 5,
        assigneeId: d[1].id,
        reporterId: adminUser.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint2.id,
        title: "Фільтрація та пошук задач",
        priority: "medium",
        status: "done",
        storyPoint: 3,
        assigneeId: d[0].id,
        reporterId: adminUser.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint2.id,
        title: "Встановлення пріоритетів задач",
        priority: "low",
        status: "done",
        storyPoint: 2,
        assigneeId: d[3].id,
        reporterId: adminUser.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint2.id,
        title: "Сторінка деталей задачі",
        priority: "medium",
        status: "done",
        storyPoint: 3,
        assigneeId: d[2].id,
        reporterId: adminUser.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint2.id,
        title: "Коментарі до задач",
        priority: "medium",
        status: "done",
        storyPoint: 3,
        assigneeId: d[3].id,
        reporterId: adminUser.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint2.id,
        title: "Логіка story points та velocity",
        priority: "low",
        status: "done",
        storyPoint: 2,
        assigneeId: d[0].id,
        reporterId: adminUser.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint2.id,
        title: "Інтеграційні тести API",
        priority: "medium",
        status: "in_review",
        storyPoint: 3,
        assigneeId: d[1].id,
        reporterId: adminUser.id,
        dueDate: daysAgo(16),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint2.id,
        title: "Кешування запитів React Query",
        priority: "high",
        status: "in_review",
        storyPoint: 5,
        assigneeId: d[2].id,
        reporterId: adminUser.id,
        dueDate: daysAgo(17),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint2.id,
        title: "Email сповіщення про дедлайн",
        priority: "medium",
        status: "blocked",
        storyPoint: 3,
        assigneeId: d[3].id,
        reporterId: adminUser.id,
        dueDate: daysAgo(5),
      },
    }),
  ]);

  // ── Sprint 3 tasks (15, active) ────────────────────────────────────────────

  const t3 = await prisma.$transaction([
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint3.id,
        title: "Сторінка аналітики – основний UI",
        priority: "high",
        status: "done",
        storyPoint: 8,
        assigneeId: d[0].id,
        reporterId: adminUser.id,
        dueDate: daysAgo(4),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint3.id,
        title: "Burndown chart реалізація",
        priority: "high",
        status: "done",
        storyPoint: 5,
        assigneeId: d[1].id,
        reporterId: adminUser.id,
        dueDate: daysAgo(3),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint3.id,
        title: "Velocity chart по спринтах",
        priority: "medium",
        status: "done",
        storyPoint: 3,
        assigneeId: d[0].id,
        reporterId: adminUser.id,
        dueDate: daysAgo(5),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint3.id,
        title: "PDF звіт – генерація та дизайн",
        priority: "critical",
        status: "done",
        storyPoint: 8,
        assigneeId: d[2].id,
        reporterId: adminUser.id,
        dueDate: daysAgo(2),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint3.id,
        title: "KPI дашборд – картки метрик",
        priority: "high",
        status: "in_progress",
        storyPoint: 5,
        assigneeId: d[3].id,
        reporterId: adminUser.id,
        dueDate: daysFrom(new Date(), 5),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint3.id,
        title: "Фільтрація аналітики по спринту",
        priority: "medium",
        status: "in_progress",
        storyPoint: 3,
        assigneeId: d[1].id,
        reporterId: adminUser.id,
        dueDate: daysFrom(new Date(), 3),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint3.id,
        title: "Сторінка релізів – UI та логіка",
        priority: "high",
        status: "in_progress",
        storyPoint: 5,
        assigneeId: d[0].id,
        reporterId: adminUser.id,
        dueDate: daysFrom(new Date(), 7),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint3.id,
        title: "Unit тести сервісу аналітики",
        priority: "medium",
        status: "in_review",
        storyPoint: 3,
        assigneeId: d[2].id,
        reporterId: adminUser.id,
        dueDate: daysFrom(new Date(), 2),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint3.id,
        title: "E2E тести основних сценаріїв",
        priority: "high",
        status: "in_review",
        storyPoint: 5,
        assigneeId: d[3].id,
        reporterId: adminUser.id,
        dueDate: daysFrom(new Date(), 4),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint3.id,
        title: "Оптимізація PDF генерації",
        priority: "medium",
        status: "in_review",
        storyPoint: 3,
        assigneeId: d[1].id,
        reporterId: adminUser.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint3.id,
        title: "Звіт по продуктивності члена команди",
        priority: "medium",
        status: "todo",
        storyPoint: 3,
        assigneeId: d[0].id,
        reporterId: adminUser.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint3.id,
        title: "PM дашборд – огляд проектів",
        priority: "high",
        status: "todo",
        storyPoint: 5,
        assigneeId: d[2].id,
        reporterId: adminUser.id,
        dueDate: daysFrom(new Date(), 10),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint3.id,
        title: "Мобільна адаптація інтерфейсу",
        priority: "low",
        status: "todo",
        storyPoint: 3,
        assigneeId: d[3].id,
        reporterId: adminUser.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint3.id,
        title: "Інтеграція зовнішніх сповіщень",
        priority: "low",
        status: "blocked",
        storyPoint: 5,
        assigneeId: d[1].id,
        reporterId: adminUser.id,
        dueDate: daysFrom(new Date(), 2),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint3.id,
        title: "Аудит логів дій користувача",
        priority: "medium",
        status: "blocked",
        storyPoint: 3,
        assigneeId: d[0].id,
        reporterId: adminUser.id,
        dueDate: daysAgo(2),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: sprint3.id,
        title: "Інтеграція з Google Analytics",
        priority: "medium",
        status: "todo",
        storyPoint: 3,
        assigneeId: d[0].id,
        reporterId: adminUser.id,
      },
    }),
  ]);

  // ── Task history ───────────────────────────────────────────────────────────

  // Helper: build history for a done task (spread over sprint days)
  function doneHistory(
    taskId: bigint,
    sprintStart: Date,
    offsetDays: number,
    changedBy: bigint,
  ) {
    return [
      {
        taskId,
        changedBy,
        oldStatus: "todo" as TS,
        newStatus: "in_progress" as TS,
        changedAt: daysFrom(sprintStart, offsetDays),
      },
      {
        taskId,
        changedBy,
        oldStatus: "in_progress" as TS,
        newStatus: "in_review" as TS,
        changedAt: daysFrom(sprintStart, offsetDays + 4),
      },
      {
        taskId,
        changedBy,
        oldStatus: "in_review" as TS,
        newStatus: "done" as TS,
        changedAt: daysFrom(sprintStart, offsetDays + 7),
      },
    ];
  }

  // Sprint 1 done tasks (t1[0..7])
  const histS1 = [
    ...doneHistory(t1[0].id, s1Start, 1, d[0].id),
    ...doneHistory(t1[1].id, s1Start, 2, d[1].id),
    ...doneHistory(t1[2].id, s1Start, 3, d[2].id),
    ...doneHistory(t1[3].id, s1Start, 5, d[1].id),
    ...doneHistory(t1[4].id, s1Start, 8, d[0].id),
    ...doneHistory(t1[5].id, s1Start, 10, d[3].id),
    ...doneHistory(t1[6].id, s1Start, 12, d[2].id),
    ...doneHistory(t1[7].id, s1Start, 15, d[3].id),
    // t1[8] in_review
    {
      taskId: t1[8].id,
      changedBy: d[0].id,
      oldStatus: "todo" as TS,
      newStatus: "in_progress" as TS,
      changedAt: daysFrom(s1Start, 18),
    },
    {
      taskId: t1[8].id,
      changedBy: d[0].id,
      oldStatus: "in_progress" as TS,
      newStatus: "in_review" as TS,
      changedAt: daysFrom(s1Start, 22),
    },
  ];

  // Sprint 2 done tasks (t2[0..8])
  const histS2 = [
    ...doneHistory(t2[0].id, s2Start, 1, d[0].id),
    ...doneHistory(t2[1].id, s2Start, 2, d[1].id),
    ...doneHistory(t2[2].id, s2Start, 3, d[2].id),
    ...doneHistory(t2[3].id, s2Start, 5, d[1].id),
    ...doneHistory(t2[4].id, s2Start, 7, d[0].id),
    ...doneHistory(t2[5].id, s2Start, 9, d[3].id),
    ...doneHistory(t2[6].id, s2Start, 11, d[2].id),
    ...doneHistory(t2[7].id, s2Start, 14, d[3].id),
    ...doneHistory(t2[8].id, s2Start, 16, d[0].id),
    // Regression: t2[1] went back from in_review to in_progress
    {
      taskId: t2[1].id,
      changedBy: d[1].id,
      oldStatus: "in_review" as TS,
      newStatus: "in_progress" as TS,
      changedAt: daysFrom(s2Start, 5),
    },
    {
      taskId: t2[1].id,
      changedBy: d[1].id,
      oldStatus: "in_progress" as TS,
      newStatus: "in_review" as TS,
      changedAt: daysFrom(s2Start, 7),
    },
    {
      taskId: t2[1].id,
      changedBy: d[1].id,
      oldStatus: "in_review" as TS,
      newStatus: "done" as TS,
      changedAt: daysFrom(s2Start, 9),
    },
    // t2[9] in_review
    {
      taskId: t2[9].id,
      changedBy: d[1].id,
      oldStatus: "todo" as TS,
      newStatus: "in_progress" as TS,
      changedAt: daysFrom(s2Start, 18),
    },
    {
      taskId: t2[9].id,
      changedBy: d[1].id,
      oldStatus: "in_progress" as TS,
      newStatus: "in_review" as TS,
      changedAt: daysFrom(s2Start, 23),
    },
    // t2[10] in_review
    {
      taskId: t2[10].id,
      changedBy: d[2].id,
      oldStatus: "todo" as TS,
      newStatus: "in_progress" as TS,
      changedAt: daysFrom(s2Start, 20),
    },
    {
      taskId: t2[10].id,
      changedBy: d[2].id,
      oldStatus: "in_progress" as TS,
      newStatus: "in_review" as TS,
      changedAt: daysFrom(s2Start, 25),
    },
  ];

  // Sprint 3 done tasks (t3[0..3])
  const histS3 = [
    ...doneHistory(t3[0].id, s3Start, 1, d[0].id),
    ...doneHistory(t3[1].id, s3Start, 2, d[1].id),
    ...doneHistory(t3[2].id, s3Start, 3, d[0].id),
    ...doneHistory(t3[3].id, s3Start, 4, d[2].id),
    // t3[4] in_progress
    {
      taskId: t3[4].id,
      changedBy: d[3].id,
      oldStatus: "todo" as TS,
      newStatus: "in_progress" as TS,
      changedAt: daysFrom(s3Start, 3),
    },
    // t3[5] in_progress
    {
      taskId: t3[5].id,
      changedBy: d[1].id,
      oldStatus: "todo" as TS,
      newStatus: "in_progress" as TS,
      changedAt: daysFrom(s3Start, 4),
    },
    // t3[6] in_progress with regression
    {
      taskId: t3[6].id,
      changedBy: d[0].id,
      oldStatus: "todo" as TS,
      newStatus: "in_progress" as TS,
      changedAt: daysFrom(s3Start, 1),
    },
    {
      taskId: t3[6].id,
      changedBy: d[0].id,
      oldStatus: "in_progress" as TS,
      newStatus: "in_review" as TS,
      changedAt: daysFrom(s3Start, 3),
    },
    {
      taskId: t3[6].id,
      changedBy: d[0].id,
      oldStatus: "in_review" as TS,
      newStatus: "in_progress" as TS,
      changedAt: daysFrom(s3Start, 5),
    },
    // t3[7] in_review
    {
      taskId: t3[7].id,
      changedBy: d[2].id,
      oldStatus: "todo" as TS,
      newStatus: "in_progress" as TS,
      changedAt: daysFrom(s3Start, 2),
    },
    {
      taskId: t3[7].id,
      changedBy: d[2].id,
      oldStatus: "in_progress" as TS,
      newStatus: "in_review" as TS,
      changedAt: daysFrom(s3Start, 5),
    },
    // t3[8] in_review
    {
      taskId: t3[8].id,
      changedBy: d[3].id,
      oldStatus: "todo" as TS,
      newStatus: "in_progress" as TS,
      changedAt: daysFrom(s3Start, 3),
    },
    {
      taskId: t3[8].id,
      changedBy: d[3].id,
      oldStatus: "in_progress" as TS,
      newStatus: "in_review" as TS,
      changedAt: daysFrom(s3Start, 6),
    },
    // t3[9] in_review
    {
      taskId: t3[9].id,
      changedBy: d[1].id,
      oldStatus: "todo" as TS,
      newStatus: "in_progress" as TS,
      changedAt: daysFrom(s3Start, 4),
    },
    {
      taskId: t3[9].id,
      changedBy: d[1].id,
      oldStatus: "in_progress" as TS,
      newStatus: "in_review" as TS,
      changedAt: daysFrom(s3Start, 6),
    },
  ];

  await prisma.taskHistory.createMany({
    data: [...histS1, ...histS2, ...histS3],
  });

  // ── Comments ───────────────────────────────────────────────────────────────

  await prisma.taskComment.createMany({
    data: [
      // t1[0] CI/CD
      {
        taskId: t1[0].id,
        authorId: d[0].id,
        body: "Використовую GitHub Actions. Налаштував два пайплайни: lint+build для PR і deploy для main.",
        createdAt: daysFrom(s1Start, 2),
      },
      {
        taskId: t1[0].id,
        authorId: adminUser.id,
        body: "Добре, додай також крок для запуску тестів перед деплоєм.",
        createdAt: daysFrom(s1Start, 3),
      },
      // t1[1] JWT
      {
        taskId: t1[1].id,
        authorId: d[1].id,
        body: "Access token — 15 хв, refresh — 7 днів. Зберігаємо refresh у httpOnly cookie.",
        createdAt: daysFrom(s1Start, 2),
      },
      {
        taskId: t1[1].id,
        authorId: adminUser.id,
        body: "Чудово. Не забудь ендпоінт для відкликання токена.",
        createdAt: daysFrom(s1Start, 3),
      },
      {
        taskId: t1[1].id,
        authorId: d[1].id,
        body: "Зроблено. Також додав middleware для перевірки ролей.",
        createdAt: daysFrom(s1Start, 5),
      },
      // t1[8] Swagger (in_review)
      {
        taskId: t1[8].id,
        authorId: d[0].id,
        body: "Покрив усі ендпоінти /auth та /users. Працюю над /projects.",
        createdAt: daysFrom(s1Start, 20),
      },
      {
        taskId: t1[8].id,
        authorId: adminUser.id,
        body: "Перевірив — виглядає добре. Допиши приклади відповідей для помилок.",
        createdAt: daysFrom(s1Start, 22),
      },
      // t2[1] CRUD tasks (had regression)
      {
        taskId: t2[1].id,
        authorId: d[1].id,
        body: "Базовий CRUD готовий. Починаю з фронтом.",
        createdAt: daysFrom(s2Start, 3),
      },
      {
        taskId: t2[1].id,
        authorId: d[2].id,
        body: "На код-рев'ю: у DELETE не перевіряється чи задача належить проекту поточного користувача. Треба виправити.",
        createdAt: daysFrom(s2Start, 5),
      },
      {
        taskId: t2[1].id,
        authorId: d[1].id,
        body: "Виправив перевірку прав доступу і додав відповідні тести. Відправляю на повторне ревью.",
        createdAt: daysFrom(s2Start, 7),
      },
      {
        taskId: t2[1].id,
        authorId: adminUser.id,
        body: "Затверджено. Гарна знахідка, Марино.",
        createdAt: daysFrom(s2Start, 9),
      },
      // t2[11] Email blocked
      {
        taskId: t2[11].id,
        authorId: d[3].id,
        body: "Заблоковано: корпоративний SMTP сервер потребує білого списку IP, але DevOps ще не надав доступ.",
        createdAt: daysFrom(s2Start, 8),
      },
      {
        taskId: t2[11].id,
        authorId: adminUser.id,
        body: "Зрозуміло. Переносимо в наступний спринт, коли DevOps вирішить питання з мережею.",
        createdAt: daysFrom(s2Start, 9),
      },
      // t3[0] Analytics UI
      {
        taskId: t3[0].id,
        authorId: d[0].id,
        body: "Використовую recharts для графіків. Додав селектор спринтів і 4 KPI-картки.",
        createdAt: daysFrom(s3Start, 1),
      },
      {
        taskId: t3[0].id,
        authorId: createdUsers[0].id,
        body: "Виглядає відповідно до дизайну. Затверджую.",
        createdAt: daysFrom(s3Start, 3),
      },
      // t3[3] PDF report
      {
        taskId: t3[3].id,
        authorId: d[2].id,
        body: "Обрав @react-pdf/renderer. Стандартні chart-бібліотеки не сумісні з їхнім рендерером, тому малюю графіки через SVG-примітиви.",
        createdAt: daysFrom(s3Start, 2),
      },
      {
        taskId: t3[3].id,
        authorId: adminUser.id,
        body: "Розумне рішення. Скільки секцій у звіті?",
        createdAt: daysFrom(s3Start, 3),
      },
      {
        taskId: t3[3].id,
        authorId: d[2].id,
        body: "П'ять: продуктивність спринту, команда, якість, прогрес проекту і реліз. Готово, перевіряй.",
        createdAt: daysFrom(s3Start, 5),
      },
      {
        taskId: t3[3].id,
        authorId: createdUsers[0].id,
        body: "PDF виглядає чудово. Merge!",
        createdAt: daysFrom(s3Start, 6),
      },
      // t3[6] Releases UI (in_progress, had regression)
      {
        taskId: t3[6].id,
        authorId: d[0].id,
        body: "Сторінку деталей зроблено. Застрягнув на логіці прив'язки релізу до спринту.",
        createdAt: daysFrom(s3Start, 4),
      },
      {
        taskId: t3[6].id,
        authorId: d[1].id,
        body: "Подивився код — здається, проблема в тому що sprint_id у releases унікальний, але форма це не валідує. Можу допомогти.",
        createdAt: daysFrom(s3Start, 5),
      },
      // t3[8] E2E tests (in_review)
      {
        taskId: t3[8].id,
        authorId: d[3].id,
        body: "Покрив сценарії: логін, створення проекту, спринту та задачі. Тест на аналітику пропускаю поки немає даних.",
        createdAt: daysFrom(s3Start, 5),
      },
      {
        taskId: t3[8].id,
        authorId: createdUsers[0].id,
        body: "Прийнятно для цього спринту. Залиш TODO для аналітики.",
        createdAt: daysFrom(s3Start, 6),
      },
      // t3[13] Slack blocked
      {
        taskId: t3[13].id,
        authorId: d[1].id,
        body: "Заблоковано: потрібен Slack App token. Очікую відповіді від адміністратора воркспейсу.",
        createdAt: daysFrom(s3Start, 2),
      },
    ],
  });

  // ── Release for Sprint 1 ───────────────────────────────────────────────────

  await prisma.release.create({
    data: {
      projectId: project.id,
      sprintId: sprint1.id,
      version: "1.0.0",
      name: "Foundation Release",
      releaseDate: s1End,
      notes: "Перший реліз: авторизація, схема БД, базовий API та UI.",
      status: "completed",
    },
  });

  return {
    users: createdUsers.length,
    sprints: 3,
    tasks: t1.length + t2.length + t3.length,
  };
}
