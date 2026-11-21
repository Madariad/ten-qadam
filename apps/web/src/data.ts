export type Role = 'defectologist' | 'teacher' | 'psychologist' | 'social' | 'admin';
export type SectionKey = 'home' | 'normative' | 'students' | 'guides' | 'metrics' | 'plans' | 'collaboration' | 'library' | 'reports' | 'users';

export const roleLabels: Record<Role, { kk: string; ru: string }> = {
  defectologist: { kk: 'Дефектолог', ru: 'Дефектолог' },
  teacher: { kk: 'Пән оқытушысы', ru: 'Предметный преподаватель' },
  psychologist: { kk: 'Педагог-психолог', ru: 'Педагог-психолог' },
  social: { kk: 'Әлеуметтік педагог', ru: 'Социальный педагог' },
  admin: { kk: 'Әкімшілік', ru: 'Администрация' },
};

export const navigation: { key: SectionKey; label: string; icon: string }[] = [
  { key: 'home', label: 'home', icon: 'home' },
  { key: 'users', label: 'users', icon: 'manage_accounts' },
  { key: 'normative', label: 'normative', icon: 'description' },
  { key: 'students', label: 'students', icon: 'groups' },
  { key: 'guides', label: 'guides', icon: 'menu_book' },
  { key: 'metrics', label: 'metrics', icon: 'bar_chart' },
  { key: 'collaboration', label: 'collaboration', icon: 'hub' },
  { key: 'library', label: 'library', icon: 'school' },
  { key: 'reports', label: 'reports', icon: 'description' },
];

export const permissions: Record<Role, SectionKey[]> = {
  defectologist: ['home', 'normative', 'students', 'guides', 'metrics', 'collaboration', 'library', 'reports'],
  teacher: ['home', 'normative', 'students', 'guides', 'metrics', 'collaboration', 'library', 'reports'],
  psychologist: ['home', 'normative', 'students', 'metrics', 'collaboration', 'library', 'reports'],
  social: ['home', 'normative', 'students', 'metrics', 'collaboration', 'library', 'reports'],
  admin: ['home', 'users', 'normative', 'guides', 'metrics', 'library', 'reports'],
};

export const student = {
  name: 'Серік Әлихан',
  code: 'ЭС-24-01',
  group: '3С-24',
  specialty: 'Электрмен жабдықтау',
  needs: 'Оқу материалын визуалды қолдаумен ұсыну, тапсырманы кезеңдерге бөлу',
  support: ['Психологиялық', 'Педагогикалық', 'Әлеуметтік'],
};

export const metrics = [
  { kk: 'Түсіну', ru: 'Понимание', baseline: 40, reassessment: 70 },
  { kk: 'Орындау', ru: 'Выполнение', baseline: 35, reassessment: 65 },
  { kk: 'Дербестік', ru: 'Самостоятельность', baseline: 25, reassessment: 55 },
  { kk: 'Қатысу', ru: 'Участие', baseline: 50, reassessment: 80 },
];

export const resourceItems = [
  { kind: 'normative', title: 'Инклюзивті білім беру қағидалары', ruTitle: 'Правила инклюзивного образования', summary: 'Қолданыстағы нормативтік құжаттар мен колледж ішкі тәртібіне арналған жинақ.', category: 'Нормативтік құжаттар', date: '20.11.2026' },
  { kind: 'guide', title: 'Тапсырманы шағын кезеңдерге бөлу', ruTitle: 'Деление задания на небольшие этапы', summary: 'Практикалық жұмысты ретімен ұсыну және әр қадамның орындалуын бақылау.', category: 'Сабақты бейімдеу', date: '18.11.2026' },
  { kind: 'guide', title: 'Визуалды тіректерді қолдану', ruTitle: 'Использование визуальных опор', summary: 'Сызбалар, карточкалар және үлгі арқылы оқу материалын түсіндіру.', category: 'Әдістемелік ұсыным', date: '17.11.2026' },
  { kind: 'method', title: 'Баламалы бағалау чек-парағы', ruTitle: 'Чек-лист альтернативного оценивания', summary: 'Оқу мақсатына сай қолжетімді бағалау тәсілін таңдау.', category: 'Чек-парақ', date: '15.11.2026' },
  { kind: 'method', title: 'Практикалық тапсырма үлгісі', ruTitle: 'Шаблон практического задания', summary: 'Кәсіптік пәндегі тапсырманы кезең-кезеңімен ұсынуға арналған үлгі.', category: 'Оқу материалы', date: '14.11.2026' },
];

export const initialPlanActions = [
  { id: 'a1', titleKk: 'Практикалық тапсырманы 3 қадамға бөлу', titleRu: 'Разделить практическое задание на 3 шага', owner: 'Пән оқытушысы', due: '22.11.2026', status: 'done' as const },
  { id: 'a2', titleKk: 'Шартты белгілер карточкаларын дайындау', titleRu: 'Подготовить карточки с условными обозначениями', owner: 'Дефектолог', due: '23.11.2026', status: 'progress' as const },
  { id: 'a3', titleKk: 'Қайта бағалау өткізу', titleRu: 'Провести повторную оценку', owner: 'Пән оқытушысы', due: '26.11.2026', status: 'planned' as const },
  { id: 'a4', titleKk: 'Оқу мотивациясына қысқа тренинг', titleRu: 'Короткий тренинг учебной мотивации', owner: 'Педагог-психолог', due: '27.11.2026', status: 'planned' as const },
];

export const initialMessages = [
  { id: 'm1', author: 'Пән оқытушысы', role: 'teacher' as Role, time: '10:24', textKk: 'Практикалық тапсырманы орындауда қиналады.', textRu: 'Студенту сложно выполнить практическое задание.' },
  { id: 'm2', author: 'Дефектолог', role: 'defectologist' as Role, time: '11:02', textKk: 'Тапсырманы қарапайым қадамдарға бөліп, визуалды нұсқаулық қолдануды ұсынамын.', textRu: 'Предлагаю разделить задание на простые шаги и использовать визуальную инструкцию.' },
  { id: 'm3', author: 'Педагог-психолог', role: 'psychologist' as Role, time: '11:15', textKk: 'Мотивацияны арттыру бойынша қысқа тренинг жоспарланды.', textRu: 'Запланирован короткий тренинг для поддержки учебной мотивации.' },
];
