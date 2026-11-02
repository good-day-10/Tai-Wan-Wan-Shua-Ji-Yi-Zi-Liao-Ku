import type { ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { WonderScoutsContent } from './site-content';

type StringFieldKey<T> = Extract<keyof T, string>;
type ItemField<T> = { key: StringFieldKey<T>; label: string; multiline?: boolean; placeholder?: string };

function ContentField({ label, value, onChange, multiline = false, type = 'text', placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
  placeholder?: string;
}) {
  const className = 'input-archive mt-2';
  return <label className="block min-w-0 text-sm font-semibold">
    {label}
    {multiline
      ? <textarea value={value} onChange={(event) => onChange(event.target.value)} className={`${className} min-h-24 resize-y`} placeholder={placeholder} />
      : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={className} placeholder={placeholder} />}
  </label>;
}

function StringListEditor({ title, description, items, onChange, multiline = false }: {
  title: string;
  description?: string;
  items: string[];
  onChange: (items: string[]) => void;
  multiline?: boolean;
}) {
  return <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
    <div className="flex items-start justify-between gap-3">
      <div><h3 className="font-bold">{title} <span className="font-normal text-[hsl(var(--muted-foreground))]">({items.length})</span></h3>{description && <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{description}</p>}</div>
      <button type="button" onClick={() => onChange([...items, ''])} className="btn-outline shrink-0 px-3 py-2 text-xs"><Plus size={14} />新增</button>
    </div>
    <div className="mt-4 space-y-3">
      {items.map((item, index) => <div key={`${title}-${index}`} className="flex items-start gap-2">
        <div className="min-w-0 flex-1"><ContentField label={`${title}第 ${index + 1} 項`} value={item} multiline={multiline} onChange={(value) => onChange(items.map((current, itemIndex) => itemIndex === index ? value : current))} /></div>
        <button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="btn-ghost mt-7 shrink-0 text-[hsl(var(--destructive))]" aria-label={`刪除${title}第 ${index + 1} 項`}><Trash2 size={16} /></button>
      </div>)}
      {items.length === 0 && <p className="rounded-xl bg-[hsl(var(--muted))] px-3 py-4 text-center text-sm text-[hsl(var(--muted-foreground))]">目前沒有項目，可按「新增」建立。</p>}
    </div>
  </section>;
}

function ItemListEditor<T extends object>({ title, description, items, fields, createItem, onChange }: {
  title: string;
  description?: string;
  items: T[];
  fields: ItemField<T>[];
  createItem: () => T;
  onChange: (items: T[]) => void;
}) {
  const update = (index: number, key: StringFieldKey<T>, value: string) => {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  };
  return <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
    <div className="flex items-start justify-between gap-3">
      <div><h3 className="font-bold">{title} <span className="font-normal text-[hsl(var(--muted-foreground))]">({items.length})</span></h3>{description && <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{description}</p>}</div>
      <button type="button" onClick={() => onChange([...items, createItem()])} className="btn-outline shrink-0 px-3 py-2 text-xs"><Plus size={14} />新增</button>
    </div>
    <div className="mt-4 space-y-4">
      {items.map((item, index) => <article key={`${title}-${index}`} className="rounded-xl border border-[hsl(var(--border))] p-4">
        <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">{title}第 {index + 1} 項</p><button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="btn-ghost px-2 py-1 text-[hsl(var(--destructive))]" aria-label={`刪除${title}第 ${index + 1} 項`}><Trash2 size={15} />刪除</button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => <ContentField key={field.key} label={field.label} value={item[field.key] as string} multiline={field.multiline} placeholder={field.placeholder} onChange={(value) => update(index, field.key, value)} />)}
        </div>
      </article>)}
      {items.length === 0 && <p className="rounded-xl bg-[hsl(var(--muted))] px-3 py-4 text-center text-sm text-[hsl(var(--muted-foreground))]">目前沒有項目，可按「新增」建立。</p>}
    </div>
  </section>;
}

function EditorGroup({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="mb-8">
    <div className="mb-4"><p className="eyebrow text-[hsl(var(--primary))]">SITE CONTENT / 網站內容</p><h2 className="serif mt-2 text-2xl font-bold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{description}</p></div>
    <div className="grid gap-4">{children}</div>
  </section>;
}

export default function WonderScoutsContentEditor({ content, onChange }: {
  content: WonderScoutsContent;
  onChange: (content: WonderScoutsContent) => void;
}) {
  const updateDonation = (patch: Partial<WonderScoutsContent['donation']>) => onChange({ ...content, donation: { ...content.donation, ...patch } });
  const updateLinks = (patch: Partial<WonderScoutsContent['links']>) => onChange({ ...content, links: { ...content.links, ...patch } });

  return <div className="mx-auto max-w-5xl">
    <EditorGroup title="影片與民眾回饋" description="這些內容會出現在「導覽成果與影片」分頁，保存後所有訪客都會看到新版本。">
      <ItemListEditor title="精選影片" description="影片以 YouTube 影片代碼播放；封面可填網站圖片路徑或圖片網址。" items={content.videos} fields={[
        { key: 'place', label: '場域／分類' },
        { key: 'title', label: '影片標題' },
        { key: 'youtubeId', label: 'YouTube 影片代碼', placeholder: '例如：025HOvHCdP4' },
        { key: 'image', label: '封面圖片路徑或網址' },
      ]} createItem={() => ({ place: '', title: '', youtubeId: '', image: '' })} onChange={(videos) => onChange({ ...content, videos })} />
      <ItemListEditor title="民眾回饋" items={content.feedback} fields={[
        { key: 'quote', label: '回饋內容', multiline: true },
        { key: 'by', label: '回饋者／來源' },
      ]} createItem={() => ({ quote: '', by: '' })} onChange={(feedback) => onChange({ ...content, feedback })} />
    </EditorGroup>

    <EditorGroup title="場域合作服務" description="編輯合作方案、雙方合作價值，以及對外表單和成果連結。">
      <StringListEditor title="合作對場域的價值" items={content.partnershipBenefits} onChange={(partnershipBenefits) => onChange({ ...content, partnershipBenefits })} />
      <StringListEditor title="合作對少年導覽隊的價值" items={content.squadBenefits} onChange={(squadBenefits) => onChange({ ...content, squadBenefits })} />
      <ItemListEditor title="合作服務" items={content.services} fields={[
        { key: 'number', label: '編號' },
        { key: 'title', label: '服務名稱' },
        { key: 'body', label: '服務說明', multiline: true },
        { key: 'tags', label: '服務標籤' },
      ]} createItem={() => ({ number: '', title: '', body: '', tags: '' })} onChange={(services) => onChange({ ...content, services })} />
      <div className="grid gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:grid-cols-2">
        <ContentField label="合作提案表單網址" value={content.links.partnershipForm} onChange={(partnershipForm) => updateLinks({ partnershipForm })} />
        <ContentField label="合作成果影片網址" value={content.links.resultsVideo} onChange={(resultsVideo) => updateLinks({ resultsVideo })} />
        <ContentField label="將軍村數位導覽網址" value={content.links.digitalTour} onChange={(digitalTour) => updateLinks({ digitalTour })} />
      </div>
    </EditorGroup>

    <EditorGroup title="加入與見習步驟" description="管理見習隊招募流程和教育單位合作表單。">
      <ItemListEditor title="見習步驟" items={content.joinSteps} fields={[
        { key: 'number', label: '步驟編號' },
        { key: 'title', label: '步驟名稱' },
        { key: 'body', label: '步驟說明', multiline: true },
      ]} createItem={() => ({ number: '', title: '', body: '' })} onChange={(joinSteps) => onChange({ ...content, joinSteps })} />
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <ContentField label="教育單位合作表單網址" value={content.links.joinForm} onChange={(joinForm) => updateLinks({ joinForm })} />
      </div>
    </EditorGroup>

    <EditorGroup title="捐款說明" description="協會名稱、捐款用途和捐款網址都會保存於共享資料。">
      <section className="grid gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <ContentField label="受款單位名稱" value={content.donation.organization} onChange={(organization) => updateDonation({ organization })} />
        <ContentField label="捐款引言" value={content.donation.intro} multiline onChange={(intro) => updateDonation({ intro })} />
        <ContentField label="捐款網址" value={content.donation.url} onChange={(url) => updateDonation({ url })} />
      </section>
      <StringListEditor title="捐款用途" items={content.donation.purposes} multiline onChange={(purposes) => updateDonation({ purposes })} />
    </EditorGroup>
  </div>;
}
