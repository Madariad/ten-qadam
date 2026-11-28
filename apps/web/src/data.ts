export type Role = 'defectologist' | 'teacher' | 'psychologist' | 'social' | 'admin';
export type SectionKey = 'home' | 'normative' | 'students' | 'ebbk' | 'guides' | 'metrics' | 'plans' | 'collaboration' | 'library' | 'reports' | 'users';

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
  { key: 'ebbk', label: 'ebbk', icon: 'accessibility' },
  { key: 'guides', label: 'guides', icon: 'menu_book' },
  { key: 'collaboration', label: 'collaboration', icon: 'hub' },
  { key: 'library', label: 'library', icon: 'school' },
  { key: 'reports', label: 'reports', icon: 'description' },
];

export const permissions: Record<Role, SectionKey[]> = {
  defectologist: ['home', 'normative', 'students', 'ebbk', 'guides', 'collaboration', 'library', 'reports'],
  teacher: ['home', 'normative', 'students', 'ebbk', 'guides', 'collaboration', 'library', 'reports'],
  psychologist: ['home', 'normative', 'students', 'ebbk', 'collaboration', 'library', 'reports'],
  social: ['home', 'normative', 'students', 'ebbk', 'collaboration', 'library', 'reports'],
  admin: ['home', 'users', 'normative', 'ebbk', 'guides', 'library', 'reports'],
};

export const student = {
  name: 'Алдаберген Ералы Дінсламұлы',
  code: 'SW-611-01',
  group: 'SW-611b',
  specialty: '06130100 Бағдарламалық қамтамасыздандыру',
  needs: '1-курс · Жеңіл түрдегі зияттың бұзылуы. Тапсырманы шағын кезеңдерге бөліп ұсыну, тірек сызбалар мен үлгілерді қолдану.',
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
  { kind: 'ebbk', title: 'Көру қабілеті бұзылған студенттермен жұмыс (І, ІІ, ІІІ дәреже)', ruTitle: 'Особенности обучения слабовидящих студентов (I, II, III степень)', summary: 'Көру өткірлігінің төмендеу дәрежесіне қарай шрифт өлшемін (16–20 pt), жоғары контрастты сұлбаларды, қосымша жарықтандыруды және аудио-тіректерді қолдану ережелері.', category: 'ЕББҚ · Көру қабілеті бұзылған (Нашар көретіндер) | І–ІІІ дәреже', date: '24.11.2026' },
  { kind: 'ebbk', title: 'Есту қабілеті бұзылған студенттердің ерекшеліктері (І–ІV дәреже)', ruTitle: 'Особенности работы со слабослышащими студентами (I–IV степень тугоухости)', summary: 'Алдыңғы қатарға отырғызу, визуалды презентациялар, субтитрлер, жазбаша алгоритмдер мен артикуляцияға назар аудару арқылы оқу процесін бейімдеу.', category: 'ЕББҚ · Есту қабілеті бұзылған (Нашар еститіндер) | І–ІV дәреже', date: '24.11.2026' },
  { kind: 'ebbk', title: 'Тірек-қимыл аппараты (ТҚА) бұзылған студенттерге жағдай жасау', ruTitle: 'Адаптация учебного процесса при нарушениях ОДА (лёгкая, средняя, тяжёлая степень)', summary: 'Жұмыс орнының эргономикасы, зертханалық және практикалық жұмыстарда уақытты ұзарту, ұсақ моторика қиындықтары кезінде цифрлық тренажерларды қолдану.', category: 'ЕББҚ · Тірек-қимыл аппараты (ТҚА / НОДА) | Жеңіл / Орташа / Ауыр дәреже', date: '24.11.2026' },
  { kind: 'ebbk', title: 'Сөйлеу тілі және аутизм спектрі (АСБ / РАС) ерекшеліктері', ruTitle: 'Речевые особенности и расстройства аутистического спектра (РАС)', summary: 'Сенсорлық жүктемені азайту, нақты құрылымдалған сабақ жоспары, ауызша жауапты жазбаша немесе тест түріндегі баламалы бағалаумен алмастыру.', category: 'ЕББҚ · Сөйлеу тілі және коммуникация (АСБ / РАС) | Жеке бейімдеу', date: '24.11.2026' },
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
