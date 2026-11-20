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
import { copy, type Language } from './i18n';
import { apiRequest, getCurrentUser, login, logout, type ApiRole, type ApiUser } from './api';
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
  description: DescriptionRounded,
  groups: GroupsRounded,
  menu_book: MenuBookRounded,
  bar_chart: BarChartRounded,
  event_note: EventNoteRounded,
  hub: HubRounded,
  school: SchoolRounded,
};

type PlanStatus = 'done' | 'progress' | 'planned';
type PlanAction = (typeof initialPlanActions)[number];
type Message = (typeof initialMessages)[number];
type StudentRecord = { id: string; name: string; group: string; specialty: string; status: string };
type StudentView = { id: string; name: string; code: string; group: string; specialty: string; needs: string; support: string[]; goal: string };
type ApiSummary = { students: number; plans: number; actionCompletion: number; learningChange: number | null };
type ApiAssessmentSession = { id: string; kind: 'BASELINE' | 'REASSESSMENT'; assessedAt: string; goal: { id: string }; results: { criterion: string; score: number; min: number; max: number }[] };
type ApiLibraryItem = { id: string; kind: 'NORMATIVE' | 'TEACHER_GUIDE' | 'METHODICAL'; category: string; titleKk: string; titleRu: string; summaryKk: string | null; summaryRu: string | null; publishedAt: string | null };
type ApiGroup = { id: string; code: string; specialty: { nameKk: string; nameRu: string } };

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
  if (!user) return <LoginScreen onLogin={async (username, password) => {
    try {
      const result = await login(username, password);
      setUser(result.user);
      setAuthError('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Не удалось войти');
    }
  }} error={authError} />;
  return <WorkspaceApp demoMode={false} authenticatedUser={user} onLogout={async () => { await logout().catch(() => undefined); setUser(null); }} />;
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
  const initialRole = authenticatedUser?.roles[0] ? roleFromApi[authenticatedUser.roles[0]] : 'teacher';
  const [role, setRole] = useState<Role>(initialRole);
  const [activeSection, setActiveSection] = useState<SectionKey>('home');
  const [messages, setMessages] = useState<Message[]>(demoMode ? initialMessages : []);
  const [messageText, setMessageText] = useState('');
  const [planActions, setPlanActions] = useState<PlanAction[]>(demoMode ? initialPlanActions : []);
  const [query, setQuery] = useState('');
  const [studentRows, setStudentRows] = useState<StudentRecord[]>(demoMode ? [
    { id: 'DEMO-ЭС-24-01', name: student.name, group: student.group, specialty: student.specialty, status: 'Қолдауда' },
    { id: 'DEMO-ТП-24-02', name: 'Айдана Марат', group: '2ТП-24', specialty: 'Техникалық қызмет көрсету', status: 'Қолдауда' },
    { id: 'DEMO-ЭМ-23-03', name: 'Нұрсұлтан Әли', group: '3ЭМ-23', specialty: 'Электр жабдықтары', status: 'Бақылауда' },
  ] : []);
  const [studentView, setStudentView] = useState<StudentView | null>(demoMode ? { id: 'DEMO-ЭС-24-01', ...student, goal: 'Шартты белгілерді тану' } : null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ApiSummary | null>(null);
  const [chartRows, setChartRows] = useState<typeof metrics>(demoMode ? metrics : []);
  const [libraryRows, setLibraryRows] = useState<typeof resourceItems>(demoMode ? resourceItems : []);
  const [loadingError, setLoadingError] = useState('');
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGroup, setNewStudentGroup] = useState('');
  const [newStudentCode, setNewStudentCode] = useState('');
  const [groupOptions, setGroupOptions] = useState<ApiGroup[]>([]);
  const [toast, setToast] = useState('');
  const t = copy[language];

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
      try {
        const items = await apiRequest<ApiLibraryItem[]>('/library');
        if (active) setLibraryRows(items.map((item) => ({ kind: item.kind === 'NORMATIVE' ? 'normative' : item.kind === 'TEACHER_GUIDE' ? 'guide' : 'method', title: item.titleKk, ruTitle: item.titleRu, summary: item.summaryKk ?? item.summaryRu ?? '', category: item.category, date: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '', } as (typeof resourceItems)[number])));
      } catch { if (active) setLibraryRows([]); }
      if (role === 'admin') return;
      if (role === 'defectologist') {
        try { setGroupOptions(await apiRequest<ApiGroup[]>('/students/groups')); } catch { setGroupOptions([]); }
      }
      try {
        const rows = await apiRequest<{ id: string; studentCode: string; fullName: string; group: { code: string; specialty: { nameKk: string; nameRu: string } } }[]>('/students');
        if (!active) return;
        const mapped = rows.map((row) => ({ id: row.id, name: row.fullName, group: row.group.code, specialty: language === 'kk' ? row.group.specialty.nameKk : row.group.specialty.nameRu, status: language === 'kk' ? 'Қолдауда' : 'На сопровождении' }));
        setStudentRows(mapped);
        setSelectedStudentId(mapped[0]?.id ?? null);
      } catch (error) {
        if (active) {
          setStudentRows([]);
          if (!(error instanceof Error && error.message.includes('403'))) setLoadingError(error instanceof Error ? error.message : 'Не удалось загрузить студентов');
        }
      }
    }
    void loadWorkspace();
    return () => { active = false; };
  }, [demoMode, role, language]);

  useEffect(() => {
    if (demoMode || !selectedStudentId) return;
    let active = true;
    async function loadStudentWorkspace() {
      const [profile, assessments, plans, threads] = await Promise.allSettled([
        apiRequest<{ id: string; studentCode: string; fullName: string; group: { code: string; specialty: { nameKk: string; nameRu: string } }; supportProfiles: { category: string; description: string }[]; goals: { titleKk: string; titleRu: string }[] }>(`/students/${selectedStudentId}`),
        apiRequest<ApiAssessmentSession[]>(`/dashboard/students/${selectedStudentId}/metrics`),
        apiRequest<{ actions: { id: string; titleKk: string; titleRu: string; dueAt: string | null; status: string; responsible: { displayName: string } }[] }[]>(`/students/${selectedStudentId}/plans`),
        apiRequest<{ id: string; members: { user: { id: string; roles: { role: { code: ApiRole } }[] } }[]; messages: { id: string; authorId: string; author: { displayName: string }; body: string; createdAt: string }[] }[]>(`/students/${selectedStudentId}/threads`),
      ]);
      if (!active) return;
      if (profile.status === 'fulfilled') {
        const record = profile.value;
        setStudentView({ id: record.id, code: record.studentCode, name: record.fullName, group: record.group.code, specialty: language === 'kk' ? record.group.specialty.nameKk : record.group.specialty.nameRu, needs: record.supportProfiles.map((item) => item.description).join('; ') || (language === 'kk' ? 'Қолдау профилі әлі толтырылмаған' : 'Профиль поддержки пока не заполнен'), support: [...new Set(record.supportProfiles.map((item) => item.category))], goal: record.goals[0] ? (language === 'kk' ? record.goals[0].titleKk : record.goals[0].titleRu) : (language === 'kk' ? 'Белсенді оқу мақсаты жоқ' : 'Нет активной учебной цели') });
      } else if (profile.reason instanceof Error) setLoadingError(profile.reason.message);
      if (assessments.status === 'fulfilled') setChartRows(buildChartRows(assessments.value));
      if (plans.status === 'fulfilled') setPlanActions(plans.value.flatMap((plan) => plan.actions).map((action) => ({ id: action.id, titleKk: action.titleKk, titleRu: action.titleRu, owner: action.responsible.displayName, due: action.dueAt ? new Date(action.dueAt).toLocaleDateString() : '—', status: action.status === 'COMPLETED' ? 'done' as const : action.status === 'IN_PROGRESS' ? 'progress' as const : 'planned' as const })));
      if (threads.status === 'fulfilled') {
        const first = threads.value[0];
        setThreadId(first?.id ?? null);
        if (first) setMessages(first.messages.map((message) => {
          const roleCode = first.members.find((member) => member.user.id === message.authorId)?.user.roles[0]?.role.code ?? 'DEFECTOLOGIST';
          const authorRole = roleFromApi[roleCode];
          return { id: message.id, author: message.author.displayName, role: authorRole, time: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), textKk: message.body, textRu: message.body };
        }));
        else setMessages([]);
      }
    }
    void loadStudentWorkspace();
    return () => { active = false; };
  }, [demoMode, selectedStudentId, language]);

  const allowed = permissions[role];
  const canOpen = (section: SectionKey) => allowed.includes(section);
  const sectionTitle = t[activeSection];

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const author = roleLabels[role][language];
    if (!demoMode) {
      if (!selectedStudentId) { setToast(language === 'kk' ? 'Алдымен тағайындалған студентті таңдаңыз' : 'Сначала выберите назначенного студента'); return; }
      try {
        let activeThreadId = threadId;
        if (!activeThreadId) {
          const created = await apiRequest<{ id: string }>(`/students/${selectedStudentId}/threads`, { method: 'POST', body: JSON.stringify({ title: `Консилиум · ${studentView?.name ?? ''}` }) });
          activeThreadId = created.id;
          setThreadId(activeThreadId);
        }
        const saved = await apiRequest<{ id: string; body: string; createdAt: string; author: { displayName: string } }>(`/threads/${activeThreadId}/messages`, { method: 'POST', body: JSON.stringify({ body: trimmed }) });
        setMessages((current) => [...current, { id: saved.id, author: saved.author.displayName, role, time: new Date(saved.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), textKk: saved.body, textRu: saved.body }]);
        setMessageText('');
      } catch (error) { setToast(error instanceof Error ? error.message : 'Не удалось отправить сообщение'); }
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
      } catch (error) { setToast(error instanceof Error ? error.message : 'Не удалось обновить мероприятие'); return; }
    }
    setPlanActions((items) => items.map((action) => action.id === id ? { ...action, status: next } : action));
  }

  async function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newStudentName.trim() || !newStudentGroup.trim() || !newStudentCode.trim()) return;
    if (!demoMode) {
      try {
        await apiRequest('/students', { method: 'POST', body: JSON.stringify({ studentCode: newStudentCode.trim(), fullName: newStudentName.trim(), groupId: newStudentGroup }) });
        setStudentDialogOpen(false);
        setNewStudentName(''); setNewStudentCode(''); setNewStudentGroup('');
        setToast(language === 'kk' ? 'Студент сақталды' : 'Студент сохранён');
        const rows = await apiRequest<{ id: string; studentCode: string; fullName: string; group: { code: string; specialty: { nameKk: string; nameRu: string } } }[]>('/students');
        setStudentRows(rows.map((row) => ({ id: row.id, name: row.fullName, group: row.group.code, specialty: language === 'kk' ? row.group.specialty.nameKk : row.group.specialty.nameRu, status: language === 'kk' ? 'Қолдауда' : 'На сопровождении' })));
      } catch (error) { setToast(error instanceof Error ? error.message : 'Не удалось сохранить студента'); }
      return;
    }
    setStudentRows((current) => [{
      id: `DEMO-${Date.now()}`,
      name: newStudentName.trim(),
      group: newStudentGroup.trim(),
      specialty: language === 'kk' ? 'Жаңа мамандық' : 'Новая специальность',
      status: language === 'kk' ? 'Қолдауда' : 'На сопровождении',
    }, ...current]);
    setNewStudentName('');
    setNewStudentGroup('');
    setStudentDialogOpen(false);
    setToast(language === 'kk' ? 'Демо-жазба осы браузер сессиясына қосылды' : 'Демо-запись добавлена в эту сессию браузера');
  }

  function exportReport() {
    const rows = [
      ['Критерий', 'Первичная оценка', 'Повторная оценка'],
      ...chartRows.map((metric) => [language === 'kk' ? metric.kk : metric.ru, String(metric.baseline), String(metric.reassessment)]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = demoMode ? 'ten-qadam-demo-report.csv' : 'ten-qadam-report.csv';
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
            setActiveSection={setActiveSection}
            canOpen={canOpen}
            onDenied={() => setToast(t.noAccess)}
            t={t}
          />
          {activeSection === 'home' ? (
            <>
              <section className="overview-column">
                <InstitutionBar language={language} setLanguage={setLanguage} role={role} setRole={setRole} t={t} demoMode={demoMode} userName={authenticatedUser?.displayName} onLogout={onLogout} />
                <DashboardOverview language={language} setActiveSection={setActiveSection} t={t} demoMode={demoMode} summary={summary} />
              </section>
            </>
          ) : (
            <section className="section-column">
              <InstitutionBar language={language} setLanguage={setLanguage} role={role} setRole={setRole} t={t} demoMode={demoMode} userName={authenticatedUser?.displayName} onLogout={onLogout} />
              {canOpen(activeSection) ? (
                <SectionContent
                  activeSection={activeSection}
                  language={language}
                  t={t}
                  role={role}
                  query={query}
                  setQuery={setQuery}
                  studentRows={studentRows}
                  studentInfo={studentView}
                  metricRows={chartRows}
                  resourceRows={libraryRows}
                  demoMode={demoMode}
                  selectedStudentId={selectedStudentId}
                  onSelectStudent={(id) => setSelectedStudentId(id)}
                  openStudentDialog={() => setStudentDialogOpen(true)}
                  planActions={planActions}
                  changePlanStatus={changePlanStatus}
                  messages={messages}
                  messageText={messageText}
                  setMessageText={setMessageText}
                  sendMessage={sendMessage}
                  exportReport={exportReport}
                  setActiveSection={setActiveSection}
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
            <Alert severity="info">{t.demo}: жеке деректер сақталмайды.</Alert>
            <TextField autoFocus label={language === 'kk' ? 'Аты-жөні' : 'ФИО'} value={newStudentName} onChange={(event) => setNewStudentName(event.target.value)} required fullWidth />
            <TextField label="ID" value={newStudentCode} onChange={(event) => setNewStudentCode(event.target.value)} required fullWidth />
            {demoMode ? <TextField label={language === 'kk' ? 'Тобы' : 'Группа'} value={newStudentGroup} onChange={(event) => setNewStudentGroup(event.target.value)} required fullWidth /> : <TextField select label={language === 'kk' ? 'Оқу тобы' : 'Учебная группа'} value={newStudentGroup} onChange={(event) => setNewStudentGroup(event.target.value)} required fullWidth>{groupOptions.map((group) => <MenuItem key={group.id} value={group.id}>{group.code} · {language === 'kk' ? group.specialty.nameKk : group.specialty.nameRu}</MenuItem>)}</TextField>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStudentDialogOpen(false)}>{t.cancel}</Button>
            <Button type="submit" variant="contained">{t.save}</Button>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar open={Boolean(toast)} autoHideDuration={3200} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="info" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
      {loadingError && <Snackbar open autoHideDuration={6000} onClose={() => setLoadingError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert severity="error" onClose={() => setLoadingError('')}>{loadingError}</Alert></Snackbar>}
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

function Sidebar({ language, activeSection, setActiveSection, canOpen, onDenied, t }: {
  language: Language;
  activeSection: SectionKey;
  setActiveSection: (key: SectionKey) => void;
  canOpen: (key: SectionKey) => boolean;
  onDenied: () => void;
  t: typeof copy.kk;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand"><img src="/assets/ten-qadam-logo.png" alt="TEN QADAM" /></div>
      <nav aria-label={language === 'kk' ? 'Негізгі мәзір' : 'Главное меню'}>
        {navigation.map((item) => {
          const Icon = iconMap[item.icon];
          const locked = !canOpen(item.key);
          return (
            <button
              key={item.key}
              type="button"
              className={`nav-item ${activeSection === item.key ? 'active' : ''} ${locked ? 'locked' : ''}`}
              onClick={() => locked ? onDenied() : setActiveSection(item.key)}
              aria-current={activeSection === item.key ? 'page' : undefined}
              title={locked ? t.noAccess : undefined}
            >
              <Icon fontSize="small" />
              <span>{t[item.label as keyof typeof t]}</span>
              {locked && <LockRounded className="nav-lock" fontSize="inherit" />}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <span className="online-dot" />
        <span>{language === 'kk' ? 'Қауіпсіз жұмыс кеңістігі' : 'Защищённое рабочее пространство'}</span>
      </div>
    </aside>
  );
}

function InstitutionBar({ language, setLanguage, role, setRole, t, demoMode, userName, onLogout }: { language: Language; setLanguage: (value: Language) => void; role: Role; setRole: (role: Role) => void; t: typeof copy.kk; demoMode: boolean; userName?: string; onLogout: () => void }) {
  return (
    <div className="institution-bar">
      <div className="institution-name">
        <div className="institution-icon"><SchoolRounded /></div>
        <span>{language === 'kk' ? 'Жетісу политехникалық колледжі' : 'Жетысуский политехнический колледж'}</span>
      </div>
      <div className="user-controls">
        <div className="language-toggle app-language-toggle" aria-label={t.language}><button className={language === 'kk' ? 'selected' : ''} onClick={() => setLanguage('kk')}>ҚАЗ</button><button className={language === 'ru' ? 'selected' : ''} onClick={() => setLanguage('ru')}>РУС</button></div>
        <Tooltip title={language === 'kk' ? 'Хабарламалар' : 'Уведомления'}>
          <IconButton className="notification-button" aria-label={language === 'kk' ? 'Хабарламалар' : 'Уведомления'}>
            <Badge variant="dot" color="error"><NotificationsNoneRounded /></Badge>
          </IconButton>
        </Tooltip>
        <div className="user-select-wrap">
          <Avatar className="user-avatar"><PersonRounded /></Avatar>
          <span className="user-caption">{roleLabels[role][language]}<small>{userName ?? (role === 'teacher' ? 'Айдарова А.С.' : language === 'kk' ? 'Демо қолданушы' : 'Демо-пользователь')}</small></span>
          {demoMode ? <>
            <Select value={role} onChange={(event) => setRole(event.target.value as Role)} variant="standard" disableUnderline className="role-select" inputProps={{ 'aria-label': t.role }}>
              {(Object.keys(roleLabels) as Role[]).map((key) => <MenuItem key={key} value={key}>{roleLabels[key][language]}</MenuItem>)}
            </Select>
            <KeyboardArrowDownRounded className="role-arrow" />
          </> : <Tooltip title={language === 'kk' ? 'Шығу' : 'Выйти'}><IconButton onClick={onLogout} className="logout-button" aria-label={language === 'kk' ? 'Шығу' : 'Выйти'}><LogoutRounded /></IconButton></Tooltip>}
        </div>
      </div>
    </div>
  );
}

function DashboardOverview({ language, setActiveSection, t, demoMode, summary }: { language: Language; setActiveSection: (key: SectionKey) => void; t: typeof copy.kk; demoMode: boolean; summary: ApiSummary | null }) {
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
          {demoMode && <span className="demo-pill"><span className="demo-dot" />{t.demo}</span>}
        </div>
        <img src="/assets/students-illustration.png" alt="" className="students-art" />
      </section>
      <div className="kpi-grid">
        {kpis.map(({ label, value, Icon, tone }) => (
          <Paper key={label} className="kpi-card" elevation={0}>
            <div className={`kpi-icon ${tone}`}><Icon /></div>
            <div className="kpi-text"><span>{label}</span><strong className={tone === 'green' ? 'green-value' : tone === 'purple' ? 'purple-value' : ''}>{value}</strong></div>
          </Paper>
        ))}
      </div>
      <div className="updates-grid">
        <Paper className="updates-card" elevation={0}>
          <h2>{t.updates}</h2>
          {demoMode ? <>
            <UpdateRow icon="document" title={language === 'kk' ? 'Инклюзивті білім беру қағидалары (жаңа редакция)' : 'Правила инклюзивного образования (новая редакция)'} date="20.11.2026" />
            <UpdateRow icon="people" title={language === 'kk' ? '3 студенттің жеке жоспары жаңартылды' : 'Обновлены индивидуальные планы 3 студентов'} date="19.11.2026" />
            <UpdateRow icon="chart" title={language === 'kk' ? 'Білім көрсеткіштері енгізілді' : 'Добавлены учебные показатели'} date="18.11.2026" />
          </> : <div className="no-live-data">{language === 'kk' ? 'Әзірге соңғы жаңарту жоқ' : 'Пока нет новых обновлений'}</div>}
        </Paper>
        <Paper className="events-card" elevation={0}>
          <h2>{t.events}</h2>
          {demoMode ? <>
            <div className="event-row"><EventAvailableRounded /><div><strong>{language === 'kk' ? 'Мамандар консилиумы' : 'Консилиум специалистов'}</strong><span>22.11.2026, 15:00</span></div></div>
            <div className="event-row"><EventAvailableRounded /><div><strong>{language === 'kk' ? 'Педагогтерге шеберлік сабақ' : 'Мастер-класс для педагогов'}</strong><span>{language === 'kk' ? 'Сабақты бейімдеу әдістері' : 'Методы адаптации занятий'} · 25.11.2026, 11:00</span></div></div>
          </> : <div className="no-live-data">{language === 'kk' ? 'Жоспарланған іс-шара жоқ' : 'Нет запланированных событий'}</div>}
          <button className="text-link" onClick={() => setActiveSection('plans')}>{language === 'kk' ? 'Жоспарды ашу' : 'Открыть план'} <ArrowForwardRounded /></button>
        </Paper>
      </div>
    </div>
  );
}

function UpdateRow({ icon, title, date }: { icon: 'document' | 'people' | 'chart'; title: string; date: string }) {
  const Icon = icon === 'people' ? GroupsRounded : icon === 'chart' ? BarChartRounded : DescriptionRounded;
  return <div className="update-row"><span className={`update-icon ${icon}`}><Icon /></span><span className="update-title">{title}</span><time>{date}</time></div>;
}


function CollaborationPanel({ language, t, messages, messageText, setMessageText, sendMessage, studentInfo, demoMode }: {
  language: Language;
  t: typeof copy.kk;
  messages: Message[];
  messageText: string;
  setMessageText: (value: string) => void;
  sendMessage: (event: FormEvent<HTMLFormElement>) => void;
  studentInfo: StudentView | null;
  demoMode: boolean;
}) {
  return (
    <Paper className="collaboration-panel" elevation={0}>
      <div className="section-ribbon wide-ribbon">{t.specialistContact}</div>
      <div className="collaboration-content">
        <div className="specialist-list">
          <h2><HubRounded /> {language === 'kk' ? 'Мамандар байланысы' : 'Связь специалистов'}</h2>
          {([
            ['defectologist', 'Дефектолог', '#f0a5ae'],
            ['psychologist', 'Педагог-психолог', '#c278e8'],
            ['social', 'Әлеуметтік педагог', '#f4ae4d'],
            ['teacher', 'Пән оқытушысы', '#3f89db'],
          ] as [Role, string, string][]).map(([key, label, color]) => (
            <div className="specialist-item" key={key}><Avatar style={{ backgroundColor: color }}>{roleIcons[key]}</Avatar><span>{language === 'kk' ? label : roleLabels[key].ru}</span><span className={`presence ${key === 'teacher' ? 'away' : ''}`} /></div>
          ))}
        </div>
        <div className="conversation-box">
          <div className="conversation-title"><AssignmentRounded /><strong>{studentInfo ? `${language === 'kk' ? 'Консилиум' : 'Консилиум'}: ${studentInfo.name} (${studentInfo.group})` : (language === 'kk' ? 'Студент таңдалмаған' : 'Студент не выбран')}</strong>{demoMode && <span className="demo-inline">DEMO</span>}</div>
          <div className="conversation-messages" aria-live="polite">
            {messages.slice(-3).map((message) => (
              <div className={`message-line ${message.role}`} key={message.id}>
                <Avatar className={`message-avatar ${message.role}`}>{roleIcons[message.role]}</Avatar>
                <div className="message-copy"><strong>{message.author}</strong><p>{language === 'kk' ? message.textKk : message.textRu}</p></div>
                <time>{message.time}</time>
              </div>
            ))}
            {messages.length === 0 && <div className="no-live-data">{language === 'kk' ? 'Әзірге хабарлама жоқ' : 'Сообщений пока нет'}</div>}
          </div>
          <form className="message-form" onSubmit={sendMessage}>
            <TextField size="small" fullWidth value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder={t.messagePlaceholder} inputProps={{ 'aria-label': t.messagePlaceholder }} />
            <Button type="submit" variant="contained" aria-label={t.send}><SendRounded /></Button>
          </form>
          <small className="local-demo-note">{language === 'kk' ? 'Хабарламалар осы демо-сессияда ғана сақталады' : 'Сообщения хранятся только в текущей демо-сессии'}</small>
        </div>
      </div>
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
              <div className="bars"><div className="bar-value baseline" style={{ height: `${metric.baseline}%` }}><span>{metric.baseline} %</span></div><div className="bar-value reassessment" style={{ height: `${metric.reassessment}%` }}><span>{metric.reassessment} %</span></div></div>
              <strong>{language === 'kk' ? metric.kk : metric.ru}</strong>
            </div>
          ))}
        </div>
        {data.length === 0 && <div className="chart-empty">{language === 'kk' ? 'Бағалау деректері әзірге жоқ' : 'Пока нет данных оценок'}</div>}
      </div>
    </div>
  );
}

function SectionContent({ activeSection, language, t, role, query, setQuery, studentRows, studentInfo, metricRows, resourceRows, demoMode, selectedStudentId, onSelectStudent, openStudentDialog, planActions, changePlanStatus, messages, messageText, setMessageText, sendMessage, exportReport, setActiveSection }: {
  activeSection: SectionKey;
  language: Language;
  t: typeof copy.kk;
  role: Role;
  query: string;
  setQuery: (value: string) => void;
  studentRows: StudentRecord[];
  studentInfo: StudentView | null;
  metricRows: typeof metrics;
  resourceRows: typeof resourceItems;
  demoMode: boolean;
  selectedStudentId: string | null;
  onSelectStudent: (id: string) => void;
  openStudentDialog: () => void;
  planActions: PlanAction[];
  changePlanStatus: (id: string) => void;
  messages: Message[];
  messageText: string;
  setMessageText: (value: string) => void;
  sendMessage: (event: FormEvent<HTMLFormElement>) => void;
  exportReport: () => void;
  setActiveSection: (key: SectionKey) => void;
}) {
  const [selectedResource, setSelectedResource] = useState<(typeof resourceItems)[number] | null>(null);
  const [localTab, setLocalTab] = useState(0);
  const q = query.trim().toLocaleLowerCase(language === 'kk' ? 'kk-KZ' : 'ru-RU');
  const filteredStudents = studentRows.filter((row) => `${row.name} ${row.group} ${row.specialty} ${row.id}`.toLocaleLowerCase().includes(q));
  const resources = activeSection === 'normative' ? resourceRows.filter((item) => item.kind === 'normative')
    : activeSection === 'guides' ? resourceRows.filter((item) => item.kind === 'guide')
      : resourceRows.filter((item) => item.kind !== 'normative');
  const filteredResources = resources.filter((item) => `${item.title} ${item.ruTitle} ${item.summary} ${item.category}`.toLocaleLowerCase().includes(q));
  const heading = activeSection === 'students' ? t.students
    : activeSection === 'normative' ? t.normative
      : activeSection === 'guides' ? t.guides
        : activeSection === 'metrics' ? t.metrics
          : activeSection === 'plans' ? t.plans
            : activeSection === 'collaboration' ? t.collaboration
              : activeSection === 'library' ? t.library : t.reports;

  return (
    <div className="section-page">
      <div className="section-page-heading">
        <div><div className="eyebrow">TEN QADAM · {t.demo}</div><h1>{heading}</h1><p>{sectionDescription(activeSection, language)}</p></div>
        {activeSection === 'students' && (demoMode || role === 'defectologist') && <Button variant="contained" startIcon={<AddRounded />} onClick={openStudentDialog}>{t.addStudent}</Button>}
        {activeSection === 'reports' && <Button variant="contained" startIcon={<FileDownloadRounded />} onClick={exportReport}>{t.export}</Button>}
      </div>

      {activeSection === 'students' && (
        <>
          <div className="filter-bar"><TextField size="small" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`${t.search}...`} InputProps={{ startAdornment: <SearchRounded className="search-start" /> }} /><Chip label={`${filteredStudents.length} ${language === 'kk' ? 'студент' : 'студента'}`} /></div>
          <div className="student-table-wrap"><table className="data-table"><thead><tr><th>ID</th><th>{language === 'kk' ? 'Аты-жөні' : 'ФИО'}</th><th>{language === 'kk' ? 'Тобы' : 'Группа'}</th><th>{language === 'kk' ? 'Мамандығы' : 'Специальность'}</th><th>{language === 'kk' ? 'Мәртебесі' : 'Статус'}</th><th /></tr></thead><tbody>{filteredStudents.map((row) => <tr key={row.id} className={selectedStudentId === row.id ? 'selected-row' : ''}><td className="muted-cell">{row.id}</td><td><strong>{row.name}</strong></td><td>{row.group}</td><td>{row.specialty}</td><td><Chip className="status-chip" size="small" label={row.status} /></td><td><Button size="small" onClick={() => { onSelectStudent(row.id); setActiveSection('home'); }}>{t.open}</Button></td></tr>)}</tbody></table>{filteredStudents.length === 0 && <p className="empty-state">{t.emptySearch}</p>}</div>
          {demoMode && <p className="data-note">{language === 'kk' ? 'Демо-жазбалар осы браузер сессиясында ғана қолжетімді.' : 'Демо-записи доступны только в текущей сессии браузера.'}</p>}
        </>
      )}

      {['normative', 'guides', 'library'].includes(activeSection) && (
        <>
          <div className="filter-bar"><TextField size="small" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`${t.search}...`} InputProps={{ startAdornment: <SearchRounded className="search-start" /> }} /><Chip label={activeSection === 'normative' ? 'PDF · DOC' : language === 'kk' ? 'Әдістемелік материалдар' : 'Методические материалы'} /></div>
          <div className="resource-grid">{filteredResources.map((item) => <Paper className="resource-card" key={item.title} elevation={0}><div className="resource-icon"><DescriptionRounded /></div><span className="resource-category">{language === 'kk' ? item.category : item.kind === 'normative' ? 'Нормативные документы' : item.kind === 'guide' ? 'Адаптация занятий' : 'Методический материал'}</span><h2>{language === 'kk' ? item.title : item.ruTitle}</h2><p>{item.summary}</p><div className="resource-footer"><time>{item.date}</time><Button size="small" onClick={() => setSelectedResource(item)}>{t.open} <ArrowForwardRounded /></Button></div></Paper>)}</div>
          {filteredResources.length === 0 && <p className="empty-state">{t.emptySearch}</p>}
        </>
      )}

      {activeSection === 'metrics' && <Paper className="section-chart-card" elevation={0}><div className="chart-meta"><strong>{studentInfo ? `${language === 'kk' ? 'Пән' : 'Предмет'}: ${studentInfo.specialty} · ${studentInfo.name}` : t.metrics}</strong><span>{studentInfo?.goal ?? t.notice}</span></div><BarChart language={language} data={metricRows} /><div className="chart-legend"><span><i className="legend-blue" />{t.baseline}</span><span><i className="legend-green" />{t.reassessment}</span></div><div className="chart-disclaimer">{t.notice}</div></Paper>}

      {activeSection === 'plans' && <Paper className="plan-list-card" elevation={0}><div className="plan-student-head"><div><span className="eyebrow">{language === 'kk' ? 'Жеке қолдау жоспары' : 'ИНДИВИДУАЛЬНЫЙ ПЛАН ПОДДЕРЖКИ'}</span><h2>{studentInfo ? `${studentInfo.name} · ${studentInfo.group}` : (language === 'kk' ? 'Студент таңдалмаған' : 'Студент не выбран')}</h2></div><Chip className="status-chip" label={language === 'kk' ? 'Белсенді' : 'Активен'} /></div>{planActions.map((action) => <PlanActionRow key={action.id} action={action} language={language} t={t} changePlanStatus={changePlanStatus} />)}{planActions.length === 0 && <p className="empty-state">{language === 'kk' ? 'Қолдау жоспары әзірге жоқ' : 'Плана поддержки пока нет'}</p>}<Button variant="outlined" startIcon={<AddRounded />} className="add-action-button" onClick={() => setLocalTab(localTab + 1)}>{language === 'kk' ? 'Іс-шара қосу' : 'Добавить мероприятие'}</Button>{localTab > 0 && <Alert severity="info" className="demo-alert">{language === 'kk' ? 'Іс-шара құру формасы келесі UI кезеңінде қосылады.' : 'Форма создания мероприятия добавляется следующим UI этапом.'}</Alert>}</Paper>}

      {activeSection === 'collaboration' && <CollaborationPanel language={language} t={t} messages={messages} messageText={messageText} setMessageText={setMessageText} sendMessage={sendMessage} studentInfo={studentInfo} demoMode={demoMode} />}

      {activeSection === 'reports' && <div className="reports-grid"><Paper className="report-summary" elevation={0}><div className="report-icon"><TrendingUpRounded /></div><span>{t.planProgress}</span><strong>{demoMode ? '78%' : '—'}</strong><small>{demoMode ? t.demo : (language === 'kk' ? 'Қолжетімді жиынтық' : 'Доступная сводка')}</small></Paper><Paper className="report-summary" elevation={0}><div className="report-icon teal"><CheckCircleRounded /></div><span>{language === 'kk' ? 'Уақытылы орындалған шаралар' : 'Мероприятия выполнены в срок'}</span><strong>{demoMode ? '64%' : '—'}</strong><small>{demoMode ? t.demo : (language === 'kk' ? 'Қолжетімді жиынтық' : 'Доступная сводка')}</small></Paper><Paper className="report-table-card" elevation={0}><h2>{language === 'kk' ? 'Оқу мақсаты бойынша динамика' : 'Динамика по учебным целям'}</h2><BarChart language={language} data={metricRows} /><div className="chart-legend"><span><i className="legend-blue" />{t.baseline}</span><span><i className="legend-green" />{t.reassessment}</span></div>{demoMode && <Alert severity="info" icon={false}>{language === 'kk' ? 'Бұл CSV мысалы тек демонстрациялық бағалау деректерін қамтиды.' : 'Пример CSV содержит только демонстрационные результаты оценки.'}</Alert>}</Paper></div>}

      <Dialog open={Boolean(selectedResource)} onClose={() => setSelectedResource(null)} fullWidth maxWidth="sm">
        {selectedResource && <><DialogTitle>{language === 'kk' ? selectedResource.title : selectedResource.ruTitle}</DialogTitle><DialogContent><div className="resource-dialog-category">{selectedResource.category} · {selectedResource.date}</div><p>{selectedResource.summary}</p><Alert severity="info">{language === 'kk' ? 'Демонстрациялық нұсқа: құжаттар қоймасы іске қосылғанда файл осында ашылады.' : 'Демонстрационный режим: файл будет открываться здесь после подключения хранилища документов.'}</Alert></DialogContent><DialogActions><Button onClick={() => setSelectedResource(null)}>{language === 'kk' ? 'Жабу' : 'Закрыть'}</Button></DialogActions></>}
      </Dialog>
    </div>
  );
}

function sectionDescription(section: SectionKey, language: Language) {
  const kk: Partial<Record<SectionKey, string>> = {
    students: 'Студенттердің жеке оқу мақсаттарын, қолдау шараларын және педагогикалық бақылауларын қарау.',
    normative: 'Инклюзивті білім беру бойынша нормативтік құжаттарды іздеу және қарау.',
    guides: 'Сабақты және практикалық тапсырмаларды бейімдеу бойынша нұсқаулықтар.',
    metrics: 'Оқу мақсаттары бойынша бастапқы және қайталама бағалау динамикасы.',
    plans: 'Жауапты мамандарды, іс-шараларды, мерзімдер мен орындалу мәртебесін үйлестіру.',
    collaboration: 'Студентке бекітілген мамандар арасындағы жұмыс және ұсынымдар.',
    library: 'Бейімделген тапсырмалар, үлгілер және чек-парақтар жинағы.',
    reports: 'Мониторинг және оқу көрсеткіштері бойынша жинақталған есептер.',
  };
  const ru: Partial<Record<SectionKey, string>> = {
    students: 'Личные учебные цели, меры поддержки и педагогические наблюдения по студентам.',
    normative: 'Поиск и просмотр нормативных документов по инклюзивному образованию.',
    guides: 'Инструкции по адаптации занятий и практических заданий.',
    metrics: 'Первичная и повторная оценка динамики по учебным целям.',
    plans: 'Координация специалистов, мероприятий, сроков и статусов выполнения.',
    collaboration: 'Работа и рекомендации специалистов, назначенных студенту.',
    library: 'Подборка адаптированных заданий, шаблонов и чек-листов.',
    reports: 'Мониторинг и сводные отчёты по учебным показателям.',
  };
  return (language === 'kk' ? kk : ru)[section] ?? '';
}

function PlanActionRow({ action, language, t, changePlanStatus }: { action: PlanAction; language: Language; t: typeof copy.kk; changePlanStatus: (id: string) => void }) {
  const statusLabel = action.status === 'done' ? t.completed : action.status === 'progress' ? t.inProgress : t.planned;
  return <div className="plan-action-row"><button className={`action-check ${action.status}`} onClick={() => changePlanStatus(action.id)} aria-label={statusLabel}>{action.status === 'done' ? <CheckCircleRounded /> : <span />}</button><div className="action-copy"><strong>{language === 'kk' ? action.titleKk : action.titleRu}</strong><span>{action.owner}</span></div><time>{action.due}</time><Chip size="small" className={`action-status ${action.status}`} label={statusLabel} /></div>;
}

function buildChartRows(sessions: ApiAssessmentSession[]): typeof metrics {
  if (!sessions.length) return [];
  const goalId = sessions[0].goal.id;
  const forGoal = sessions.filter((session) => session.goal.id === goalId).sort((a, b) => a.assessedAt.localeCompare(b.assessedAt));
  const baseline = forGoal.find((session) => session.kind === 'BASELINE');
  const followup = [...forGoal].reverse().find((session) => session.kind === 'REASSESSMENT');
  if (!baseline || !followup) return [];
  const labelMap: Record<string, { kk: string; ru: string }> = {
    'Түсіну': { kk: 'Түсіну', ru: 'Понимание' },
    'Понимание': { kk: 'Түсіну', ru: 'Понимание' },
    'Орындау': { kk: 'Орындау', ru: 'Выполнение' },
    'Выполнение': { kk: 'Орындау', ru: 'Выполнение' },
    'Дербестік': { kk: 'Дербестік', ru: 'Самостоятельность' },
    'Самостоятельность': { kk: 'Дербестік', ru: 'Самостоятельность' },
    'Қатысу': { kk: 'Қатысу', ru: 'Участие' },
    'Участие': { kk: 'Қатысу', ru: 'Участие' },
  };
  const normalize = (score: number, min: number, max: number) => max > min ? Math.max(0, Math.min(100, Math.round(((score - min) / (max - min)) * 100))) : 0;
  return baseline.results.flatMap((entry) => {
    const later = followup.results.find((result) => result.criterion === entry.criterion);
    if (!later) return [];
    const translated = labelMap[entry.criterion];
    return [{ kk: translated?.kk ?? entry.criterion, ru: translated?.ru ?? entry.criterion, baseline: normalize(entry.score, entry.min, entry.max), reassessment: normalize(later.score, later.min, later.max) }];
  });
}
