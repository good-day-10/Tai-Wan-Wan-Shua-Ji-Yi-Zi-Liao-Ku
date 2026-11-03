import { useEffect, useMemo, useState } from 'react';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { Menu, X } from 'lucide-react';
import { CommunityFeatures } from './community-features';
import { FocusManagedDialog } from './components/focus-managed-dialog';
import './index.css';

type SheetKeyValueMap = Record<string, string>;

type FormResponse = {
  Name?: string;
  name?: string;
  Email?: string;
  email?: string;
  Message?: string;
  message?: string;
  Comment?: string;
  comment?: string;
  Timestamp?: string;
  timestamp?: string;
  Date?: string;
  date?: string;
};

const SHEET_CONFIG = {
  styles: {
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjI8FZQcYhRev1IW24ZxVQ8dNk5qxwpliq5ypHERWkaSaGK1VeuYw9wk5yoVavs2ABpJuUXFNpRObM/pub?gid=824524678&single=true&output=csv',
    label: 'Site_Styles',
  },
  content: {
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjI8FZQcYhRev1IW24ZxVQ8dNk5qxwpliq5ypHERWkaSaGK1VeuYw9wk5yoVavs2ABpJuUXFNpRObM/pub?gid=824524678&single=true&output=csv',
    label: 'Site_Content',
  },
  formResponses: {
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjI8FZQcYhRev1IW24ZxVQ8dNk5qxwpliq5ypHERWkaSaGK1VeuYw9wk5yoVavs2ABpJuUXFNpRObM/pub?gid=824524678&single=true&output=csv',
    label: 'Form_Responses',
  },
};

const DEFAULT_STYLES: Record<string, string> = {
  background: '42 43% 96%',
  foreground: '205 44% 18%',
  border: '36 22% 83%',
  card: '42 48% 98%',
  primary: '183 58% 31%',
  'primary-foreground': '42 48% 98%',
  secondary: '18 75% 66%',
  'secondary-foreground': '205 44% 18%',
  muted: '39 26% 91%',
  'muted-foreground': '205 16% 44%',
  accent: '39 88% 55%',
  'accent-foreground': '205 44% 18%',
  destructive: '3 64% 47%',
  'destructive-foreground': '42 48% 98%',
  'app-font-sans': '"Noto Sans TC", ui-sans-serif, sans-serif',
  'app-font-serif': '"Noto Serif TC", Georgia, serif',
};

const DEFAULT_CONTENT: SheetKeyValueMap = {
  brand_name: '台灣玩耍記憶資料庫',
  nav_memories: '記憶索引',
  nav_about: '關於資料庫',
  nav_results: '導覽成果',
  nav_contact: '聯絡我們',
  hero_eyebrow: '一座正在長大的集體記憶',
  hero_title: '玩過的，<span style="color: hsl(var(--secondary))">就不會消失。</span>',
  hero_description: '一座收藏台灣童年與遊戲記憶的溫柔資料庫。從巷口的彈珠、廟埕的躲貓貓，到放學路上的一段段集體回憶，這裡都在等人把它說出來。',
  hero_cta: '走進記憶索引',
  hero_meta: '收錄自 1960 年代至今的台灣故事',
  hero_note_label: 'ARCHIVE NOTE / 0001',
  hero_note_status: '保存中',
  hero_note_quote: '「那時候沒有<br />手機，<br />但我們每天<br />都約得到。」',
  hero_note_location: '彰化・鹿港',
  hero_note_era: '1980 年代',
  memory_index_kicker: 'MEMORY INDEX / 記憶索引',
  memory_index_title: '一人說起，<span style="color: hsl(var(--primary))">大家想起。</span>',
  memory_index_desc: '每一筆記憶都由一位說故事的人開始。用地點、年代或一個你熟悉的詞，找找看。',
  memory_count: '目前收藏',
  about_kicker: 'WHY WE KEEP / 為什麼保存',
  about_title: '把「以前」<span style="color: hsl(var(--secondary))">交給以後。</span>',
  about_body: '一個孩子記得的遊戲，常常也是一個家庭、一條街，甚至一整個時代的共同記憶。這座資料庫正試著把那些不一定被寫進教科書的日常，留下來成為下一代可以回看的生活地圖。',
  footer_brand: '台灣玩耍記憶資料庫',
  footer_body: '讓那些曾經一起玩過的事，繼續在不同世代之間找到彼此。',
  footer_explore: 'EXPLORE',
  footer_contribute: 'CONTRIBUTE',
  footer_contribute_body: '你也有一段想保存的童年嗎？',
  footer_cta: '進入編輯入口 →',
  footer_copyright: '一個開放給所有人的家庭記憶計畫',
  contact_title: '聯絡我們',
  contact_body: '如果你有想保存的童年記憶、地方故事，或是希望合作，歡迎與我們聯絡。',
  form_title: '最新回饋',
};

const MEMORY_CARDS = [
  {
    id: '01',
    title: '鐵皮屋頂下的紙上遊戲',
    location: '臺南・新化',
    era: '1970 年代',
    category: '童玩',
    storyteller: '陳阿姨，1958 年生',
    excerpt: '下雨天不能去外面跑，大家就會把紙當成地圖，一起在鐵皮屋頂下注。',
    color: '#cf7657',
    mark: '童玩',
    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '02',
    title: '圍牆邊的彈珠王國',
    location: '彰化・鹿港',
    era: '1980 年代',
    category: '巷弄遊戲',
    storyteller: '林志明，1972 年生',
    excerpt: '那面圍牆不是邊界，而是整個街區的小型競技場。',
    color: '#3e8090',
    mark: '巷弄',
    image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '03',
    title: '阿公的竹蜻蜓',
    location: '花蓮・壽豐',
    era: '1990 年代',
    category: '家族手作',
    storyteller: '黃小芳，1985 年生',
    excerpt: '竹片飛起來以前，阿公先教我們量、剪、綁，像是學一種會飛的手藝。',
    color: '#7d8e58',
    mark: '手作',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '04',
    title: '四點半的紅白機',
    location: '臺北・萬華',
    era: '1990 年代',
    category: '電玩時光',
    storyteller: '周柏翰，1981 年生',
    excerpt: '電視機前面的那個瞬間，幾乎就像全世界都停在同一個畫面裡。',
    color: '#b98a35',
    mark: '電玩',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '05',
    title: '廟埕的影子追逐戰',
    location: '高雄・旗山',
    era: '1960 年代',
    category: '集體遊戲',
    storyteller: '王金蘭，1951 年生',
    excerpt: '夕陽把每個人都變成了下一秒會跑掉的影子。',
    color: '#a25b53',
    mark: '集體',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '06',
    title: '河堤邊的橡皮筋',
    location: '宜蘭・羅東',
    era: '1980 年代',
    category: '童謠遊戲',
    storyteller: '吳秀真，1969 年生',
    excerpt: '我們唱得越大聲，橡皮筋就像一條連著我們所有笑聲的線。',
    color: '#6c6a8d',
    mark: '童謠',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
  },
];

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(current);
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  }

  return rows;
}

function rowsToMap(rows: string[][]): SheetKeyValueMap {
  if (!rows || rows.length < 2) return {};
  const map: SheetKeyValueMap = {};

  for (const row of rows.slice(1)) {
    if (!row || row.length < 2) continue;
    const key = (row[0] ?? '').trim();
    const value = (row[1] ?? '').trim();
    if (!key) continue;
    map[key] = value;
  }

  return map;
}

function rowsToFormResponses(rows: string[][]): FormResponse[] {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map((header) => header.trim());

  return rows.slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) => {
      const entry: FormResponse = {};
      headers.forEach((header, index) => {
        entry[header as keyof FormResponse] = (row[index] ?? '').trim();
      });
      return entry;
    });
}

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function applyStyles(styleMap: Record<string, string>): void {
  const root = document.documentElement;
  const cssVars: Record<string, string> = {
    background: styleMap.background ?? DEFAULT_STYLES.background,
    foreground: styleMap.foreground ?? DEFAULT_STYLES.foreground,
    border: styleMap.border ?? DEFAULT_STYLES.border,
    card: styleMap.card ?? DEFAULT_STYLES.card,
    primary: styleMap.primary ?? DEFAULT_STYLES.primary,
    'primary-foreground': styleMap['primary-foreground'] ?? DEFAULT_STYLES['primary-foreground'],
    secondary: styleMap.secondary ?? DEFAULT_STYLES.secondary,
    'secondary-foreground': styleMap['secondary-foreground'] ?? DEFAULT_STYLES['secondary-foreground'],
    muted: styleMap.muted ?? DEFAULT_STYLES.muted,
    'muted-foreground': styleMap['muted-foreground'] ?? DEFAULT_STYLES['muted-foreground'],
    accent: styleMap.accent ?? DEFAULT_STYLES.accent,
    'accent-foreground': styleMap['accent-foreground'] ?? DEFAULT_STYLES['accent-foreground'],
    destructive: styleMap.destructive ?? DEFAULT_STYLES.destructive,
    'destructive-foreground': styleMap['destructive-foreground'] ?? DEFAULT_STYLES['destructive-foreground'],
    'app-font-sans': styleMap['app-font-sans'] ?? DEFAULT_STYLES['app-font-sans'],
    'app-font-serif': styleMap['app-font-serif'] ?? DEFAULT_STYLES['app-font-serif'],
  };

  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}

function applyContent(contentMap: SheetKeyValueMap): void {
  const merged = { ...DEFAULT_CONTENT, ...contentMap };
  const nodes = document.querySelectorAll('[data-sheet-key]');
  nodes.forEach((node) => {
    const key = node.getAttribute('data-sheet-key');
    if (!key) return;
    const value = merged[key];
    if (value === undefined || value === null) return;
    if (node instanceof HTMLButtonElement || node instanceof HTMLAnchorElement) {
      node.textContent = value;
    } else {
      node.innerHTML = value;
    }
  });
}

async function fetchCsv(url: string): Promise<string> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`CSV request failed: ${response.status}`);
  return response.text();
}

function normalizeStyleMap(raw: SheetKeyValueMap): Record<string, string> {
  const out: Record<string, string> = {};
  const colorKeys = new Set([
    'background', 'foreground', 'border', 'input', 'ring', 'card', 'card-foreground', 'card-border',
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted',
    'muted-foreground', 'accent', 'accent-foreground', 'destructive', 'destructive-foreground',
  ]);
  const mapping: Record<string, string> = {
    background: 'background',
    foreground: 'foreground',
    border: 'border',
    input_color: 'input',
    inputcolor: 'input',
    ring_color: 'ring',
    ringcolor: 'ring',
    card: 'card',
    card_foreground: 'card-foreground',
    cardforeground: 'card-foreground',
    card_border: 'card-border',
    cardborder: 'card-border',
    primary_color: 'primary',
    primarycolor: 'primary',
    primary_foreground: 'primary-foreground',
    primaryforeground: 'primary-foreground',
    secondary_color: 'secondary',
    secondarycolor: 'secondary',
    secondary_foreground: 'secondary-foreground',
    secondaryforeground: 'secondary-foreground',
    muted_color: 'muted',
    mutedcolor: 'muted',
    muted_foreground: 'muted-foreground',
    mutedforeground: 'muted-foreground',
    accent_color: 'accent',
    accentcolor: 'accent',
    accent_foreground: 'accent-foreground',
    accentforeground: 'accent-foreground',
    destructive_color: 'destructive',
    destructivecolor: 'destructive',
    destructive_foreground: 'destructive-foreground',
    destructiveforeground: 'destructive-foreground',
    text_color: 'foreground',
    textColor: 'foreground',
    heading_color: 'foreground',
    headingColor: 'foreground',
    font_family: 'app-font-sans',
    fontfamily: 'app-font-sans',
    serif_font: 'app-font-serif',
    seriffont: 'app-font-serif',
  };

  Object.entries(raw).forEach(([key, value]) => {
    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
    const cssVar = mapping[normalizedKey] ?? normalizedKey;
    if (!cssVar) return;
    const colorValue = value.trim();
    out[cssVar] = colorKeys.has(cssVar) ? normalizeStyleColor(colorValue) : colorValue;
  });

  return out;
}

function normalizeStyleColor(value: string): string {
  const hexMatch = value.match(/^#([\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i);
  if (hexMatch) {
    let hex = hexMatch[1].slice(0, 6);
    if (hex.length === 3) hex = [...hex].map((part) => `${part}${part}`).join('');
    const channels = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
    const [r, g, b] = channels;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const lightness = (max + min) / 2;
    let hue = 0;
    let saturation = 0;
    if (delta) {
      saturation = delta / (1 - Math.abs(2 * lightness - 1));
      if (max === r) hue = ((g - b) / delta) % 6;
      else if (max === g) hue = (b - r) / delta + 2;
      else hue = (r - g) / delta + 4;
      hue = (hue * 60 + 360) % 360;
    }
    return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
  }

  const hslMatch = value.match(/^hsla?\((.+)\)$/i);
  if (hslMatch) {
    const parts = hslMatch[1].split(/[,\s/]+/).filter(Boolean).slice(0, 3);
    if (parts.length === 3) return parts.join(' ').replace(/deg/gi, '');
  }

  const rgbMatch = value.match(/^rgba?\((.+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(/[,\s/]+/).slice(0, 3);
    const channels = parts.map((part) => part.endsWith('%')
      ? Number.parseFloat(part) / 100
      : Number.parseFloat(part) / 255);
    if (channels.length === 3 && channels.every(Number.isFinite)) {
      const [r, g, b] = channels;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      const lightness = (max + min) / 2;
      let hue = 0;
      let saturation = 0;
      if (delta) {
        saturation = delta / (1 - Math.abs(2 * lightness - 1));
        if (max === r) hue = ((g - b) / delta) % 6;
        else if (max === g) hue = (b - r) / delta + 2;
        else hue = (r - g) / delta + 4;
        hue = (hue * 60 + 360) % 360;
      }
      return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
    }
  }

  return value.replace(/,/g, ' ').replace(/deg/gi, '').trim();
}

function prettyDate(value: string): string {
  if (!value) return '未提供時間';
  return value;
}

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <FocusManagedDialog
      labelledBy="login-modal-title"
      className="detail-backdrop fixed inset-0 z-50 flex items-center justify-center p-5"
    >
      <div className="modal-panel w-full max-w-md rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-[hsl(var(--primary))]">LOGIN / 登入</p>
            <h2 id="login-modal-title" className="serif mt-2 text-2xl font-bold">管理入口</h2>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose} data-testid="button-close-login-modal">關閉</button>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">登入後可上傳故事照片，管理者也能使用編輯入口。</p>
        <a href={`${import.meta.env.BASE_URL}sign-in`} className="btn-primary flex min-h-12 w-full justify-center" data-testid="link-login-from-modal">使用帳號登入</a>
      </div>
    </FocusManagedDialog>
  );
}

function AppContent() {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const isFavoritesPage = window.location.pathname.endsWith('/favorites');
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [contentMap, setContentMap] = useState<SheetKeyValueMap>({});
  const [earliestYear, setEarliestYear] = useState<number | undefined>(undefined);

  useEffect(() => {
    const load = async () => {
      try {
        const stylesCsv = await fetchCsv(SHEET_CONFIG.styles.url);
        const contentCsv = await fetchCsv(SHEET_CONFIG.content.url);
        const formCsv = await fetchCsv(SHEET_CONFIG.formResponses.url);

        const styleRows = parseCsv(stylesCsv);
        const contentRows = parseCsv(contentCsv);
        const formRows = parseCsv(formCsv);

        const rawStyleMap = rowsToMap(styleRows);
        const rawContentMap = rowsToMap(contentRows);
        const formEntries = rowsToFormResponses(formRows);

        applyStyles(normalizeStyleMap(rawStyleMap));
        applyContent({ ...DEFAULT_CONTENT, ...rawContentMap });
        setContentMap({ ...DEFAULT_CONTENT, ...rawContentMap });
        setFormResponses(formEntries);
      } catch (error) {
        console.error('Sheet data load failed:', error);
        applyStyles(DEFAULT_STYLES);
        applyContent(DEFAULT_CONTENT);
        setContentMap(DEFAULT_CONTENT);
        setFormResponses([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const responseCards = useMemo(() => {
    if (!formResponses.length) {
      return [
        {
          Name: '尚無回應',
          Email: 'waiting',
          Message: '目前沒有可顯示的表單資料。',
          Timestamp: '等待中',
        },
      ];
    }

    return formResponses.slice(-6).reverse();
  }, [formResponses]);

  return (
    <div className="archive-shell texture">
        <header className="masthead relative z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <a href={isFavoritesPage ? import.meta.env.BASE_URL : '#top'} className="flex items-center gap-3" data-testid="link-home">
            <span className="archive-mark" aria-label="玩"><span>玩</span></span>
            <span>
              <span className="block text-[10px] font-semibold tracking-[.16em] text-[hsl(var(--accent))]" data-sheet-key="hero_eyebrow">{DEFAULT_CONTENT.hero_eyebrow}</span>
              <span className="block text-base font-bold text-white" data-sheet-key="brand_name">{DEFAULT_CONTENT.brand_name}</span>
            </span>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
            <a href="#memories" className="transition hover:text-white" data-sheet-key="nav_memories">{DEFAULT_CONTENT.nav_memories}</a>
            <a href={`${import.meta.env.BASE_URL}favorites`} className="transition hover:text-white">我的收藏</a>
            <a href="#about" className="transition hover:text-white" data-sheet-key="nav_about">{DEFAULT_CONTENT.nav_about}</a>
            <a href="#responses" className="transition hover:text-white" data-sheet-key="nav_results">{DEFAULT_CONTENT.nav_results}</a>
            <a href="#contact" className="transition hover:text-white" data-sheet-key="nav_contact">{DEFAULT_CONTENT.nav_contact}</a>
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost text-xs md:hidden" aria-label={menuOpen ? '關閉導覽選單' : '開啟導覽選單'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button type="button" className="btn-ghost text-xs" onClick={() => isSignedIn ? void signOut({ redirectUrl: import.meta.env.BASE_URL }) : setLoginOpen(true)}>
              {isSignedIn ? '登出' : '登入'}
            </button>
            <button type="button" className="btn-primary text-xs" onClick={() => document.getElementById('memories')?.scrollIntoView({ behavior: 'smooth' })}>
              立即開始
            </button>
          </div>
        </div>
        {menuOpen && <nav id="mobile-navigation" className="mx-5 mb-4 grid gap-1 rounded-xl border border-white/15 bg-slate-900/95 p-3 text-sm text-white md:hidden" aria-label="手機導覽">
          <a className="rounded-lg px-3 py-3" href="#memories" onClick={() => setMenuOpen(false)}>記憶索引</a>
          <a className="rounded-lg px-3 py-3" href={`${import.meta.env.BASE_URL}favorites`} onClick={() => setMenuOpen(false)}>☆ 我的收藏</a>
          <a className="rounded-lg px-3 py-3" href="#about" onClick={() => setMenuOpen(false)}>關於資料庫</a>
          <a className="rounded-lg px-3 py-3" href="#responses" onClick={() => setMenuOpen(false)}>導覽成果</a>
          <a className="rounded-lg px-3 py-3" href="#contact" onClick={() => setMenuOpen(false)}>聯絡我們</a>
        </nav>}
      </header>

      <main>
        {!isFavoritesPage && <section id="top" className="masthead relative overflow-hidden">
          <div className="hero-orbit" aria-hidden="true"><span className="hero-dot" /></div>
          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:pb-28 lg:pt-24">
            <div className="max-w-3xl">
              <p className="eyebrow fade-up text-[hsl(var(--accent))]" data-sheet-key="hero_eyebrow">
                {DEFAULT_CONTENT.hero_eyebrow}
              </p>
              <h1 className="display-title fade-up delay-1 mt-4 max-w-2xl text-5xl font-black text-white sm:text-7xl" data-sheet-key="hero_title">
                <span dangerouslySetInnerHTML={{ __html: DEFAULT_CONTENT.hero_title }} />
              </h1>
              <p className="fade-up delay-2 mt-8 max-w-xl text-base leading-loose text-white/70 sm:text-lg" data-sheet-key="hero_description">
                {DEFAULT_CONTENT.hero_description}
              </p>
              <div className="fade-up delay-3 mt-9 flex flex-wrap items-center gap-4">
                <button type="button" className="btn-primary" onClick={() => document.getElementById('memories')?.scrollIntoView({ behavior: 'smooth' })}>
                  <span data-sheet-key="hero_cta">{DEFAULT_CONTENT.hero_cta}</span>
                </button>
                <span className="text-xs tracking-wide text-white/45" data-sheet-key="hero_meta">{DEFAULT_CONTENT.hero_meta}</span>
              </div>
            </div>

            <div className="relative hidden min-h-[330px] items-end justify-end lg:flex">
              <div className="fade-up delay-4 relative w-[330px] rotate-3 border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between text-[10px] tracking-[.18em] text-white/60">
                  <span data-sheet-key="hero_note_label">{DEFAULT_CONTENT.hero_note_label}</span>
                  <span data-sheet-key="hero_note_status">{DEFAULT_CONTENT.hero_note_status}</span>
                </div>
                <p className="serif border-l-2 border-[hsl(var(--secondary))] pb-1 pl-4 text-2xl leading-tight text-white" data-sheet-key="hero_note_quote">
                  <span dangerouslySetInnerHTML={{ __html: DEFAULT_CONTENT.hero_note_quote }} />
                </p>
                <div className="mt-7 flex justify-between text-xs text-white/50">
                  <span data-sheet-key="hero_note_location">{DEFAULT_CONTENT.hero_note_location}</span>
                  <span data-sheet-key="hero_note_era">{DEFAULT_CONTENT.hero_note_era}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="relative mx-auto max-w-7xl px-5 pb-5 lg:px-8"><div className="flex items-center gap-3 text-[10px] tracking-[.2em] text-white/40"><span className="h-px w-8 bg-[hsl(var(--secondary))]" /><span>SCROLL TO REMEMBER</span></div></div>
        </section>}

        <div data-sheet-key="memory_index_kicker" className="sr-only">{contentMap.memory_index_kicker}</div>
        <CommunityFeatures
          initialStories={MEMORY_CARDS}
          isSignedIn={Boolean(isSignedIn)}
          onSignIn={() => { window.location.href = `${import.meta.env.BASE_URL}sign-in`; }}
          onEarliestYear={setEarliestYear}
          favoritesOnly={isFavoritesPage}
          content={contentMap}
        />

        {!isFavoritesPage && <>
        <section id="about" className="border-y border-[hsl(var(--border))] bg-[hsl(var(--muted)/.55)]">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
            <div>
              <p className="section-kicker text-[hsl(var(--primary))]" data-sheet-key="about_kicker">{DEFAULT_CONTENT.about_kicker}</p>
              <h2 className="serif mt-3 text-4xl font-black text-[hsl(var(--foreground))]" data-sheet-key="about_title">
                <span dangerouslySetInnerHTML={{ __html: DEFAULT_CONTENT.about_title }} />
              </h2>
            </div>
            <div className="grid items-start gap-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))]">
                <p className="serif text-3xl font-bold leading-tight" data-sheet-key="about_title_2">每個人<br />都是收藏家。</p>
              </div>
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                <p className="eyebrow text-[hsl(var(--primary))]" data-testid="text-earliest-story-decade">{earliestYear ?? 1960} →</p>
                <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">跨越不同年代，持續收錄中</p>
              </div>
              <div className="sm:col-span-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                <p className="text-base leading-relaxed text-[hsl(var(--muted-foreground))]" data-sheet-key="about_body">
                  {DEFAULT_CONTENT.about_body}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="responses" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="mb-8">
            <p className="section-kicker text-[hsl(var(--primary))]">Responses / 回饋</p>
            <h2 className="serif mt-3 text-4xl font-black text-[hsl(var(--foreground))]" data-sheet-key="form_title">{DEFAULT_CONTENT.form_title}</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {responseCards.map((item, index) => (
              <div key={`${item.Name}-${index}`} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <strong className="text-base text-[hsl(var(--foreground))]">{item.Name || '匿名'}</strong>
                  <span className="text-[10px] tracking-[.12em] text-[hsl(var(--muted-foreground))]">{prettyDate(item.Timestamp || item.timestamp || item.Date || item.date || '未提供時間')}</span>
                </div>
                <div className="mb-3 text-xs text-[hsl(var(--muted-foreground))]">{item.Email || item.email || '未提供信箱'}</div>
                <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{item.Message || item.message || item.Comment || item.comment || '沒有內容'}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-7xl px-5 pb-20 lg:px-8 lg:pb-28">
          <div className="rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-sm">
            <p className="section-kicker text-[hsl(var(--primary))]" data-sheet-key="contact_title">{DEFAULT_CONTENT.contact_title}</p>
            <h2 className="serif mt-3 text-4xl font-black text-[hsl(var(--foreground))]" data-sheet-key="contact_title_primary">聯絡我們</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[hsl(var(--muted-foreground))]" data-sheet-key="contact_body">
              {DEFAULT_CONTENT.contact_body}
            </p>
          </div>
        </section>
        </>}
      </main>

      <footer className="masthead">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
          <div className="footer-grid">
            <div>
              <div className="flex items-center gap-3">
                <span className="archive-mark" aria-label="玩"><span>玩</span></span>
                <div>
                  <p className="eyebrow text-[hsl(var(--accent))]">TAIWAN PLAY MEMORIES</p>
                  <h3 className="text-xl font-bold text-white" data-sheet-key="footer_brand">{DEFAULT_CONTENT.footer_brand}</h3>
                </div>
              </div>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70" data-sheet-key="footer_body">{DEFAULT_CONTENT.footer_body}</p>
            </div>

            <div>
              <p className="eyebrow text-[hsl(var(--accent))]" data-sheet-key="footer_explore">{DEFAULT_CONTENT.footer_explore}</p>
              <ul className="mt-4 space-y-3 text-sm text-white/80">
                <li><a href="#top">首頁</a></li>
                <li><a href="#memories">記憶索引</a></li>
                <li><a href="#about">關於資料庫</a></li>
              </ul>
            </div>

            <div>
              <p className="eyebrow text-[hsl(var(--accent))]" data-sheet-key="footer_contribute">{DEFAULT_CONTENT.footer_contribute}</p>
              <p className="mt-4 text-sm leading-relaxed text-white/70" data-sheet-key="footer_contribute_body">{DEFAULT_CONTENT.footer_contribute_body}</p>
              <button type="button" className="btn-ghost mt-4 text-xs" onClick={() => setLoginOpen(true)} data-sheet-key="footer_cta">
                {DEFAULT_CONTENT.footer_cta}
              </button>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <span data-sheet-key="footer_copyright">{DEFAULT_CONTENT.footer_copyright}</span>
            <span>© 2026 Taiwan Play Memories</span>
          </div>
        </div>
      </footer>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      {loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[hsl(var(--background)/.8)] backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-xl">
            <div className="mb-4 h-4 w-24 rounded-full bg-[hsl(var(--muted))]" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded-full bg-[hsl(var(--muted))]" />
              <div className="h-4 w-5/6 rounded-full bg-[hsl(var(--muted))]" />
              <div className="h-4 w-4/6 rounded-full bg-[hsl(var(--muted))]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkAppearance = {
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg?v=5`,
  },
  variables: {
    colorPrimary: '#24777a',
    colorForeground: '#1b3341',
    colorMutedForeground: '#68747a',
    colorBackground: '#fbf8f1',
    colorInput: '#fffdf8',
    colorInputForeground: '#1b3341',
    colorDanger: '#a34137',
    colorNeutral: '#d9d4ca',
    fontFamily: '"Noto Sans TC", ui-sans-serif, sans-serif',
    borderRadius: '0.75rem',
  },
};

function App() {
  const path = window.location.pathname;
  const isSignIn = path.includes(`${basePath}/sign-in`);
  const isSignUp = path.includes(`${basePath}/sign-up`);
  return (
    <ClerkProvider publishableKey={clerkPubKey} proxyUrl={import.meta.env.VITE_CLERK_PROXY_URL} appearance={clerkAppearance}>
      {isSignIn ? <div className="flex min-h-dvh items-center justify-center bg-[hsl(var(--muted))] p-5"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>
        : isSignUp ? <div className="flex min-h-dvh items-center justify-center bg-[hsl(var(--muted))] p-5"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>
          : <AppContent />}
    </ClerkProvider>
  );
}

export default App;
