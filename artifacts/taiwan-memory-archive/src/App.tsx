import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowDown, ArrowRight, BookOpen, Check, ChevronDown, Eye, LockKeyhole, MapPin, Menu, Plus, Search, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

type Memory = {
  id: string;
  title: string;
  location: string;
  era: string;
  category: string;
  storyteller: string;
  excerpt: string;
  story: string;
  color: string;
  mark: string;
};

type ArchiveData = { introduction: string; memories: Memory[] };

const seedData: ArchiveData = {
  introduction: '一座收藏台灣童年與遊戲記憶的溫柔資料庫。從巷口的彈珠、廟埕的躲貓貓，到放學路上只屬於那一代人的暗號，這裡收下每一個「以前我們都這樣玩」的故事。',
  memories: [
    { id: '01', title: '鐵皮屋頂下的紙上遊戲', location: '臺南・新化', era: '1970 年代', category: '童玩', storyteller: '陳阿姨，1958 年生', excerpt: '下雨天不能去溪邊，我們就把整個下午摺進一張紙裡。', story: '下雨天不能去溪邊，我們就把整個下午摺進一張紙裡。那時候文具店一張厚紙要兩毛錢，我們捨不得買，就拿哥哥的作業簿背面。畫格子、寫上「前進三格」，再把橡皮擦削成小棋子。鐵皮屋頂被雨打得轟轟響，誰先走到終點，誰就可以吃掉最後一顆鹹酸甜。\n\n現在回想起來，那個遊戲其實沒有固定規則。每次有人耍賴，我們就一起改規則，改到所有人都想再玩一次。', color: '#cf7657', mark: '雨日', },
    { id: '02', title: '圍牆邊的彈珠王國', location: '彰化・鹿港', era: '1980 年代', category: '巷弄遊戲', storyteller: '林志明，1972 年生', excerpt: '那面圍牆不是圍牆，是我們每天都要征服的山。', story: '鹿港的夏天很早就熱起來。放學後，我們把書包往家裡一丟，手掌沾著一點粉筆灰，就在老戲院後面的圍牆邊集合。地上挖幾個小洞，誰能把彈珠打進最遠的洞，大家就叫他「王」。\n\n我最珍惜的是一顆藍色透明彈珠，裡面像有一小朵雲。後來它不見了，我沿著排水溝找了三天。找不到是找不到，但那三天所有人都陪我蹲在地上，這件事我一直記得。', color: '#3e8090', mark: '街角', },
    { id: '03', title: '阿公的竹蜻蜓', location: '花蓮・壽豐', era: '1990 年代', category: '家族手作', storyteller: '黃小芳，1985 年生', excerpt: '竹片飛起來以前，阿公總會先說：慢慢來，風會幫你。', story: '阿公的手指總是有木頭的味道。他把竹片削得薄薄的，在中間鑽一個小孔，插進細竹棒，再用手掌搓著讓它升空。第一次我用力過頭，竹蜻蜓飛起來撞到屋簷，掉進了姑姑種的九重葛裡。\n\n阿公沒有罵我，只是又拿出一截竹子。他說，做東西跟種田一樣，慢慢來，風會幫你。後來每年暑假我都去壽豐，學會了做風車、陀螺，還有一個不太會飛的風箏。', color: '#7d8e58', mark: '山風', },
    { id: '04', title: '四點半的紅白機', location: '臺北・萬華', era: '1990 年代', category: '電玩時光', storyteller: '周柏翰，1981 年生', excerpt: '電視機前面的那條線，是我們和另一個世界的入口。', story: '巷口的電玩店四點半開門。老闆把鐵門拉到一半，我們就從下面鑽進去，書包一字排在門邊。那台紅白機的手把常常接觸不良，要用膝蓋壓著才有畫面，但沒有人在意。\n\n我們用一枚十元硬幣分配輪流的時間。輪到別人的時候，大家也不是真的在休息，而是湊得很近，替他指揮下一步。最熱鬧的時候，整間店都是「上啊！」和「再一關！」。', color: '#b98a35', mark: '像素', },
    { id: '05', title: '廟埕的影子追逐戰', location: '高雄・旗山', era: '1960 年代', category: '集體遊戲', storyteller: '王金蘭，1951 年生', excerpt: '夕陽把每個人的影子拉得好長，誰的影子被踩到，誰就要當鬼。', story: '吃完晚飯，家裡的大人還在廚房忙，我們就跑到廟埕。沒有手電筒，只有廟前那盞黃黃的燈。夕陽把每個人的影子拉得好長，誰的影子被踩到，誰就要當鬼。\n\n那時候孩子很多，鄰居家的、遠房親戚家的，通通混在一起。遊戲沒有開始和結束，是媽媽站在騎樓喊名字的時候，大家才一哄而散。隔天再見面，昨天的輸贏就忘了，先決定今天誰當鬼。', color: '#a25b53', mark: '暮色', },
    { id: '06', title: '河堤邊的橡皮筋', location: '宜蘭・羅東', era: '1980 年代', category: '童謠遊戲', storyteller: '吳秀真，1969 年生', excerpt: '我們唱得越大聲，橡皮筋就跳得越高。', story: '三個人就可以玩橡皮筋。兩個人站在兩側，把一條彩色的橡皮筋繃在小腿間，其他人一邊唱歌一邊跳。高度從腳踝一路升到腰，唱錯歌詞的人要換邊。\n\n羅東河堤的風很大，頭髮常常被吹得亂七八糟，但我們還是唱得很大聲。歌詞有時候是自己亂編的，只有我們聽得懂。這些歌沒有被錄下來，卻在很多人的身體裡記得節奏。', color: '#d28a68', mark: '唱遊', },
  ],
};

const categories = ['全部', '童玩', '巷弄遊戲', '家族手作', '電玩時光', '集體遊戲', '童謠遊戲'];
const queryClient = new QueryClient();

function loadArchive(): ArchiveData {
  try {
    const stored = localStorage.getItem('taiwan-memory-archive');
    if (stored) return JSON.parse(stored) as ArchiveData;
  } catch { /* use seed data when local storage is unavailable */ }
  return seedData;
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="masthead relative z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <a href="#top" className="flex items-center gap-3" data-testid="link-home">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--accent)/.65)] text-[hsl(var(--accent))]">
            <BookOpen size={18} />
          </span>
          <span><span className="block font-semibold tracking-[.16em] text-[10px] text-[hsl(var(--accent))]">TAIWAN PLAY MEMORIES</span><span className="serif text-lg font-bold">台灣玩耍記憶資料庫</span></span>
        </a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="主要導覽">
          <a href="#memories" className="text-sm text-white/75 transition hover:text-[hsl(var(--accent))]" data-testid="link-memories">記憶索引</a>
          <a href="#about" className="text-sm text-white/75 transition hover:text-[hsl(var(--accent))]" data-testid="link-about">關於資料庫</a>
        </nav>
        <button onClick={() => setMenuOpen(!menuOpen)} className="btn-ghost md:hidden" aria-label="開啟導覽選單" aria-expanded={menuOpen} data-testid="button-mobile-menu"><Menu /></button>
      </div>
      {menuOpen && <nav className="flex flex-col gap-1 border-t border-white/10 px-5 pb-4 pt-2 md:hidden" aria-label="行動版導覽">
        <a href="#memories" onClick={() => setMenuOpen(false)} className="rounded px-2 py-2 text-sm text-white/80" data-testid="link-mobile-memories">記憶索引</a>
        <a href="#about" onClick={() => setMenuOpen(false)} className="rounded px-2 py-2 text-sm text-white/80" data-testid="link-mobile-about">關於資料庫</a>
      </nav>}
    </header>
  );
}

function Hero({ introduction, onExplore }: { introduction: string; onExplore: () => void }) {
  return <section id="top" className="masthead relative overflow-hidden">
    <div className="hero-orbit" aria-hidden="true"><span className="hero-dot" /></div>
    <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:pb-28 lg:pt-24">
      <div className="max-w-3xl">
        <p className="eyebrow fade-up text-[hsl(var(--accent))]">一座正在長大的集體記憶</p>
        <h1 className="display-title fade-up delay-1 mt-7 text-5xl font-black tracking-tight text-white sm:text-7xl lg:text-[6.8rem]">玩過的，<br /><span className="text-[hsl(var(--secondary))]">就不會消失。</span></h1>
        <p className="fade-up delay-2 mt-8 max-w-xl text-base leading-loose text-white/70 sm:text-lg">{introduction}</p>
        <div className="fade-up delay-3 mt-9 flex flex-wrap items-center gap-4">
          <button onClick={onExplore} className="btn-primary" data-testid="button-explore"><span>走進記憶索引</span><ArrowDown size={16} /></button>
          <span className="text-xs tracking-wide text-white/45">收錄自 1960 年代至今的台灣故事</span>
        </div>
      </div>
      <div className="relative hidden min-h-[330px] items-end justify-end lg:flex">
        <div className="fade-up delay-4 relative w-[330px] rotate-3 border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between text-[10px] tracking-[.18em] text-white/60"><span>ARCHIVE NOTE / 0001</span><span>保存中</span></div>
          <div className="serif border-l-2 border-[hsl(var(--secondary))] py-4 pl-5 text-2xl leading-relaxed text-white">「那時候沒有<br />手機，<br />但我們每天<br />都約得到。」</div>
          <div className="mt-7 flex justify-between text-xs text-white/50"><span>彰化・鹿港</span><span>1980 年代</span></div>
        </div>
      </div>
    </div>
    <div className="relative mx-auto max-w-7xl px-5 pb-5 lg:px-8"><div className="flex items-center gap-3 text-[10px] tracking-[.2em] text-white/40"><span className="h-px w-8 bg-[hsl(var(--secondary))]" /> SCROLL TO REMEMBER</div></div>
  </section>;
}

function MemoryCard({ memory, onOpen }: { memory: Memory; onOpen: (memory: Memory) => void }) {
  return <article className="memory-card overflow-hidden rounded-[1.15rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))]" data-testid={`card-memory-${memory.id}`}>
    <button onClick={() => onOpen(memory)} className="block w-full text-left" data-testid={`button-open-memory-${memory.id}`}>
      <div className="memory-image flex flex-col justify-between p-5" style={{ background: memory.color }}>
        <div className="relative z-[1] flex justify-between text-white/80"><span className="card-stamp">{memory.mark}</span><span className="text-[10px] tracking-[.18em]">NO. {memory.id}</span></div>
        <div className="relative z-[1]"><div className="mb-3 flex items-center gap-2 text-xs text-white/75"><MapPin size={13} />{memory.location}</div><h3 className="serif text-2xl font-bold leading-snug text-white">{memory.title}</h3></div>
      </div>
      <div className="p-5"><div className="mb-4 flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]"><span>{memory.era}</span><span className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-1">{memory.category}</span></div><p className="serif min-h-[54px] text-base leading-relaxed text-[hsl(var(--foreground))]">「{memory.excerpt}」</p><div className="mt-5 flex items-center justify-between border-t border-[hsl(var(--border))] pt-4 text-xs text-[hsl(var(--muted-foreground))]"><span>{memory.storyteller}</span><span className="flex items-center gap-1 font-semibold text-[hsl(var(--primary))]">閱讀故事 <ArrowRight size={14} /></span></div></div>
    </button>
  </article>;
}

function IndexSection({ memories, onOpen }: { memories: Memory[]; onOpen: (memory: Memory) => void }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const filtered = useMemo(() => memories.filter((memory) => {
    const matchCategory = category === '全部' || memory.category === category;
    const text = `${memory.title}${memory.location}${memory.storyteller}${memory.excerpt}`.toLowerCase();
    return matchCategory && text.includes(search.toLowerCase());
  }), [memories, search, category]);
  return <section id="memories" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="section-kicker eyebrow">MEMORY INDEX / 記憶索引</p><h2 className="display-title mt-5 text-4xl font-bold sm:text-5xl">一人說起，<br /><span className="text-[hsl(var(--primary))]">大家想起。</span></h2></div><p className="max-w-sm text-sm leading-loose text-[hsl(var(--muted-foreground))]">每一筆記憶都由一位說故事的人開始。用地點、年代或一個你熟悉的詞，找找看。</p></div>
    <div className="mt-12 flex flex-col gap-5 border-y border-[hsl(var(--border))] py-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative max-w-sm flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋地點、人物或記憶…" className="input-archive search-input" aria-label="搜尋記憶" data-testid="input-search-memories" /></div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="記憶分類篩選">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`filter-chip rounded-full border px-3 py-2 text-xs font-semibold ${category === item ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))]'}`} data-testid={`button-filter-${item}`}>{item}</button>)}</div>
    </div>
    {filtered.length > 0 ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((memory, index) => <div key={memory.id} className={`fade-up delay-${Math.min(index + 1, 4)}`}><MemoryCard memory={memory} onOpen={onOpen} /></div>)}</div> : <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] py-20 text-center"><Search className="mx-auto mb-4 text-[hsl(var(--secondary))]" size={30} /><p className="serif text-xl">還沒有找到這段記憶</p><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">換個詞試試，或把一個新故事放進資料庫。</p></div>}
    <p className="mt-7 text-xs text-[hsl(var(--muted-foreground))]" data-testid="text-memory-count">目前收藏 {filtered.length} / {memories.length} 則記憶</p>
  </section>;
}

function AboutSection() {
  return <section id="about" className="border-y border-[hsl(var(--border))] bg-[hsl(var(--muted)/.55)]"><div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-28">
    <div><p className="section-kicker eyebrow">WHY WE KEEP / 為什麼保存</p><h2 className="display-title mt-5 text-4xl font-bold sm:text-5xl">把「以前」<br /><span className="text-[hsl(var(--secondary))]">交給以後。</span></h2><p className="mt-7 max-w-md text-sm leading-loose text-[hsl(var(--muted-foreground))]">一個孩子記得的遊戲，常常也是一個家庭、一條街、甚至一整個時代的共同記憶。這座資料庫邀請不同世代坐下來，讓口述成為可以再被聽見的文化。</p></div>
     <div className="grid items-start gap-5 sm:grid-cols-2"><div className="rounded-2xl bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))]"><Sparkles size={20} className="mb-7 text-[hsl(var(--accent))]" /><div className="serif text-3xl font-bold">每個人<br />都是收藏家。</div></div><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:mt-12"><div className="serif text-3xl font-bold text-[hsl(var(--secondary))]">1960 →</div><p className="mt-2 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">跨越不同年代，持續收錄中</p></div></div>
  </div></section>;
}

function MemoryModal({ memory, onClose }: { memory: Memory; onClose: () => void }) {
  return <div className="detail-backdrop fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="memory-detail-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-panel max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-2xl sm:rounded-3xl">
      <div className="flex items-center justify-between p-5 sm:p-7"><div className="eyebrow text-[hsl(var(--primary))]">MEMORY NO. {memory.id} / 故事詳頁</div><button onClick={onClose} aria-label="關閉故事詳頁" className="btn-ghost" data-testid="button-close-memory"><X size={20} /></button></div>
      <div className="mx-5 h-2 rounded-full sm:mx-7" style={{ background: memory.color }} />
      <div className="grid gap-8 p-5 sm:p-10 lg:grid-cols-[.72fr 1.28fr]"><div><p className="text-sm text-[hsl(var(--muted-foreground))]">{memory.location}　/　{memory.era}</p><h2 id="memory-detail-title" className="display-title mt-4 text-4xl font-bold">{memory.title}</h2><div className="mt-8 border-l-2 border-[hsl(var(--secondary))] pl-5"><p className="quote-mark">“</p><p className="serif text-xl leading-loose">{memory.excerpt}</p></div><p className="mt-8 text-sm text-[hsl(var(--muted-foreground))]">說故事的人<br /><strong className="mt-1 block text-base text-[hsl(var(--foreground))]">{memory.storyteller}</strong></p></div><div><div className="whitespace-pre-line text-base leading-[2.1] text-[hsl(var(--foreground)/.82)]">{memory.story}</div><div className="mt-10 border-t border-[hsl(var(--border))] pt-5 text-xs text-[hsl(var(--muted-foreground))]">分類：{memory.category}</div></div></div>
    </div>
  </div>;
}

function PasswordGate({ onUnlock, onClose }: { onUnlock: () => void; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); if (password === '00000') onUnlock(); else { setError('密碼不對，再試一次。提示：是五個 0。'); setPassword(''); } };
  return <div className="detail-backdrop fixed inset-0 z-50 flex items-center justify-center p-5" role="dialog" aria-modal="true" aria-labelledby="gate-title"><div className="modal-panel w-full max-w-md rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-7 shadow-2xl sm:p-10"><div className="flex items-start justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><LockKeyhole size={21} /></div><button onClick={onClose} className="btn-ghost" aria-label="關閉編輯入口" data-testid="button-close-gate"><X size={19} /></button></div><p className="eyebrow mt-8 text-[hsl(var(--primary))]">EDITOR ACCESS / 編輯入口</p><h2 id="gate-title" className="serif mt-3 text-3xl font-bold">想替這座資料庫<br />放進一段新的記憶嗎？</h2><p className="mt-4 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">這裡是給資料庫守護者的入口。輸入五位數密碼，就可以整理故事、修改介紹或新增一則收藏。</p><form onSubmit={submit} className="mt-7"><label htmlFor="archive-password" className="text-sm font-semibold">編輯密碼</label><input id="archive-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} type="password" inputMode="numeric" maxLength={5} placeholder="請輸入 5 位數密碼" className="input-archive mt-2 text-center text-xl tracking-[.45em]" autoFocus data-testid="input-editor-password" />{error && <p className="mt-2 text-sm text-[hsl(var(--destructive))]" role="alert" data-testid="text-password-error">{error}</p>}<button type="submit" className="btn-primary mt-5 w-full" data-testid="button-submit-password">進入編輯模式 <ArrowRight size={16} /></button></form><p className="mt-5 text-center text-xs text-[hsl(var(--muted-foreground))]"><ShieldCheck className="mr-1 inline-block" size={13} />編輯內容只會保存在這台裝置上</p></div></div>;
}

function Editor({ archive, onSave, onCancel, onLock }: { archive: ArchiveData; onSave: (data: ArchiveData) => void; onCancel: () => void; onLock: () => void }) {
  const [draft, setDraft] = useState<ArchiveData>(() => structuredClone(archive));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);
  const selected = draft.memories.find((memory) => memory.id === selectedId);
  const updateSelected = (field: keyof Memory, value: string) => { if (!selectedId) return; setDraft((current) => ({ ...current, memories: current.memories.map((memory) => memory.id === selectedId ? { ...memory, [field]: value } : memory) })); };
  const removeSelected = () => { if (!selectedId || !window.confirm('確定要刪除這則記憶嗎？刪除後請按「保存變更」才會生效。')) return; setDraft((current) => ({ ...current, memories: current.memories.filter((memory) => memory.id !== selectedId) })); setSelectedId(null); };
  const addNew = () => { const nextId = String(Math.max(0, ...draft.memories.map((memory) => Number(memory.id))) + 1).padStart(2, '0'); const memory: Memory = { id: nextId, title: '一段還沒命名的記憶', location: '台灣・', era: '年代待補', category: '童玩', storyteller: '說故事的人', excerpt: '在這裡寫下一句讓人想繼續聽的話。', story: '請在這裡寫下完整的故事。可以記錄遊戲怎麼開始、誰和你一起玩，以及那時候的天氣和聲音。', color: '#3e8090', mark: '新藏', }; setDraft((current) => ({ ...current, memories: [...current.memories, memory] })); setSelectedId(nextId); setShowNew(false); };
  return <div className="fixed inset-0 z-40 overflow-y-auto bg-[hsl(var(--background))]"><div className="mx-auto min-h-dvh max-w-7xl px-5 pb-20 lg:px-8"><div className="sticky top-0 z-10 -mx-5 mb-10 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.94)] px-5 py-4 backdrop-blur lg:-mx-8 lg:px-8"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow text-[hsl(var(--primary))]">EDITOR MODE / 編輯模式</p><h1 className="serif mt-1 text-xl font-bold">整理這些被記住的事</h1></div><div className="flex gap-2"><button onClick={onCancel} className="btn-outline px-3 py-2 text-xs" data-testid="button-cancel-editor">取消</button><button onClick={onLock} className="btn-ghost text-xs" data-testid="button-lock-editor"><LockKeyhole size={15} /> 鎖定</button><button onClick={() => { onSave(draft); setSaved(true); setTimeout(() => setSaved(false), 2200); }} className="btn-primary text-xs" data-testid="button-save-archive">{saved ? <><Check size={15} /> 已保存</> : <><Check size={15} /> 保存變更</>}</button></div></div></div><div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]"><aside><div className="rounded-2xl bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))]"><p className="eyebrow text-[hsl(var(--accent))]">ARCHIVE SETTINGS</p><h2 className="serif mt-3 text-2xl font-bold">資料庫介紹</h2><textarea value={draft.introduction} onChange={(event) => setDraft({ ...draft, introduction: event.target.value })} className="mt-5 min-h-[190px] w-full resize-y rounded-xl border border-white/20 bg-white/10 p-4 text-sm leading-relaxed text-white outline-none placeholder:text-white/45 focus:border-[hsl(var(--accent))]" aria-label="編輯資料庫介紹" data-testid="textarea-introduction" /><p className="mt-3 text-xs text-white/55">這段文字會出現在首頁的第一個畫面。</p></div><div className="mt-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"><div className="flex items-center justify-between"><div><p className="eyebrow text-[hsl(var(--primary))]">COLLECTION</p><p className="mt-1 font-bold">記憶清單 <span className="text-[hsl(var(--muted-foreground))]">({draft.memories.length})</span></p></div><button onClick={() => setShowNew(true)} className="btn-primary px-3 py-2 text-xs" data-testid="button-add-memory"><Plus size={15} /> 新增</button></div><div className="mt-4 space-y-1">{draft.memories.map((memory) => <button key={memory.id} onClick={() => setSelectedId(memory.id)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${selectedId === memory.id ? 'bg-[hsl(var(--muted))]' : 'hover:bg-[hsl(var(--muted)/.65)]'}`} data-testid={`button-edit-memory-${memory.id}`}><span className="h-8 w-8 rounded-lg" style={{ background: memory.color }} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{memory.title}</span><span className="block text-xs text-[hsl(var(--muted-foreground))]">{memory.location}</span></span><ChevronDown size={14} className="-rotate-90 text-[hsl(var(--muted-foreground))]" /></button>)}</div></div></aside><main>{selected ? <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8"><div className="mb-7 flex items-start justify-between"><div><p className="eyebrow text-[hsl(var(--primary))]">EDIT MEMORY / 編輯故事</p><h2 className="serif mt-2 text-3xl font-bold">{selected.title}</h2></div><button onClick={removeSelected} className="btn-ghost text-[hsl(var(--destructive))]" aria-label="刪除此記憶" data-testid={`button-delete-memory-${selected.id}`}><Trash2 size={17} /> <span className="hidden sm:inline">刪除</span></button></div><div className="grid gap-5 sm:grid-cols-2">{[['title','標題'],['location','地點'],['era','年代'],['category','分類'],['storyteller','說故事的人'],['mark','卡片標記'],['color','卡片色彩']].map(([field, label]) => <label key={field} className="text-sm font-semibold">{label}<input value={String(selected[field as keyof Memory])} onChange={(event) => updateSelected(field as keyof Memory, event.target.value)} className="input-archive mt-2" data-testid={`input-memory-${field}-${selected.id}`} /></label>)}</div><label className="mt-5 block text-sm font-semibold">一句話摘錄<textarea value={selected.excerpt} onChange={(event) => updateSelected('excerpt', event.target.value)} className="input-archive mt-2 min-h-[95px] resize-y" data-testid={`textarea-memory-excerpt-${selected.id}`} /></label><label className="mt-5 block text-sm font-semibold">完整故事<textarea value={selected.story} onChange={(event) => updateSelected('story', event.target.value)} className="input-archive mt-2 min-h-[250px] resize-y leading-loose" data-testid={`textarea-memory-story-${selected.id}`} /></label><p className="mt-6 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Eye size={14} /> 編輯完成後，請按右上角「保存變更」讓首頁看見最新內容。</p></div> : <div className="flex min-h-[430px] items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] p-8 text-center"><div><BookOpen className="mx-auto text-[hsl(var(--secondary))]" size={34} /><h2 className="serif mt-5 text-2xl font-bold">選一則記憶開始整理</h2><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">或從左側新增一個故事。</p></div></div>}</main></div></div>{showNew && <div className="detail-backdrop fixed inset-0 z-50 flex items-center justify-center p-5"><div className="modal-panel max-w-sm rounded-3xl bg-[hsl(var(--background))] p-8 text-center shadow-2xl"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--secondary)/.2)] text-[hsl(var(--secondary))]"><Plus /></div><h2 className="serif mt-5 text-2xl font-bold">放進一段新記憶</h2><p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">先建立一張空白收藏卡，再慢慢把故事補完整。</p><div className="mt-6 flex justify-center gap-2"><button onClick={() => setShowNew(false)} className="btn-outline" data-testid="button-cancel-new-memory">先不要</button><button onClick={addNew} className="btn-primary" data-testid="button-confirm-new-memory">建立收藏 <ArrowRight size={15} /></button></div></div></div>}</div>;
}

function Footer({ onEdit }: { onEdit: () => void }) {
  return <footer className="masthead"><div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20"><div className="footer-grid"><div><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-[hsl(var(--accent)/.65)] text-[hsl(var(--accent))]"><BookOpen size={16} /></span><span className="serif text-lg font-bold">台灣玩耍記憶資料庫</span></div><p className="mt-5 max-w-xs text-sm leading-loose text-white/55">讓那些曾經一起玩過的事，繼續在不同世代之間找到彼此。</p></div><div><p className="eyebrow text-[hsl(var(--accent))]">EXPLORE</p><div className="mt-4 flex flex-col gap-3 text-sm text-white/65"><a href="#memories" data-testid="link-footer-memories">記憶索引</a><a href="#about" data-testid="link-footer-about">關於資料庫</a></div></div><div><p className="eyebrow text-[hsl(var(--accent))]">CONTRIBUTE</p><p className="mt-4 text-sm leading-loose text-white/65">你也有一段想保存的童年嗎？</p><button onClick={onEdit} className="mt-3 text-sm font-bold text-[hsl(var(--secondary))]" data-testid="button-footer-editor">進入編輯入口　→</button></div></div><div className="mt-14 flex flex-col justify-between gap-3 border-t border-white/10 pt-5 text-xs text-white/35 sm:flex-row"><span>一個開放給所有人的家庭記憶計畫</span><span>© 台灣玩耍記憶資料庫</span></div></div></footer>;
}

function Home() {
  const [archive, setArchive] = useState<ArchiveData>(loadArchive);
  const [detail, setDetail] = useState<Memory | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => { localStorage.setItem('taiwan-memory-archive', JSON.stringify(archive)); }, [archive]);
  const saveArchive = (data: ArchiveData) => { setArchive(data); setEditing(false); };
  const explore = () => document.getElementById('memories')?.scrollIntoView({ behavior: 'smooth' });
  return <div className="archive-shell texture"><Header /><main><Hero introduction={archive.introduction} onExplore={explore} /><IndexSection memories={archive.memories} onOpen={setDetail} /><AboutSection /></main><Footer onEdit={() => setGateOpen(true)} />{detail && <MemoryModal memory={detail} onClose={() => setDetail(null)} />}{gateOpen && <PasswordGate onClose={() => setGateOpen(false)} onUnlock={() => { setGateOpen(false); setEditing(true); }} />}{editing && <Editor archive={archive} onSave={saveArchive} onCancel={() => setEditing(false)} onLock={() => setEditing(false)} />}</div>;
}

function Router() {
  return <ErrorBoundary><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;