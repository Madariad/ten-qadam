import { useEffect, useState, type ComponentType, type FormEvent } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Tooltip,
} from '@mui/material';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import HomeRounded from '@mui/icons-material/HomeRounded';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import MenuBookRounded from '@mui/icons-material/MenuBookRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import EventNoteRounded from '@mui/icons-material/EventNoteRounded';
import HubRounded from '@mui/icons-material/HubRounded';
import SchoolRounded from '@mui/icons-material/SchoolRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import NotificationsNoneRounded from '@mui/icons-material/NotificationsNoneRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import SendRounded from '@mui/icons-material/SendRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import AssignmentRounded from '@mui/icons-material/AssignmentRounded';
import EventAvailableRounded from '@mui/icons-material/EventAvailableRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import FileDownloadRounded from '@mui/icons-material/FileDownloadRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import ManageAccountsRounded from '@mui/icons-material/ManageAccountsRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import { copy, type Language } from './i18n';
import {
  apiRequest,
  apiUploadFile,
  getCurrentUser,
  getLibraryFileUrl,
  login,
  logout,
  type ApiRole,
  type ApiUser,
} from './api';
import {
  initialMessages,
  initialPlanActions,
  metrics,
  navigation,
  permissions,
  resourceItems,
  roleLabels,
  student,
  type Role,
  type SectionKey,
} from './data';

type IconComponent = ComponentType<SvgIconProps>;
const iconMap: Record<string, IconComponent> = {
  home: HomeRounded,
  manage_accounts: ManageAccountsRounded,
  description: DescriptionRounded,
  groups: GroupsRounded,
  menu_book: MenuBookRounded,
  bar_chart: BarChartRounded,
  event_note: EventNoteRounded,
  hub: HubRounded,
  school: SchoolRounded,
};

type PlanStatus = 'done' | 'progress' | 'planned';
type PlanAction = {
  id: string;
  planId?: string;
  titleKk: string;
  titleRu: string;
  owner: string;
  due: string;
  status: PlanStatus;
  result?: string | null;
};
type Message = (typeof initialMessages)[number];
type StudentRecord = { id: string; code: string; name: string; group: string; specialty: string; status: string };
type ApiGoal = {
  id: string;
  titleKk: string;
  titleRu: string;
  successCriteria: string;
  status: string;
  subject: { id: string; code: string; nameKk: string; nameRu: string };
};
type ApiObservation = {
  id: string;
  observedAt: string;
  context: string | null;
  observationText: string;
  author: { displayName: string };
  subject?: { nameKk: string; nameRu: string } | null;
  goal?: { id: string; titleKk: string; titleRu: string } | null;
};
type ApiRecommendation = {
  id: string;
  domain: ApiRole;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  author: { displayName: string };
  goal?: { id: string; titleKk: string; titleRu: string } | null;
  applications: {
    id: string;
    appliedAt: string;
    outcome: string | null;
    reflection: string | null;
    appliedBy: { displayName: string };
  }[];
};
type ApiAssignment = {
  id: string;
  user: { id: string; displayName: string; roles: { role: { code: ApiRole; labelKk: string; labelRu: string } }[] };
  subject?: { id: string; nameKk: string; nameRu: string } | null;
};
type ApiPrivateNote = {
  id: string;
  title: string;
  content: string;
  domain: ApiRole;
  createdAt: string;
  authorId: string;
  author?: { displayName: string };
  accessList?: { userId: string; user: { displayName: string } }[];
};
type StudentView = {
  id: string;
  name: string;
  code: string;
  group: string;
  specialty: string;
  needs: string;
  support: string[];
  goal: string;
  rawProfiles: { id: string; category: string; description: string; createdAt?: string; createdBy?: { displayName: string } }[];
  goals: ApiGoal[];
  observations: ApiObservation[];
  recommendations: ApiRecommendation[];
  assignments: ApiAssignment[];
  activePlanId: string | null;
  activePlanTitle: string | null;
};
type ApiSummary = {
  students: number;
  plans: number;
  actionCompletion: number;
  timelyCompletion?: number;
  recommendationsApplied?: number;
  learningChange: number | null;
  updates?: { icon: 'document' | 'people' | 'chart'; titleKk: string; titleRu: string; date: string }[];
  events?: { id: string; titleKk: string; titleRu: string; subtitle: string; date: string | null }[];
};
type ApiAssessmentSession = {
  id: string;
  kind: 'BASELINE' | 'REASSESSMENT';
  assessedAt: string;
  note?: string | null;
  goal: { id: string; titleKk?: string; titleRu?: string; subject?: { nameKk: string; nameRu: string } };
  results: { criterion: string; score: number; min: number; max: number }[];
};
type ApiLibraryFile = {
  id: string;
  itemId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};
type ApiLibraryItem = {
  id: string;
  createdById?: string;
  kind: 'NORMATIVE' | 'TEACHER_GUIDE' | 'METHODICAL';
  category: string;
  titleKk: string;
  titleRu: string;
  summaryKk: string | null;
  summaryRu: string | null;
  publishedAt: string | null;
  isPublished: boolean;
  files?: ApiLibraryFile[];
};
type ResourceRow = {
  id: string;
  createdById?: string;
  kind: 'normative' | 'guide' | 'method';
  title: string;
  ruTitle: string;
  summary: string;
  ruSummary: string;
  category: string;
  date: string;
  files: ApiLibraryFile[];
  localUrl?: string;
};
type ApiGroup = { id: string; code: string; specialty: { nameKk: string; nameRu: string } };
type ApiSubject = { id: string; code: string; nameKk: string; nameRu: string };
type ApiSpecialist = {
  id: string;
  login: string;
  displayName: string;
  roles: { role: { code: ApiRole; labelKk: string; labelRu: string } }[];
};
type ApiThread = {
  id: string;
  title: string;
  status: 'OPEN' | 'CLOSED';
  members: { user: { id: string; displayName: string; roles: { role: { code: ApiRole } }[] } }[];
  messages: { id: string; authorId: string; author: { displayName: string; roles?: { role: { code: ApiRole } }[] }; body: string; createdAt: string }[];
};
type ApiAdminUser = {
  id: string;
  login: string;
  displayName: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
  lastLoginAt: string | null;
  roles: { role: { code: ApiRole; labelKk: string; labelRu: string } }[];
};

const roleFromApi: Record<ApiRole, Role> = {
  DEFECTOLOGIST: 'defectologist',
  SUBJECT_TEACHER: 'teacher',
  PSYCHOLOGIST: 'psychologist',
  SOCIAL_PEDAGOG: 'social',
  ADMINISTRATOR: 'admin',
};

export function App() {
  const demoMode = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true';
  const [user, setUser] = useState<ApiUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(!demoMode);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (demoMode) return;
    getCurrentUser().then(setUser).catch(() => setUser(null)).finally(() => setCheckingSession(false));
  }, [demoMode]);

  if (demoMode) return <WorkspaceApp demoMode authenticatedUser={null} onLogout={() => undefined} />;
  if (checkingSession) return <div className="loading-screen">TEN QADAM</div>;
  if (!user) return (
    <LoginScreen
      onLogin={async (username, password) => {
        try {
          const result = await login(username, password);
          setUser(result.user);
          setAuthError('');
        } catch (error) {
          setAuthError(error instanceof Error ? error.message : 'Не удалось войти');
        }
      }}
      error={authError}
    />
  );
  return (
    <WorkspaceApp
      demoMode={false}
      authenticatedUser={user}
      onLogout={async () => {
        await logout().catch(() => undefined);
        setUser(null);
      }}
    />
  );
}

function LoginScreen({ onLogin, error }: { onLogin: (login: string, password: string) => Promise<void>; error: string }) {
  const [language, setLanguage] = useState<Language>('kk');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const t = copy[language];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    await onLogin(username, password);
    setBusy(false);
  }

  return (
    <div className="login-page">
      <BrandHeader language={language} setLanguage={setLanguage} t={t} />
      <Paper className="login-card" elevation={0}>
        <div className="login-mark"><img src="/assets/ten-qadam-logo.png" alt="TEN QADAM" /></div>
        <div className="eyebrow">TEN QADAM</div>
        <h1>{language === 'kk' ? 'Жүйеге кіру' : 'Вход в платформу'}</h1>
        <p>{language === 'kk' ? 'Жеке логин мен құпиясөзді енгізіңіз.' : 'Введите личный логин и пароль.'}</p>
        <form onSubmit={submit} className="login-form">
          <TextField label={language === 'kk' ? 'Логин' : 'Логин'} value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required fullWidth />
          <TextField label={language === 'kk' ? 'Құпиясөз' : 'Пароль'} value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required fullWidth />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" disabled={busy} fullWidth>{busy ? '…' : language === 'kk' ? 'Кіру' : 'Войти'}</Button>
        </form>
      </Paper>
    </div>
  );
}

const roleIcons: Record<Role, string> = {
  defectologist: 'Д',
  teacher: 'П',
  psychologist: 'П',
  social: 'Ә',
  admin: 'Ә',
};

function WorkspaceApp({ demoMode, authenticatedUser, onLogout }: { demoMode: boolean; authenticatedUser: ApiUser | null; onLogout: () => void }) {
  const [language, setLanguage] = useState<Language>('kk');
  const initialRole = authenticatedUser?.roles[0] ? roleFromApi[authenticatedUser.roles[0]] : 'defectologist';
  const [role, setRole] = useState<Role>(initialRole);
  const [activeSection, setActiveSection] = useState<SectionKey>('home');
  const [messages, setMessages] = useState<Message[]>(demoMode ? initialMessages : []);
  const [messageText, setMessageText] = useState('');
  const [threads, setThreads] = useState<ApiThread[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [planActions, setPlanActions] = useState<PlanAction[]>(demoMode ? initialPlanActions : []);
  const [query, setQuery] = useState('');
  const [studentRows, setStudentRows] = useState<StudentRecord[]>(demoMode ? [
    { id: 'ЭС-24-01', code: 'ЭС-24-01', name: student.name, group: student.group, specialty: student.specialty, status: 'Қолдауда' },
    { id: 'ТП-24-02', code: 'ТП-24-02', name: 'Айдана Марат', group: '2ТП-24', specialty: 'Техникалық қызмет көрсету', status: 'Қолдауда' },
  ] : []);
  const [studentView, setStudentView] = useState<StudentView | null>(demoMode ? {
    id: 'ЭС-24-01',
    ...student,
    goal: 'Шартты белгілерді тану',
    rawProfiles: [{ id: 'p1', category: 'PEDAGOGICAL', description: student.needs }],
    goals: [{ id: 'g1', titleKk: 'Шартты белгілерді тану', titleRu: 'Распознавание условных обозначений', successCriteria: 'Оқу схемасындағы шартты белгілерді атайды және сәйкестендіреді.', status: 'ACTIVE', subject: { id: 's1', code: 'PRACTICE', nameKk: 'Кәсіптік практика', nameRu: 'Профессиональная практика' } }],
    observations: [],
    recommendations: [],
    assignments: [],
    activePlanId: 'plan-1',
    activePlanTitle: 'Жеке қолдау жоспары · 2026–2027',
  } : null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(demoMode ? 'ЭС-24-01' : null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [assessmentSessions, setAssessmentSessions] = useState<ApiAssessmentSession[]>([]);
  const [privateNotes, setPrivateNotes] = useState<ApiPrivateNote[]>([]);
  const [summary, setSummary] = useState<ApiSummary | null>(null);
  const [chartRows, setChartRows] = useState<typeof metrics>(demoMode ? metrics : []);
  const [libraryRows, setLibraryRows] = useState<ResourceRow[]>(demoMode ? resourceItems.map((item, idx) => ({
    id: `demo-res-${idx}`,
    kind: item.kind as 'normative' | 'guide' | 'method',
    title: item.title,
    ruTitle: item.ruTitle,
    summary: item.summary,
    ruSummary: item.summary,
    category: item.category,
    date: item.date,
    files: [],
  })) : []);
  const [loadingError, setLoadingError] = useState('');
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGroup, setNewStudentGroup] = useState('');
  const [newStudentCode, setNewStudentCode] = useState('');
  const [groupOptions, setGroupOptions] = useState<ApiGroup[]>([]);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupSpecKk, setNewGroupSpecKk] = useState('');
  const [newGroupSpecRu, setNewGroupSpecRu] = useState('');
  const [newGroupYear, setNewGroupYear] = useState('2026-2027');
  const [subjectOptions, setSubjectOptions] = useState<ApiSubject[]>([]);
  const [specialistOptions, setSpecialistOptions] = useState<ApiSpecialist[]>([]);
  const [adminUsers, setAdminUsers] = useState<ApiAdminUser[]>([]);
  const [toast, setToast] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = copy[language];

  const triggerRefresh = () => setRefreshTick((v) => v + 1);

  async function loadLibrary() {
    if (demoMode) return;
    try {
      const items = await apiRequest<ApiLibraryItem[]>('/library');
      setLibraryRows(items.map((item) => ({
        id: item.id,
        createdById: item.createdById,
        kind: item.kind === 'NORMATIVE' ? 'normative' : item.kind === 'TEACHER_GUIDE' ? 'guide' : 'method',
        title: item.titleKk,
        ruTitle: item.titleRu,
        summary: item.summaryKk ?? item.summaryRu ?? '',
        ruSummary: item.summaryRu ?? item.summaryKk ?? '',
        category: item.category,
        date: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '',
        files: item.files ?? [],
      })));
    } catch {
      setLibraryRows([]);
    }
  }

  useEffect(() => {
    if (demoMode) return;
    let active = true;
    async function loadWorkspace() {
      try {
        const overview = await apiRequest<ApiSummary>('/dashboard/summary');
        if (active) setSummary(overview);
      } catch (error) {
        if (active) setLoadingError(error instanceof Error ? error.message : 'Не удалось загрузить сводку');
      }
      await loadLibrary();

      if (role === 'admin') {
        try {
          const [aggMetrics, usersList, groupsList, subjectsList] = await Promise.all([
            apiRequest<{ criterion: string; baseline: number; reassessment: number }[]>('/dashboard/metrics'),
            apiRequest<ApiAdminUser[]>('/users'),
            apiRequest<ApiGroup[]>('/students/groups'),
            apiRequest<ApiSubject[]>('/students/subjects'),
          ]);
          if (active) {
            setChartRows(mapCriterionList(aggMetrics));
            setAdminUsers(usersList);
            setGroupOptions(groupsList);
            setSubjectOptions(subjectsList);
          }
        } catch {
          /* ignore */
        }
        return;
      }

      if (role === 'defectologist') {
        try { setGroupOptions(await apiRequest<ApiGroup[]>('/students/groups')); } catch { setGroupOptions([]); }
      }
      try { setSubjectOptions(await apiRequest<ApiSubject[]>('/students/subjects')); } catch { setSubjectOptions([]); }
      if (['defectologist', 'psychologist', 'social'].includes(role)) {
        try { setSpecialistOptions(await apiRequest<ApiSpecialist[]>('/students/specialists')); } catch { setSpecialistOptions([]); }
      }

      try {
        const rows = await apiRequest<{ id: string; studentCode: string; fullName: string; group: { code: string; specialty: { nameKk: string; nameRu: string } } }[]>('/students');
        if (!active) return;
        const mapped = rows.map((row) => ({
          id: row.id,
          code: row.studentCode,
          name: row.fullName,
          group: row.group.code,
          specialty: language === 'kk' ? row.group.specialty.nameKk : row.group.specialty.nameRu,
          status: language === 'kk' ? 'Қолдауда' : 'На сопровождении',
        }));
        setStudentRows(mapped);
        setSelectedStudentId((prev) => (prev && mapped.some((s) => s.id === prev) ? prev : mapped[0]?.id ?? null));
      } catch (error) {
        if (active) {
          setStudentRows([]);
          if (!(error instanceof Error && error.message.includes('403'))) {
            setLoadingError(error instanceof Error ? error.message : 'Не удалось загрузить студентов');
          }
        }
      }
    }
    void loadWorkspace();
    return () => { active = false; };
  }, [demoMode, role, language, refreshTick]);

  useEffect(() => {
    if (demoMode || !selectedStudentId || role === 'admin') return;
    let active = true;
    async function loadStudentWorkspace() {
      const [profile, assessments, plans, threadList, notes] = await Promise.allSettled([
        apiRequest<{
          id: string;
          studentCode: string;
          fullName: string;
          group: { code: string; specialty: { nameKk: string; nameRu: string } };
          supportProfiles: { id: string; category: string; description: string; createdAt: string; createdBy?: { displayName: string } }[];
          goals: ApiGoal[];
          observations: ApiObservation[];
          recommendations: ApiRecommendation[];
          assignments: ApiAssignment[];
        }>(`/students/${selectedStudentId}`),
        apiRequest<ApiAssessmentSession[]>(`/dashboard/students/${selectedStudentId}/metrics`),
        apiRequest<{ id: string; title: string; actions: { id: string; titleKk: string; titleRu: string; dueAt: string | null; status: string; result?: string | null; responsible: { displayName: string } }[] }[]>(`/students/${selectedStudentId}/plans`),
        apiRequest<ApiThread[]>(`/students/${selectedStudentId}/threads`),
        apiRequest<ApiPrivateNote[]>(`/students/${selectedStudentId}/private-notes`),
      ]);
      if (!active) return;

      let activePlanId: string | null = null;
      let activePlanTitle: string | null = null;
      if (plans.status === 'fulfilled') {
        activePlanId = plans.value[0]?.id ?? null;
        activePlanTitle = plans.value[0]?.title ?? null;
        setPlanActions(plans.value.flatMap((plan) => plan.actions.map((action) => ({
          id: action.id,
          planId: plan.id,
          titleKk: action.titleKk,
          titleRu: action.titleRu,
          owner: action.responsible.displayName,
          due: action.dueAt ? new Date(action.dueAt).toLocaleDateString() : '—',
          status: action.status === 'COMPLETED' ? 'done' as const : action.status === 'IN_PROGRESS' ? 'progress' as const : 'planned' as const,
          result: action.result,
        }))));
      }

      if (profile.status === 'fulfilled') {
        const record = profile.value;
        const firstGoal = record.goals[0];
        setSelectedGoalId((prev) => (prev && record.goals.some((g) => g.id === prev) ? prev : firstGoal?.id ?? null));
        setStudentView({
          id: record.id,
          code: record.studentCode,
          name: record.fullName,
          group: record.group.code,
          specialty: language === 'kk' ? record.group.specialty.nameKk : record.group.specialty.nameRu,
          needs: record.supportProfiles.map((item) => item.description).join('; ') || (language === 'kk' ? 'Қолдау профилі әлі толтырылмаған' : 'Профиль поддержки пока не заполнен'),
          support: [...new Set(record.supportProfiles.map((item) => translateCategory(item.category, language)))],
          goal: firstGoal ? (language === 'kk' ? firstGoal.titleKk : firstGoal.titleRu) : (language === 'kk' ? 'Белсенді оқу мақсаты жоқ' : 'Нет активной учебной цели'),
          rawProfiles: record.supportProfiles ?? [],
          goals: record.goals ?? [],
          observations: record.observations ?? [],
          recommendations: record.recommendations ?? [],
          assignments: record.assignments ?? [],
          activePlanId,
          activePlanTitle,
        });
      } else if (profile.reason instanceof Error) {
        setLoadingError(profile.reason.message);
      }

      if (assessments.status === 'fulfilled') {
        setAssessmentSessions(assessments.value);
        setChartRows(buildChartRows(assessments.value, selectedGoalId));
      }

      if (notes.status === 'fulfilled') {
        setPrivateNotes(notes.value);
      } else {
        setPrivateNotes([]);
      }

      if (threadList.status === 'fulfilled') {
        setThreads(threadList.value);
        const currentThread = threadList.value.find((th) => th.id === threadId) ?? threadList.value[0];
        setThreadId(currentThread?.id ?? null);
        if (currentThread) {
          setMessages(mapThreadMessages(currentThread));
        } else {
          setMessages([]);
        }
      }
    }
    void loadStudentWorkspace();
    return () => { active = false; };
  }, [demoMode, selectedStudentId, language, role, refreshTick]);

  useEffect(() => {
    if (!demoMode && role !== 'admin' && assessmentSessions.length > 0) {
      setChartRows(buildChartRows(assessmentSessions, selectedGoalId));
    }
  }, [selectedGoalId, assessmentSessions, demoMode, role]);

  const allowed = permissions[role];
  const canOpen = (section: SectionKey) => allowed.includes(section);
  const sectionTitle = t[activeSection];

  useEffect(() => {
    if (!allowed.includes(activeSection)) {
      setActiveSection('home');
    }
  }, [role, allowed, activeSection]);

  async function selectThread(nextThreadId: string) {
    setThreadId(nextThreadId);
    const found = threads.find((th) => th.id === nextThreadId);
    if (found) {
      setMessages(mapThreadMessages(found));
    }
    if (!demoMode) {
      try {
        const fresh = await apiRequest<ApiThread['messages']>(`/threads/${nextThreadId}/messages`);
        const currentThread = threads.find((th) => th.id === nextThreadId);
        if (currentThread) {
          setMessages(mapThreadMessages({ ...currentThread, messages: fresh }));
        }
      } catch {
        /* ignore */
      }
    }
  }

  async function createNewThread(title: string) {
    if (!title.trim() || !selectedStudentId) return;
    if (demoMode) {
      setToast(language === 'kk' ? 'Жаңа тақырып ашылды' : 'Новая тема создана');
      return;
    }
    try {
      const created = await apiRequest<ApiThread>(`/students/${selectedStudentId}/threads`, {
        method: 'POST',
        body: JSON.stringify({ title: title.trim() }),
      });
      setThreads((prev) => [created, ...prev]);
      setThreadId(created.id);
      setMessages([]);
      setToast(language === 'kk' ? 'Жаңа талқылау ашылды' : 'Открыто новое обсуждение');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Не удалось создать обсуждение');
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const author = roleLabels[role][language];
    if (!demoMode) {
      if (!selectedStudentId) {
        setToast(language === 'kk' ? 'Алдымен тағайындалған студентті таңдаңыз' : 'Сначала выберите назначенного студента');
        return;
      }
      try {
        let activeThreadId = threadId;
        if (!activeThreadId) {
          const created = await apiRequest<ApiThread>(`/students/${selectedStudentId}/threads`, {
            method: 'POST',
            body: JSON.stringify({ title: `Консилиум · ${studentView?.name ?? ''}` }),
          });
          activeThreadId = created.id;
          setThreadId(activeThreadId);
          setThreads((prev) => [created, ...prev]);
        }
        const saved = await apiRequest<{ id: string; body: string; createdAt: string; author: { displayName: string } }>(`/threads/${activeThreadId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ body: trimmed }),
        });
        setMessages((current) => [
          ...current,
          {
            id: saved.id,
            author: saved.author.displayName,
            role,
            time: new Date(saved.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            textKk: saved.body,
            textRu: saved.body,
          },
        ]);
        setMessageText('');
      } catch (error) {
        setToast(error instanceof Error ? error.message : 'Не удалось отправить сообщение');
      }
      return;
    }
    setMessages((current) => [
      ...current,
      { id: `m-${now.getTime()}`, author, role, time, textKk: trimmed, textRu: trimmed },
    ]);
    setMessageText('');
  }

  async function changePlanStatus(id: string) {
    const current = planActions.find((action) => action.id === id);
    if (!current) return;
    const next: PlanStatus = current.status === 'done' ? 'progress' : current.status === 'progress' ? 'planned' : 'done';
    if (!demoMode) {
      if (!selectedStudentId) return;
      const status = next === 'done' ? 'COMPLETED' : next === 'progress' ? 'IN_PROGRESS' : 'PLANNED';
      try {
        await apiRequest(`/students/${selectedStudentId}/actions/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
        triggerRefresh();
      } catch (error) {
        setToast(error instanceof Error ? error.message : 'Не удалось обновить мероприятие');
        return;
      }
    }
    setPlanActions((items) => items.map((action) => (action.id === id ? { ...action, status: next } : action)));
  }

  async function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newStudentName.trim() || !newStudentGroup.trim() || !newStudentCode.trim()) return;
    if (!demoMode) {
      try {
        const created = await apiRequest<{ id: string }>('/students', {
          method: 'POST',
          body: JSON.stringify({ studentCode: newStudentCode.trim(), fullName: newStudentName.trim(), groupId: newStudentGroup }),
        });
        setStudentDialogOpen(false);
        setNewStudentName('');
        setNewStudentCode('');
        setNewStudentGroup('');
        setToast(language === 'kk' ? 'Студент сақталды' : 'Студент сохранён');
        setSelectedStudentId(created.id);
        triggerRefresh();
      } catch (error) {
        setToast(error instanceof Error ? error.message : 'Не удалось сохранить студента');
      }
      return;
    }
    setStudentRows((current) => [
      {
        id: `ST-${Date.now()}`,
        code: newStudentCode.trim(),
        name: newStudentName.trim(),
        group: newStudentGroup.trim(),
        specialty: language === 'kk' ? 'Жаңа мамандық' : 'Новая специальность',
        status: language === 'kk' ? 'Қолдауда' : 'На сопровождении',
      },
      ...current,
    ]);
    setNewStudentName('');
    setNewStudentGroup('');
    setNewStudentCode('');
    setStudentDialogOpen(false);
    setToast(language === 'kk' ? 'Студент сақталды' : 'Студент сохранён');
  }

  async function addStudyGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newGroupCode.trim() || (!newGroupSpecKk.trim() && !newGroupSpecRu.trim())) return;
    const specKk = newGroupSpecKk.trim() || newGroupSpecRu.trim();
    const specRu = newGroupSpecRu.trim() || newGroupSpecKk.trim();
    if (!demoMode) {
      try {
        const created = await apiRequest<ApiGroup>('/students/groups', {
          method: 'POST',
          body: JSON.stringify({
            code: newGroupCode.trim(),
            academicYear: newGroupYear.trim() || '2026-2027',
            specialtyNameKk: specKk,
            specialtyNameRu: specRu,
          }),
        });
        setGroupOptions((prev) => [...prev, created]);
        setNewStudentGroup(created.id);
        setGroupDialogOpen(false);
        setNewGroupCode('');
        setNewGroupSpecKk('');
        setNewGroupSpecRu('');
        setToast(language === 'kk' ? 'Оқу тобы қосылды' : 'Учебная группа добавлена');
        triggerRefresh();
      } catch (error) {
        setToast(error instanceof Error ? error.message : 'Не удалось создать учебную группу');
      }
      return;
    }
    const createdDemo: ApiGroup = {
      id: `grp-${Date.now()}`,
      code: newGroupCode.trim(),
      specialty: { nameKk: specKk, nameRu: specRu },
    };
    setGroupOptions((prev) => [...prev, createdDemo]);
    setNewStudentGroup(createdDemo.code);
    setGroupDialogOpen(false);
    setNewGroupCode('');
    setNewGroupSpecKk('');
    setNewGroupSpecRu('');
    setToast(language === 'kk' ? 'Оқу тобы қосылды' : 'Учебная группа добавлена');
  }

  function exportReport() {
    const rows = [
      [
        language === 'kk' ? 'Көрсеткіш / Критерий' : 'Показатель / Критерий',
        language === 'kk' ? 'Бастапқы бағалау (%)' : 'Первичная оценка (%)',
        language === 'kk' ? 'Қайта бағалау (%)' : 'Повторная оценка (%)',
        language === 'kk' ? 'Динамика (п.п.)' : 'Динамика (п.п.)',
      ],
      ...chartRows.map((metric) => [
        language === 'kk' ? metric.kk : metric.ru,
        String(metric.baseline),
        String(metric.reassessment),
        String(metric.reassessment - metric.baseline),
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ten-qadam-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="platform-shell">
      <div className="workspace">
        <div className="top-layout">
          <Sidebar
            language={language}
            activeSection={activeSection}
            setActiveSection={(sec) => {
              setActiveSection(sec);
              setMobileMenuOpen(false);
            }}
            canOpen={canOpen}
            onDenied={() => setToast(t.noAccess)}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
            t={t}
          />
          {activeSection === 'home' ? (
            <section className="overview-column">
              <InstitutionBar
                language={language}
                setLanguage={setLanguage}
                role={role}
                setRole={setRole}
                t={t}
                demoMode={demoMode}
                userName={authenticatedUser?.displayName}
                onLogout={onLogout}
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
              />
              <DashboardOverview
                language={language}
                role={role}
                setActiveSection={setActiveSection}
                t={t}
                demoMode={demoMode}
                summary={summary}
              />
            </section>
          ) : (
            <section className="section-column">
              <InstitutionBar
                language={language}
                setLanguage={setLanguage}
                role={role}
                setRole={setRole}
                t={t}
                demoMode={demoMode}
                userName={authenticatedUser?.displayName}
                onLogout={onLogout}
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
              />
              {canOpen(activeSection) ? (
                <SectionContent
                  activeSection={activeSection}
                  language={language}
                  t={t}
                  role={role}
                  currentUserId={authenticatedUser?.id ?? authenticatedUser?.userId}
                  query={query}
                  setQuery={setQuery}
                  studentRows={studentRows}
                  studentInfo={studentView}
                  metricRows={chartRows}
                  resourceRows={libraryRows}
                  demoMode={demoMode}
                  selectedStudentId={selectedStudentId}
                  onSelectStudent={(id) => setSelectedStudentId(id)}
                  selectedGoalId={selectedGoalId}
                  onSelectGoal={(id) => setSelectedGoalId(id)}
                  openStudentDialog={() => setStudentDialogOpen(true)}
                  openGroupDialog={() => setGroupDialogOpen(true)}
                  groupOptions={groupOptions}
                  planActions={planActions}
                  changePlanStatus={changePlanStatus}
                  messages={messages}
                  messageText={messageText}
                  setMessageText={setMessageText}
                  sendMessage={sendMessage}
                  threads={threads}
                  activeThreadId={threadId}
                  onSelectThread={selectThread}
                  onCreateThread={createNewThread}
                  exportReport={exportReport}
                  subjectOptions={subjectOptions}
                  specialistOptions={specialistOptions}
                  privateNotes={privateNotes}
                  summary={summary}
                  adminUsers={adminUsers}
                  onRefresh={triggerRefresh}
                  onReloadLibrary={loadLibrary}
                  setLocalResourceRows={setLibraryRows}
                  setToast={setToast}
                />
              ) : (
                <Paper className="restricted-panel">
                  <LockRounded />
                  <h2>{t.noAccess}</h2>
                  <p>{roleLabels[role][language]} — {sectionTitle}</p>
                  <Button variant="contained" onClick={() => setActiveSection('home')}>{t.home}</Button>
                </Paper>
              )}
            </section>
          )}
        </div>
      </div>

      <Dialog open={studentDialogOpen} onClose={() => setStudentDialogOpen(false)} fullWidth maxWidth="xs">
        <form onSubmit={addStudent}>
          <DialogTitle>{t.addStudent}</DialogTitle>
          <DialogContent className="dialog-fields">
            <TextField autoFocus label={language === 'kk' ? 'Аты-жөні' : 'ФИО'} value={newStudentName} onChange={(event) => setNewStudentName(event.target.value)} required fullWidth />
            <TextField label={language === 'kk' ? 'Студент коды (ID)' : 'Код студента (ID)'} value={newStudentCode} onChange={(event) => setNewStudentCode(event.target.value)} placeholder="ЭС-24-05" required fullWidth />
            {demoMode ? (
              <TextField label={language === 'kk' ? 'Тобы' : 'Группа'} value={newStudentGroup} onChange={(event) => setNewStudentGroup(event.target.value)} required fullWidth />
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <TextField select label={language === 'kk' ? 'Оқу тобы' : 'Учебная группа'} value={newStudentGroup} onChange={(event) => setNewStudentGroup(event.target.value)} required fullWidth>
                  {groupOptions.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.code} · {language === 'kk' ? group.specialty.nameKk : group.specialty.nameRu}
                    </MenuItem>
                  ))}
                </TextField>
                <Button variant="outlined" onClick={() => setGroupDialogOpen(true)} style={{ minWidth: 115, height: 54 }}>
                  + {language === 'kk' ? 'Жаңа топ' : 'Группа'}
                </Button>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStudentDialogOpen(false)}>{t.cancel}</Button>
            <Button type="submit" variant="contained">{t.save}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} fullWidth maxWidth="xs">
        <form onSubmit={addStudyGroup}>
          <DialogTitle>{language === 'kk' ? 'Жаңа оқу тобын қосу' : 'Добавить учебную группу'}</DialogTitle>
          <DialogContent className="dialog-fields">
            <TextField
              autoFocus
              label={language === 'kk' ? 'Топ коды (мысалы: 1ЭМ-26)' : 'Код группы (например: 1ЭМ-26)'}
              value={newGroupCode}
              onChange={(e) => setNewGroupCode(e.target.value)}
              placeholder="1ЭМ-26"
              required
              fullWidth
            />
            <TextField
              label={language === 'kk' ? 'Мамандық атауы (Қазақша)' : 'Специальность (на казахском)'}
              value={newGroupSpecKk}
              onChange={(e) => setNewGroupSpecKk(e.target.value)}
              placeholder={language === 'kk' ? 'Электрмен жабдықтау' : 'Электрмен жабдықтау'}
              required
              fullWidth
            />
            <TextField
              label={language === 'kk' ? 'Мамандық атауы (Орысша)' : 'Специальность (на русском)'}
              value={newGroupSpecRu}
              onChange={(e) => setNewGroupSpecRu(e.target.value)}
              placeholder={language === 'kk' ? 'Электроснабжение' : 'Электроснабжение'}
              required
              fullWidth
            />
            <TextField
              label={language === 'kk' ? 'Оқу жылы' : 'Учебный год'}
              value={newGroupYear}
              onChange={(e) => setNewGroupYear(e.target.value)}
              required
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGroupDialogOpen(false)}>{t.cancel}</Button>
            <Button type="submit" variant="contained">{t.save}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={3500} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="info" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
      {loadingError && (
        <Snackbar open autoHideDuration={6000} onClose={() => setLoadingError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setLoadingError('')}>{loadingError}</Alert>
        </Snackbar>
      )}
    </div>
  );
}

function BrandHeader({ language, setLanguage, t }: { language: Language; setLanguage: (value: Language) => void; t: typeof copy.kk }) {
  return (
    <header className="brand-header compact-brand-header">
      <img className="brand-logo" src="/assets/ten-qadam-logo.png" alt="TEN QADAM" />
      <div className="brand-actions">
        <div className="language-toggle" aria-label={t.language}>
          <button className={language === 'kk' ? 'selected' : ''} onClick={() => setLanguage('kk')}>ҚАЗ</button>
          <button className={language === 'ru' ? 'selected' : ''} onClick={() => setLanguage('ru')}>РУС</button>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ language, activeSection, setActiveSection, canOpen, mobileOpen, onCloseMobile, t }: {
  language: Language;
  activeSection: SectionKey;
  setActiveSection: (key: SectionKey) => void;
  canOpen: (key: SectionKey) => boolean;
  onDenied?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  t: typeof copy.kk;
}) {
  const visibleItems = navigation.filter((item) => canOpen(item.key));
  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} aria-hidden="true" />}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/assets/ten-qadam-logo.png" alt="TEN QADAM" />
          <IconButton className="sidebar-close-btn" onClick={onCloseMobile} aria-label="Close menu">
            <CloseRounded />
          </IconButton>
        </div>
        <nav aria-label={language === 'kk' ? 'Негізгі мәзір' : 'Главное меню'}>
          {visibleItems.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <button
                key={item.key}
                type="button"
                className={`nav-item ${activeSection === item.key ? 'active' : ''}`}
                onClick={() => setActiveSection(item.key)}
                aria-current={activeSection === item.key ? 'page' : undefined}
              >
                <Icon fontSize="small" />
                <span>{t[item.label as keyof typeof t]}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <span className="online-dot" />
          <span>{language === 'kk' ? 'Қауіпсіз жұмыс кеңістігі' : 'Защищённое рабочее пространство'}</span>
        </div>
      </aside>
    </>
  );
}

function InstitutionBar({ language, setLanguage, role, setRole, t, demoMode, userName, onLogout, onOpenMobileMenu }: {
  language: Language;
  setLanguage: (value: Language) => void;
  role: Role;
  setRole: (role: Role) => void;
  t: typeof copy.kk;
  demoMode: boolean;
  userName?: string;
  onLogout: () => void;
  onOpenMobileMenu?: () => void;
}) {
  return (
    <div className="institution-bar">
      <div className="institution-name">
        <IconButton className="mobile-menu-trigger" onClick={onOpenMobileMenu} aria-label="Menu">
          <MenuRounded />
        </IconButton>
        <div className="institution-icon"><SchoolRounded /></div>
        <span>{language === 'kk' ? 'Талдықорған жоғары политехникалық колледжі' : 'Талдыкорганский высший политехнический колледж'}</span>
      </div>
      <div className="user-controls">
        <div className="language-toggle app-language-toggle" aria-label={t.language}>
          <button className={language === 'kk' ? 'selected' : ''} onClick={() => setLanguage('kk')}>ҚАЗ</button>
          <button className={language === 'ru' ? 'selected' : ''} onClick={() => setLanguage('ru')}>РУС</button>
        </div>
        <Tooltip title={language === 'kk' ? 'Хабарламалар' : 'Уведомления'}>
          <IconButton className="notification-button" aria-label={language === 'kk' ? 'Хабарламалар' : 'Уведомления'}>
            <Badge variant="dot" color="error"><NotificationsNoneRounded /></Badge>
          </IconButton>
        </Tooltip>
        <div className="user-select-wrap">
          <Avatar className="user-avatar"><PersonRounded /></Avatar>
          <span className="user-caption">
            {roleLabels[role][language]}
            <small>{userName ?? (role === 'teacher' ? 'Айдарова А.С.' : 'Оспанова М.Қ.')}</small>
          </span>
          {demoMode ? (
            <>
              <Select
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
                variant="standard"
                disableUnderline
                className="role-select"
                inputProps={{ 'aria-label': t.role }}
              >
                {(Object.keys(roleLabels) as Role[]).map((key) => (
                  <MenuItem key={key} value={key}>{roleLabels[key][language]}</MenuItem>
                ))}
              </Select>
              <KeyboardArrowDownRounded className="role-arrow" />
            </>
          ) : (
            <Tooltip title={language === 'kk' ? 'Шығу' : 'Выйти'}>
              <IconButton onClick={onLogout} className="logout-button" aria-label={language === 'kk' ? 'Шығу' : 'Выйти'}>
                <LogoutRounded />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardOverview({ language, role, setActiveSection, t, demoMode, summary }: {
  language: Language;
  role: Role;
  setActiveSection: (key: SectionKey) => void;
  t: typeof copy.kk;
  demoMode: boolean;
  summary: ApiSummary | null;
}) {
  const kpis = [
    { label: t.studentsSupported, value: demoMode ? '42' : String(summary?.students ?? '—'), Icon: GroupsRounded, tone: 'blue' },
    { label: t.supportPlans, value: demoMode ? '42' : String(summary?.plans ?? '—'), Icon: AssignmentRounded, tone: 'teal' },
    { label: t.planProgress, value: demoMode ? '78 %' : summary ? `${summary.actionCompletion} %` : '—', Icon: BarChartRounded, tone: 'green' },
    { label: t.learningProgress, value: demoMode ? '+15 %' : summary?.learningChange == null ? '—' : `${summary.learningChange > 0 ? '+' : ''}${summary.learningChange} п.п.`, Icon: TrendingUpRounded, tone: 'purple' },
  ];

  return (
    <div className="overview-content">
      <section className="welcome-banner">
        <div className="welcome-copy">
          <h1>{t.welcome}</h1>
          <p>{t.headline}</p>
          <span className="demo-pill"><span className="demo-dot" />{t.demo}</span>
        </div>
        <img src="/assets/students-illustration.png" alt="" className="students-art" />
      </section>
      <div className="kpi-grid">
        {kpis.map(({ label, value, Icon, tone }) => (
          <Paper key={label} className="kpi-card" elevation={0}>
            <div className={`kpi-icon ${tone}`}><Icon /></div>
            <div className="kpi-text">
              <span>{label}</span>
              <strong className={tone === 'green' ? 'green-value' : tone === 'purple' ? 'purple-value' : ''}>{value}</strong>
            </div>
          </Paper>
        ))}
      </div>

      <div className="updates-grid">
        <Paper className="updates-card" elevation={0}>
          <h2>{t.updates}</h2>
          {summary?.updates && summary.updates.length > 0 ? (
            summary.updates.map((upd, idx) => (
              <UpdateRow
                key={idx}
                icon={upd.icon}
                title={language === 'kk' ? upd.titleKk : upd.titleRu}
                date={new Date(upd.date).toLocaleDateString()}
              />
            ))
          ) : (
            <>
              <UpdateRow icon="document" title={language === 'kk' ? 'Инклюзивті білім беру қағидалары (жаңа редакция)' : 'Правила инклюзивного образования (новая редакция)'} date="20.11.2026" />
              <UpdateRow icon="people" title={language === 'kk' ? 'Студенттердің жеке қолдау жоспары жаңартылды' : 'Обновлены индивидуальные планы поддержки'} date="19.11.2026" />
              <UpdateRow icon="chart" title={language === 'kk' ? 'Білім көрсеткіштері енгізілді' : 'Добавлены учебные показатели'} date="18.11.2026" />
            </>
          )}
        </Paper>
        <Paper className="events-card" elevation={0}>
          <h2>{t.events}</h2>
          {summary?.events && summary.events.length > 0 ? (
            summary.events.map((ev) => (
              <div className="event-row" key={ev.id}>
                <EventAvailableRounded />
                <div>
                  <strong>{language === 'kk' ? ev.titleKk : ev.titleRu}</strong>
                  <span>{ev.subtitle}{ev.date ? ` · ${new Date(ev.date).toLocaleDateString()}` : ''}</span>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="event-row"><EventAvailableRounded /><div><strong>{language === 'kk' ? 'Мамандар консилиумы' : 'Консилиум специалистов'}</strong><span>22.11.2026, 15:00</span></div></div>
              <div className="event-row"><EventAvailableRounded /><div><strong>{language === 'kk' ? 'Педагогтерге шеберлік сабақ' : 'Мастер-класс для педагогов'}</strong><span>{language === 'kk' ? 'Сабақты бейімдеу әдістері' : 'Методы адаптации занятий'} · 25.11.2026, 11:00</span></div></div>
            </>
          )}
          {role !== 'admin' ? (
            <button className="text-link" onClick={() => setActiveSection('students')}>
              {language === 'kk' ? 'Студенттер базасын ашу' : 'Открыть базу студентов'} <ArrowForwardRounded />
            </button>
          ) : (
            <button className="text-link" onClick={() => setActiveSection('users')}>
              {language === 'kk' ? 'Пайдаланушылар мен рөлдерді басқару' : 'Управление пользователями и ролями'} <ArrowForwardRounded />
            </button>
          )}
        </Paper>
      </div>
    </div>
  );
}

function UpdateRow({ icon, title, date }: { icon: 'document' | 'people' | 'chart'; title: string; date: string }) {
  const Icon = icon === 'people' ? GroupsRounded : icon === 'chart' ? BarChartRounded : DescriptionRounded;
  return (
    <div className="update-row">
      <span className={`update-icon ${icon}`}><Icon /></span>
      <span className="update-title">{title}</span>
      <time>{date}</time>
    </div>
  );
}

function CollaborationPanel({
  language,
  t,
  messages,
  messageText,
  setMessageText,
  sendMessage,
  studentInfo,
  threads,
  activeThreadId,
  onSelectThread,
  onCreateThread,
  onRefresh,
}: {
  language: Language;
  t: typeof copy.kk;
  messages: Message[];
  messageText: string;
  setMessageText: (value: string) => void;
  sendMessage: (event: FormEvent<HTMLFormElement>) => void;
  studentInfo: StudentView | null;
  demoMode?: boolean;
  threads: ApiThread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onCreateThread: (title: string) => Promise<void>;
  onRefresh: () => void;
}) {
  const [threadDialogOpen, setThreadDialogOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');

  return (
    <Paper className="collaboration-panel" elevation={0}>
      <div className="chat-threads-bar">
        <div className="section-ribbon wide-ribbon">{t.specialistContact}</div>
        <div className="chat-thread-pills">
          {threads.map((th) => (
            <Chip
              key={th.id}
              label={th.title}
              color={th.id === activeThreadId ? 'primary' : 'default'}
              variant={th.id === activeThreadId ? 'filled' : 'outlined'}
              onClick={() => onSelectThread(th.id)}
              size="small"
            />
          ))}
          <Button size="small" variant="outlined" startIcon={<AddRounded />} onClick={() => setThreadDialogOpen(true)}>
            {language === 'kk' ? 'Жаңа талқылау' : 'Новая тема'}
          </Button>
          <IconButton size="small" onClick={onRefresh} title={language === 'kk' ? 'Жаңарту' : 'Обновить'}>
            <RefreshRounded fontSize="small" />
          </IconButton>
        </div>
      </div>

      <div className="collaboration-content">
        <div className="specialist-list">
          <h2><HubRounded /> {language === 'kk' ? 'Мамандар тобы' : 'Команда сопровождения'}</h2>
          {([
            ['defectologist', 'Дефектолог', '#f0a5ae'],
            ['psychologist', 'Педагог-психолог', '#c278e8'],
            ['social', 'Әлеуметтік педагог', '#f4ae4d'],
            ['teacher', 'Пән оқытушысы', '#3f89db'],
          ] as [Role, string, string][]).map(([key, label, color]) => (
            <div className="specialist-item" key={key}>
              <Avatar style={{ backgroundColor: color }}>{roleIcons[key]}</Avatar>
              <span>{language === 'kk' ? label : roleLabels[key].ru}</span>
              <span className="presence" />
            </div>
          ))}
        </div>
        <div className="conversation-box">
          <div className="conversation-title">
            <AssignmentRounded />
            <strong>
              {studentInfo
                ? `${threads.find((th) => th.id === activeThreadId)?.title ?? (language === 'kk' ? 'Консилиум' : 'Консилиум')}: ${studentInfo.name} (${studentInfo.group})`
                : (language === 'kk' ? 'Студент таңдалмаған' : 'Студент не выбран')}
            </strong>
          </div>
          <div className="conversation-messages scrollable-chat" aria-live="polite">
            {messages.map((message) => (
              <div className={`message-line ${message.role}`} key={message.id}>
                <Avatar className={`message-avatar ${message.role}`}>{roleIcons[message.role]}</Avatar>
                <div className="message-copy">
                  <strong>{message.author}</strong>
                  <p>{language === 'kk' ? message.textKk : message.textRu}</p>
                </div>
                <time>{message.time}</time>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="no-live-data">
                {language === 'kk' ? 'Әзірге хабарлама жоқ. Талқылауды бастаңыз.' : 'Сообщений пока нет. Начните обсуждение.'}
              </div>
            )}
          </div>
          <form className="message-form" onSubmit={sendMessage}>
            <TextField
              size="small"
              fullWidth
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder={t.messagePlaceholder}
              inputProps={{ 'aria-label': t.messagePlaceholder }}
            />
            <Button type="submit" variant="contained" aria-label={t.send}><SendRounded /></Button>
          </form>
        </div>
      </div>

      <Dialog open={threadDialogOpen} onClose={() => setThreadDialogOpen(false)} fullWidth maxWidth="xs">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onCreateThread(newThreadTitle);
            setNewThreadTitle('');
            setThreadDialogOpen(false);
          }}
        >
          <DialogTitle>{language === 'kk' ? 'Жаңа консилиум тақырыбы' : 'Новая тема консилиума'}</DialogTitle>
          <DialogContent className="dialog-fields">
            <TextField
              autoFocus
              label={language === 'kk' ? 'Тақырып атауы' : 'Название темы'}
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              placeholder={language === 'kk' ? 'Мысалы: Электртехника бойынша бейімдеу' : 'Например: Адаптация по электротехнике'}
              required
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setThreadDialogOpen(false)}>{t.cancel}</Button>
            <Button type="submit" variant="contained">{t.save}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  );
}

function BarChart({ language, data = metrics }: { language: Language; data?: typeof metrics }) {
  return (
    <div className="bar-chart" role="img" aria-label={language === 'kk' ? 'Бастапқы және қайталама бағалау диаграммасы' : 'Диаграмма первичной и повторной оценок'}>
      <div className="y-axis"><span>100 %</span><span>75 %</span><span>50 %</span><span>25 %</span><span>0 %</span></div>
      <div className="chart-plot">
        <div className="gridlines"><i /><i /><i /><i /><i /></div>
        <div className="bar-groups">
          {data.map((metric) => (
            <div className="bar-group" key={metric.kk}>
              <div className="bars">
                <div className="bar-value baseline" style={{ height: `${metric.baseline}%` }}><span>{metric.baseline} %</span></div>
                <div className="bar-value reassessment" style={{ height: `${metric.reassessment}%` }}><span>{metric.reassessment} %</span></div>
              </div>
              <strong>{language === 'kk' ? metric.kk : metric.ru}</strong>
            </div>
          ))}
        </div>
        {data.length === 0 && <div className="chart-empty">{language === 'kk' ? 'Бағалау деректері әзірге жоқ' : 'Пока нет данных оценок'}</div>}
      </div>
    </div>
  );
}

function SectionContent({
  activeSection,
  language,
  t,
  role,
  currentUserId,
  query,
  setQuery,
  studentRows,
  studentInfo,
  metricRows,
  resourceRows,
  demoMode,
  selectedStudentId,
  onSelectStudent,
  selectedGoalId,
  onSelectGoal,
  openStudentDialog,
  openGroupDialog,
  groupOptions,
  planActions,
  changePlanStatus,
  messages,
  messageText,
  setMessageText,
  sendMessage,
  threads,
  activeThreadId,
  onSelectThread,
  onCreateThread,
  exportReport,
  subjectOptions,
  specialistOptions,
  privateNotes,
  summary,
  adminUsers,
  onRefresh,
  onReloadLibrary,
  setLocalResourceRows,
  setToast,
}: {
  activeSection: SectionKey;
  language: Language;
  t: typeof copy.kk;
  role: Role;
  currentUserId?: string;
  query: string;
  setQuery: (value: string) => void;
  studentRows: StudentRecord[];
  studentInfo: StudentView | null;
  metricRows: typeof metrics;
  resourceRows: ResourceRow[];
  demoMode: boolean;
  selectedStudentId: string | null;
  onSelectStudent: (id: string) => void;
  selectedGoalId: string | null;
  onSelectGoal: (id: string) => void;
  openStudentDialog: () => void;
  openGroupDialog: () => void;
  groupOptions: ApiGroup[];
  planActions: PlanAction[];
  changePlanStatus: (id: string) => void;
  messages: Message[];
  messageText: string;
  setMessageText: (value: string) => void;
  sendMessage: (event: FormEvent<HTMLFormElement>) => void;
  threads: ApiThread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onCreateThread: (title: string) => Promise<void>;
  exportReport: () => void;
  subjectOptions: ApiSubject[];
  specialistOptions: ApiSpecialist[];
  privateNotes: ApiPrivateNote[];
  summary: ApiSummary | null;
  adminUsers: ApiAdminUser[];
  onRefresh: () => void;
  onReloadLibrary: () => Promise<void>;
  setLocalResourceRows: React.Dispatch<React.SetStateAction<ResourceRow[]>>;
  setToast: (msg: string) => void;
}) {
  const [selectedResource, setSelectedResource] = useState<ResourceRow | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [studentTab, setStudentTab] = useState(0);

  // Admin Users & Roles management dialogs
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [newLogin, setNewLogin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newUserRole, setNewUserRole] = useState<ApiRole>('SUBJECT_TEACHER');

  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiAdminUser | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editUserRole, setEditUserRole] = useState<ApiRole>('SUBJECT_TEACHER');
  const [editUserStatus, setEditUserStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'DISABLED'>('ACTIVE');

  // Document creation & upload dialog
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [docCategory, setDocCategory] = useState('');
  const [docTitleKk, setDocTitleKk] = useState('');
  const [docTitleRu, setDocTitleRu] = useState('');
  const [docSummaryKk, setDocSummaryKk] = useState('');
  const [docSummaryRu, setDocSummaryRu] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Pedagogical cycle dialogs
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalSubjectId, setGoalSubjectId] = useState('');
  const [goalTitleKk, setGoalTitleKk] = useState('');
  const [goalTitleRu, setGoalTitleRu] = useState('');
  const [goalCriteria, setGoalCriteria] = useState('');

  const [obsDialogOpen, setObsDialogOpen] = useState(false);
  const [obsContext, setObsContext] = useState('');
  const [obsText, setObsText] = useState('');
  const [obsGoalId, setObsGoalId] = useState('');

  const [recDialogOpen, setRecDialogOpen] = useState(false);
  const [recTitle, setRecTitle] = useState('');
  const [recContent, setRecContent] = useState('');
  const [recGoalId, setRecGoalId] = useState('');

  const [applyDialogOpen, setApplyDialogOpen] = useState<string | null>(null);
  const [applyOutcome, setApplyOutcome] = useState('');
  const [applyReflection, setApplyReflection] = useState('');

  const [assessDialogOpen, setAssessDialogOpen] = useState(false);
  const [assessKind, setAssessKind] = useState<'BASELINE' | 'REASSESSMENT'>('REASSESSMENT');
  const [assessGoalId, setAssessGoalId] = useState('');
  const [scoreUnderstanding, setScoreUnderstanding] = useState(70);
  const [scoreExecution, setScoreExecution] = useState(65);
  const [scoreIndependence, setScoreIndependence] = useState(55);
  const [scoreParticipation, setScoreParticipation] = useState(80);
  const [assessNote, setAssessNote] = useState('');

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionTitleKk, setActionTitleKk] = useState('');
  const [actionTitleRu, setActionTitleRu] = useState('');
  const [actionResponsibleId, setActionResponsibleId] = useState('');
  const [actionDueAt, setActionDueAt] = useState('2026-11-30');

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileCategory, setProfileCategory] = useState('PEDAGOGICAL');
  const [profileDesc, setProfileDesc] = useState('');

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectNameKk, setNewSubjectNameKk] = useState('');
  const [newSubjectNameRu, setNewSubjectNameRu] = useState('');

  async function submitSubject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newSubjectCode.trim() || (!newSubjectNameKk.trim() && !newSubjectNameRu.trim())) return;
    const nameKk = newSubjectNameKk.trim() || newSubjectNameRu.trim();
    const nameRu = newSubjectNameRu.trim() || newSubjectNameKk.trim();
    try {
      await apiRequest('/students/subjects', {
        method: 'POST',
        body: JSON.stringify({ code: newSubjectCode.trim(), nameKk, nameRu }),
      });
      setSubjectDialogOpen(false);
      setNewSubjectCode('');
      setNewSubjectNameKk('');
      setNewSubjectNameRu('');
      setToast(language === 'kk' ? 'Пән қосылды' : 'Учебный предмет добавлен');
      onRefresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Ошибка создания предмета');
    }
  }

  const q = query.trim().toLocaleLowerCase(language === 'kk' ? 'kk-KZ' : 'ru-RU');
  const filteredStudents = studentRows.filter((row) => `${row.name} ${row.group} ${row.specialty} ${row.code}`.toLocaleLowerCase().includes(q));
  const resources = activeSection === 'normative'
    ? resourceRows.filter((item) => item.kind === 'normative')
    : activeSection === 'guides'
      ? resourceRows.filter((item) => item.kind === 'guide')
      : resourceRows.filter((item) => item.kind === 'method' || item.kind === 'guide');
  const filteredResources = resources.filter((item) => `${item.title} ${item.ruTitle} ${item.summary} ${item.category}`.toLocaleLowerCase().includes(q));

  const heading = activeSection === 'users' ? t.users
    : activeSection === 'students' ? t.students
      : activeSection === 'normative' ? t.normative
        : activeSection === 'guides' ? t.guides
          : activeSection === 'metrics' ? t.metrics
            : activeSection === 'plans' ? t.plans
              : activeSection === 'collaboration' ? t.collaboration
                : activeSection === 'library' ? t.library : t.reports;

  const allRolesList: { code: ApiRole; labelKk: string; labelRu: string }[] = [
    { code: 'DEFECTOLOGIST', labelKk: 'Дефектолог', labelRu: 'Дефектолог' },
    { code: 'SUBJECT_TEACHER', labelKk: 'Пән оқытушысы', labelRu: 'Предметный преподаватель' },
    { code: 'PSYCHOLOGIST', labelKk: 'Педагог-психолог', labelRu: 'Педагог-психолог' },
    { code: 'SOCIAL_PEDAGOG', labelKk: 'Әлеуметтік педагог', labelRu: 'Социальный педагог' },
    { code: 'ADMINISTRATOR', labelKk: 'Әкімшілік', labelRu: 'Администрация' },
  ];

  const filteredAdminUsers = adminUsers.filter((u) => `${u.login} ${u.displayName} ${u.roles.map((r) => `${r.role.labelKk} ${r.role.labelRu}`).join(' ')}`.toLocaleLowerCase().includes(q));

  async function createStaffUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({ login: newLogin.trim(), password: newPassword, displayName: newDisplayName.trim(), role: newUserRole }),
      });
      setUserDialogOpen(false);
      setNewLogin('');
      setNewPassword('');
      setNewDisplayName('');
      setToast(language === 'kk' ? 'Қызметкер тіркелді және рөлі тағайындалды' : 'Пользователь создан и роль назначена');
      onRefresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Ошибка создания пользователя');
    }
  }

  async function quickChangeRole(targetUserId: string, nextRole: ApiRole) {
    try {
      await apiRequest(`/users/${targetUserId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole }),
      });
      setToast(language === 'kk' ? 'Пайдаланушы рөлі жаңартылды' : 'Роль пользователя успешно назначена');
      onRefresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Ошибка изменения роли');
    }
  }

  async function quickChangeStatus(targetUserId: string, nextStatus: 'ACTIVE' | 'SUSPENDED' | 'DISABLED') {
    try {
      await apiRequest(`/users/${targetUserId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setToast(language === 'kk' ? 'Мәртебе жаңартылды' : 'Статус пользователя обновлён');
      onRefresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Ошибка изменения статуса');
    }
  }

  function openEditUser(u: ApiAdminUser) {
    setEditingUser(u);
    setEditDisplayName(u.displayName);
    setEditPassword('');
    setEditUserRole(u.roles[0]?.role.code ?? 'SUBJECT_TEACHER');
    setEditUserStatus(u.status);
    setEditUserDialogOpen(true);
  }

  async function submitEditUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await apiRequest(`/users/${editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: editDisplayName.trim(),
          role: editUserRole,
          status: editUserStatus,
          ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
        }),
      });
      setEditUserDialogOpen(false);
      setEditingUser(null);
      setToast(language === 'kk' ? 'Пайдаланушы деректері мен рөлі сақталды' : 'Данные и роль пользователя сохранены');
      onRefresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Ошибка обновления пользователя');
    }
  }

  const canUploadResource = activeSection === 'normative'
    ? (role === 'admin' || role === 'defectologist')
    : true;

  async function handleCreateDocument(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!docTitleKk.trim() && !docTitleRu.trim()) return;
    setUploadingDoc(true);
    const kindApi = activeSection === 'normative' ? 'NORMATIVE' : activeSection === 'guides' ? 'TEACHER_GUIDE' : 'METHODICAL';
    const titleKk = docTitleKk.trim() || docTitleRu.trim();
    const titleRu = docTitleRu.trim() || docTitleKk.trim();
    const category = docCategory.trim() || (activeSection === 'normative' ? 'Нормативтік құжат' : activeSection === 'guides' ? 'Нұсқаулық' : 'Әдістемелік материал');

    if (demoMode) {
      const localUrl = docFile ? URL.createObjectURL(docFile) : undefined;
      const newRow: ResourceRow = {
        id: `demo-doc-${Date.now()}`,
        kind: activeSection === 'normative' ? 'normative' : activeSection === 'guides' ? 'guide' : 'method',
        title: titleKk,
        ruTitle: titleRu,
        summary: docSummaryKk || docSummaryRu,
        ruSummary: docSummaryRu || docSummaryKk,
        category,
        date: new Date().toLocaleDateString(),
        files: docFile ? [{ id: `f-${Date.now()}`, itemId: 'demo', originalName: docFile.name, mimeType: docFile.type || 'application/pdf', sizeBytes: docFile.size, createdAt: new Date().toISOString() }] : [],
        localUrl,
      };
      setLocalResourceRows((prev) => [newRow, ...prev]);
      setUploadingDoc(false);
      setDocDialogOpen(false);
      setDocTitleKk(''); setDocTitleRu(''); setDocSummaryKk(''); setDocSummaryRu(''); setDocFile(null);
      setToast(language === 'kk' ? 'Құжат жүктелді' : 'Документ загружен');
      return;
    }

    try {
      const created = await apiRequest<ApiLibraryItem>('/library', {
        method: 'POST',
        body: JSON.stringify({
          kind: kindApi,
          category,
          titleKk,
          titleRu,
          summaryKk: docSummaryKk.trim() || undefined,
          summaryRu: docSummaryRu.trim() || undefined,
          isPublished: true,
        }),
      });
      if (docFile) {
        await apiUploadFile(`/library/${created.id}/files`, docFile);
      }
      await onReloadLibrary();
      setDocDialogOpen(false);
      setDocTitleKk(''); setDocTitleRu(''); setDocSummaryKk(''); setDocSummaryRu(''); setDocCategory(''); setDocFile(null);
      setToast(language === 'kk' ? 'Құжат сәтті сақталды' : 'Документ успешно сохранён');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Ошибка загрузки документа');
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleAttachFileToExisting(item: ResourceRow, file: File) {
    if (demoMode) {
      const localUrl = URL.createObjectURL(file);
      const updated: ResourceRow = {
        ...item,
        localUrl,
        files: [{ id: `f-${Date.now()}`, itemId: item.id, originalName: file.name, mimeType: file.type || 'application/pdf', sizeBytes: file.size, createdAt: new Date().toISOString() }, ...item.files],
      };
      setLocalResourceRows((prev) => prev.map((r) => (r.id === item.id ? updated : r)));
      setSelectedResource(updated);
      setSelectedFileIndex(0);
      return;
    }
    try {
      await apiUploadFile(`/library/${item.id}/files`, file);
      await onReloadLibrary();
      const refreshed = await apiRequest<ApiLibraryItem[]>('/library');
      const match = refreshed.find((r) => r.id === item.id);
      if (match) {
        setSelectedResource({
          id: match.id,
          kind: match.kind === 'NORMATIVE' ? 'normative' : match.kind === 'TEACHER_GUIDE' ? 'guide' : 'method',
          title: match.titleKk,
          ruTitle: match.titleRu,
          summary: match.summaryKk ?? match.summaryRu ?? '',
          ruSummary: match.summaryRu ?? match.summaryKk ?? '',
          category: match.category,
          date: match.publishedAt ? new Date(match.publishedAt).toLocaleDateString() : '',
          files: match.files ?? [],
        });
        setSelectedFileIndex(0);
      }
      setToast(language === 'kk' ? 'Файл қосылды' : 'Файл прикреплён');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Не удалось прикрепить файл');
    }
  }

  function canManageResource(item: ResourceRow): boolean {
    if (demoMode) return true;
    if (role === 'admin' || role === 'defectologist') return true;
    if (currentUserId && item.createdById === currentUserId) return true;
    return false;
  }

  async function handleDeleteResource(item: ResourceRow) {
    if (demoMode) {
      setLocalResourceRows((prev) => prev.filter((r) => r.id !== item.id));
      if (selectedResource?.id === item.id) setSelectedResource(null);
      setToast(language === 'kk' ? 'Құжат өшірілді' : 'Документ удалён');
      return;
    }
    try {
      await apiRequest(`/library/${item.id}`, { method: 'DELETE' });
      if (selectedResource?.id === item.id) setSelectedResource(null);
      await onReloadLibrary();
      setToast(language === 'kk' ? 'Құжат өшірілді' : 'Документ удалён');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Не удалось удалить документ');
    }
  }

  async function handleDeleteResourceFile(item: ResourceRow, fileId: string) {
    if (demoMode) {
      const updatedFiles = item.files.filter((f) => f.id !== fileId);
      const updated = { ...item, files: updatedFiles, localUrl: updatedFiles.length === 0 ? undefined : item.localUrl };
      setLocalResourceRows((prev) => prev.map((r) => (r.id === item.id ? updated : r)));
      setSelectedResource(updated);
      setSelectedFileIndex(0);
      setToast(language === 'kk' ? 'Файл өшірілді' : 'Файл удалён');
      return;
    }
    try {
      await apiRequest(`/library/files/${fileId}`, { method: 'DELETE' });
      await onReloadLibrary();
      const refreshed = await apiRequest<ApiLibraryItem[]>('/library');
      const match = refreshed.find((r) => r.id === item.id);
      if (match) {
        setSelectedResource({
          id: match.id,
          createdById: match.createdById,
          kind: match.kind === 'NORMATIVE' ? 'normative' : match.kind === 'TEACHER_GUIDE' ? 'guide' : 'method',
          title: match.titleKk,
          ruTitle: match.titleRu,
          summary: match.summaryKk ?? match.summaryRu ?? '',
          ruSummary: match.summaryRu ?? match.summaryKk ?? '',
          category: match.category,
          date: match.publishedAt ? new Date(match.publishedAt).toLocaleDateString() : '',
          files: match.files ?? [],
        });
        setSelectedFileIndex(0);
      }
      setToast(language === 'kk' ? 'Файл өшірілді' : 'Файл удалён');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Не удалось удалить файл');
    }
  }

  async function submitGoal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedStudentId) return;
    try {
      await apiRequest(`/students/${selectedStudentId}/goals`, {
        method: 'POST',
        body: JSON.stringify({
          subjectId: goalSubjectId || subjectOptions[0]?.id,
          titleKk: goalTitleKk.trim() || goalTitleRu.trim(),
          titleRu: goalTitleRu.trim() || goalTitleKk.trim(),
          successCriteria: goalCriteria.trim(),
        }),
      });
      setGoalDialogOpen(false);
      setGoalTitleKk(''); setGoalTitleRu(''); setGoalCriteria('');
      setToast(language === 'kk' ? 'Оқу мақсаты қосылды' : 'Учебная цель добавлена');
      onRefresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Ошибка сохранения цели');
    }
  }

  async function submitObservation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedStudentId) return;
    try {
      const targetGoalId = obsGoalId || studentInfo?.goals[0]?.id;
      const targetGoal = studentInfo?.goals.find((g) => g.id === targetGoalId);
      await apiRequest(`/students/${selectedStudentId}/observations`, {
        method: 'POST',
        body: JSON.stringify({
          goalId: targetGoalId,
          subjectId: targetGoal?.subject.id ?? subjectOptions[0]?.id,
          observedAt: new Date().toISOString(),
          context: obsContext.trim() || undefined,
          observationText: obsText.trim(),
        }),
      });
      setObsDialogOpen(false);
      setObsContext(''); setObsText('');
      setToast(language === 'kk' ? 'Педагогикалық бақылау сақталды' : 'Педагогическое наблюдение сохранено');
      onRefresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Ошибка сохранения наблюдения');
    }
  }

  async function submitRecommendation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedStudentId) return;
    try {
      await apiRequest(`/students/${selectedStudentId}/recommendations`, {
        method: 'POST',
        body: JSON.stringify({
          goalId: recGoalId || studentInfo?.goals[0]?.id,
          title: recTitle.trim(),
          content: recContent.trim(),
        }),
      });
      setRecDialogOpen(false);
      setRecTitle(''); setRecContent('');
      setToast(language === 'kk' ? 'Маман ұсынымы қосылды' : 'Рекомендация специалиста добавлена');
      onRefresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Ошибка сохранения рекомендации');
    }
  }

  async function submitApplication(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedStudentId || !applyDialogOpen) return;
    try {
      await apiRequest(`/students/${selectedStudentId}/recommendations/${applyDialogOpen}/applications`, {
        method: 'POST',
        body: JSON.stringify({
          appliedAt: new Date().toISOString(),
          outcome: applyOutcome.trim(),
          reflection: applyReflection.trim() || undefined,
        }),
      });
      setApplyDialogOpen(null);
      setApplyOutcome(''); setApplyReflection('');
      setToast(language === 'kk' ? 'Сабақта қолданылу нәтижесі тіркелді' : 'Применение рекомендации на занятии зафиксировано');
      onRefresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Ошибка фиксации применения');
    }
  }

  async function submitAssessment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedStudentId) return;
    const goalId = assessGoalId || selectedGoalId || studentInfo?.goals[0]?.id;
    if (!goalId) {
      setToast(language === 'kk' ? 'Алдымен студентке оқу мақсатын қосыңыз' : 'Сначала добавьте учебную цель студенту');
      return;
    }
    try {
      await apiRequest(`/students/${selectedStudentId}/assessments`, {
        method: 'POST',
        body: JSON.stringify({
          goalId,
          kind: assessKind,
          assessedAt: new Date().toISOString(),
          note: assessNote.trim() || undefined,
          results: [
            { criterion: 'Түсіну', score: Number(scoreUnderstanding) },
            { criterion: 'Орындау', score: Number(scoreExecution) },
            { criterion: 'Дербестік', score: Number(scoreIndependence) },
            { criterion: 'Қатысу', score: Number(scoreParticipation) },
          ],
        }),
      });
      setAssessDialogOpen(false);
      setAssessNote('');
      setToast(language === 'kk' ? 'Бағалау нәтижесі сақталды' : 'Результаты оценки сохранены');
      onRefresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Ошибка сохранения оценки');
    }
  }

  async function submitPlanAction(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedStudentId) return;
    try {
      let planId = studentInfo?.activePlanId;
      if (!planId) {
        const createdPlan = await apiRequest<{ id: string }>(`/students/${selectedStudentId}/plans`, {
          method: 'POST',
          body: JSON.stringify({
            title: `Жеке қолдау жоспары · ${studentInfo?.name ?? ''}`,
            periodStart: new Date().toISOString(),
          }),
        });
        planId = createdPlan.id;
      }
      const responsibleId = actionResponsibleId || studentInfo?.assignments[0]?.user.id || specialistOptions[0]?.id;
      if (!responsibleId) {
        setToast(language === 'kk' ? 'Жауапты маманды таңдаңыз' : 'Выберите ответственного специалиста');
        return;
      }
      await apiRequest(`/students/${selectedStudentId}/plans/${planId}/actions`, {
        method: 'POST',
        body: JSON.stringify({
          goalId: studentInfo?.goals[0]?.id,
          responsibleId,
          titleKk: actionTitleKk.trim() || actionTitleRu.trim(),
          titleRu: actionTitleRu.trim() || actionTitleKk.trim(),
          dueAt: actionDueAt ? new Date(actionDueAt).toISOString() : undefined,
        }),
      });
      setActionDialogOpen(false);
      setActionTitleKk(''); setActionTitleRu('');
      setToast(language === 'kk' ? 'Іс-шара жоспарға қосылды' : 'Мероприятие добавлено в план');
      onRefresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Ошибка добавления мероприятия');
    }
  }

  async function submitAssignment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedStudentId || !assignUserId) return;
    try {
      await apiRequest(`/students/${selectedStudentId}/assignments`, {
        method: 'POST',
        body: JSON.stringify({
          userId: assignUserId,
          subjectId: assignSubjectId || undefined,
        }),
      });
      setAssignDialogOpen(false);
      setAssignUserId(''); setAssignSubjectId('');
      setToast(language === 'kk' ? 'Маман студентке бекітілді' : 'Специалист назначен студенту');
      onRefresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Ошибка назначения специалиста');
    }
  }

  async function submitSupportProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedStudentId || !profileDesc.trim()) return;
    try {
      await apiRequest(`/students/${selectedStudentId}/support-profiles`, {
        method: 'POST',
        body: JSON.stringify({
          category: profileCategory,
          description: profileDesc.trim(),
        }),
      });
      setProfileDialogOpen(false);
      setProfileDesc('');
      setToast(language === 'kk' ? 'Қолдау профилі жаңартылды' : 'Профиль поддержки обновлён');
      onRefresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Ошибка сохранения профиля');
    }
  }

  async function submitPrivateNote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedStudentId || !noteTitle.trim() || !noteContent.trim()) return;
    try {
      await apiRequest(`/students/${selectedStudentId}/private-notes`, {
        method: 'POST',
        body: JSON.stringify({
          title: noteTitle.trim(),
          content: noteContent.trim(),
        }),
      });
      setNoteDialogOpen(false);
      setNoteTitle(''); setNoteContent('');
      setToast(language === 'kk' ? 'Құпия жазба сақталды' : 'Приватная запись сохранена');
      onRefresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Ошибка сохранения приватной записи');
    }
  }

  const activeFile = selectedResource?.files[selectedFileIndex] ?? null;
  const activeFileUrl = selectedResource?.localUrl ?? (activeFile ? getLibraryFileUrl(activeFile.id, false) : null);

  return (
    <div className="section-page">
      <div className="section-page-heading">
        <div>
          <div className="eyebrow">TEN QADAM · {t.demo}</div>
          <h1>{heading}</h1>
          <p>{sectionDescription(activeSection, language)}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {activeSection === 'users' && role === 'admin' && (
            <>
              <Button variant="outlined" startIcon={<AddRounded />} onClick={openGroupDialog}>
                {language === 'kk' ? 'Оқу тобын қосу' : 'Добавить группу'}
              </Button>
              <Button variant="outlined" startIcon={<AddRounded />} onClick={() => setSubjectDialogOpen(true)}>
                {language === 'kk' ? 'Пән қосу' : 'Добавить предмет'}
              </Button>
              <Button variant="contained" startIcon={<AddRounded />} onClick={() => setUserDialogOpen(true)}>
                {language === 'kk' ? 'Пайдаланушы қосу' : 'Создать пользователя'}
              </Button>
            </>
          )}
          {activeSection === 'students' && (demoMode || role === 'defectologist') && (
            <>
              <Button variant="outlined" startIcon={<AddRounded />} onClick={openGroupDialog}>
                {language === 'kk' ? 'Оқу тобын қосу' : 'Добавить учебную группу'}
              </Button>
              <Button variant="contained" startIcon={<AddRounded />} onClick={openStudentDialog}>{t.addStudent}</Button>
            </>
          )}
          {['normative', 'guides', 'library'].includes(activeSection) && canUploadResource && (
            <Button variant="contained" startIcon={<UploadFileRounded />} onClick={() => setDocDialogOpen(true)}>
              {language === 'kk' ? 'Құжат жүктеу (PDF / DOC)' : 'Загрузить документ (PDF / DOC)'}
            </Button>
          )}
          {activeSection === 'metrics' && role !== 'admin' && (role === 'teacher' || role === 'defectologist') && (
            <Button variant="contained" startIcon={<AddRounded />} onClick={() => setAssessDialogOpen(true)}>
              {language === 'kk' ? 'Бағалау енгізу' : 'Внести оценку'}
            </Button>
          )}
          {activeSection === 'plans' && ['defectologist', 'psychologist', 'social'].includes(role) && (
            <Button variant="contained" startIcon={<AddRounded />} onClick={() => setActionDialogOpen(true)}>
              {language === 'kk' ? 'Іс-шара қосу' : 'Добавить мероприятие'}
            </Button>
          )}
          {activeSection === 'reports' && (
            <Button variant="contained" startIcon={<FileDownloadRounded />} onClick={exportReport}>{t.export}</Button>
          )}
        </div>
      </div>

      {/* Student Selector Bar across student-scoped tabs */}
      {role !== 'admin' && ['metrics', 'plans', 'collaboration'].includes(activeSection) && studentRows.length > 0 && (
        <div className="student-selector-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PersonRounded color="primary" />
            <strong>{language === 'kk' ? 'Белсенді студент:' : 'Выбранный студент:'}</strong>
            <Select
              size="small"
              value={selectedStudentId ?? ''}
              onChange={(e) => onSelectStudent(e.target.value)}
              style={{ minWidth: 220, background: '#fff', borderRadius: 10, fontSize: 12 }}
            >
              {studentRows.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name} ({s.group})</MenuItem>
              ))}
            </Select>
          </div>
          {studentInfo && (
            <Chip size="small" color="primary" variant="outlined" label={`${t.goal}: ${studentInfo.goal}`} />
          )}
        </div>
      )}

      {/* TAB: ADMIN USERS & ROLES MANAGEMENT */}
      {activeSection === 'users' && role === 'admin' && (
        <>
          <div className="filter-bar">
            <TextField
              size="small"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`${t.search}...`}
              InputProps={{ startAdornment: <SearchRounded className="search-start" /> }}
            />
            <Chip label={`${filteredAdminUsers.length} ${language === 'kk' ? 'қызметкер' : 'сотрудников'}`} />
          </div>
          <div className="student-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{language === 'kk' ? 'Логин' : 'Логин'}</th>
                  <th>{language === 'kk' ? 'Аты-жөні (ФИО)' : 'ФИО сотрудника'}</th>
                  <th>{language === 'kk' ? 'Тағайындалған рөлі' : 'Назначенная роль'}</th>
                  <th>{language === 'kk' ? 'Мәртебесі' : 'Статус'}</th>
                  <th>{language === 'kk' ? 'Әрекет' : 'Действия'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdminUsers.map((u) => {
                  const currentRoleCode = u.roles[0]?.role.code ?? 'SUBJECT_TEACHER';
                  return (
                    <tr key={u.id}>
                      <td><strong>{u.login}</strong></td>
                      <td>{u.displayName}</td>
                      <td>
                        <Select
                          size="small"
                          value={currentRoleCode}
                          onChange={(e) => void quickChangeRole(u.id, e.target.value as ApiRole)}
                          style={{ minWidth: 225, fontSize: 13.5, borderRadius: 10, background: '#f8faff' }}
                        >
                          {allRolesList.map((r) => (
                            <MenuItem key={r.code} value={r.code}>
                              {language === 'kk' ? r.labelKk : r.labelRu}
                            </MenuItem>
                          ))}
                        </Select>
                      </td>
                      <td>
                        <Select
                          size="small"
                          value={u.status}
                          onChange={(e) => void quickChangeStatus(u.id, e.target.value as 'ACTIVE' | 'SUSPENDED' | 'DISABLED')}
                          style={{ minWidth: 150, fontSize: 13, borderRadius: 10 }}
                        >
                          <MenuItem value="ACTIVE">{language === 'kk' ? 'Белсенді (ACTIVE)' : 'Активен (ACTIVE)'}</MenuItem>
                          <MenuItem value="SUSPENDED">{language === 'kk' ? 'Уақытша шектелген' : 'Приостановлен'}</MenuItem>
                          <MenuItem value="DISABLED">{language === 'kk' ? 'Өшірілген' : 'Отключён'}</MenuItem>
                        </Select>
                      </td>
                      <td>
                        <Button size="small" variant="outlined" onClick={() => openEditUser(u)}>
                          {language === 'kk' ? 'Өңдеу / Құпиясөз' : 'Изменить / Пароль'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredAdminUsers.length === 0 && <p className="empty-state">{t.emptySearch}</p>}
          </div>

          <div className="updates-grid" style={{ marginTop: 18 }}>
            <Paper className="updates-card" elevation={0}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h2 style={{ margin: 0 }}>{language === 'kk' ? `Оқу топтары мен мамандықтар (${groupOptions.length})` : `Учебные группы и специальности (${groupOptions.length})`}</h2>
                <Button size="small" variant="outlined" startIcon={<AddRounded />} onClick={openGroupDialog}>
                  {language === 'kk' ? 'Топ қосу' : 'Добавить группу'}
                </Button>
              </div>
              <div className="student-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{language === 'kk' ? 'Топ коды' : 'Код группы'}</th>
                      <th>{language === 'kk' ? 'Мамандығы' : 'Специальность'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupOptions.map((g) => (
                      <tr key={g.id}>
                        <td><strong>{g.code}</strong></td>
                        <td>{language === 'kk' ? g.specialty.nameKk : g.specialty.nameRu}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Paper>

            <Paper className="updates-card" elevation={0}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h2 style={{ margin: 0 }}>{language === 'kk' ? `Оқу пәндері (${subjectOptions.length})` : `Учебные предметы (${subjectOptions.length})`}</h2>
                <Button size="small" variant="outlined" startIcon={<AddRounded />} onClick={() => setSubjectDialogOpen(true)}>
                  {language === 'kk' ? 'Пән қосу' : 'Добавить предмет'}
                </Button>
              </div>
              <div className="student-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{language === 'kk' ? 'Код' : 'Код'}</th>
                      <th>{language === 'kk' ? 'Пән атауы' : 'Название предмета'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectOptions.map((s) => (
                      <tr key={s.id}>
                        <td className="muted-cell">{s.code}</td>
                        <td><strong>{language === 'kk' ? s.nameKk : s.nameRu}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Paper>
          </div>

          <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} fullWidth maxWidth="xs">
            <form onSubmit={createStaffUser}>
              <DialogTitle>{language === 'kk' ? 'Жаңа пайдаланушы құру және рөл тағайындау' : 'Создание пользователя и назначение роли'}</DialogTitle>
              <DialogContent className="dialog-fields">
                <TextField
                  autoFocus
                  label={language === 'kk' ? 'Аты-жөні (ФИО)' : 'ФИО сотрудника'}
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder={language === 'kk' ? 'Мысалы: Сәрсенова А.Б.' : 'Например: Сарсенова А.Б.'}
                  required
                  fullWidth
                />
                <TextField
                  label={language === 'kk' ? 'Жеке логин' : 'Индивидуальный логин'}
                  value={newLogin}
                  onChange={(e) => setNewLogin(e.target.value)}
                  placeholder="sarsenova"
                  required
                  fullWidth
                />
                <TextField
                  label={language === 'kk' ? 'Құпиясөз (кемінде 8 таңба)' : 'Пароль (минимум 8 символов)'}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  select
                  label={language === 'kk' ? 'Тағайындалатын рөл' : 'Назначаемая роль'}
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as ApiRole)}
                  fullWidth
                >
                  {allRolesList.map((r) => (
                    <MenuItem key={r.code} value={r.code}>
                      {language === 'kk' ? r.labelKk : r.labelRu}
                    </MenuItem>
                  ))}
                </TextField>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setUserDialogOpen(false)}>{t.cancel}</Button>
                <Button type="submit" variant="contained">{t.save}</Button>
              </DialogActions>
            </form>
          </Dialog>

          <Dialog open={editUserDialogOpen} onClose={() => setEditUserDialogOpen(false)} fullWidth maxWidth="xs">
            <form onSubmit={submitEditUser}>
              <DialogTitle>
                {language === 'kk' ? `Пайдаланушыны өңдеу: ${editingUser?.login ?? ''}` : `Редактирование: ${editingUser?.login ?? ''}`}
              </DialogTitle>
              <DialogContent className="dialog-fields">
                <TextField
                  label={language === 'kk' ? 'Аты-жөні (ФИО)' : 'ФИО сотрудника'}
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  select
                  label={language === 'kk' ? 'Рөлі' : 'Назначенная роль'}
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value as ApiRole)}
                  fullWidth
                >
                  {allRolesList.map((r) => (
                    <MenuItem key={r.code} value={r.code}>
                      {language === 'kk' ? r.labelKk : r.labelRu}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label={language === 'kk' ? 'Мәртебесі' : 'Статус учётной записи'}
                  value={editUserStatus}
                  onChange={(e) => setEditUserStatus(e.target.value as 'ACTIVE' | 'SUSPENDED' | 'DISABLED')}
                  fullWidth
                >
                  <MenuItem value="ACTIVE">{language === 'kk' ? 'Белсенді (ACTIVE)' : 'Активен (ACTIVE)'}</MenuItem>
                  <MenuItem value="SUSPENDED">{language === 'kk' ? 'Уақытша шектелген (SUSPENDED)' : 'Приостановлен (SUSPENDED)'}</MenuItem>
                  <MenuItem value="DISABLED">{language === 'kk' ? 'Өшірілген (DISABLED)' : 'Отключён (DISABLED)'}</MenuItem>
                </TextField>
                <TextField
                  label={language === 'kk' ? 'Жаңа құпиясөз (өзгерту қажет болса)' : 'Новый пароль (оставьте пустым, если без изменений)'}
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  fullWidth
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setEditUserDialogOpen(false)}>{t.cancel}</Button>
                <Button type="submit" variant="contained">{t.save}</Button>
              </DialogActions>
            </form>
          </Dialog>
        </>
      )}

      {/* TAB 2: STUDENTS DATABASE & FULL PEDAGOGICAL CYCLE */}
      {activeSection === 'students' && (
        <div className="student-workspace-grid">
          <div>
            <div className="filter-bar">
              <TextField
                size="small"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`${t.search}...`}
                InputProps={{ startAdornment: <SearchRounded className="search-start" /> }}
              />
              <Chip label={`${filteredStudents.length} ${language === 'kk' ? 'студент' : 'студента'}`} />
            </div>
            <div className="student-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{language === 'kk' ? 'Аты-жөні' : 'ФИО'}</th>
                    <th>{language === 'kk' ? 'Тобы' : 'Группа'}</th>
                    <th>{language === 'kk' ? 'Мамандығы' : 'Специальность'}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((row) => (
                    <tr
                      key={row.id}
                      className={selectedStudentId === row.id ? 'selected-row' : ''}
                      onClick={() => onSelectStudent(row.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="muted-cell">{row.code}</td>
                      <td><strong>{row.name}</strong></td>
                      <td>{row.group}</td>
                      <td>{row.specialty}</td>
                      <td>
                        <Button
                          size="small"
                          variant={selectedStudentId === row.id ? 'contained' : 'outlined'}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStudent(row.id);
                            document.getElementById('student-profile-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                        >
                          {t.open}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredStudents.length === 0 && <p className="empty-state">{t.emptySearch}</p>}
            </div>
          </div>

          {/* Right Panel: Detailed Student Profile & Pedagogical Cycle */}
          <Paper id="student-profile-card" className="profile-panel" elevation={0}>
            {studentInfo ? (
              <>
                <div className="student-card-header">
                  <div className="student-card-title">
                    <img src="/assets/student-avatar.svg" alt={studentInfo.name} />
                    <div>
                      <span className="eyebrow">{t.studentCard} · {studentInfo.code}</span>
                      <h2>{studentInfo.name}</h2>
                      <p>{studentInfo.group} · {studentInfo.specialty}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {studentInfo.support.map((sup) => (
                      <Chip key={sup} size="small" className="supporting-chip" label={sup} />
                    ))}
                  </div>
                </div>

                <Tabs
                  value={studentTab}
                  onChange={(_, val) => setStudentTab(val)}
                  className="profile-tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label={t.generalInfo} />
                  <Tab label={language === 'kk' ? `Оқу мақсаттары (${studentInfo.goals.length})` : `Учебные цели (${studentInfo.goals.length})`} />
                  <Tab label={language === 'kk' ? `Бақылаулар (${studentInfo.observations.length})` : `Наблюдения (${studentInfo.observations.length})`} />
                  <Tab label={language === 'kk' ? `Маман ұсынымдары (${studentInfo.recommendations.length})` : `Рекомендации (${studentInfo.recommendations.length})`} />
                  {role === 'psychologist' && (
                    <Tab label={language === 'kk' ? `Құпия жазбалар (${privateNotes.length})` : `Приватные заметки (${privateNotes.length})`} />
                  )}
                </Tabs>

                {/* Sub-tab 0: General Info & Assigned Specialists */}
                {studentTab === 0 && (
                  <div className="cycle-list">
                    <div className="profile-facts">
                      <div className="profile-fact">
                        <span className="fact-icon"><SchoolRounded /></span>
                        <strong>{t.studentNeeds}</strong>
                        <span>{studentInfo.needs}</span>
                      </div>
                      <div className="profile-fact">
                        <span className="fact-icon"><AssignmentRounded /></span>
                        <strong>{t.goal}</strong>
                        <span>{studentInfo.goal}</span>
                      </div>
                      <div className="profile-fact">
                        <span className="fact-icon"><GroupsRounded /></span>
                        <strong>{t.responsible}</strong>
                        <span>
                          {studentInfo.assignments.length > 0
                            ? studentInfo.assignments.map((a) => `${a.user.displayName}${a.subject ? ` (${language === 'kk' ? a.subject.nameKk : a.subject.nameRu})` : ''}`).join(', ')
                            : (language === 'kk' ? 'Дефектолог, Пән оқытушысы, Психолог, Әлеуметтік педагог' : 'Дефектолог, Преподаватель, Психолог, Социальный педагог')}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                      {['defectologist', 'psychologist', 'social'].includes(role) && (
                        <Button size="small" variant="outlined" startIcon={<AddRounded />} onClick={() => setProfileDialogOpen(true)}>
                          {language === 'kk' ? 'Қажеттілік профилін қосу' : 'Добавить профиль поддержки'}
                        </Button>
                      )}
                      {role === 'defectologist' && (
                        <Button size="small" variant="outlined" startIcon={<AddRounded />} onClick={() => setAssignDialogOpen(true)}>
                          {language === 'kk' ? 'Маман бекіту' : 'Назначить специалиста'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-tab 1: Learning Goals */}
                {studentTab === 1 && (
                  <div className="cycle-list">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 11 }}>{language === 'kk' ? 'Жеке оқу мақсаттары' : 'Индивидуальные учебные цели'}</strong>
                      {(role === 'defectologist' || role === 'teacher') && (
                        <Button size="small" variant="contained" startIcon={<AddRounded />} onClick={() => setGoalDialogOpen(true)}>
                          {language === 'kk' ? 'Мақсат қосу' : 'Добавить цель'}
                        </Button>
                      )}
                    </div>
                    {studentInfo.goals.map((g) => (
                      <div className="cycle-card" key={g.id}>
                        <div className="cycle-card-head">
                          <strong>{language === 'kk' ? g.titleKk : g.titleRu}</strong>
                          <Chip size="small" className="status-chip" label={language === 'kk' ? g.subject.nameKk : g.subject.nameRu} />
                        </div>
                        <p>{g.successCriteria}</p>
                      </div>
                    ))}
                    {studentInfo.goals.length === 0 && <p className="empty-state">{language === 'kk' ? 'Оқу мақсаты әлі қосылмаған' : 'Учебные цели пока не добавлены'}</p>}
                  </div>
                )}

                {/* Sub-tab 2: Pedagogical Observations */}
                {studentTab === 2 && (
                  <div className="cycle-list">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 11 }}>{language === 'kk' ? '1-қадам: Оқытушының сабақтағы бақылауы' : 'Шаг 1: Педагогические наблюдения на занятии'}</strong>
                      {(role === 'teacher' || role === 'defectologist') && (
                        <Button size="small" variant="contained" startIcon={<AddRounded />} onClick={() => setObsDialogOpen(true)}>
                          {language === 'kk' ? 'Бақылау тіркеу' : 'Добавить наблюдение'}
                        </Button>
                      )}
                    </div>
                    {studentInfo.observations.map((obs) => (
                      <div className="cycle-card" key={obs.id}>
                        <div className="cycle-card-head">
                          <strong>{obs.context || (language === 'kk' ? 'Сабақтағы бақылау' : 'Наблюдение на занятии')}</strong>
                          <time>{new Date(obs.observedAt).toLocaleDateString()}</time>
                        </div>
                        <p>{obs.observationText}</p>
                        <div className="cycle-meta">
                          <span>{obs.author.displayName}</span>
                          {obs.goal && <span>{language === 'kk' ? obs.goal.titleKk : obs.goal.titleRu}</span>}
                        </div>
                      </div>
                    ))}
                    {studentInfo.observations.length === 0 && (
                      <p className="empty-state">{language === 'kk' ? 'Педагогикалық бақылаулар жоқ' : 'Педагогических наблюдений пока нет'}</p>
                    )}
                  </div>
                )}

                {/* Sub-tab 3: Specialist Recommendations & Classroom Application */}
                {studentTab === 3 && (
                  <div className="cycle-list">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 11 }}>{language === 'kk' ? '2–3 қадам: Маман ұсынымы және сабақта қолдану' : 'Шаги 2–3: Рекомендации специалистов и применение на уроке'}</strong>
                      {['defectologist', 'psychologist', 'social'].includes(role) && (
                        <Button size="small" variant="contained" startIcon={<AddRounded />} onClick={() => setRecDialogOpen(true)}>
                          {language === 'kk' ? 'Ұсыным беру' : 'Дать рекомендацию'}
                        </Button>
                      )}
                    </div>
                    {studentInfo.recommendations.map((rec) => (
                      <div className="cycle-card" key={rec.id}>
                        <div className="cycle-card-head">
                          <strong>{rec.title}</strong>
                          <Chip
                            size="small"
                            className={`action-status ${rec.applications.length > 0 ? 'done' : 'progress'}`}
                            label={rec.applications.length > 0 ? (language === 'kk' ? 'Сабақта қолданылды' : 'Применено на занятии') : (language === 'kk' ? 'Ұсынылды' : 'Рекомендовано')}
                          />
                        </div>
                        <p>{rec.content}</p>
                        {rec.applications.map((app) => (
                          <Alert key={app.id} severity="success" style={{ marginTop: 6, padding: '2px 10px', fontSize: 10 }}>
                            <strong>{app.appliedBy.displayName} ({new Date(app.appliedAt).toLocaleDateString()}):</strong> {app.outcome}
                          </Alert>
                        ))}
                        <div className="cycle-meta">
                          <span>{rec.author.displayName}</span>
                          {(role === 'teacher' || role === 'defectologist') && (
                            <Button size="small" variant="outlined" onClick={() => setApplyDialogOpen(rec.id)}>
                              {language === 'kk' ? 'Сабақта қолданылғанын белгілеу' : 'Отметить применение на уроке'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {studentInfo.recommendations.length === 0 && (
                      <p className="empty-state">{language === 'kk' ? 'Маман ұсынымдары әзірге жоқ' : 'Рекомендаций специалистов пока нет'}</p>
                    )}
                  </div>
                )}

                {/* Sub-tab 4: Psychologist Private Notes */}
                {studentTab === 4 && role === 'psychologist' && (
                  <div className="cycle-list">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 11 }}>{language === 'kk' ? 'Тек психологке қолжетімді құпия жазбалар' : 'Конфиденциальные заметки педагога-психолога'}</strong>
                      <Button size="small" variant="contained" startIcon={<AddRounded />} onClick={() => setNoteDialogOpen(true)}>
                        {language === 'kk' ? 'Жазба қосу' : 'Добавить запись'}
                      </Button>
                    </div>
                    {privateNotes.map((note) => (
                      <div className="cycle-card" key={note.id}>
                        <div className="cycle-card-head">
                          <strong><LockRounded style={{ fontSize: 13, verticalAlign: 'middle', marginRight: 4 }} />{note.title}</strong>
                          <time>{new Date(note.createdAt).toLocaleDateString()}</time>
                        </div>
                        <p>{note.content}</p>
                      </div>
                    ))}
                    {privateNotes.length === 0 && <p className="empty-state">{language === 'kk' ? 'Құпия жазбалар жоқ' : 'Конфиденциальных записей пока нет'}</p>}
                  </div>
                )}
              </>
            ) : (
              <div className="profile-empty">
                <GroupsRounded />
                <strong>{language === 'kk' ? 'Тізімнен студентті таңдаңыз' : 'Выберите студента из списка'}</strong>
              </div>
            )}
          </Paper>
        </div>
      )}

      {/* TABS 1, 3, 7: NORMATIVE DOCUMENTS, TEACHER GUIDES, METHODICAL LIBRARY */}
      {['normative', 'guides', 'library'].includes(activeSection) && (
        <>
          <div className="filter-bar">
            <TextField
              size="small"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`${t.search}...`}
              InputProps={{ startAdornment: <SearchRounded className="search-start" /> }}
            />
            <Chip label={activeSection === 'normative' ? 'PDF · DOC · Нормативтік база' : language === 'kk' ? 'PDF · Бейімдеу материалдары' : 'PDF · Методические материалы'} />
          </div>
          <div className="resource-grid">
            {filteredResources.map((item) => (
              <Paper className="resource-card" key={item.id} elevation={0}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="resource-icon"><DescriptionRounded /></div>
                  <Chip
                    size="small"
                    color={item.files.length > 0 || item.localUrl ? 'primary' : 'default'}
                    variant="outlined"
                    label={item.files.length > 0 ? `${item.files[0].originalName.split('.').pop()?.toUpperCase() ?? 'PDF'}` : 'PDF'}
                  />
                </div>
                <span className="resource-category">{item.category}</span>
                <h2>{language === 'kk' ? item.title : item.ruTitle}</h2>
                <p>{language === 'kk' ? item.summary : item.ruSummary}</p>
                <div className="resource-footer">
                  <time>{item.date}</time>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {canManageResource(item) && (
                      <Tooltip title={language === 'kk' ? 'Құжатты өшіру' : 'Удалить документ'}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => void handleDeleteResource(item)}
                        >
                          <DeleteOutlineRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {item.files[0] && !demoMode && (
                      <Tooltip title={language === 'kk' ? 'Жүктеп алу' : 'Скачать файл'}>
                        <IconButton
                          size="small"
                          component="a"
                          href={getLibraryFileUrl(item.files[0].id, true)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FileDownloadRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityRounded />}
                      onClick={() => {
                        setSelectedResource(item);
                        setSelectedFileIndex(0);
                      }}
                    >
                      {language === 'kk' ? 'Қарау' : 'Просмотр'}
                    </Button>
                  </div>
                </div>
              </Paper>
            ))}
          </div>
          {filteredResources.length === 0 && <p className="empty-state">{t.emptySearch}</p>}
        </>
      )}

      {/* TAB 4: LEARNING INDICATORS (METRICS) */}
      {activeSection === 'metrics' && (
        <Paper className="section-chart-card" elevation={0}>
          <div className="chart-meta">
            <div>
              <strong>
                {role === 'admin'
                  ? (language === 'kk' ? 'Колледж бойынша жинақталған білім динамикасы (жеке дерексіз)' : 'Сводная учебная динамика по колледжу (без персональных данных)')
                  : studentInfo
                    ? `${language === 'kk' ? 'Студент' : 'Студент'}: ${studentInfo.name} (${studentInfo.group}) · ${studentInfo.specialty}`
                    : t.metrics}
              </strong>
              <div style={{ marginTop: 4, fontSize: 11, color: '#586382' }}>{studentInfo?.goal ?? t.notice}</div>
            </div>
            {role !== 'admin' && studentInfo && studentInfo.goals.length > 1 && (
              <Select
                size="small"
                value={selectedGoalId ?? studentInfo.goals[0]?.id ?? ''}
                onChange={(e) => onSelectGoal(e.target.value)}
                style={{ minWidth: 220, fontSize: 11 }}
              >
                {studentInfo.goals.map((g) => (
                  <MenuItem key={g.id} value={g.id}>{language === 'kk' ? g.titleKk : g.titleRu}</MenuItem>
                ))}
              </Select>
            )}
          </div>
          <BarChart language={language} data={metricRows} />
          <div className="chart-legend">
            <span><i className="legend-blue" />{t.baseline}</span>
            <span><i className="legend-green" />{t.reassessment}</span>
          </div>
          <div className="chart-disclaimer">{t.notice}</div>
        </Paper>
      )}

      {/* TAB 5: INDIVIDUAL SUPPORT PLAN */}
      {activeSection === 'plans' && (
        <Paper className="plan-list-card" elevation={0}>
          <div className="plan-student-head">
            <div>
              <span className="eyebrow">{language === 'kk' ? 'Жеке қолдау жоспары' : 'ИНДИВИДУАЛЬНЫЙ ПЛАН ПОДДЕРЖКИ'}</span>
              <h2>{studentInfo ? `${studentInfo.name} · ${studentInfo.group}` : (language === 'kk' ? 'Студент таңдалмаған' : 'Студент не выбран')}</h2>
            </div>
            <Chip className="status-chip" label={language === 'kk' ? 'Белсенді' : 'Активен'} />
          </div>
          {planActions.map((action) => (
            <PlanActionRow key={action.id} action={action} language={language} t={t} changePlanStatus={changePlanStatus} />
          ))}
          {planActions.length === 0 && <p className="empty-state">{language === 'kk' ? 'Қолдау жоспарында іс-шаралар әзірге жоқ' : 'В плане поддержки пока нет мероприятий'}</p>}
          {['defectologist', 'psychologist', 'social'].includes(role) && (
            <Button variant="outlined" startIcon={<AddRounded />} className="add-action-button" onClick={() => setActionDialogOpen(true)}>
              {language === 'kk' ? 'Іс-шара қосу' : 'Добавить мероприятие'}
            </Button>
          )}
        </Paper>
      )}

      {/* TAB 6: SPECIALIST COLLABORATION (CHAT) */}
      {activeSection === 'collaboration' && (
        <CollaborationPanel
          language={language}
          t={t}
          messages={messages}
          messageText={messageText}
          setMessageText={setMessageText}
          sendMessage={sendMessage}
          studentInfo={studentInfo}
          demoMode={demoMode}
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={onSelectThread}
          onCreateThread={onCreateThread}
          onRefresh={onRefresh}
        />
      )}

      {/* TAB 8: DOCUMENTS & REPORTS */}
      {activeSection === 'reports' && (
        <div className="reports-grid">
          <Paper className="report-summary" elevation={0}>
            <div className="report-icon"><TrendingUpRounded /></div>
            <span>{t.planProgress}</span>
            <strong>{demoMode ? '78%' : summary ? `${summary.actionCompletion}%` : '—'}</strong>
            <small>{language === 'kk' ? 'Қолдау жоспары іс-шараларының орындалу үлесі' : 'Доля выполненных мероприятий плана поддержки'}</small>
          </Paper>
          <Paper className="report-summary" elevation={0}>
            <div className="report-icon teal"><CheckCircleRounded /></div>
            <span>{language === 'kk' ? 'Маман ұсынымының сабақта қолданылу үлесі' : 'Доля рекомендаций, применённых на занятиях'}</span>
            <strong>{demoMode ? '85%' : summary ? `${summary.recommendationsApplied ?? 100}%` : '—'}</strong>
            <small>{language === 'kk' ? 'Жеке дерексіз жиынтық индикатор' : 'Обезличенный сводный индикатор'}</small>
          </Paper>
          <Paper className="report-table-card" elevation={0}>
            <h2>{language === 'kk' ? 'Оқу мақсаттары бойынша жиынтық динамика (Бастапқы vs Қайта бағалау)' : 'Сводная динамика по учебным целям (Первичная vs Повторная оценка)'}</h2>
            <BarChart language={language} data={metricRows} />
            <div className="chart-legend">
              <span><i className="legend-blue" />{t.baseline}</span>
              <span><i className="legend-green" />{t.reassessment}</span>
            </div>
            <Alert severity="info" icon={false}>
              {language === 'kk'
                ? 'Есептерде жеке медициналық диагноздар жиналмайды. CSV экспорты тек оқу мақсаттарының орындалу динамикасын қамтиды.'
                : 'В отчётах не собираются медицинские диагнозы. CSV-экспорт содержит только динамику достижения учебных целей.'}
            </Alert>
          </Paper>
        </div>
      )}

      {/* IN-APP DOCUMENT VIEWER DIALOG (PDF / IMAGES / OTHER FILES) */}
      <Dialog open={Boolean(selectedResource)} onClose={() => setSelectedResource(null)} fullWidth maxWidth="lg">
        {selectedResource && (
          <>
            <DialogTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div>{language === 'kk' ? selectedResource.title : selectedResource.ruTitle}</div>
                <div className="resource-dialog-category" style={{ margin: 0 }}>{selectedResource.category} · {selectedResource.date}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {canManageResource(selectedResource) && (
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    startIcon={<DeleteOutlineRounded />}
                    onClick={() => void handleDeleteResource(selectedResource)}
                  >
                    {language === 'kk' ? 'Құжатты өшіру' : 'Удалить документ'}
                  </Button>
                )}
                {canUploadResource && (
                  <Button component="label" size="small" variant="outlined" startIcon={<UploadFileRounded />}>
                    {language === 'kk' ? 'Файл тіркеу' : 'Прикрепить файл'}
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleAttachFileToExisting(selectedResource, f);
                      }}
                    />
                  </Button>
                )}
                {activeFile && canManageResource(selectedResource) && (
                  <Button
                    size="small"
                    color="error"
                    variant="text"
                    startIcon={<DeleteOutlineRounded />}
                    onClick={() => void handleDeleteResourceFile(selectedResource, activeFile.id)}
                  >
                    {language === 'kk' ? 'Файлды өшіру' : 'Удалить файл'}
                  </Button>
                )}
                {activeFile && !demoMode && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<FileDownloadRounded />}
                    component="a"
                    href={getLibraryFileUrl(activeFile.id, true)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {language === 'kk' ? 'Жүктеу' : 'Скачать'}
                  </Button>
                )}
              </div>
            </DialogTitle>
            <DialogContent>
              <p style={{ marginTop: 0, fontSize: 12, color: '#45506e' }}>
                {language === 'kk' ? selectedResource.summary : selectedResource.ruSummary}
              </p>
              {selectedResource.files.length > 0 && (
                <div className="doc-file-chips" style={{ marginBottom: 10 }}>
                  {selectedResource.files.map((f, idx) => (
                    <Chip
                      key={f.id}
                      label={f.originalName}
                      color={idx === selectedFileIndex ? 'primary' : 'default'}
                      onClick={() => setSelectedFileIndex(idx)}
                      onDelete={canManageResource(selectedResource) ? () => void handleDeleteResourceFile(selectedResource, f.id) : undefined}
                      clickable
                    />
                  ))}
                </div>
              )}
              {activeFileUrl ? (
                activeFile?.mimeType.startsWith('image/') ? (
                  <img className="doc-preview-image" src={activeFileUrl} alt={activeFile.originalName} />
                ) : (activeFile?.mimeType === 'application/pdf' || activeFile?.originalName.toLowerCase().endsWith('.pdf') || selectedResource.localUrl) ? (
                  <iframe
                    className="doc-viewer-frame"
                    src={activeFileUrl}
                    title={activeFile?.originalName ?? selectedResource.title}
                  />
                ) : (
                  <Paper elevation={0} style={{ padding: 24, textAlign: 'center', border: '1px solid #dce2f1', background: '#f8f9fe' }}>
                    <DescriptionRounded style={{ fontSize: 44, color: '#316bda' }} />
                    <h3 style={{ margin: '8px 0 4px' }}>{activeFile?.originalName}</h3>
                    <p style={{ fontSize: 12, color: '#697592', marginBottom: 14 }}>
                      {language === 'kk'
                        ? 'Бұл форматтағы құжатты тікелей жүктеп алып қарауға болады.'
                        : 'Документ данного формата доступен для прямого скачивания и просмотра.'}
                    </p>
                    {activeFile && (
                      <Button
                        variant="contained"
                        startIcon={<FileDownloadRounded />}
                        component="a"
                        href={getLibraryFileUrl(activeFile.id, true)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {language === 'kk' ? 'Файлды жүктеу' : 'Скачать документ'}
                      </Button>
                    )}
                  </Paper>
                )
              ) : (
                <Alert severity="info">
                  {language === 'kk'
                    ? 'Бұл жазбаға әлі файл тіркелмеген. Жоғарыдағы «Файл тіркеу» батырмасы арқылы PDF немесе басқа құжатты жүктей аласыз.'
                    : 'К этой записи ещё не прикреплён файл. Нажмите «Прикрепить файл» выше, чтобы загрузить PDF или другой документ.'}
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedResource(null)}>{language === 'kk' ? 'Жабу' : 'Закрыть'}</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* UPLOAD DOCUMENT DIALOG */}
      <Dialog open={docDialogOpen} onClose={() => setDocDialogOpen(false)} fullWidth maxWidth="sm">
        <form onSubmit={handleCreateDocument}>
          <DialogTitle>
            {language === 'kk' ? 'Жаңа құжат немесе материал жүктеу' : 'Загрузка нового документа или материала'}
          </DialogTitle>
          <DialogContent className="dialog-fields">
            <TextField
              label={language === 'kk' ? 'Санат (мысалы: Бұйрық, Чек-парақ, Нұсқаулық)' : 'Категория (например: Приказ, Чек-лист, Инструкция)'}
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label={language === 'kk' ? 'Атауы (Қазақша)' : 'Название (на казахском)'}
              value={docTitleKk}
              onChange={(e) => setDocTitleKk(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label={language === 'kk' ? 'Атауы (Орысша)' : 'Название (на русском)'}
              value={docTitleRu}
              onChange={(e) => setDocTitleRu(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label={language === 'kk' ? 'Қысқаша сипаттамасы (Қазақша)' : 'Краткое описание (на казахском)'}
              value={docSummaryKk}
              onChange={(e) => setDocSummaryKk(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label={language === 'kk' ? 'Қысқаша сипаттамасы (Орысша)' : 'Краткое описание (на русском)'}
              value={docSummaryRu}
              onChange={(e) => setDocSummaryRu(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
            <Button component="label" variant="outlined" startIcon={<UploadFileRounded />} fullWidth>
              {docFile ? `${docFile.name} (${Math.round(docFile.size / 1024)} KB)` : (language === 'kk' ? 'PDF, DOCX, PNG файлды таңдау' : 'Выбрать файл (PDF, DOCX, PNG)')}
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
              />
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDocDialogOpen(false)}>{t.cancel}</Button>
            <Button type="submit" variant="contained" disabled={uploadingDoc}>{uploadingDoc ? '…' : t.save}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG: ADD LEARNING GOAL */}
      <Dialog open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)} fullWidth maxWidth="xs">
        <form onSubmit={submitGoal}>
          <DialogTitle>{language === 'kk' ? 'Жеке оқу мақсатын қосу' : 'Добавить индивидуальную учебную цель'}</DialogTitle>
          <DialogContent className="dialog-fields">
            <TextField
              select
              label={t.subject}
              value={goalSubjectId || subjectOptions[0]?.id || ''}
              onChange={(e) => setGoalSubjectId(e.target.value)}
              required
              fullWidth
            >
              {subjectOptions.map((sub) => (
                <MenuItem key={sub.id} value={sub.id}>{language === 'kk' ? sub.nameKk : sub.nameRu}</MenuItem>
              ))}
            </TextField>
            <TextField label={language === 'kk' ? 'Мақсат (Қазақша)' : 'Цель (на казахском)'} value={goalTitleKk} onChange={(e) => setGoalTitleKk(e.target.value)} required fullWidth />
            <TextField label={language === 'kk' ? 'Мақсат (Орысша)' : 'Цель (на русском)'} value={goalTitleRu} onChange={(e) => setGoalTitleRu(e.target.value)} required fullWidth />
            <TextField label={language === 'kk' ? 'Орындалу критерийі' : 'Критерии достижения'} value={goalCriteria} onChange={(e) => setGoalCriteria(e.target.value)} multiline rows={2} required fullWidth />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGoalDialogOpen(false)}>{t.cancel}</Button>
            <Button type="submit" variant="contained">{t.save}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG: ADD OBSERVATION */}
      <Dialog open={obsDialogOpen} onClose={() => setObsDialogOpen(false)} fullWidth maxWidth="xs">
        <form onSubmit={submitObservation}>
          <DialogTitle>{language === 'kk' ? 'Педагогикалық бақылау енгізу' : 'Добавить педагогическое наблюдение'}</DialogTitle>
          <DialogContent className="dialog-fields">
            {studentInfo && studentInfo.goals.length > 0 && (
              <TextField
                select
                label={t.goal}
                value={obsGoalId || studentInfo.goals[0]?.id || ''}
                onChange={(e) => setObsGoalId(e.target.value)}
                fullWidth
              >
                {studentInfo.goals.map((g) => (
                  <MenuItem key={g.id} value={g.id}>{language === 'kk' ? g.titleKk : g.titleRu}</MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label={language === 'kk' ? 'Сабақ / тапсырма контексті' : 'Контекст занятия / задания'}
              value={obsContext}
              onChange={(e) => setObsContext(e.target.value)}
              placeholder={language === 'kk' ? 'Мысалы: Электртехника · Схеманы оқу' : 'Например: Электротехника · Чтение схемы'}
              fullWidth
            />
            <TextField
              label={language === 'kk' ? 'Бақылау мазмұны' : 'Описание наблюдения'}
              value={obsText}
              onChange={(e) => setObsText(e.target.value)}
              multiline
              rows={3}
              required
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setObsDialogOpen(false)}>{t.cancel}</Button>
            <Button type="submit" variant="contained">{t.save}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG: ADD RECOMMENDATION */}
      <Dialog open={recDialogOpen} onClose={() => setRecDialogOpen(false)} fullWidth maxWidth="xs">
        <form onSubmit={submitRecommendation}>
          <DialogTitle>{language === 'kk' ? 'Маман ұсынымын қосу' : 'Добавить рекомендацию специалиста'}</DialogTitle>
          <DialogContent className="dialog-fields">
            {studentInfo && studentInfo.goals.length > 0 && (
              <TextField
                select
                label={t.goal}
                value={recGoalId || studentInfo.goals[0]?.id || ''}
                onChange={(e) => setRecGoalId(e.target.value)}
                fullWidth
              >
                {studentInfo.goals.map((g) => (
                  <MenuItem key={g.id} value={g.id}>{language === 'kk' ? g.titleKk : g.titleRu}</MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label={language === 'kk' ? 'Ұсыным тақырыбы' : 'Заголовок рекомендации'}
              value={recTitle}
              onChange={(e) => setRecTitle(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label={language === 'kk' ? 'Нақты педагогикалық әрекет / бейімдеу жолы' : 'Конкретные шаги адаптации задания'}
              value={recContent}
              onChange={(e) => setRecContent(e.target.value)}
              multiline
              rows={3}
              required
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRecDialogOpen(false)}>{t.cancel}</Button>
            <Button type="submit" variant="contained">{t.save}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG: APPLY RECOMMENDATION IN CLASS */}
      <Dialog open={Boolean(applyDialogOpen)} onClose={() => setApplyDialogOpen(null)} fullWidth maxWidth="xs">
        <form onSubmit={submitApplication}>
          <DialogTitle>{language === 'kk' ? 'Ұсынымды сабақта қолдану нәтижесі' : 'Применение рекомендации на занятии'}</DialogTitle>
          <DialogContent className="dialog-fields">
            <TextField
              label={language === 'kk' ? 'Қолдану нәтижесі' : 'Результат применения'}
              value={applyOutcome}
              onChange={(e) => setApplyOutcome(e.target.value)}
              placeholder={language === 'kk' ? 'Ірілендірілген карточкалар қолданылды, 3 қадам орындалды' : 'Применены карточки, студент выполнил все 3 шага'}
              required
              fullWidth
            />
            <TextField
              label={language === 'kk' ? 'Оқытушының қосымша ескертпесі' : 'Комментарий преподавателя'}
              value={applyReflection}
              onChange={(e) => setApplyReflection(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApplyDialogOpen(null)}>{t.cancel}</Button>
            <Button type="submit" variant="contained">{t.save}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG: ADD ASSESSMENT (BASELINE / REASSESSMENT) */}
      <Dialog open={assessDialogOpen} onClose={() => setAssessDialogOpen(false)} fullWidth maxWidth="xs">
        <form onSubmit={submitAssessment}>
          <DialogTitle>{language === 'kk' ? 'Оқу мақсаты бойынша бағалау' : 'Оценка по учебной цели'}</DialogTitle>
          <DialogContent className="dialog-fields">
            {studentInfo && studentInfo.goals.length > 0 && (
              <TextField
                select
                label={t.goal}
                value={assessGoalId || selectedGoalId || studentInfo.goals[0]?.id || ''}
                onChange={(e) => setAssessGoalId(e.target.value)}
                fullWidth
              >
                {studentInfo.goals.map((g) => (
                  <MenuItem key={g.id} value={g.id}>{language === 'kk' ? g.titleKk : g.titleRu}</MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              select
              label={language === 'kk' ? 'Бағалау түрі' : 'Тип оценки'}
              value={assessKind}
              onChange={(e) => setAssessKind(e.target.value as 'BASELINE' | 'REASSESSMENT')}
              fullWidth
            >
              <MenuItem value="BASELINE">{t.baseline}</MenuItem>
              <MenuItem value="REASSESSMENT">{t.reassessment}</MenuItem>
            </TextField>
            <TextField
              type="number"
              label={language === 'kk' ? 'Түсіну (0 - 100 %)' : 'Понимание (0 - 100 %)'}
              value={scoreUnderstanding}
              onChange={(e) => setScoreUnderstanding(Number(e.target.value))}
              inputProps={{ min: 0, max: 100 }}
              required
              fullWidth
            />
            <TextField
              type="number"
              label={language === 'kk' ? 'Орындау (0 - 100 %)' : 'Выполнение (0 - 100 %)'}
              value={scoreExecution}
              onChange={(e) => setScoreExecution(Number(e.target.value))}
              inputProps={{ min: 0, max: 100 }}
              required
              fullWidth
            />
            <TextField
              type="number"
              label={language === 'kk' ? 'Дербестік (0 - 100 %)' : 'Самостоятельность (0 - 100 %)'}
              value={scoreIndependence}
              onChange={(e) => setScoreIndependence(Number(e.target.value))}
              inputProps={{ min: 0, max: 100 }}
              required
              fullWidth
            />
            <TextField
              type="number"
              label={language === 'kk' ? 'Қатысу (0 - 100 %)' : 'Участие (0 - 100 %)'}
              value={scoreParticipation}
              onChange={(e) => setScoreParticipation(Number(e.target.value))}
              inputProps={{ min: 0, max: 100 }}
              required
              fullWidth
            />
            <TextField
              label={language === 'kk' ? 'Ескертпе' : 'Примечание'}
              value={assessNote}
              onChange={(e) => setAssessNote(e.target.value)}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssessDialogOpen(false)}>{t.cancel}</Button>
            <Button type="submit" variant="contained">{t.save}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG: ADD SUPPORT PLAN ACTION */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} fullWidth maxWidth="xs">
        <form onSubmit={submitPlanAction}>
          <DialogTitle>{language === 'kk' ? 'Қолдау жоспарына іс-шара қосу' : 'Добавить мероприятие в план поддержки'}</DialogTitle>
          <DialogContent className="dialog-fields">
            <TextField
              label={language === 'kk' ? 'Іс-шара атауы (Қазақша)' : 'Название мероприятия (на казахском)'}
              value={actionTitleKk}
              onChange={(e) => setActionTitleKk(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label={language === 'kk' ? 'Іс-шара атауы (Орысша)' : 'Название мероприятия (на русском)'}
              value={actionTitleRu}
              onChange={(e) => setActionTitleRu(e.target.value)}
              required
              fullWidth
            />
            <TextField
              select
              label={language === 'kk' ? 'Жауапты маман' : 'Ответственный специалист'}
              value={actionResponsibleId || studentInfo?.assignments[0]?.user.id || ''}
              onChange={(e) => setActionResponsibleId(e.target.value)}
              required
              fullWidth
            >
              {(studentInfo?.assignments.length
                ? studentInfo.assignments.map((a) => ({ id: a.user.id, name: a.user.displayName }))
                : specialistOptions.map((s) => ({ id: s.id, name: s.displayName }))
              ).map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              type="date"
              label={language === 'kk' ? 'Орындалу мерзімі' : 'Срок выполнения'}
              value={actionDueAt}
              onChange={(e) => setActionDueAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActionDialogOpen(false)}>{t.cancel}</Button>
            <Button type="submit" variant="contained">{t.save}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG: ASSIGN SPECIALIST TO STUDENT */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} fullWidth maxWidth="xs">
        <form onSubmit={submitAssignment}>
          <DialogTitle>{language === 'kk' ? 'Студентке маман бекіту' : 'Назначить специалиста студенту'}</DialogTitle>
          <DialogContent className="dialog-fields">
            <TextField
              select
              label={language === 'kk' ? 'Маман' : 'Специалист'}
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              required
              fullWidth
            >
              {specialistOptions.map((sp) => (
                <MenuItem key={sp.id} value={sp.id}>
                  {sp.displayName} ({sp.roles.map((r) => (language === 'kk' ? r.role.labelKk : r.role.labelRu)).join(', ')})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={language === 'kk' ? 'Пән (тек пән оқытушысы үшін)' : 'Предмет (для предметного преподавателя)'}
              value={assignSubjectId}
              onChange={(e) => setAssignSubjectId(e.target.value)}
              fullWidth
            >
              <MenuItem value="">{language === 'kk' ? 'Жалпы сүйемелдеу (пәнсіз)' : 'Общее сопровождение'}</MenuItem>
              {subjectOptions.map((sub) => (
                <MenuItem key={sub.id} value={sub.id}>{language === 'kk' ? sub.nameKk : sub.nameRu}</MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignDialogOpen(false)}>{t.cancel}</Button>
            <Button type="submit" variant="contained">{t.save}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG: ADD SUPPORT PROFILE */}
      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} fullWidth maxWidth="xs">
        <form onSubmit={submitSupportProfile}>
          <DialogTitle>{language === 'kk' ? 'Білім алу қажеттілігі мен қолдау түрі' : 'Образовательные потребности и поддержка'}</DialogTitle>
          <DialogContent className="dialog-fields">
            {role === 'defectologist' && (
              <TextField
                select
                label={t.supportTypes}
                value={profileCategory}
                onChange={(e) => setProfileCategory(e.target.value)}
                fullWidth
              >
                <MenuItem value="PEDAGOGICAL">{language === 'kk' ? 'Педагогикалық қолдау' : 'Педагогическая поддержка'}</MenuItem>
                <MenuItem value="PSYCHOLOGICAL">{language === 'kk' ? 'Психологиялық қолдау' : 'Психологическая поддержка'}</MenuItem>
                <MenuItem value="SOCIAL">{language === 'kk' ? 'Әлеуметтік қолдау' : 'Социальная поддержка'}</MenuItem>
              </TextField>
            )}
            <TextField
              label={language === 'kk' ? 'Қолдау шараларының сипаттамасы (диагнозсыз)' : 'Описание мер поддержки (без медицинских диагнозов)'}
              value={profileDesc}
              onChange={(e) => setProfileDesc(e.target.value)}
              multiline
              rows={3}
              required
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProfileDialogOpen(false)}>{t.cancel}</Button>
            <Button type="submit" variant="contained">{t.save}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG: ADD PSYCHOLOGIST PRIVATE NOTE */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} fullWidth maxWidth="xs">
        <form onSubmit={submitPrivateNote}>
          <DialogTitle>{language === 'kk' ? 'Психологтің құпия жазбасы' : 'Приватная запись педагога-психолога'}</DialogTitle>
          <DialogContent className="dialog-fields">
            <Alert severity="info">
              {language === 'kk' ? 'Бұл жазба басқа рөлдерге және әкімшілікке көрінбейді.' : 'Эта запись скрыта от других ролей и администрации.'}
            </Alert>
            <TextField label={language === 'kk' ? 'Тақырыбы' : 'Заголовок'} value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} required fullWidth />
            <TextField label={language === 'kk' ? 'Мазмұны' : 'Содержание'} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} multiline rows={3} required fullWidth />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNoteDialogOpen(false)}>{t.cancel}</Button>
            <Button type="submit" variant="contained">{t.save}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG: ADD SUBJECT */}
      <Dialog open={subjectDialogOpen} onClose={() => setSubjectDialogOpen(false)} fullWidth maxWidth="xs">
        <form onSubmit={submitSubject}>
          <DialogTitle>{language === 'kk' ? 'Жаңа оқу пәнін қосу' : 'Добавить учебный предмет'}</DialogTitle>
          <DialogContent className="dialog-fields">
            <TextField
              autoFocus
              label={language === 'kk' ? 'Пән коды (мысалы: ELECTRO-1)' : 'Код предмета (например: ELECTRO-1)'}
              value={newSubjectCode}
              onChange={(e) => setNewSubjectCode(e.target.value)}
              placeholder="ELECTRO-1"
              required
              fullWidth
            />
            <TextField
              label={language === 'kk' ? 'Пән атауы (Қазақша)' : 'Название предмета (на казахском)'}
              value={newSubjectNameKk}
              onChange={(e) => setNewSubjectNameKk(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label={language === 'kk' ? 'Пән атауы (Орысша)' : 'Название предмета (на русском)'}
              value={newSubjectNameRu}
              onChange={(e) => setNewSubjectNameRu(e.target.value)}
              required
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSubjectDialogOpen(false)}>{t.cancel}</Button>
            <Button type="submit" variant="contained">{t.save}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

function sectionDescription(section: SectionKey, language: Language) {
  const kk: Partial<Record<SectionKey, string>> = {
    users: 'Жаңа мамандарды тіркеу, рөлдерді (Дефектолог, Оқытушы, Психолог, Әлеуметтік педагог, Әкімшілік) тағайындау және қолжетімділікті басқару.',
    students: 'Студенттердің жеке оқу мақсаттарын, қолдау шараларын, педагогикалық бақылауларын және маман ұсынымдарын жүргізу.',
    normative: 'Инклюзивті білім беру бойынша заңдар, бұйрықтар және колледждің ішкі құжаттарын PDF түрінде іздеу, жүктеу және қарау.',
    guides: 'Тапсырманы кезеңдеу, визуалды тіректер және баламалы бағалау бойынша педагогтерге арналған практикалық нұсқаулықтар.',
    metrics: 'Жеке оқу мақсаттары бойынша бастапқы және қайта бағалау динамикасын салыстыру.',
    plans: 'Жауапты мамандарды, іс-шараларды, мерзімдер мен орындалу белгісін үйлестіру.',
    collaboration: 'Дефектолог, психолог, әлеуметтік педагог және пән оқытушыларының ортақ консилиум чаты.',
    library: 'Бейімделген тапсырмалар, үлгілер және чек-парақтар қоры.',
    reports: 'Жеке дерексіз жиынтық есептер, индикаторлар мониторингі және CSV экспорт.',
  };
  const ru: Partial<Record<SectionKey, string>> = {
    users: 'Создание учётных записей сотрудников, назначение и смена ролей (Дефектолог, Преподаватель, Психолог, Социальный педагог, Администрация) и управление доступом.',
    students: 'Личные учебные цели, меры поддержки, педагогические наблюдения и рекомендации специалистов по студентам.',
    normative: 'Поиск, загрузка и встроенный просмотр PDF нормативных документов, приказов и внутренних положений колледжа.',
    guides: 'Практические инструкции для педагогов по делению заданий на этапы, визуальным опорам и альтернативному оцениванию.',
    metrics: 'Сравнение первичной и повторной оценки достижения индивидуальных учебных целей.',
    plans: 'Координация ответственных специалистов, мероприятий, сроков и отметок о выполнении.',
    collaboration: 'Общий чат-консилиум дефектолога, психолога, социального педагога и предметных преподавателей.',
    library: 'Методический фонд адаптированных заданий, шаблонов и чек-листов.',
    reports: 'Обезличенные сводные отчёты, мониторинг индикаторов и выгрузка CSV.',
  };
  return (language === 'kk' ? kk : ru)[section] ?? '';
}

function PlanActionRow({ action, language, t, changePlanStatus }: { action: PlanAction; language: Language; t: typeof copy.kk; changePlanStatus: (id: string) => void }) {
  const statusLabel = action.status === 'done' ? t.completed : action.status === 'progress' ? t.inProgress : t.planned;
  return (
    <div className="plan-action-row">
      <button className={`action-check ${action.status}`} onClick={() => changePlanStatus(action.id)} aria-label={statusLabel}>
        {action.status === 'done' ? <CheckCircleRounded /> : <span />}
      </button>
      <div className="action-copy">
        <strong>{language === 'kk' ? action.titleKk : action.titleRu}</strong>
        <span>{action.owner}</span>
      </div>
      <time>{action.due}</time>
      <Chip size="small" className={`action-status ${action.status}`} label={statusLabel} onClick={() => changePlanStatus(action.id)} />
    </div>
  );
}

const criterionLabels: Record<string, { kk: string; ru: string }> = {
  'Түсіну': { kk: 'Түсіну', ru: 'Понимание' },
  'Понимание': { kk: 'Түсіну', ru: 'Понимание' },
  'Орындау': { kk: 'Орындау', ru: 'Выполнение' },
  'Выполнение': { kk: 'Орындау', ru: 'Выполнение' },
  'Дербестік': { kk: 'Дербестік', ru: 'Самостоятельность' },
  'Самостоятельность': { kk: 'Дербестік', ru: 'Самостоятельность' },
  'Қатысу': { kk: 'Қатысу', ru: 'Участие' },
  'Участие': { kk: 'Қатысу', ru: 'Участие' },
};

function mapCriterionList(rows: { criterion: string; baseline: number; reassessment: number }[]): typeof metrics {
  return rows.map((r) => ({
    kk: criterionLabels[r.criterion]?.kk ?? r.criterion,
    ru: criterionLabels[r.criterion]?.ru ?? r.criterion,
    baseline: r.baseline,
    reassessment: r.reassessment,
  }));
}

function buildChartRows(sessions: ApiAssessmentSession[], preferredGoalId?: string | null): typeof metrics {
  if (!sessions.length) return [];
  const goalId = preferredGoalId && sessions.some((s) => s.goal.id === preferredGoalId) ? preferredGoalId : sessions[0].goal.id;
  const forGoal = sessions.filter((session) => session.goal.id === goalId).sort((a, b) => a.assessedAt.localeCompare(b.assessedAt));
  const baseline = forGoal.find((session) => session.kind === 'BASELINE') ?? forGoal[0];
  const followup = [...forGoal].reverse().find((session) => session.kind === 'REASSESSMENT') ?? baseline;
  if (!baseline) return [];
  const normalize = (score: number, min: number, max: number) => (max > min ? Math.max(0, Math.min(100, Math.round(((score - min) / (max - min)) * 100))) : 0);
  return baseline.results.map((entry) => {
    const later = followup?.results.find((result) => result.criterion === entry.criterion) ?? entry;
    const translated = criterionLabels[entry.criterion];
    return {
      kk: translated?.kk ?? entry.criterion,
      ru: translated?.ru ?? entry.criterion,
      baseline: normalize(entry.score, entry.min, entry.max),
      reassessment: normalize(later.score, later.min, later.max),
    };
  });
}

function mapThreadMessages(thread: ApiThread): Message[] {
  return thread.messages.map((message) => {
    const authorRoleCode =
      message.author.roles?.[0]?.role.code ??
      thread.members.find((member) => member.user.id === message.authorId)?.user.roles[0]?.role.code ??
      'DEFECTOLOGIST';
    const authorRole = roleFromApi[authorRoleCode] ?? 'defectologist';
    return {
      id: message.id,
      author: message.author.displayName,
      role: authorRole,
      time: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      textKk: message.body,
      textRu: message.body,
    };
  });
}

function translateCategory(cat: string, language: Language): string {
  const upper = cat.toUpperCase();
  if (upper === 'PEDAGOGICAL') return language === 'kk' ? 'Педагогикалық' : 'Педагогическая';
  if (upper === 'PSYCHOLOGICAL') return language === 'kk' ? 'Психологиялық' : 'Психологическая';
  if (upper === 'SOCIAL') return language === 'kk' ? 'Әлеуметтік' : 'Социальная';
  return cat;
}
