import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaClient, RoleCode } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient();

const roleRows: { code: RoleCode; labelKk: string; labelRu: string }[] = [
  { code: 'DEFECTOLOGIST', labelKk: 'Дефектолог', labelRu: 'Дефектолог' },
  { code: 'SUBJECT_TEACHER', labelKk: 'Пән оқытушысы', labelRu: 'Предметный преподаватель' },
  { code: 'PSYCHOLOGIST', labelKk: 'Педагог-психолог', labelRu: 'Педагог-психолог' },
  { code: 'SOCIAL_PEDAGOG', labelKk: 'Әлеуметтік педагог', labelRu: 'Социальный педагог' },
  { code: 'ADMINISTRATOR', labelKk: 'Әкімшілік', labelRu: 'Администрация' },
];

async function getOrCreateDemoUser(institutionId: string, login: string, displayName: string, roleCode: RoleCode, password: string) {
  const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await prisma.user.upsert({
    where: { institutionId_login: { institutionId, login } },
    update: { displayName, status: 'ACTIVE', passwordHash },
    create: { institutionId, login, displayName, passwordHash },
  });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: role.id } }, update: {}, create: { userId: user.id, roleId: role.id } });
  return user;
}

async function main() {
  const localDemoMode = process.env.NODE_ENV === 'development';
  for (const role of roleRows) await prisma.role.upsert({ where: { code: role.code }, update: { labelKk: role.labelKk, labelRu: role.labelRu }, create: role });

  const institutionCode = process.env.BOOTSTRAP_INSTITUTION_CODE ?? 'ZPC-01';
  const institution = await prisma.institution.upsert({
    where: { code: institutionCode },
    update: { name: process.env.BOOTSTRAP_INSTITUTION_NAME ?? 'Жетісу политехникалық колледжі' },
    create: { code: institutionCode, name: process.env.BOOTSTRAP_INSTITUTION_NAME ?? 'Жетісу политехникалық колледжі', timezone: 'Asia/Almaty' },
  });

  const adminLogin = process.env.BOOTSTRAP_ADMIN_LOGIN ?? 'admin';
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? (localDemoMode ? 'TenQadamAdmin2026!' : '');
  if (!adminPassword || adminPassword.startsWith('REPLACE_') || adminPassword.length < 16) {
    throw new Error('Set BOOTSTRAP_ADMIN_PASSWORD to a unique password of at least 16 characters before seeding.');
  }
  await getOrCreateDemoUser(institution.id, adminLogin, 'Администратор учреждения', 'ADMINISTRATOR', adminPassword);

  if (!localDemoMode) {
    console.log(`Seeded TEN QADAM roles, institution ${institution.code}, and the configured administrator. Synthetic student records are disabled outside NODE_ENV=development.`);
    return;
  }

  const specialty = await prisma.specialty.upsert({
    where: { institutionId_code: { institutionId: institution.id, code: 'ЭЖ' } },
    update: { nameKk: 'Электрмен жабдықтау', nameRu: 'Электроснабжение' },
    create: { institutionId: institution.id, code: 'ЭЖ', nameKk: 'Электрмен жабдықтау', nameRu: 'Электроснабжение' },
  });
  const group = await prisma.studyGroup.upsert({
    where: { institutionId_code_academicYear: { institutionId: institution.id, code: '3С-24', academicYear: '2026-2027' } },
    update: { specialtyId: specialty.id },
    create: { institutionId: institution.id, specialtyId: specialty.id, code: '3С-24', academicYear: '2026-2027' },
  });
  const subject = await prisma.subject.upsert({
    where: { institutionId_code: { institutionId: institution.id, code: 'PRACTICE' } },
    update: { nameKk: 'Кәсіптік практика', nameRu: 'Профессиональная практика' },
    create: { institutionId: institution.id, code: 'PRACTICE', nameKk: 'Кәсіптік практика', nameRu: 'Профессиональная практика' },
  });
  const demoStudent = await prisma.student.upsert({
    where: { institutionId_studentCode: { institutionId: institution.id, studentCode: 'DEMO-ЭС-24-01' } },
    update: { fullName: 'Серік Әлихан', groupId: group.id, status: 'ACTIVE' },
    create: { institutionId: institution.id, studentCode: 'DEMO-ЭС-24-01', fullName: 'Серік Әлихан', groupId: group.id },
  });

  const demoAccounts = [
    { login: 'demo-defectologist', name: 'Демо · Дефектолог', role: 'DEFECTOLOGIST' as const, password: 'Defectolog2026!!' },
    { login: 'demo-teacher', name: 'Демо · Предметный преподаватель', role: 'SUBJECT_TEACHER' as const, password: 'Teacher2026Pass!' },
    { login: 'demo-psychologist', name: 'Демо · Педагог-психолог', role: 'PSYCHOLOGIST' as const, password: 'Psychologist2026!' },
    { login: 'demo-social', name: 'Демо · Социальный педагог', role: 'SOCIAL_PEDAGOG' as const, password: 'SocialPed2026Pass!' },
  ];
  const demoUsers = await Promise.all(demoAccounts.map((account) => getOrCreateDemoUser(institution.id, account.login, account.name, account.role, account.password)));
  for (const user of demoUsers) {
    await prisma.userStudentAssignment.upsert({
      where: { id: `${user.id.slice(0, 8)}-${demoStudent.id.slice(0, 8)}-demo` },
      update: { validUntil: null },
      create: { id: `${user.id.slice(0, 8)}-${demoStudent.id.slice(0, 8)}-demo`, institutionId: institution.id, userId: user.id, studentId: demoStudent.id, subjectId: user.login === 'demo-teacher' ? subject.id : null, assignedById: user.id },
    });
  }

  const goal = await prisma.learningGoal.findFirst({ where: { institutionId: institution.id, studentId: demoStudent.id, titleKk: 'Шартты белгілерді тану' } });
  const learningGoal = goal ?? await prisma.learningGoal.create({ data: {
    institutionId: institution.id, studentId: demoStudent.id, subjectId: subject.id,
    ownerId: (await prisma.user.findFirstOrThrow({ where: { institutionId: institution.id, login: adminLogin } })).id,
    titleKk: 'Шартты белгілерді тану', titleRu: 'Распознавание условных обозначений',
    successCriteria: 'Оқу схемасындағы шартты белгілерді атайды және сәйкестендіреді.', status: 'ACTIVE',
  } });

  const defectologist = await prisma.user.findFirst({ where: { institutionId: institution.id, login: 'demo-defectologist' } });
  const teacher = await prisma.user.findFirst({ where: { institutionId: institution.id, login: 'demo-teacher' } });
  if (defectologist && teacher) {
    let plan = await prisma.supportPlan.findFirst({ where: { institutionId: institution.id, studentId: demoStudent.id, title: 'Қолдау жоспары · DEMO' } });
    if (!plan) plan = await prisma.supportPlan.create({ data: { institutionId: institution.id, studentId: demoStudent.id, createdById: defectologist.id, title: 'Қолдау жоспары · DEMO', periodStart: new Date('2026-11-01T00:00:00Z'), periodEnd: new Date('2026-12-31T00:00:00Z') } });
    if ((await prisma.supportPlanAction.count({ where: { planId: plan.id } })) === 0) {
      await prisma.supportPlanAction.createMany({ data: [
        { planId: plan.id, goalId: learningGoal.id, responsibleId: teacher.id, titleKk: 'Практикалық тапсырманы 3 қадамға бөлу', titleRu: 'Разделить практическое задание на 3 шага', status: 'COMPLETED', completedAt: new Date('2026-11-18T10:00:00Z') },
        { planId: plan.id, goalId: learningGoal.id, responsibleId: defectologist.id, titleKk: 'Шартты белгілер карточкаларын дайындау', titleRu: 'Подготовить карточки с условными обозначениями', status: 'IN_PROGRESS', dueAt: new Date('2026-11-23T00:00:00Z') },
        { planId: plan.id, goalId: learningGoal.id, responsibleId: teacher.id, titleKk: 'Қайта бағалау өткізу', titleRu: 'Провести повторную оценку', status: 'PLANNED', dueAt: new Date('2026-11-26T00:00:00Z') },
      ] });
    }

    if ((await prisma.assessmentSession.count({ where: { institutionId: institution.id, goalId: learningGoal.id } })) === 0) {
      await prisma.assessmentSession.create({ data: { institutionId: institution.id, studentId: demoStudent.id, goalId: learningGoal.id, assessorId: teacher.id, kind: 'BASELINE', assessedAt: new Date('2026-11-10T00:00:00Z'), results: { create: [{ criterion: 'Түсіну', score: 40 }, { criterion: 'Орындау', score: 35 }, { criterion: 'Дербестік', score: 25 }, { criterion: 'Қатысу', score: 50 }] } } });
      await prisma.assessmentSession.create({ data: { institutionId: institution.id, studentId: demoStudent.id, goalId: learningGoal.id, assessorId: teacher.id, kind: 'REASSESSMENT', assessedAt: new Date('2026-11-18T00:00:00Z'), results: { create: [{ criterion: 'Түсіну', score: 70 }, { criterion: 'Орындау', score: 65 }, { criterion: 'Дербестік', score: 55 }, { criterion: 'Қатысу', score: 80 }] } } });
    }
    if ((await prisma.recommendation.count({ where: { institutionId: institution.id, studentId: demoStudent.id } })) === 0) {
      await prisma.recommendation.create({ data: { institutionId: institution.id, studentId: demoStudent.id, goalId: learningGoal.id, authorId: defectologist.id, domain: 'DEFECTOLOGIST', title: 'Тапсырманы кезеңдерге бөлу', content: 'Әр кезеңге жеке нұсқаулық беріп, визуалды тіректер қолданыңыз.', status: 'IN_PROGRESS', applications: { create: { institutionId: institution.id, appliedById: teacher.id, appliedAt: new Date('2026-11-18T09:00:00Z'), outcome: 'Демо-сценарийде қолданылды' } } } });
    }
    let thread = await prisma.collaborationThread.findFirst({ where: { institutionId: institution.id, studentId: demoStudent.id, title: 'Консилиум · DEMO' } });
    if (!thread) {
      const psychologist = await prisma.user.findFirst({ where: { institutionId: institution.id, login: 'demo-psychologist' } });
      const social = await prisma.user.findFirst({ where: { institutionId: institution.id, login: 'demo-social' } });
      const members = [defectologist, teacher, psychologist, social].filter((item): item is NonNullable<typeof item> => Boolean(item));
      thread = await prisma.collaborationThread.create({ data: { institutionId: institution.id, studentId: demoStudent.id, title: 'Консилиум · DEMO', members: { create: members.map((member) => ({ userId: member.id })) }, messages: { create: { authorId: teacher.id, body: 'Демо-сценарий: требуется визуальная инструкция и деление задания на шаги.', createdAt: new Date('2026-11-18T10:24:00Z') } } } });
    }
  }

  console.log(`Seeded TEN QADAM for institution ${institution.code} with fictional demonstration records.`);
  console.log(`Development-only users: admin / ${adminPassword}; demo-defectologist / Defectolog2026!!; demo-teacher / Teacher2026Pass!; demo-psychologist / Psychologist2026!; demo-social / SocialPed2026Pass!`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
