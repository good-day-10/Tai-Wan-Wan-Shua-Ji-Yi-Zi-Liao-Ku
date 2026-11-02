import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Heart, Star, Upload } from 'lucide-react';
import { getEarliestStoryDecade } from './archive-display';

type Story = {
  id: string;
  title: string;
  location?: string;
  era: string;
  category: string;
  storyteller?: string;
  excerpt: string;
  story?: string;
  color?: string;
  mark?: string;
  image?: string;
  imagePath?: string;
  pendingReview?: boolean;
};

type Resonance = { memoryId: string; count: number; reactedByVisitor: boolean };

const categories = ['全部', '童玩', '巷弄遊戲', '家族手作', '電玩時光', '集體遊戲', '童謠遊戲'];
const visitorId = (() => {
  try {
    let id = localStorage.getItem('archive-resonance-visitor');
    if (!id) {
      id = `visitor-${crypto.randomUUID()}`;
      localStorage.setItem('archive-resonance-visitor', id);
    }
    return id;
  } catch {
    return `visitor-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  }
})();

async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', ...init });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export function CommunityFeatures({
  initialStories,
  isSignedIn,
  onSignIn,
  onEarliestYear,
  favoritesOnly = false,
  content = {},
}: {
  initialStories: Story[];
  isSignedIn: boolean;
  onSignIn: () => void;
  onEarliestYear: (year: number | undefined) => void;
  favoritesOnly?: boolean;
  content?: Record<string, string>;
}) {
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [pending, setPending] = useState<Story[]>([]);
  const [reactions, setReactions] = useState<Resonance[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('archive-favorite-memory-ids') ?? '[]') as string[]; } catch { return []; }
  });
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [formCategory, setFormCategory] = useState('童玩');
  const [busy, setBusy] = useState<string[]>([]);
  const busyLock = useRef(new Set<string>());
  const [title, setTitle] = useState('');
  const [era, setEra] = useState('');
  const [story, setStory] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [sharedStatus, setSharedStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  const refresh = async () => {
    const [archive, publicStories, counts] = await Promise.all([
      jsonRequest<{ memories?: Story[] }>('/api/archive').catch(() => null),
      jsonRequest<Array<{ id: string; title: string; category: string; era: string; story: string; imagePath?: string }>>('/api/archive/submissions/public').catch(() => []),
      jsonRequest<Resonance[]>(`/api/archive/resonance?visitorId=${encodeURIComponent(visitorId)}`).catch(() => []),
    ]);
    if (archive) {
      if (archive.memories?.length) setStories(archive.memories);
      setSharedStatus('ready');
    } else {
      setSharedStatus('error');
    }
    setPending(publicStories.map((item) => ({
      ...item, id: `pending-${item.id}`, location: '讀者投稿', storyteller: '讀者投稿',
      excerpt: item.story.slice(0, 100), color: '#a97945', mark: '投稿', pendingReview: true,
      ...(item.imagePath ? { image: `/api/storage${item.imagePath}` } : {}),
    })));
    setReactions(counts);
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2500);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const handleOnline = () => {
      if (sharedStatus === 'error') {
        setSharedStatus('loading');
        void refresh();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [sharedStatus]);

  const allStories = useMemo(() => [...stories, ...pending], [stories, pending]);
  const earliest = getEarliestStoryDecade(allStories.map((item) => item.era));
  useEffect(() => onEarliestYear(earliest), [earliest, onEarliestYear]);
  const visibleStories = favoritesOnly ? allStories.filter((item) => favorites.includes(item.id)) : allStories;
  const filtered = visibleStories.filter((item) => (
    (category === '全部' || item.category === category)
    && `${item.title} ${item.era} ${item.category} ${item.location ?? ''} ${item.excerpt}`.toLowerCase().includes(query.trim().toLowerCase())
  ));

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
      try { localStorage.setItem('archive-favorite-memory-ids', JSON.stringify(next)); } catch { /* Keep this session usable if storage is unavailable. */ }
      return next;
    });
  };

  const toggleReaction = async (id: string) => {
    if (busyLock.current.has(id)) return;
    const current = reactions.find((item) => item.memoryId === id);
    const reacted = current?.reactedByVisitor ?? false;
    const oldCount = current?.count ?? 0;
    busyLock.current.add(id);
    setBusy((items) => [...items, id]);
    setReactions((items) => [...items.filter((item) => item.memoryId !== id), { memoryId: id, count: Math.max(0, oldCount + (reacted ? -1 : 1)), reactedByVisitor: !reacted }]);
    try {
      await jsonRequest(`/api/archive/resonance/${encodeURIComponent(id)}`, {
        method: reacted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      });
      const latest = await jsonRequest<Resonance[]>(`/api/archive/resonance?visitorId=${encodeURIComponent(visitorId)}`);
      setReactions(latest);
    } catch {
      setReactions((items) => [...items.filter((item) => item.memoryId !== id), { memoryId: id, count: oldCount, reactedByVisitor: reacted }]);
    } finally {
      busyLock.current.delete(id);
      setBusy((items) => items.filter((value) => value !== id));
    }
  };

  const choosePhoto = async (file?: File) => {
    if (!file) return;
    setFormError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setFormError('請選擇 10 MB 以內的 JPG、PNG 或 WebP 圖片。');
      return;
    }
    try {
      const upload = await jsonRequest<{ uploadURL: string; objectPath: string }>('/api/storage/uploads/request-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      const result = await fetch(upload.uploadURL, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!result.ok) throw new Error('Upload failed');
      setImagePath(upload.objectPath);
      setFileName(file.name);
    } catch {
      setFormError('照片上傳失敗，請重新登入後再試；也可以不附照片繼續投稿。');
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setMessage('');
    try {
      await jsonRequest('/api/archive/submissions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), category: formCategory, era: era.trim(), story: story.trim(), ...(name.trim() ? { name: name.trim() } : {}), ...(gender ? { gender } : {}), ...(imagePath ? { imagePath } : {}) }),
      });
      setTitle(''); setEra(''); setStory(''); setName(''); setGender(''); setImagePath(''); setFileName('');
      setMessage('故事已送出，並會先以「待審核」標籤公開顯示。');
      await refresh();
    } catch {
      setFormError('投稿沒有送出，請檢查網路後再試。');
    }
  };

  return (
    <>
      <section id="memories" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="section-kicker text-[hsl(var(--primary))]">{favoritesOnly ? 'MY FAVORITES / 我的收藏' : content.memory_index_kicker ?? 'MEMORY INDEX / 記憶索引'}</p><h2 className="serif mt-3 text-4xl font-black text-[hsl(var(--foreground))]" dangerouslySetInnerHTML={{ __html: favoritesOnly ? '收藏的故事' : content.memory_index_title ?? '一人說起，大家想起。' }} /><p className="mt-3 max-w-xl text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{content.memory_index_desc ?? ''}</p></div><a href={favoritesOnly ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}favorites`} className="btn-outline min-h-11 self-start px-4"><Star size={17} />{favoritesOnly ? '返回記憶首頁' : `我的收藏（${favorites.length}）`}</a></div>
        <div className="mt-12 flex flex-col gap-5 border-y border-[hsl(var(--border))] py-5 lg:flex-row lg:items-center lg:justify-between">
          <input className="input-archive search-input max-w-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋地點、人物或記憶…" aria-label="搜尋故事" />
          <div className="flex flex-wrap gap-2" role="group" aria-label="記憶分類篩選">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`filter-chip rounded-full border border-[hsl(var(--border))] px-3 py-2 text-sm ${category === item ? 'bg-[hsl(var(--primary))] text-white' : 'bg-[hsl(var(--card))]'}`}>{item}</button>)}</div>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sharedStatus !== 'ready' && <div className="col-span-full flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-slate-800" role="status" aria-live="polite" data-testid={`shared-archive-notice-${sharedStatus}`}>
            <span>{sharedStatus === 'loading' ? '正在同步共享資料…' : '共享資料暫時無法載入。'}</span>
            {sharedStatus === 'error' && <><span>目前畫面可能是此裝置保存的舊內容，尚未確認為最新版本。</span><button type="button" className="btn-outline min-h-11 px-4" data-testid="button-retry-shared-archive" onClick={() => { setSharedStatus('loading'); void refresh(); }}>重試</button></>}
          </div>}
          {filtered.map((memory) => {
            const reaction = reactions.find((item) => item.memoryId === memory.id);
            const image = memory.image?.startsWith('/objects/') ? `/api/storage${memory.image}` : memory.image;
            return <article key={memory.id} className="memory-card overflow-hidden rounded-[1.15rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))]" data-testid={`card-memory-${memory.id}`}>
              <details>
                <summary className="memory-image flex cursor-pointer flex-col justify-between p-5" style={{ background: memory.color ?? '#3e8090' }}>
                  {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                  <div className="memory-image-overlay absolute inset-0" aria-hidden="true" />
                  <div className="relative z-[1] flex justify-between text-white/90"><span className="card-stamp">{memory.mark ?? memory.category}</span><span className="text-xs">{memory.pendingReview && <span className="mr-2 rounded-full bg-amber-200 px-2 py-1 font-bold text-slate-900">待審核</span>}NO.{memory.id}</span></div>
                  <div className="relative z-[1]"><div className="mb-3 text-xs text-white/85">📍 {memory.location ?? '讀者投稿'}</div><h3 className="serif text-2xl font-bold text-white">{memory.title}</h3></div>
                </summary>
                <div className="p-5"><p className="text-xs text-[hsl(var(--muted-foreground))]">{memory.era}　/　{memory.category}</p><p className="mt-3 text-sm leading-relaxed">{memory.story ?? memory.excerpt}</p></div>
              </details>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[hsl(var(--border))] px-4 py-3 text-sm"><span>{memory.storyteller ?? '讀者投稿'}</span><div className="flex gap-2"><button type="button" onClick={() => toggleFavorite(memory.id)} aria-pressed={favorites.includes(memory.id)} className="btn-outline min-h-10 px-3"><Star size={16} fill={favorites.includes(memory.id) ? 'currentColor' : 'none'} />收藏</button><button type="button" onClick={() => void toggleReaction(memory.id)} disabled={busy.includes(memory.id)} aria-pressed={reaction?.reactedByVisitor ?? false} className="btn-outline min-h-10 px-3 disabled:opacity-60"><Heart size={16} fill={reaction?.reactedByVisitor ? 'currentColor' : 'none'} />{reaction?.reactedByVisitor ? '已按讚' : '我也玩過'} <span>{reaction?.count ?? 0}</span></button></div></div>
            </article>;
          })}
          {favoritesOnly && filtered.length === 0 && <p className="col-span-full rounded-2xl border border-dashed p-10 text-center">目前沒有收藏故事。</p>}
        </div>
        <p className="mt-6 text-sm text-[hsl(var(--muted-foreground))]">目前顯示 {filtered.length} / {allStories.length} 則故事　｜　全站按讚總數：{reactions.reduce((sum, item) => sum + item.count, 0)}</p>
      </section>
      {!favoritesOnly && <section id="contribute" className="border-y border-[hsl(var(--border))] bg-[hsl(var(--muted)/.55)] px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.7fr_1.3fr]"><div><p className="section-kicker">ADD A MEMORY / 一起保存</p><h2 className="serif mt-3 text-4xl font-bold">你的那一段，也值得留下。</h2><p className="mt-4 leading-relaxed">投稿故事會立即公開，並標示「待審核」；編輯者核准後會加入典藏。</p></div>
          <form onSubmit={(event) => void submit(event)} className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-8">
            <label className="block font-semibold">故事標題<input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} className="input-archive mt-2" /></label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="font-semibold">記憶分類<select value={formCategory} onChange={(event) => setFormCategory(event.target.value)} className="input-archive mt-2">{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label className="font-semibold">大約年代<input required value={era} onChange={(event) => setEra(event.target.value)} placeholder="例如：民國七十年代" className="input-archive mt-2" /></label><label className="font-semibold">姓名（選填）<input value={name} onChange={(event) => setName(event.target.value)} className="input-archive mt-2" /></label><label className="font-semibold">性別（選填）<select value={gender} onChange={(event) => setGender(event.target.value)} className="input-archive mt-2"><option value="">不填寫</option><option>女性</option><option>男性</option><option>其他</option><option>不透露</option></select></label></div>
            <label className="mt-4 block font-semibold">故事內容<textarea required minLength={10} maxLength={10000} value={story} onChange={(event) => setStory(event.target.value)} rows={6} className="input-archive mt-2" /></label>
            <div className="mt-4 rounded-xl border border-dashed p-4"><label className="flex cursor-pointer items-center gap-2 font-semibold"><Upload size={18} />附上一張回憶照片（選填）<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!isSignedIn} onChange={(event) => void choosePhoto(event.target.files?.[0])} /></label>{!isSignedIn && <p className="mt-2 text-sm">登入後即可上傳照片；文字投稿不受影響。<button type="button" className="ml-2 underline" onClick={onSignIn}>登入</button></p>}{fileName && <p className="mt-2 text-sm" role="status">已上傳：{fileName}</p>}</div>
            {formError && <p className="mt-3 text-sm text-red-700" role="alert">{formError}</p>}{message && <p className="mt-3 text-sm" role="status">{message}</p>}
            <button type="submit" className="btn-primary mt-5 min-h-12 w-full justify-center">送出故事，等待審核</button>
          </form>
        </div>
      </section>}
    </>
  );
}
