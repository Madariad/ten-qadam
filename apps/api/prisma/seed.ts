import 'dotenv/config';
import * as argon2 from 'argon2';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient, RoleCode } from '../src/generated/prisma/client.js';
import { resolveDbConfig } from '../src/prisma/prisma.service.js';

const dbConfig = resolveDbConfig();
const adapter = new PrismaMariaDb({
  ...dbConfig,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});
const prisma = new PrismaClient({ adapter });

const roleRows: { code: RoleCode; labelKk: string; labelRu: string }[] = [
  { code: 'DEFECTOLOGIST', labelKk: 'Дефектолог', labelRu: 'Дефектолог' },
  { code: 'SUBJECT_TEACHER', labelKk: 'Пән оқытушысы', labelRu: 'Предметный преподаватель' },
  { code: 'PSYCHOLOGIST', labelKk: 'Педагог-психолог', labelRu: 'Педагог-психолог' },
  { code: 'SOCIAL_PEDAGOG', labelKk: 'Әлеуметтік педагог', labelRu: 'Социальный педагог' },
  { code: 'ADMINISTRATOR', labelKk: 'Әкімшілік', labelRu: 'Администрация' },
];

function generateMinimalPdf(titleAscii: string, linesAscii: string[]): Buffer {
  const safe = (str: string) => str.replace(/[()\\]/g, '');
  const contentCommands = [
    'BT',
    '/F1 18 Tf',
    '50 770 Td',
    `(${safe(titleAscii)}) Tj`,
    '/F1 11 Tf',
    '0 -28 Td',
    ...linesAscii.flatMap((line) => [`(${safe(line)}) Tj`, '0 -18 Td']),
    'ET',
  ].join('\n');

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 595 842] /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${Buffer.byteLength(contentCommands, 'utf8')} >>\nstream\n${contentCommands}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }
  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

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
  const localDemoMode = process.env.NODE_ENV !== 'production' || process.env.SEED_DEMO_DATA !== 'false';
  for (const role of roleRows) await prisma.role.upsert({ where: { code: role.code }, update: { labelKk: role.labelKk, labelRu: role.labelRu }, create: role });

  const institutionCode = process.env.BOOTSTRAP_INSTITUTION_CODE ?? 'ZPC-01';
  const institution = await prisma.institution.upsert({
    where: { code: institutionCode },
    update: { name: process.env.BOOTSTRAP_INSTITUTION_NAME ?? 'Талдықорған жоғары политехникалық колледжі' },
    create: { code: institutionCode, name: process.env.BOOTSTRAP_INSTITUTION_NAME ?? 'Талдықорған жоғары политехникалық колледжі', timezone: 'Asia/Almaty' },
  });

  const adminLogin = process.env.BOOTSTRAP_ADMIN_LOGIN ?? 'admin';
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'TenQadamAdmin2026!';
  if (!adminPassword || adminPassword.startsWith('REPLACE_') || adminPassword.length < 16) {
    throw new Error('Set BOOTSTRAP_ADMIN_PASSWORD to a unique password of at least 16 characters before seeding.');
  }
  const adminUser = await getOrCreateDemoUser(institution.id, adminLogin, 'Администратор учреждения', 'ADMINISTRATOR', adminPassword);

  if (!localDemoMode) {
    console.log(`Seeded TEN QADAM roles, institution ${institution.code}, and the configured administrator. Synthetic student records are disabled outside NODE_ENV=development.`);
    return;
  }

  const specialty = await prisma.specialty.upsert({
    where: { institutionId_code: { institutionId: institution.id, code: 'ЭЖ' } },
    update: { nameKk: 'Электрмен жабдықтау', nameRu: 'Электроснабжение' },
    create: { institutionId: institution.id, code: 'ЭЖ', nameKk: 'Электрмен жабдықтау', nameRu: 'Электроснабжение' },
  });
  const specialty2 = await prisma.specialty.upsert({
    where: { institutionId_code: { institutionId: institution.id, code: 'ТП' } },
    update: { nameKk: 'Техникалық қызмет көрсету', nameRu: 'Техническое обслуживание' },
    create: { institutionId: institution.id, code: 'ТП', nameKk: 'Техникалық қызмет көрсету', nameRu: 'Техническое обслуживание' },
  });
  const group = await prisma.studyGroup.upsert({
    where: { institutionId_code_academicYear: { institutionId: institution.id, code: '3С-24', academicYear: '2026-2027' } },
    update: { specialtyId: specialty.id },
    create: { institutionId: institution.id, specialtyId: specialty.id, code: '3С-24', academicYear: '2026-2027' },
  });
  const group2 = await prisma.studyGroup.upsert({
    where: { institutionId_code_academicYear: { institutionId: institution.id, code: '2ТП-24', academicYear: '2026-2027' } },
    update: { specialtyId: specialty2.id },
    create: { institutionId: institution.id, specialtyId: specialty2.id, code: '2ТП-24', academicYear: '2026-2027' },
  });
  const subject = await prisma.subject.upsert({
    where: { institutionId_code: { institutionId: institution.id, code: 'PRACTICE' } },
    update: { nameKk: 'Кәсіптік практика (Электртехника)', nameRu: 'Профессиональная практика (Электротехника)' },
    create: { institutionId: institution.id, code: 'PRACTICE', nameKk: 'Кәсіптік практика (Электртехника)', nameRu: 'Профессиональная практика (Электротехника)' },
  });
  await prisma.subject.upsert({
    where: { institutionId_code: { institutionId: institution.id, code: 'AUTOMATION' } },
    update: { nameKk: 'Автоматика негіздері', nameRu: 'Основы автоматики' },
    create: { institutionId: institution.id, code: 'AUTOMATION', nameKk: 'Автоматика негіздері', nameRu: 'Основы автоматики' },
  });

  const demoStudent = await prisma.student.upsert({
    where: { institutionId_studentCode: { institutionId: institution.id, studentCode: 'DEMO-ЭС-24-01' } },
    update: { fullName: 'Серік Әлихан', groupId: group.id, status: 'ACTIVE', studentCode: 'ЭС-24-01' },
    create: { institutionId: institution.id, studentCode: 'ЭС-24-01', fullName: 'Серік Әлихан', groupId: group.id },
  }).catch(() => prisma.student.upsert({
    where: { institutionId_studentCode: { institutionId: institution.id, studentCode: 'ЭС-24-01' } },
    update: { fullName: 'Серік Әлихан', groupId: group.id, status: 'ACTIVE' },
    create: { institutionId: institution.id, studentCode: 'ЭС-24-01', fullName: 'Серік Әлихан', groupId: group.id },
  }));
  const demoStudent2 = await prisma.student.upsert({
    where: { institutionId_studentCode: { institutionId: institution.id, studentCode: 'DEMO-ТП-24-02' } },
    update: { fullName: 'Айдана Марат', groupId: group2.id, status: 'ACTIVE', studentCode: 'ТП-24-02' },
    create: { institutionId: institution.id, studentCode: 'ТП-24-02', fullName: 'Айдана Марат', groupId: group2.id },
  }).catch(() => prisma.student.upsert({
    where: { institutionId_studentCode: { institutionId: institution.id, studentCode: 'ТП-24-02' } },
    update: { fullName: 'Айдана Марат', groupId: group2.id, status: 'ACTIVE' },
    create: { institutionId: institution.id, studentCode: 'ТП-24-02', fullName: 'Айдана Марат', groupId: group2.id },
  }));

  const demoAccounts = [
    { login: 'demo-defectologist', name: 'Оспанова М.Қ.', role: 'DEFECTOLOGIST' as const, password: 'Defectolog2026!!' },
    { login: 'demo-teacher', name: 'Айдарова А.С.', role: 'SUBJECT_TEACHER' as const, password: 'Teacher2026Pass!' },
    { login: 'demo-psychologist', name: 'Нұрғалиева Д.Т.', role: 'PSYCHOLOGIST' as const, password: 'Psychologist2026!' },
    { login: 'demo-social', name: 'Қасымова Г.Е.', role: 'SOCIAL_PEDAGOG' as const, password: 'SocialPed2026Pass!' },
  ];
  const demoUsers = await Promise.all(demoAccounts.map((account) => getOrCreateDemoUser(institution.id, account.login, account.name, account.role, account.password)));
  for (const user of demoUsers) {
    await prisma.userStudentAssignment.upsert({
      where: { id: `${user.id.slice(0, 8)}-${demoStudent.id.slice(0, 8)}-demo` },
      update: { validUntil: null },
      create: { id: `${user.id.slice(0, 8)}-${demoStudent.id.slice(0, 8)}-demo`, institutionId: institution.id, userId: user.id, studentId: demoStudent.id, subjectId: user.login === 'demo-teacher' ? subject.id : null, assignedById: user.id },
    });
    if (user.login !== 'demo-teacher') {
      await prisma.userStudentAssignment.upsert({
        where: { id: `${user.id.slice(0, 8)}-${demoStudent2.id.slice(0, 8)}-demo2` },
        update: { validUntil: null },
        create: { id: `${user.id.slice(0, 8)}-${demoStudent2.id.slice(0, 8)}-demo2`, institutionId: institution.id, userId: user.id, studentId: demoStudent2.id, subjectId: null, assignedById: user.id },
      });
    }
  }

  const defectologist = await prisma.user.findFirst({ where: { institutionId: institution.id, login: 'demo-defectologist' } });
  const teacher = await prisma.user.findFirst({ where: { institutionId: institution.id, login: 'demo-teacher' } });
  const psychologist = await prisma.user.findFirst({ where: { institutionId: institution.id, login: 'demo-psychologist' } });
  const social = await prisma.user.findFirst({ where: { institutionId: institution.id, login: 'demo-social' } });

  if (defectologist && teacher && psychologist && social) {
    if ((await prisma.studentSupportProfile.count({ where: { institutionId: institution.id, studentId: demoStudent.id } })) === 0) {
      await prisma.studentSupportProfile.createMany({
        data: [
          { institutionId: institution.id, studentId: demoStudent.id, createdById: defectologist.id, category: 'PEDAGOGICAL', description: 'Оқу материалын визуалды қолдаумен ұсыну, электр сұлбаларын оқу тапсырмаларын 3 шағын кезеңге бөлу.' },
          { institutionId: institution.id, studentId: demoStudent.id, createdById: psychologist.id, category: 'PSYCHOLOGICAL', description: 'Практикалық жұмыс алдындағы мазасыздықты төмендету және оқу мотивациясын қолдау.' },
          { institutionId: institution.id, studentId: demoStudent.id, createdById: social.id, category: 'SOCIAL', description: 'Оқу кестесі мен колледж ішіндегі бейімделу шараларын үйлестіру.' },
        ],
      });
    }

    const goal = await prisma.learningGoal.findFirst({ where: { institutionId: institution.id, studentId: demoStudent.id, titleKk: 'Шартты белгілерді тану' } });
    const learningGoal = goal ?? await prisma.learningGoal.create({
      data: {
        institutionId: institution.id,
        studentId: demoStudent.id,
        subjectId: subject.id,
        ownerId: defectologist.id,
        titleKk: 'Шартты белгілерді тану',
        titleRu: 'Распознавание условных обозначений',
        successCriteria: 'Оқу схемасындағы шартты белгілерді атайды және сәйкестендіреді.',
        status: 'ACTIVE',
      },
    });

    if ((await prisma.observation.count({ where: { institutionId: institution.id, studentId: demoStudent.id } })) === 0) {
      await prisma.observation.create({
        data: {
          institutionId: institution.id,
          studentId: demoStudent.id,
          goalId: learningGoal.id,
          subjectId: subject.id,
          authorId: teacher.id,
          observedAt: new Date('2026-11-16T09:30:00Z'),
          context: 'Электртехника сабағы · Электр сұлбасын оқу',
          observationText: 'Студент электр схемасын тұтас оқу тапсырмасында қиналады, шартты белгілерді шатастырады. Кезеңдік тірек қажет.',
        },
      });
    }

    await prisma.supportPlan.updateMany({
      where: { institutionId: institution.id, studentId: demoStudent.id, title: 'Қолдау жоспары · DEMO' },
      data: { title: 'Жеке қолдау жоспары · 2026–2027' },
    });
    let plan = await prisma.supportPlan.findFirst({ where: { institutionId: institution.id, studentId: demoStudent.id } });
    if (!plan) {
      plan = await prisma.supportPlan.create({
        data: {
          institutionId: institution.id,
          studentId: demoStudent.id,
          createdById: defectologist.id,
          title: 'Жеке қолдау жоспары · 2026–2027',
          periodStart: new Date('2026-11-01T00:00:00Z'),
          periodEnd: new Date('2026-12-31T00:00:00Z'),
        },
      });
    }
    if ((await prisma.supportPlanAction.count({ where: { planId: plan.id } })) === 0) {
      await prisma.supportPlanAction.createMany({
        data: [
          { planId: plan.id, goalId: learningGoal.id, responsibleId: teacher.id, titleKk: 'Практикалық тапсырманы 3 қадамға бөлу', titleRu: 'Разделить практическое задание на 3 шага', status: 'COMPLETED', completedAt: new Date('2026-11-18T10:00:00Z'), dueAt: new Date('2026-11-20T00:00:00Z') },
          { planId: plan.id, goalId: learningGoal.id, responsibleId: defectologist.id, titleKk: 'Шартты белгілер карточкаларын дайындау', titleRu: 'Подготовить карточки с условными обозначениями', status: 'IN_PROGRESS', dueAt: new Date('2026-11-23T00:00:00Z') },
          { planId: plan.id, goalId: learningGoal.id, responsibleId: teacher.id, titleKk: 'Қайта бағалау өткізу', titleRu: 'Провести повторную оценку', status: 'PLANNED', dueAt: new Date('2026-11-26T00:00:00Z') },
          { planId: plan.id, goalId: null, responsibleId: psychologist.id, titleKk: 'Оқу мотивациясына қысқа тренинг', titleRu: 'Короткий тренинг учебной мотивации', status: 'PLANNED', dueAt: new Date('2026-11-27T00:00:00Z') },
        ],
      });
    }

    if ((await prisma.assessmentSession.count({ where: { institutionId: institution.id, goalId: learningGoal.id } })) === 0) {
      await prisma.assessmentSession.create({ data: { institutionId: institution.id, studentId: demoStudent.id, goalId: learningGoal.id, assessorId: teacher.id, kind: 'BASELINE', assessedAt: new Date('2026-11-10T00:00:00Z'), results: { create: [{ criterion: 'Түсіну', score: 40 }, { criterion: 'Орындау', score: 35 }, { criterion: 'Дербестік', score: 25 }, { criterion: 'Қатысу', score: 50 }] } } });
      await prisma.assessmentSession.create({ data: { institutionId: institution.id, studentId: demoStudent.id, goalId: learningGoal.id, assessorId: teacher.id, kind: 'REASSESSMENT', assessedAt: new Date('2026-11-18T00:00:00Z'), results: { create: [{ criterion: 'Түсіну', score: 70 }, { criterion: 'Орындау', score: 65 }, { criterion: 'Дербестік', score: 55 }, { criterion: 'Қатысу', score: 80 }] } } });
    }
    if ((await prisma.recommendation.count({ where: { institutionId: institution.id, studentId: demoStudent.id } })) === 0) {
      await prisma.recommendation.create({
        data: {
          institutionId: institution.id,
          studentId: demoStudent.id,
          goalId: learningGoal.id,
          authorId: defectologist.id,
          domain: 'DEFECTOLOGIST',
          title: 'Тапсырманы кезеңдерге бөлу және ірілендірілген карточкалар',
          content: '1-қадам: шартты белгі мен атауды сәйкестендіру. 2-қадам: тізбектегі элементті табу. 3-қадам: қарапайым электр сұлбасын оқу.',
          status: 'COMPLETED',
          applications: { create: { institutionId: institution.id, appliedById: teacher.id, appliedAt: new Date('2026-11-18T09:00:00Z'), outcome: 'Сабақта ірілендірілген карточкалар қолданылды, студент 3 кезеңді орындады.' } },
        },
      });
    }
    if ((await prisma.specialistPrivateNote.count({ where: { institutionId: institution.id, studentId: demoStudent.id } })) === 0) {
      await prisma.specialistPrivateNote.create({
        data: {
          institutionId: institution.id,
          studentId: demoStudent.id,
          authorId: psychologist.id,
          domain: 'PSYCHOLOGIST',
          title: 'Психологиялық бақылау (құпия жазба)',
          content: 'Жеке кеңес қорытындысы: топтық жұмыста өзін сенімдірек ұстайды, уақыт шектеуі болмағанда тапсырманы толық аяқтайды.',
        },
      });
    }

    await prisma.collaborationThread.updateMany({
      where: { institutionId: institution.id, studentId: demoStudent.id, title: 'Консилиум · DEMO' },
      data: { title: 'Психологиялық-педагогикалық консилиум' },
    });
    let thread = await prisma.collaborationThread.findFirst({ where: { institutionId: institution.id, studentId: demoStudent.id } });
    if (!thread) {
      const members = [defectologist, teacher, psychologist, social];
      thread = await prisma.collaborationThread.create({
        data: {
          institutionId: institution.id,
          studentId: demoStudent.id,
          title: 'Психологиялық-педагогикалық консилиум',
          members: { create: members.map((member) => ({ userId: member.id })) },
          messages: {
            create: [
              { authorId: teacher.id, body: 'Электротехника сабағында студент электр схемасын оқу тапсырмасында қиналады.', createdAt: new Date('2026-11-18T10:24:00Z') },
              { authorId: defectologist.id, body: 'Тапсырманы шағын кезеңдерге бөлуді және ірілендірілген шартты белгілер карточкаларын ұсынамын.', createdAt: new Date('2026-11-18T11:02:00Z') },
              { authorId: psychologist.id, body: 'Мотивацияны қолдау бойынша қысқа тренинг жоспарға енгізілді.', createdAt: new Date('2026-11-18T11:15:00Z') },
            ],
          },
        },
      });
    }
  }

  // Seed default library items with real downloadable/viewable PDF & HTML/TXT files
  const storageDir = resolve(process.cwd(), 'storage', 'library');
  if (!existsSync(storageDir)) mkdirSync(storageDir, { recursive: true });

  const seedDocs = [
    {
      kind: 'NORMATIVE' as const,
      category: 'ҚР Бұйрықтары мен қағидалары',
      titleKk: 'Инклюзивті білім беруді ұйымдастыру қағидалары',
      titleRu: 'Правила организации инклюзивного образования в ТиПО',
      summaryKk: 'Техникалық және кәсіптік білім беру ұйымдарында ерекше білім беру қажеттіліктері бар студенттерді психологиялық-педагогикалық сүйемелдеу тәртібі мен нормативтік талаптар.',
      summaryRu: 'Нормативные требования и порядок психолого-педагогического сопровождения студентов с особыми образовательными потребностями в колледже.',
      fileName: 'Normative_Inclusive_Education_Rules_2026.pdf',
      pdfTitle: 'TEN QADAM - NORMATIVE DOCUMENT (2026)',
      pdfLines: [
        'Document: Rules for Inclusive Education in TVET Colleges',
        'Institution: Zhetysu Polytechnic College (ZPC-01)',
        '1. General Provisions and Role-Based Access Control',
        '2. Psychological and Pedagogical Accompaniment Cycle:',
        '   Observation -> Specialist Recommendation -> Adapted Task -> Reassessment',
        '3. Personal Data Protection: No diagnoses stored by default.',
        '4. Coordination of Defectologist, Teacher, Psychologist, Social Pedagogue.',
      ],
    },
    {
      kind: 'NORMATIVE' as const,
      category: 'Колледждің ішкі ережелері',
      titleKk: 'Психологиялық-педагогикалық консилиум туралы ереже',
      titleRu: 'Положение о психолого-педагогическом консилиуме колледжа',
      summaryKk: 'Мамандар консилиумының жұмыс регламенті, рөлдік жауапкершілік матрицасы және жеке деректерді қорғау талаптары.',
      summaryRu: 'Регламент работы консилиума специалистов, матрица ролевой ответственности и требования по защите персональных данных.',
      fileName: 'College_Consilium_Regulation.pdf',
      pdfTitle: 'TEN QADAM - COLLEGE CONSILIUM REGULATION',
      pdfLines: [
        'Internal Regulation on Specialist Consilium',
        'Roles covered:',
        '- Defectologist: Individual learning goals & task adaptation guidance',
        '- Subject Teacher: Classroom observations & adapted task application',
        '- Psychologist: Confidential psychological support & motivation',
        '- Social Pedagogue: Social adaptation & attendance support',
        '- Administration: Anonymized institution-wide monitoring metrics',
      ],
    },
    {
      kind: 'TEACHER_GUIDE' as const,
      category: 'Сабақты бейімдеу',
      titleKk: 'Практикалық тапсырманы шағын кезеңдерге бөлу нұсқаулығы',
      titleRu: 'Инструкция по делению практического задания на этапы',
      summaryKk: 'Электртехника және арнайы пәндерде күрделі практикалық жұмысты 3-4 нақты қадамға бөліп ұсыну және әр қадамның орындалуын тексеру әдістемесі.',
      summaryRu: 'Методика пошагового представления практических работ по электротехнике и спецдисциплинам с контролем каждого этапа.',
      fileName: 'Guide_Step_By_Step_Task_Adaptation.pdf',
      pdfTitle: 'TEACHER GUIDE: STEP-BY-STEP TASK ADAPTATION',
      pdfLines: [
        'Practical Guide for Subject Teachers',
        'Case Study: Reading Electrical Schematics in Electrotechnics',
        'Step 1: Match conditional graphic symbols with their names using cards.',
        'Step 2: Locate key elements on a simplified circuit fragment.',
        'Step 3: Trace the current path and assemble/verify the circuit.',
        'Assessment: Compare Baseline and Reassessment across 4 criteria:',
        'Understanding, Execution, Independence, Participation.',
      ],
    },
    {
      kind: 'TEACHER_GUIDE' as const,
      category: 'Әдістемелік ұсыным',
      titleKk: 'Визуалды тіректер мен баламалы бағалауды қолдану',
      titleRu: 'Использование визуальных опор и альтернативного оценивания',
      summaryKk: 'Ірілендірілген шартты белгілер карточкалары, алгоритмдік сызбалар және оқу мақсатына сәйкес баламалы бағалау тәсілдері.',
      summaryRu: 'Укрупнённые карточки условных обозначений, алгоритмические схемы и методы альтернативного оценивания по учебным целям.',
      fileName: 'Guide_Visual_Supports_And_Assessment.pdf',
      pdfTitle: 'TEACHER GUIDE: VISUAL SUPPORTS & ASSESSMENT',
      pdfLines: [
        'Visual Supports & Alternative Assessment in College',
        '1. Enlarged symbol cards with high contrast and clear labels.',
        '2. Visual step-by-step checklists at the student workstation.',
        '3. Criterion-based reassessment focused on specific learning goals.',
        'Note: Indicators measure goal progress, never medical diagnoses.',
      ],
    },
    {
      kind: 'METHODICAL' as const,
      category: 'Чек-парақ',
      titleKk: 'Бейімделген сабақ пен баламалы бағалау чек-парағы',
      titleRu: 'Чек-лист адаптированного занятия и альтернативного оценивания',
      summaryKk: 'Оқытушы мен дефектологке арналған сабақ алдындағы дайындық және оқу мақсатының орындалуын тексеру чек-парағы.',
      summaryRu: 'Чек-лист подготовки адаптированного занятия и проверки достижения индивидуальной учебной цели.',
      fileName: 'Checklist_Adapted_Lesson_2026.pdf',
      pdfTitle: 'METHODICAL BANK: ADAPTED LESSON CHECKLIST',
      pdfLines: [
        'Checklist for Adapted Practical Lesson (TEN QADAM)',
        '[x] Individual learning goal defined and linked to subject',
        '[x] Task divided into 3 manageable sequential steps',
        '[x] Visual reference cards prepared and provided',
        '[x] Baseline score recorded across 4 criteria',
        '[x] Reassessment scheduled and recorded after adaptation',
      ],
    },
    {
      kind: 'METHODICAL' as const,
      category: 'Оқу материалы',
      titleKk: 'Электр сұлбаларының шартты белгілері (бейімделген карточкалар үлгісі)',
      titleRu: 'Условные обозначения электрических схем (шаблон адаптированных карточек)',
      summaryKk: 'Электртехника сабағында қолдануға арналған ірілендірілген шартты белгілер мен кезеңдік тапсырма үлгісі.',
      summaryRu: 'Шаблон укрупнённых карточек условных обозначений и пошагового задания для занятий по электротехнике.',
      fileName: 'Template_Electrical_Symbols_Cards.pdf',
      pdfTitle: 'METHODICAL TEMPLATE: ELECTRICAL SYMBOLS CARDS',
      pdfLines: [
        'Adapted Task Template: Electrical Symbols Recognition',
        'Card 1: Resistor (R) - Limits electric current in a circuit',
        'Card 2: Capacitor (C) - Stores electrical energy in an electric field',
        'Card 3: Switch (S) - Opens or closes the electrical circuit',
        'Card 4: Power Source (G/U) - Supplies electromotive force',
        'Student Task: Match each symbol card to the schematic diagram.',
      ],
    },
    {
      kind: 'METHODICAL' as const,
      category: 'ЕББҚ · Көру қабілеті бұзылған (Нашар көретіндер) | І, ІІ, ІІІ дәреже',
      titleKk: 'Көру қабілеті бұзылған студенттердің ерекшеліктері (І, ІІ, ІІІ дәреже)',
      titleRu: 'Особенности обучения слабовидящих студентов по степеням (I, II, III степень)',
      summaryKk: 'І дәреже (жеңіл): алдыңғы парта (1–2 қатар), шрифт 14–16 pt, қосымша жарық (500 лк). ІІ дәреже (орташа): шрифт 18–20 pt, жоғары контрастты сызбалар (қара/сары, ақ/қара), үлкейткіш лупа және экран дикторы. ІІІ дәреже (ауыр): аудио-дәрістер, Брайль немесе тактильді-бедерлі электр сұлбалары, жазбаша жұмыс уақытын 1,5 есе ұзарту, әр 20 минут сайын көзге демалыс беру.',
      summaryRu: 'I степень (лёгкая): посадка на 1–2 ряду у окна, шрифт 14–16 pt, хорошее освещение. II степень (средняя): шрифт 18–20 pt без засечек, высококонтрастные схемы и чертежи, экранная лупа. III степень (тяжёлая): аудиосопровождение лекций, тактильно-рельефные схемы, увеличение времени на лабораторные и контрольные работы в 1,5 раза, зрительная гимнастика каждые 20 минут.',
      fileName: 'EBBK_Visual_Impairment_Degrees_Guide.pdf',
      pdfTitle: 'EBBK GUIDE: VISUAL IMPAIRMENT (DEGREES I, II, III)',
      pdfLines: [
        'Category: Students with Visual Impairments (Low Vision)',
        '1. Degree I (Mild):',
        '   - Front row seating (1.5 - 2 meters from board), 500 lux local lighting.',
        '   - Printed handouts with Arial/Verdana 14-16 pt font.',
        '2. Degree II (Moderate):',
        '   - Enlarged font 18-20 pt, high-contrast black-on-yellow or black-on-white.',
        '   - Thick lines (1.5-2 mm) on technical and electrical diagrams.',
        '3. Degree III (Severe):',
        '   - Screen readers (NVDA/JAWS), audio recordings of lectures, tactile schemes.',
        '   - Extended time (+50%) for practical tasks; 5-min eye rest every 20 mins.',
      ],
    },
    {
      kind: 'METHODICAL' as const,
      category: 'ЕББҚ · Есту қабілеті бұзылған (Нашар еститіндер) | І, ІІ, ІІІ, ІV дәреже',
      titleKk: 'Есту қабілеті бұзылған студенттерді оқыту ерекшеліктері (І–ІV дәреже)',
      titleRu: 'Особенности обучения слабослышащих студентов (I–IV степень тугоухости)',
      summaryKk: 'І–ІІ дәреже (жеңіл және орташа): оқытушыға бетпе-бет (1–2 парта) отырғызу, анық артикуляция, барлық ауызша терминдерді тақтада немесе слайдта жазбаша қайталау. ІІІ–ІV дәреже (орташа-ауыр және ауыр): бейнематериалдарды міндетті субтитрмен беру, практикалық жұмыстарды толық иллюстрацияланған қадамдық нұсқаулықпен (чек-парақпен) ұсыну, ауызша емтиханды жазбаша/тест форматына ауыстыру.',
      summaryRu: 'I–II степень (лёгкая и умеренная тугоухость): посадка за 1–2 парту лицом к преподавателю для чтения с губ, чёткая артикуляция, дублирование новых терминов на слайде. III–IV степень (среднетяжёлая и тяжёлая): субтитры ко всем видеоматериалам, письменные пошаговые алгоритмы к практическим и лабораторным работам, замена устных ответов письменными или демонстрацией навыка.',
      fileName: 'EBBK_Hearing_Impairment_Degrees_Guide.pdf',
      pdfTitle: 'EBBK GUIDE: HEARING IMPAIRMENT (DEGREES I - IV)',
      pdfLines: [
        'Category: Students with Hearing Impairments (Hard of Hearing)',
        '1. Degrees I - II (Mild to Moderate Hearing Loss, 26-55 dB):',
        '   - Seating on 1st-2nd row with full view of teacher face and lips.',
        '   - Never speak while turned toward the chalkboard.',
        '2. Degrees III - IV (Moderately Severe to Severe, 56-90 dB):',
        '   - Mandatory visual handouts, written glossary of technical terms.',
        '   - All safety briefings and lab instructions must be provided in writing.',
        '   - Assessment via written tests or practical demonstration instead of oral.',
      ],
    },
    {
      kind: 'METHODICAL' as const,
      category: 'ЕББҚ · Тірек-қимыл аппараты (ТҚА / НОДА) | Жеңіл, орташа, ауыр дәреже',
      titleKk: 'Тірек-қимыл аппараты (ТҚА) бұзылған студенттермен жұмыс',
      titleRu: 'Особенности студентов с нарушениями опорно-двигательного аппарата (НОДА)',
      summaryKk: 'Жеңіл дәреже: стандартты жұмыс орнын бейімдеу, ұзақ жазудан қолдың шаршауын ескеру. Орташа және ауыр дәреже (соның ішінде БЦП / ДЦП, ұсақ моторика бұзылысы): арнайы эргономикалық үстел және арбаға қолжетімді өту жолы, зертханалық жұмыста виртуалды симуляторлар мен ірі детальдарды қолдану, жазбаша конспектілерді электронды форматта беру.',
      summaryRu: 'Лёгкая степень: снижение объёма рукописного текста, предоставление готовых опорных конспектов. Средняя и тяжёлая степень (включая ДЦП и нарушения мелкой моторики): свободный подъезд к рабочему стенду, использование компьютерных симуляторов при сложностях с пайкой/мелким монтажом, дополнительное время на выполнение практических операций.',
      fileName: 'EBBK_Musculoskeletal_Disorders_Guide.pdf',
      pdfTitle: 'EBBK GUIDE: MUSCULOSKELETAL DISORDERS (NODA)',
      pdfLines: [
        'Category: Students with Musculoskeletal Disorders (NODA)',
        '1. Mild Degree:',
        '   - Provide digital lecture notes to reduce hand fatigue from writing.',
        '2. Moderate & Severe Degrees (Fine Motor & Mobility Impairments):',
        '   - Accessible workstation height and wide aisle clearance in labs.',
        '   - Partner pairing or virtual circuit simulators for fine assembly tasks.',
        '   - Extended deadlines and adaptive keyboards/input devices.',
      ],
    },
    {
      kind: 'METHODICAL' as const,
      category: 'ЕББҚ · Сөйлеу тілі және коммуникация (АСБ / РАС) | Жеке бейімдеу дәрежесі',
      titleKk: 'Сөйлеу тілі бұзылыстары және аутизм спектрі (АСБ / РАС) ерекшеліктері',
      titleRu: 'Нарушения речи и расстройства аутистического спектра (РАС)',
      summaryKk: 'Коммуникативтік және сенсорлық ерекшеліктер: сабақ құрылымының тұрақты әрі алдын ала түсінікті болуы, тапсырманы қысқа әрі нақты алгоритммен беру. Көпшілік алдында ауызша жауап беруді талап етпеу — жеке жазбаша, карточкалық немесе компьютерлік форматта бағалау. Шу мен артық сенсорлық жүктемені азайту.',
      summaryRu: 'Особенности восприятия и коммуникации: чёткая и предсказуемая структура занятия, однозначные пошаговые инструкции без метафор. Замена публичных устных выступлений у доски на индивидуальную сдачу, письменный ответ или защиту проекта в спокойной обстановке. Снижение сенсорных перегрузок.',
      fileName: 'EBBK_Speech_And_ASD_Adaptation_Guide.pdf',
      pdfTitle: 'EBBK GUIDE: SPEECH DISORDERS & AUTISM SPECTRUM (ASD)',
      pdfLines: [
        'Category: Speech Disorders and Autism Spectrum (ASD)',
        '1. Predictable Lesson Structure:',
        '   - Provide clear agenda and step-by-step checklist at start of class.',
        '2. Communication & Assessment Adaptation:',
        '   - Do not force spontaneous oral answers in front of the whole group.',
        '   - Allow written responses, schematic drawing, or 1-on-1 demonstration.',
        '3. Sensory Comfort:',
        '   - Calm workspace, warning before loud equipment startup in workshops.',
      ],
    },
    {
      kind: 'METHODICAL' as const,
      category: 'ЕББҚ · Танымдық процестер ерекшеліктері (ПДТ / ЗПР) | І–ІІ дәреже',
      titleKk: 'Танымдық процестер мен зейін ерекшеліктері (ПДТ / ЗПР)',
      titleRu: 'Особенности познавательных процессов и внимания (ЗПР)',
      summaryKk: 'Жұмыс қарқынының баяулығы мен зейіннің тез шаршауы: көлемді теориялық материалды шағын блоктарға (10–15 минут) бөлу, әр блоктан кейін практикалық бекіту. Тірек схемалар, формулалар мен шартты белгілер кестесін емтихан мен сабақ үстінде пайдалануға рұқсат беру.',
      summaryRu: 'Особенности темпа деятельности и концентрации внимания: дробление сложных заданий на 3–4 коротких шага с промежуточной проверкой. Разрешение использовать опорные схемы, справочные карточки условных обозначений и шаблоны решений на практических занятиях и зачётах.',
      fileName: 'EBBK_Cognitive_And_Attention_Support_Guide.pdf',
      pdfTitle: 'EBBK GUIDE: COGNITIVE & ATTENTION SUPPORT',
      pdfLines: [
        'Category: Cognitive Pacing and Attention Support',
        '1. Micro-Stepping Tasks:',
        '   - Divide complex lab assignments into 3-4 short steps (10-15 min each).',
        '   - Verify understanding after Step 1 before moving to Step 2.',
        '2. Visual Reference Allowances:',
        '   - Allow reference cards, formula sheets, and symbol tables during tests.',
        '3. Positive Reinforcement:',
        '   - Track individual progress against student own baseline score.',
      ],
    },
  ];

  for (const doc of seedDocs) {
    let item = await prisma.libraryItem.findFirst({ where: { institutionId: institution.id, titleKk: doc.titleKk } });
    if (!item) {
      item = await prisma.libraryItem.create({
        data: {
          institutionId: institution.id,
          createdById: adminUser.id,
          kind: doc.kind,
          category: doc.category,
          titleKk: doc.titleKk,
          titleRu: doc.titleRu,
          summaryKk: doc.summaryKk,
          summaryRu: doc.summaryRu,
          isPublished: true,
          publishedAt: new Date('2026-11-19T10:00:00Z'),
        },
      });
    }
    const existingFiles = await prisma.libraryFile.count({ where: { itemId: item.id } });
    if (existingFiles === 0) {
      const pdfBuffer = generateMinimalPdf(doc.pdfTitle, doc.pdfLines);
      const objectKey = `seed-${doc.fileName}`;
      writeFileSync(join(storageDir, objectKey), pdfBuffer);
      const checksum = createHash('sha256').update(pdfBuffer).digest('hex');
      await prisma.libraryFile.create({
        data: {
          itemId: item.id,
          uploadedById: adminUser.id,
          objectKey,
          originalName: doc.fileName,
          mimeType: 'application/pdf',
          sizeBytes: BigInt(pdfBuffer.length),
          checksum,
        },
      });
    }
  }

  console.log(`Seeded TEN QADAM for institution ${institution.code} with fictional demonstration records and PDF library files.`);
  console.log(`Development-only users: admin / ${adminPassword}; demo-defectologist / Defectolog2026!!; demo-teacher / Teacher2026Pass!; demo-psychologist / Psychologist2026!; demo-social / SocialPed2026Pass!`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
