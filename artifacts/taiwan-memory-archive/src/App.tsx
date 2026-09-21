import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getArchive as getSharedArchive, saveArchive as saveSharedArchive } from '@workspace/api-client-react';
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowRight, BookOpen, Check, ChevronDown, Eye, GripVertical, ImagePlus, Layers3, LayoutTemplate, LockKeyhole, MapPin, Menu, Monitor, Move, Plus, Search, Settings2, ShieldCheck, Smartphone, Sparkles, Tablet, Trash2, X } from 'lucide-react';
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
  storyHtml?: string;
  color: string;
  mark: string;
  image?: string;
  images?: string[];
};

type SiteTextBlock = {
  id: string;
  label: string;
  section: string;
  html: string;
  x: number;
  y: number;
  width: number;
  align: 'left' | 'center' | 'right';
};

type CustomPage = {
  id: string;
  title: string;
  slug: string;
  backgroundImage?: string;
  blocks: SiteTextBlock[];
};

type SiteContent = { blocks: SiteTextBlock[]; pages: CustomPage[] };
type ArchiveData = { introduction: string; memories: Memory[]; siteContent: SiteContent };

const defaultSiteBlocks: SiteTextBlock[] = [
  { id: 'header.eyebrow', label: '頁首英文標誌', section: '頁首', html: 'TAIWAN PLAY MEMORIES', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'header.title', label: '頁首網站名稱', section: '頁首', html: '台灣玩耍記憶資料庫', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'nav.memories', label: '導覽：記憶索引', section: '頁首', html: '記憶索引', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'nav.about', label: '導覽：關於資料庫', section: '頁首', html: '關於資料庫', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'hero.eyebrow', label: '主視覺眉題', section: '主視覺', html: '一座正在長大的集體記憶', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'hero.title', label: '主視覺大標題', section: '主視覺', html: '玩過的，<br /><span style="color: hsl(var(--secondary))">就不會消失。</span>', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'hero.description', label: '主視覺介紹', section: '主視覺', html: '一座收藏台灣童年與遊戲記憶的溫柔資料庫。從巷口的彈珠、廟埕的躲貓貓，到放學路上只屬於那一代人的暗號，這裡收下每一個「以前我們都這樣玩」的故事。', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'hero.cta', label: '主視覺按鈕', section: '主視覺', html: '走進記憶索引', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'hero.meta', label: '主視覺補充文字', section: '主視覺', html: '收錄自 1960 年代至今的台灣故事', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'hero.note.label', label: '主視覺卡片標籤', section: '主視覺', html: 'ARCHIVE NOTE / 0001', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'hero.note.status', label: '主視覺卡片狀態', section: '主視覺', html: '保存中', x: 0, y: 0, width: 100, align: 'right' },
  { id: 'hero.note.quote', label: '主視覺卡片引言', section: '主視覺', html: '「那時候沒有<br />手機，<br />但我們每天<br />都約得到。」', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'hero.note.location', label: '主視覺卡片地點', section: '主視覺', html: '彰化・鹿港', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'hero.note.era', label: '主視覺卡片年代', section: '主視覺', html: '1980 年代', x: 0, y: 0, width: 100, align: 'right' },
  { id: 'hero.scroll', label: '主視覺捲動提示', section: '主視覺', html: 'SCROLL TO REMEMBER', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'index.kicker', label: '索引眉題', section: '記憶索引', html: 'MEMORY INDEX / 記憶索引', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'index.title', label: '索引標題', section: '記憶索引', html: '一人說起，<br /><span style="color: hsl(var(--primary))">大家想起。</span>', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'index.description', label: '索引介紹', section: '記憶索引', html: '每一筆記憶都由一位說故事的人開始。用地點、年代或一個你熟悉的詞，找找看。', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'index.searchPlaceholder', label: '搜尋框提示', section: '記憶索引', html: '搜尋地點、人物或記憶…', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'index.emptyTitle', label: '無搜尋結果標題', section: '記憶索引', html: '還沒有找到這段記憶', x: 0, y: 0, width: 100, align: 'center' },
  { id: 'index.emptyBody', label: '無搜尋結果說明', section: '記憶索引', html: '換個詞試試，或把一個新故事放進資料庫。', x: 0, y: 0, width: 100, align: 'center' },
  { id: 'index.count', label: '索引筆數文字', section: '記憶索引', html: '目前收藏', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'category.全部', label: '分類按鈕：全部', section: '記憶索引', html: '全部', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'category.童玩', label: '分類按鈕：童玩', section: '記憶索引', html: '童玩', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'category.巷弄遊戲', label: '分類按鈕：巷弄遊戲', section: '記憶索引', html: '巷弄遊戲', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'category.家族手作', label: '分類按鈕：家族手作', section: '記憶索引', html: '家族手作', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'category.電玩時光', label: '分類按鈕：電玩時光', section: '記憶索引', html: '電玩時光', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'category.集體遊戲', label: '分類按鈕：集體遊戲', section: '記憶索引', html: '集體遊戲', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'category.童謠遊戲', label: '分類按鈕：童謠遊戲', section: '記憶索引', html: '童謠遊戲', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'card.readMore', label: '卡片閱讀連結', section: '記憶卡片', html: '閱讀故事', x: 0, y: 0, width: 100, align: 'right' },
  { id: 'card.number', label: '卡片編號前綴', section: '記憶卡片', html: 'NO.', x: 0, y: 0, width: 100, align: 'right' },
  { id: 'memory.detailLabel', label: '故事詳頁標籤', section: '故事詳頁', html: '故事詳頁', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'memory.storytellerLabel', label: '說故事的人標籤', section: '故事詳頁', html: '說故事的人', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'memory.categoryLabel', label: '分類標籤', section: '故事詳頁', html: '分類', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'about.kicker', label: '關於眉題', section: '關於資料庫', html: 'WHY WE KEEP / 為什麼保存', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'about.title', label: '關於標題', section: '關於資料庫', html: '把「以前」<br /><span style="color: hsl(var(--secondary))">交給以後。</span>', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'about.body', label: '關於說明', section: '關於資料庫', html: '一個孩子記得的遊戲，常常也是一個家庭、一條街、甚至一整個時代的共同記憶。這座資料庫邀請不同世代坐下來，讓口述成為可以再被聽見的文化。', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'about.cardTitle', label: '關於卡片標題', section: '關於資料庫', html: '每個人<br />都是收藏家。', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'about.year', label: '關於年代數字', section: '關於資料庫', html: '1960 →', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'about.yearBody', label: '關於年代說明', section: '關於資料庫', html: '跨越不同年代，持續收錄中', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'footer.brand', label: '頁尾網站名稱', section: '頁尾', html: '台灣玩耍記憶資料庫', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'footer.body', label: '頁尾說明', section: '頁尾', html: '讓那些曾經一起玩過的事，繼續在不同世代之間找到彼此。', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'footer.explore', label: '頁尾導覽標題', section: '頁尾', html: 'EXPLORE', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'footer.contribute', label: '頁尾投稿標題', section: '頁尾', html: 'CONTRIBUTE', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'footer.contributeBody', label: '頁尾投稿說明', section: '頁尾', html: '你也有一段想保存的童年嗎？', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'footer.contributeCta', label: '頁尾編輯連結', section: '頁尾', html: '進入編輯入口　→', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'footer.copyright', label: '頁尾版權文字', section: '頁尾', html: '一個開放給所有人的家庭記憶計畫', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'footer.copyrightMark', label: '頁尾版權標記', section: '頁尾', html: '© 台灣玩耍記憶資料庫', x: 0, y: 0, width: 100, align: 'right' },
];

function createDefaultSiteContent(): SiteContent {
  return { blocks: defaultSiteBlocks.map((block) => ({ ...block })), pages: [] };
}

type SiteTextBlockInput = Omit<SiteTextBlock, 'align'> & { align: string };
type CustomPageInput = { id: string; title: string; slug: string; backgroundImage?: string; blocks?: SiteTextBlockInput[] };
type SiteContentInput = { blocks?: SiteTextBlockInput[]; pages?: CustomPageInput[] };

function normalizeBlocks(input: SiteTextBlockInput[] = []): SiteTextBlock[] {
  return input.map((block) => ({
    ...block,
    align: block.align === 'center' || block.align === 'right' ? block.align : 'left',
  })) as SiteTextBlock[];
}

function normalizeSiteContent(input?: SiteContentInput): SiteContent {
  const incoming = normalizeBlocks(input?.blocks);
  const byId = new Map(incoming.map((block) => [block.id, block]));
  const defaults = createDefaultSiteContent().blocks;
  const blocks = defaults.map((block) => ({ ...block, ...byId.get(block.id) }));
  incoming.filter((block) => !defaults.some((defaultBlock) => defaultBlock.id === block.id)).forEach((block) => blocks.push(block));
  const pages = (input?.pages ?? []).map((page) => ({
    id: page.id,
    title: page.title,
    slug: page.slug,
    backgroundImage: page.backgroundImage,
    blocks: normalizeBlocks(page.blocks),
  }));
  return { blocks, pages };
}

function normalizeArchive(value: { memories: Memory[]; introduction: string; siteContent?: SiteContentInput }): ArchiveData {
  return { introduction: value.introduction, memories: value.memories, siteContent: normalizeSiteContent(value.siteContent) };
}

const seedData: ArchiveData = {
  introduction: '一座收藏台灣童年與遊戲記憶的溫柔資料庫。從巷口的彈珠、廟埕的躲貓貓，到放學路上只屬於那一代人的暗號，這裡收下每一個「以前我們都這樣玩」的故事。',
  siteContent: createDefaultSiteContent(),
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
    if (stored) return normalizeArchive(JSON.parse(stored) as ArchiveData);
  } catch { /* use seed data when local storage is unavailable */ }
  return normalizeArchive(seedData);
}

function getMemoryImages(memory: Memory): string[] {
  if (Array.isArray(memory.images)) return memory.images;
  return memory.image ? [memory.image] : [];
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
}

function storyToHtml(story: string): string {
  return story.split(/\n{2,}/).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`).join('');
}

function sanitizeStoryHtml(html: string): string {
  const documentRoot = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html').body.firstElementChild;
  if (!documentRoot) return '';
  const allowedTags = new Set(['P', 'DIV', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'SPAN', 'FONT', 'UL', 'OL', 'LI']);
  const allowedAttributes = new Set(['style', 'color', 'face', 'size']);
  const cleanNode = (node: Node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const element = child as HTMLElement;
      if (!allowedTags.has(element.tagName)) {
        while (element.firstChild) node.insertBefore(element.firstChild, element);
        node.removeChild(element);
        return;
      }
      [...element.attributes].forEach((attribute) => {
        if (!allowedAttributes.has(attribute.name.toLowerCase())) element.removeAttribute(attribute.name);
      });
      if (element.hasAttribute('style')) {
        const safeStyle = element.getAttribute('style')?.split(';').map((rule) => rule.trim()).filter((rule) => /^(color|font-size|font-family|font-weight|font-style|text-decoration)\s*:/i.test(rule) && !/[<>]/.test(rule)).join('; ');
        if (safeStyle) element.setAttribute('style', safeStyle);
        else element.removeAttribute('style');
      }
      cleanNode(element);
    });
  };
  cleanNode(documentRoot);
  return documentRoot.innerHTML;
}

function getSiteBlock(siteContent: SiteContent, id: string): SiteTextBlock | undefined {
  return siteContent.blocks.find((block) => block.id === id);
}

function siteBlockStyle(block: SiteTextBlock | undefined): Record<string, string | number | undefined> {
  if (!block) return {};
  return {
    position: block.x || block.y ? 'relative' : undefined,
    display: block.x || block.y || block.width < 100 || block.align !== 'left' ? 'block' : undefined,
    left: block.x ? `${block.x}px` : undefined,
    top: block.y ? `${block.y}px` : undefined,
    maxWidth: block.width < 100 ? `${block.width}%` : undefined,
    textAlign: block.align,
  };
}

function SiteText({ siteContent, id, fallback, className, as: Tag = 'span' }: { siteContent: SiteContent; id: string; fallback: string; className?: string; as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' }) {
  const block = getSiteBlock(siteContent, id);
  return <Tag className={className} style={siteBlockStyle(block)} dangerouslySetInnerHTML={{ __html: sanitizeStoryHtml(block?.html || fallback) }} />;
}

function sitePlainText(siteContent: SiteContent, id: string, fallback: string): string {
  const block = getSiteBlock(siteContent, id);
  const container = document.createElement('div');
  container.innerHTML = sanitizeStoryHtml(block?.html || fallback);
  return (container.textContent ?? '').replace(/\u00a0/g, ' ').trim();
}

function storyToPlainText(html: string): string {
  const container = document.createElement('div');
  container.innerHTML = sanitizeStoryHtml(html);
  return (container.textContent ?? '').replace(/\u00a0/g, ' ').trim();
}

function customPageHref(slug: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/page/${slug}`;
}

function Header({ siteContent }: { siteContent: SiteContent }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="masthead relative z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <a href="#top" className="flex items-center gap-3" data-testid="link-home">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--accent)/.65)] text-[hsl(var(--accent))]">
            <BookOpen size={18} />
          </span>
          <span><SiteText siteContent={siteContent} id="header.eyebrow" fallback="TAIWAN PLAY MEMORIES" className="block font-semibold tracking-[.16em] text-[10px] text-[hsl(var(--accent))]" /><SiteText siteContent={siteContent} id="header.title" fallback="台灣玩耍記憶資料庫" className="serif text-lg font-bold" /></span>
        </a>
        <button onClick={() => setMenuOpen(!menuOpen)} className="btn-ghost" aria-label={menuOpen ? '關閉導覽選單' : '開啟導覽選單'} aria-expanded={menuOpen} data-testid="button-mobile-menu"><Menu /></button>
      </div>
      {menuOpen && <nav className="absolute right-5 top-[76px] w-[min(360px,calc(100vw-2.5rem))] rounded-2xl border border-white/15 bg-[hsl(var(--primary)/.98)] p-3 shadow-2xl backdrop-blur" aria-label="網站導覽">
        <p className="px-3 pb-2 pt-1 text-[10px] font-bold tracking-[.18em] text-[hsl(var(--accent))]">EXPLORE / 導覽</p>
        <a href={`${import.meta.env.BASE_URL}#memories`} onClick={() => setMenuOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-3 text-sm text-white/85 transition hover:bg-white/10" data-testid="link-mobile-memories"><SiteText siteContent={siteContent} id="nav.memories" fallback="記憶索引" /><ArrowRight size={15} className="text-white/40" /></a>
        <a href={`${import.meta.env.BASE_URL}#about`} onClick={() => setMenuOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-3 text-sm text-white/85 transition hover:bg-white/10" data-testid="link-mobile-about"><SiteText siteContent={siteContent} id="nav.about" fallback="關於資料庫" /><ArrowRight size={15} className="text-white/40" /></a>
        {siteContent.pages.length > 0 && <div className="my-2 border-t border-white/10 pt-2"><p className="px-3 pb-1 text-[10px] font-bold tracking-[.18em] text-white/40">PAGES / 自訂頁面</p>{siteContent.pages.map((page) => <a key={page.id} href={customPageHref(page.slug)} onClick={() => setMenuOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-3 text-sm text-white/85 transition hover:bg-white/10" data-testid={`link-custom-page-${page.slug}`}><span className="flex min-w-0 items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--secondary))]" /><span className="truncate">{page.title}</span></span><ArrowRight size={15} className="text-white/40" /></a>)}</div>}
      </nav>}
    </header>
  );
}

function PageTextBlock({ block, className = '' }: { block: SiteTextBlock; className?: string }) {
  return <div className={className} style={{ ...siteBlockStyle(block), width: `${Math.min(100, block.width)}%` }} dangerouslySetInnerHTML={{ __html: sanitizeStoryHtml(block.html) }} />;
}

function CustomPageView({ page, siteContent, onEdit }: { page: CustomPage; siteContent: SiteContent; onEdit: () => void }) {
  const safeBackground = page.backgroundImage?.startsWith('data:image/') ? page.backgroundImage : undefined;
  return <div className="archive-shell texture min-h-dvh">
    <Header siteContent={siteContent} />
    <main className="relative overflow-hidden">
      <section className="relative min-h-[75dvh] bg-[hsl(var(--primary))] bg-cover bg-center text-white" style={safeBackground ? { backgroundImage: `linear-gradient(hsl(202 42% 16% / .84), hsl(202 42% 16% / .92)), url("${safeBackground}")` } : undefined}>
        <div className="mx-auto max-w-5xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="mb-10 flex items-center gap-3 text-xs text-white/55"><a href={import.meta.env.BASE_URL} className="transition hover:text-white">首頁</a><ArrowRight size={13} /><span>{page.title}</span></div>
          <h1 className="display-title max-w-3xl text-5xl font-black text-white sm:text-7xl">{page.title}</h1>
          <div className="mt-12 space-y-7 rounded-3xl border border-white/15 bg-black/10 p-6 backdrop-blur-sm sm:p-10">{page.blocks.map((block) => <PageTextBlock key={block.id} block={block} className="text-base leading-loose text-white/85" />)}</div>
        </div>
      </section>
    </main>
    <Footer siteContent={siteContent} onEdit={onEdit} />
  </div>;
}

function Hero({ introduction, siteContent, onExplore }: { introduction: string; siteContent: SiteContent; onExplore: () => void }) {
  return <section id="top" className="masthead relative overflow-hidden">
    <div className="hero-orbit" aria-hidden="true"><span className="hero-dot" /></div>
    <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:pb-28 lg:pt-24">
      <div className="max-w-3xl">
        <SiteText siteContent={siteContent} id="hero.eyebrow" fallback="一座正在長大的集體記憶" className="eyebrow fade-up text-[hsl(var(--accent))]" as="p" />
        <SiteText siteContent={siteContent} id="hero.title" fallback="玩過的，<br /><span style=&quot;color: hsl(var(--secondary))&quot;>就不會消失。</span>" className="display-title fade-up delay-1 mt-7 text-5xl font-black tracking-tight text-white sm:text-7xl lg:text-[6.8rem]" as="h1" />
        <SiteText siteContent={siteContent} id="hero.description" fallback={introduction} className="fade-up delay-2 mt-8 max-w-xl text-base leading-loose text-white/70 sm:text-lg" as="p" />
        <div className="fade-up delay-3 mt-9 flex flex-wrap items-center gap-4">
          <button onClick={onExplore} className="btn-primary" data-testid="button-explore"><SiteText siteContent={siteContent} id="hero.cta" fallback="走進記憶索引" /><ArrowDown size={16} /></button>
          <SiteText siteContent={siteContent} id="hero.meta" fallback="收錄自 1960 年代至今的台灣故事" className="text-xs tracking-wide text-white/45" />
        </div>
      </div>
      <div className="relative hidden min-h-[330px] items-end justify-end lg:flex">
        <div className="fade-up delay-4 relative w-[330px] rotate-3 border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between text-[10px] tracking-[.18em] text-white/60"><SiteText siteContent={siteContent} id="hero.note.label" fallback="ARCHIVE NOTE / 0001" /><SiteText siteContent={siteContent} id="hero.note.status" fallback="保存中" /></div>
          <SiteText siteContent={siteContent} id="hero.note.quote" fallback="「那時候沒有<br />手機，<br />但我們每天<br />都約得到。」" className="serif border-l-2 border-[hsl(var(--secondary))] py-4 pl-5 text-2xl leading-relaxed text-white" as="div" />
          <div className="mt-7 flex justify-between text-xs text-white/50"><SiteText siteContent={siteContent} id="hero.note.location" fallback="彰化・鹿港" /><SiteText siteContent={siteContent} id="hero.note.era" fallback="1980 年代" /></div>
        </div>
      </div>
    </div>
    <div className="relative mx-auto max-w-7xl px-5 pb-5 lg:px-8"><div className="flex items-center gap-3 text-[10px] tracking-[.2em] text-white/40"><span className="h-px w-8 bg-[hsl(var(--secondary))]" /><SiteText siteContent={siteContent} id="hero.scroll" fallback="SCROLL TO REMEMBER" /></div></div>
  </section>;
}

function MemoryCard({ memory, siteContent, onOpen }: { memory: Memory; siteContent: SiteContent; onOpen: (memory: Memory) => void }) {
  const images = getMemoryImages(memory);
  return <article className="memory-card overflow-hidden rounded-[1.15rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))]" data-testid={`card-memory-${memory.id}`}>
    <button onClick={() => onOpen(memory)} className="block w-full text-left" data-testid={`button-open-memory-${memory.id}`}>
      <div className="memory-image flex flex-col justify-between p-5" style={{ background: memory.color }}>
        {images[0] && <img src={images[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        {images[0] && <div className="memory-image-overlay absolute inset-0" aria-hidden="true" />}
        <div className="relative z-[1] flex justify-between text-white/80"><span className="card-stamp">{memory.mark}</span><span className="text-[10px] tracking-[.18em]"><SiteText siteContent={siteContent} id="card.number" fallback="NO." /> {memory.id}</span></div>
        <div className="relative z-[1]"><div className="mb-3 flex items-center gap-2 text-xs text-white/75"><MapPin size={13} />{memory.location}</div><h3 className="serif text-2xl font-bold leading-snug text-white">{memory.title}</h3></div>
      </div>
      <div className="p-5"><div className="mb-4 flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]"><span>{memory.era}</span><span className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-1">{memory.category}</span></div><p className="serif min-h-[54px] text-base leading-relaxed text-[hsl(var(--foreground))]">「{memory.excerpt}」</p><div className="mt-5 flex items-center justify-between border-t border-[hsl(var(--border))] pt-4 text-xs text-[hsl(var(--muted-foreground))]"><span>{memory.storyteller}</span><span className="flex items-center gap-1 font-semibold text-[hsl(var(--primary))]"><SiteText siteContent={siteContent} id="card.readMore" fallback="閱讀故事" /><ArrowRight size={14} /></span></div></div>
    </button>
  </article>;
}

function IndexSection({ memories, siteContent, onOpen }: { memories: Memory[]; siteContent: SiteContent; onOpen: (memory: Memory) => void }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const filtered = useMemo(() => memories.filter((memory) => {
    const matchCategory = category === '全部' || memory.category === category;
    const text = `${memory.title}${memory.location}${memory.storyteller}${memory.excerpt}`.toLowerCase();
    return matchCategory && text.includes(search.toLowerCase());
  }), [memories, search, category]);
  return <section id="memories" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><SiteText siteContent={siteContent} id="index.kicker" fallback="MEMORY INDEX / 記憶索引" className="section-kicker eyebrow" as="p" /><SiteText siteContent={siteContent} id="index.title" fallback="一人說起，<br /><span style=&quot;color: hsl(var(--primary))&quot;>大家想起。</span>" className="display-title mt-5 text-4xl font-bold sm:text-5xl" as="h2" /></div><SiteText siteContent={siteContent} id="index.description" fallback="每一筆記憶都由一位說故事的人開始。用地點、年代或一個你熟悉的詞，找找看。" className="max-w-sm text-sm leading-loose text-[hsl(var(--muted-foreground))]" as="p" /></div>
    <div className="mt-12 flex flex-col gap-5 border-y border-[hsl(var(--border))] py-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative max-w-sm flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={sitePlainText(siteContent, 'index.searchPlaceholder', '搜尋地點、人物或記憶…')} className="input-archive search-input" aria-label="搜尋記憶" data-testid="input-search-memories" /></div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="記憶分類篩選">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`filter-chip rounded-full border px-3 py-2 text-xs font-semibold ${category === item ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))]'}`} data-testid={`button-filter-${item}`}><SiteText siteContent={siteContent} id={`category.${item}`} fallback={item} /></button>)}</div>
    </div>
    {filtered.length > 0 ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((memory, index) => <div key={memory.id} className={`fade-up delay-${Math.min(index + 1, 4)}`}><MemoryCard memory={memory} siteContent={siteContent} onOpen={onOpen} /></div>)}</div> : <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] py-20 text-center"><Search className="mx-auto mb-4 text-[hsl(var(--secondary))]" size={30} /><SiteText siteContent={siteContent} id="index.emptyTitle" fallback="還沒有找到這段記憶" className="serif text-xl" as="p" /><SiteText siteContent={siteContent} id="index.emptyBody" fallback="換個詞試試，或把一個新故事放進資料庫。" className="mt-2 text-sm text-[hsl(var(--muted-foreground))]" as="p" /></div>}
    <p className="mt-7 text-xs text-[hsl(var(--muted-foreground))]" data-testid="text-memory-count"><SiteText siteContent={siteContent} id="index.count" fallback="目前收藏" /> {filtered.length} / {memories.length} 則記憶</p>
  </section>;
}

function AboutSection({ siteContent }: { siteContent: SiteContent }) {
  return <section id="about" className="border-y border-[hsl(var(--border))] bg-[hsl(var(--muted)/.55)]"><div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-28">
    <div><SiteText siteContent={siteContent} id="about.kicker" fallback="WHY WE KEEP / 為什麼保存" className="section-kicker eyebrow" as="p" /><SiteText siteContent={siteContent} id="about.title" fallback="把「以前」<br /><span style=&quot;color: hsl(var(--secondary))&quot;>交給以後。</span>" className="display-title mt-5 text-4xl font-bold sm:text-5xl" as="h2" /><SiteText siteContent={siteContent} id="about.body" fallback="一個孩子記得的遊戲，常常也是一個家庭、一條街、甚至一整個時代的共同記憶。這座資料庫邀請不同世代坐下來，讓口述成為可以再被聽見的文化。" className="mt-7 max-w-md text-sm leading-loose text-[hsl(var(--muted-foreground))]" as="p" /></div>
      <div className="grid items-start gap-5 sm:grid-cols-2"><div className="rounded-2xl bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))]"><Sparkles size={20} className="mb-7 text-[hsl(var(--accent))]" /><SiteText siteContent={siteContent} id="about.cardTitle" fallback="每個人<br />都是收藏家。" className="serif text-3xl font-bold" as="div" /></div><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:mt-12"><SiteText siteContent={siteContent} id="about.year" fallback="1960 →" className="serif text-3xl font-bold text-[hsl(var(--secondary))]" as="div" /><SiteText siteContent={siteContent} id="about.yearBody" fallback="跨越不同年代，持續收錄中" className="mt-2 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]" as="p" /></div></div>
  </div></section>;
}

function MemoryModal({ memory, siteContent, onClose }: { memory: Memory; siteContent: SiteContent; onClose: () => void }) {
  const images = getMemoryImages(memory);
  return <div className="detail-backdrop fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="memory-detail-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-panel max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-2xl sm:rounded-3xl">
       <div className="flex items-center justify-between p-5 sm:p-7"><div className="eyebrow text-[hsl(var(--primary))]">MEMORY NO. {memory.id} / <SiteText siteContent={siteContent} id="memory.detailLabel" fallback="故事詳頁" /></div><button onClick={onClose} aria-label="關閉故事詳頁" className="btn-ghost" data-testid="button-close-memory"><X size={20} /></button></div>
       {images[0] ? <div className="memory-detail-image relative mx-5 h-44 overflow-hidden rounded-2xl sm:mx-7 sm:h-64"><img src={images[0]} alt={`${memory.title} 的故事圖片`} className="h-full w-full object-cover" /><div className="memory-image-overlay absolute inset-0" aria-hidden="true" /></div> : <div className="mx-5 h-2 rounded-full sm:mx-7" style={{ background: memory.color }} />}
       <div className="grid gap-8 p-5 sm:p-10 lg:grid-cols-[.72fr 1.28fr]"><div><p className="text-sm text-[hsl(var(--muted-foreground))]">{memory.location}　/　{memory.era}</p><h2 id="memory-detail-title" className="display-title mt-4 text-4xl font-bold">{memory.title}</h2><div className="mt-8 border-l-2 border-[hsl(var(--secondary))] pl-5"><p className="quote-mark">“</p><p className="serif text-xl leading-loose">{memory.excerpt}</p></div><p className="mt-8 text-sm text-[hsl(var(--muted-foreground))]"><SiteText siteContent={siteContent} id="memory.storytellerLabel" fallback="說故事的人" /><br /><strong className="mt-1 block text-base text-[hsl(var(--foreground))]">{memory.storyteller}</strong></p></div><div><div className="rich-story text-base leading-[2.1]" dangerouslySetInnerHTML={{ __html: sanitizeStoryHtml(memory.storyHtml ?? storyToHtml(memory.story)) }} />{images.length > 1 && <div className="mt-10 grid grid-cols-2 gap-3 border-t border-[hsl(var(--border))] pt-6 sm:grid-cols-3">{images.slice(1).map((image, index) => <img key={`${memory.id}-image-${index + 1}`} src={image} alt={`${memory.title} 的故事圖片 ${index + 2}`} className="aspect-square w-full rounded-xl object-cover" />)}</div>}<div className="mt-10 border-t border-[hsl(var(--border))] pt-5 text-xs text-[hsl(var(--muted-foreground))]"><SiteText siteContent={siteContent} id="memory.categoryLabel" fallback="分類" />：{memory.category}</div></div></div>
    </div>
  </div>;
}

function PasswordGate({ onUnlock, onClose }: { onUnlock: () => void; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); if (password === '00000') onUnlock(); else { setError('密碼不對，再試一次。提示：是五個 0。'); setPassword(''); } };
  return <div className="detail-backdrop fixed inset-0 z-50 flex items-center justify-center p-5" role="dialog" aria-modal="true" aria-labelledby="gate-title"><div className="modal-panel w-full max-w-md rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-7 shadow-2xl sm:p-10"><div className="flex items-start justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><LockKeyhole size={21} /></div><button onClick={onClose} className="btn-ghost" aria-label="關閉編輯入口" data-testid="button-close-gate"><X size={19} /></button></div><p className="eyebrow mt-8 text-[hsl(var(--primary))]">EDITOR ACCESS / 編輯入口</p><h2 id="gate-title" className="serif mt-3 text-3xl font-bold">想替這座資料庫<br />放進一段新的記憶嗎？</h2><p className="mt-4 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">這裡是給資料庫守護者的入口。輸入五位數密碼，就可以整理故事、修改介紹或新增一則收藏。</p><form onSubmit={submit} className="mt-7"><label htmlFor="archive-password" className="text-sm font-semibold">編輯密碼</label><input id="archive-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} type="password" inputMode="numeric" maxLength={5} placeholder="請輸入 5 位數密碼" className="input-archive mt-2 text-center text-xl tracking-[.45em]" autoFocus data-testid="input-editor-password" />{error && <p className="mt-2 text-sm text-[hsl(var(--destructive))]" role="alert" data-testid="text-password-error">{error}</p>}<button type="submit" className="btn-primary mt-5 w-full" data-testid="button-submit-password">進入編輯模式 <ArrowRight size={16} /></button></form><p className="mt-5 text-center text-xs text-[hsl(var(--muted-foreground))]"><ShieldCheck className="mr-1 inline-block" size={13} />編輯內容會同步到共享資料庫</p></div></div>;
}

function imageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('圖片讀取失敗'));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error('圖片格式無法讀取'));
      image.onload = () => {
        const maxDimension = 1600;
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('瀏覽器不支援圖片處理'));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function MemoryImagesField({ images, inputId, onChange }: { images: string[]; inputId: string; onChange: (values: string[]) => void }) {
  const [error, setError] = useState('');
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    setError('');
    const invalidFile = files.find((file) => !file.type.startsWith('image/'));
    if (invalidFile) {
      setError('請只選擇圖片檔案。');
      return;
    }
    if (files.some((file) => file.size > 12 * 1024 * 1024)) {
      setError('單張圖片大小請控制在 12 MB 以內。');
      return;
    }
    try {
      onChange([...images, ...(await Promise.all(files.map(imageToDataUrl)))]);
    } catch {
      setError('圖片讀取失敗，請換幾張圖片再試一次。');
    }
  };

  return <div className="mt-7 rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--background)/.5)] p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-sm font-semibold">故事圖片</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">第一張圖片會用在故事卡片與詳情背景，也可以一次上傳多張。</p></div>
      <label htmlFor={inputId} className="btn-outline cursor-pointer px-3 py-2 text-xs"><ImagePlus size={15} /> 新增圖片<input id={inputId} type="file" accept="image/*" multiple onChange={handleFileChange} className="sr-only" /></label>
    </div>
    {images.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{images.map((image, index) => <div key={`${inputId}-${index}`} className="group relative overflow-hidden rounded-xl border border-[hsl(var(--border))]"><img src={image} alt={`故事圖片 ${index + 1} 預覽`} className="aspect-[4/3] w-full object-cover" /><div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-[hsl(var(--primary)/.78)] px-2 py-1.5 text-[11px] text-white backdrop-blur-sm"><span>{index === 0 ? '背景圖片' : `圖片 ${index + 1}`}</span><button type="button" onClick={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))} className="rounded-full px-1.5 py-0.5 font-semibold hover:bg-white/15">移除</button></div></div>)}</div> : <div className="mt-4 flex min-h-28 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 text-center text-xs leading-relaxed text-[hsl(var(--muted-foreground))]"><div><ImagePlus className="mx-auto mb-2 text-[hsl(var(--secondary))]" size={22} /><p>選擇一張或多張圖片，讓這段故事有自己的畫面。</p></div></div>}
    {error && <p className="mt-3 text-xs text-[hsl(var(--destructive))]" role="alert">{error}</p>}
  </div>;
}

function MemoryImageField({ image, inputId, onChange, onClear }: { image?: string; inputId: string; onChange: (value: string) => void; onClear: () => void }) {
  return <MemoryImagesField images={image ? [image] : []} inputId={inputId} onChange={(values) => onChange(values[0] ?? '')} />;
}

function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const selectionRef = useRef<Range | null>(null);
  const setEditorRef = (node: HTMLDivElement | null) => {
    setElement(node);
  };
  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !element || !element.contains(selection.anchorNode)) return;
    selectionRef.current = selection.getRangeAt(0).cloneRange();
  };
  const restoreSelection = () => {
    if (!element || !selectionRef.current) return;
    element.focus();
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  };
  const runCommand = (command: string, commandValue?: string) => {
    restoreSelection();
    document.execCommand(command, false, commandValue);
    if (element) onChange(sanitizeStoryHtml(element.innerHTML));
  };
  const handleInput = () => {
    if (element) onChange(sanitizeStoryHtml(element.innerHTML));
  };
  const keepSelection = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  const applyColor = (event: ChangeEvent<HTMLInputElement>) => runCommand('foreColor', event.target.value);
  const initialHtml = value || '<p><br /></p>';

  useEffect(() => {
    if (element && element.innerHTML !== value) element.innerHTML = initialHtml;
  }, [element, initialHtml, value]);

  return <div className="rich-editor-shell mt-2 overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
    <div className="rich-toolbar flex flex-wrap items-center gap-1 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.65)] p-2">
      <button type="button" onMouseDown={keepSelection} onClick={() => runCommand('bold')} className="rich-tool font-bold" title="粗體">B</button>
      <button type="button" onMouseDown={keepSelection} onClick={() => runCommand('italic')} className="rich-tool italic" title="斜體">I</button>
      <button type="button" onMouseDown={keepSelection} onClick={() => runCommand('underline')} className="rich-tool underline" title="底線">U</button>
      <span className="mx-1 h-5 w-px bg-[hsl(var(--border))]" />
      <select defaultValue="Noto Sans TC" onChange={(event) => runCommand('fontName', event.target.value)} className="rich-select" aria-label="字體">
        <option value="Noto Sans TC">無襯線</option>
        <option value="Noto Serif TC">襯線</option>
        <option value="Georgia">Georgia</option>
        <option value="monospace">等寬</option>
      </select>
      <select defaultValue="3" onChange={(event) => runCommand('fontSize', event.target.value)} className="rich-select" aria-label="文字大小">
        <option value="2">小</option>
        <option value="3">標準</option>
        <option value="4">大</option>
        <option value="5">特大</option>
      </select>
      <label className="rich-color" title="文字顏色"><span className="sr-only">文字顏色</span><input type="color" defaultValue="#15313d" onChange={applyColor} /></label>
      <button type="button" onMouseDown={keepSelection} onClick={() => runCommand('removeFormat')} className="rich-tool text-xs" title="清除格式">清除格式</button>
    </div>
    <div ref={setEditorRef} contentEditable suppressContentEditableWarning onInput={handleInput} onMouseUp={saveSelection} onKeyUp={saveSelection} className="rich-editor min-h-[280px] p-4 text-base leading-loose focus:outline-none" data-placeholder="在這裡寫下故事…" role="textbox" aria-label="編輯完整故事" />
  </div>;
}

function PageLayoutEditor({ siteContent, onChange }: { siteContent: SiteContent; onChange: (value: SiteContent) => void }) {
  const sectionOrder = ['頁首', '主視覺', '記憶索引', '記憶卡片', '故事詳頁', '關於資料庫', '頁尾', '頁面內容'];
  const sectionDescriptions: Record<string, string> = {
    頁首: '網站名稱與導覽',
    主視覺: '首頁第一個畫面',
    記憶索引: '索引標題與搜尋',
    記憶卡片: '故事卡片操作文字',
    故事詳頁: '故事詳情固定標籤',
    關於資料庫: '資料庫介紹區',
    頁尾: '頁尾與投稿入口',
    頁面內容: '自訂頁面的文字區塊',
  };
  const [selectedId, setSelectedId] = useState(siteContent.blocks[0]?.id ?? '');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const dragRef = useRef<{ id: string; startX: number; startY: number; x: number; y: number } | null>(null);
  const selected = siteContent.blocks.find((block) => block.id === selectedId) ?? siteContent.blocks[0];
  const blocksBySection = siteContent.blocks.reduce<Record<string, SiteTextBlock[]>>((result, block) => {
    (result[block.section] ??= []).push(block);
    return result;
  }, {});
  const updateBlock = (id: string, patch: Partial<SiteTextBlock>) => {
    onChange({ ...siteContent, blocks: siteContent.blocks.map((block) => block.id === id ? { ...block, ...patch } : block) });
  };
  const updateSelected = (patch: Partial<SiteTextBlock>) => {
    if (selected) updateBlock(selected.id, patch);
  };
  const startDrag = (event: React.PointerEvent<HTMLButtonElement>, block: SiteTextBlock) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(block.id);
    dragRef.current = { id: block.id, startX: event.clientX, startY: event.clientY, x: block.x, y: block.y };
  };
  const moveDraggedBlock = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    updateBlock(drag.id, {
      x: Math.round(drag.x + event.clientX - drag.startX),
      y: Math.round(drag.y + event.clientY - drag.startY),
    });
  };
  const stopDrag = () => {
    dragRef.current = null;
  };
  const blockClassName = (block: SiteTextBlock) => {
    if (block.id.includes('title')) return 'text-[1.65rem] font-black leading-tight';
    if (block.id.includes('description') || block.id.includes('body')) return 'text-sm leading-relaxed';
    if (block.id.includes('kicker') || block.id.includes('eyebrow') || block.id.includes('label')) return 'text-[10px] font-bold tracking-[.16em]';
    if (block.id.includes('cta') || block.id.includes('readMore')) return 'inline-block rounded-full bg-[hsl(var(--secondary))] px-3 py-1.5 text-xs font-bold text-white';
    return 'text-sm leading-relaxed';
  };
  const sectionClassName = (section: string) => section === '頁首' || section === '主視覺'
    ? 'bg-[#173746] text-white'
    : section === '頁尾' ? 'bg-[#173746] text-white' : 'bg-[#f6f1e8] text-[#173746]';

  return <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-5 py-4">
      <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-white"><LayoutTemplate size={18} /></span><div><p className="text-sm font-bold">首頁編輯器</p><p className="text-xs text-[hsl(var(--muted-foreground))]">點選文字後直接修改，拖曳左側把手調整位置</p></div></div>
      <div className="flex items-center gap-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1"><button type="button" onClick={() => setDevice('desktop')} className={`rounded-lg p-2 ${device === 'desktop' ? 'bg-[hsl(var(--muted))] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`} aria-label="桌面預覽"><Monitor size={16} /></button><button type="button" onClick={() => setDevice('tablet')} className={`rounded-lg p-2 ${device === 'tablet' ? 'bg-[hsl(var(--muted))] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`} aria-label="平板預覽"><Tablet size={16} /></button><button type="button" onClick={() => setDevice('mobile')} className={`rounded-lg p-2 ${device === 'mobile' ? 'bg-[hsl(var(--muted))] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`} aria-label="手機預覽"><Smartphone size={16} /></button></div>
    </div>
    <div className="grid min-h-[760px] lg:grid-cols-[230px_minmax(0,1fr)_300px]">
      <aside className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 lg:border-b-0 lg:border-r">
        <div className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wide text-[hsl(var(--muted-foreground))]"><Layers3 size={15} />頁面結構</div>
        <div className="space-y-1">{sectionOrder.map((section) => { const sectionBlocks = blocksBySection[section] ?? []; const active = selected?.section === section; return <div key={section}><button type="button" onClick={() => sectionBlocks[0] && setSelectedId(sectionBlocks[0].id)} className={`flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left transition ${active ? 'bg-[hsl(var(--primary))] text-white' : 'hover:bg-[hsl(var(--muted))]'}`}><span className="mt-0.5 text-[10px] opacity-60">▾</span><span><span className="block text-sm font-semibold">{section}</span><span className={`mt-0.5 block text-[10px] ${active ? 'text-white/65' : 'text-[hsl(var(--muted-foreground))]'}`}>{sectionDescriptions[section]}</span></span></button>{active && <div className="ml-5 mt-1 space-y-0.5 border-l border-[hsl(var(--border))] pl-2">{sectionBlocks.map((block) => <button key={block.id} type="button" onClick={() => setSelectedId(block.id)} className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[11px] ${selected?.id === block.id ? 'bg-[hsl(var(--muted))] font-bold text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted)/.7)]'}`}><GripVertical size={11} /><span className="truncate">{block.label}</span></button>)}</div>}</div>; })}</div>
      </aside>
      <section className="min-w-0 bg-[#e9e7e2] p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs text-[hsl(var(--muted-foreground))]"><span>首頁 / {selected?.section ?? '頁面'}</span><span className="rounded-full bg-white/80 px-3 py-1">預覽模式 · {device === 'desktop' ? '桌面' : device === 'tablet' ? '平板' : '手機'}</span></div>
        <div className={`mx-auto overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl transition-all ${device === 'desktop' ? 'max-w-[700px]' : device === 'tablet' ? 'max-w-[520px]' : 'max-w-[340px]'}`}>
          <div className="flex h-8 items-center gap-1.5 border-b border-black/10 bg-[#f7f7f7] px-3"><span className="h-2.5 w-2.5 rounded-full bg-[#ff605c]" /><span className="h-2.5 w-2.5 rounded-full bg-[#ffbd44]" /><span className="h-2.5 w-2.5 rounded-full bg-[#00ca4e]" /><span className="ml-3 h-3 flex-1 rounded-full bg-black/5" /></div>
          <div className="max-h-[680px] overflow-y-auto">
            {sectionOrder.map((section) => <div key={section} className={`relative px-5 py-5 ${section === '主視覺' ? 'min-h-[250px]' : 'min-h-[100px]'} ${sectionClassName(section)}`}><div className="mb-3 flex items-center justify-between border-b border-current/10 pb-2 text-[9px] uppercase tracking-[.18em] opacity-40"><span>{section}</span><span>section</span></div><div className="space-y-3">{(blocksBySection[section] ?? []).map((block) => <div key={block.id} onClick={() => setSelectedId(block.id)} className={`group relative rounded-lg transition ${selected?.id === block.id ? 'z-10 outline outline-2 outline-[hsl(var(--secondary))] outline-offset-4' : 'hover:outline hover:outline-1 hover:outline-[hsl(var(--secondary)/.55)] hover:outline-offset-2'}`}><button type="button" onPointerDown={(event) => startDrag(event, block)} onPointerMove={moveDraggedBlock} onPointerUp={stopDrag} onPointerCancel={stopDrag} className={`absolute -left-4 top-1/2 z-20 hidden -translate-y-1/2 cursor-grab rounded-md bg-[hsl(var(--secondary))] p-1 text-white shadow-sm group-hover:block ${selected?.id === block.id ? '!block' : ''}`} aria-label={`拖曳${block.label}`}><Move size={12} /></button><div contentEditable={selected?.id === block.id} suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: sanitizeStoryHtml(block.html) }} onInput={(event) => selected?.id === block.id && updateBlock(block.id, { html: sanitizeStoryHtml(event.currentTarget.innerHTML) })} className={`${blockClassName(block)} ${selected?.id === block.id ? 'cursor-text' : 'cursor-pointer'}`} style={{ ...siteBlockStyle(block), display: 'block', width: `${Math.min(block.width, 100)}%`, maxWidth: '100%', transform: `translate(${block.x}px, ${block.y}px)` }} /></div>)}</div></div>)}
          </div>
        </div>
      </section>
      <aside className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 sm:p-5 lg:border-l lg:border-t-0">
        {selected ? <><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold tracking-[.14em] text-[hsl(var(--primary))]">SELECTED ELEMENT</p><h2 className="mt-1 text-lg font-bold">{selected.label}</h2></div><Settings2 size={17} className="mt-1 text-[hsl(var(--muted-foreground))]" /></div><p className="mt-2 rounded-lg bg-[hsl(var(--muted))] px-3 py-2 text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">雙擊或直接點擊中間文字即可編輯內容。拖曳文字左側的把手可以移動它。</p><div className="mt-4"><p className="mb-2 text-xs font-bold">文字內容與格式</p><RichTextEditor key={selected.id} value={selected.html} onChange={(html) => updateSelected({ html })} /></div><div className="mt-5 border-t border-[hsl(var(--border))] pt-4"><p className="mb-3 text-xs font-bold">位置與寬度</p><div className="grid grid-cols-2 gap-2"><label className="text-[11px] font-semibold">X 位置<input type="number" value={selected.x} onChange={(event) => updateSelected({ x: Number(event.target.value) || 0 })} className="input-archive mt-1 px-2 py-2 text-xs" /></label><label className="text-[11px] font-semibold">Y 位置<input type="number" value={selected.y} onChange={(event) => updateSelected({ y: Number(event.target.value) || 0 })} className="input-archive mt-1 px-2 py-2 text-xs" /></label><label className="col-span-2 text-[11px] font-semibold">寬度<input type="range" min={10} max={100} value={selected.width} onChange={(event) => updateSelected({ width: Number(event.target.value) })} className="mt-2 w-full accent-[hsl(var(--primary))]" /><span className="mt-1 block text-right text-[10px] font-normal text-[hsl(var(--muted-foreground))]">{selected.width}%</span></label></div><div className="mt-3 flex items-center gap-2"><span className="text-[11px] font-semibold">對齊</span><button type="button" onClick={() => updateSelected({ align: 'left' })} className={`rounded-lg border p-2 ${selected.align === 'left' ? 'border-[hsl(var(--primary))] bg-[hsl(var(--muted))] text-[hsl(var(--primary))]' : 'border-[hsl(var(--border))]'}`} aria-label="靠左對齊"><AlignLeft size={14} /></button><button type="button" onClick={() => updateSelected({ align: 'center' })} className={`rounded-lg border p-2 ${selected.align === 'center' ? 'border-[hsl(var(--primary))] bg-[hsl(var(--muted))] text-[hsl(var(--primary))]' : 'border-[hsl(var(--border))]'}`} aria-label="置中對齊"><AlignCenter size={14} /></button><button type="button" onClick={() => updateSelected({ align: 'right' })} className={`rounded-lg border p-2 ${selected.align === 'right' ? 'border-[hsl(var(--primary))] bg-[hsl(var(--muted))] text-[hsl(var(--primary))]' : 'border-[hsl(var(--border))]'}`} aria-label="靠右對齊"><AlignRight size={14} /></button><button type="button" onClick={() => updateSelected({ x: 0, y: 0, width: 100, align: 'left' })} className="ml-auto text-[11px] font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]">重設</button></div></div></> : <div className="py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">選擇中間的文字開始編輯</div>}
      </aside>
    </div>
  </div>;
}

function LegacyPageLayoutEditor({ siteContent, onChange }: { siteContent: SiteContent; onChange: (value: SiteContent) => void }) {
  const [selectedId, setSelectedId] = useState(siteContent.blocks[0]?.id ?? '');
  const dragRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const selected = siteContent.blocks.find((block) => block.id === selectedId) ?? siteContent.blocks[0];
  const groups = siteContent.blocks.reduce<Record<string, SiteTextBlock[]>>((result, block) => {
    (result[block.section] ??= []).push(block);
    return result;
  }, {});
  const updateSelected = (patch: Partial<SiteTextBlock>) => {
    if (!selected) return;
    onChange({ ...siteContent, blocks: siteContent.blocks.map((block) => block.id === selected.id ? { ...block, ...patch } : block) });
  };
  const updatePositionFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !selected) return;
    updateSelected({
      x: Math.round(dragRef.current.x + event.clientX - dragRef.current.startX),
      y: Math.round(dragRef.current.y + event.clientY - dragRef.current.startY),
    });
  };
  return <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
    <aside className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
      <div className="flex items-start gap-3"><LayoutTemplate className="mt-1 text-[hsl(var(--primary))]" size={20} /><div><p className="eyebrow text-[hsl(var(--primary))]">PAGE COPY / 頁面文字</p><h2 className="serif mt-2 text-2xl font-bold">編輯網站文字</h2><p className="mt-2 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">選擇任何文字，使用同一組富文字工具編輯。右側預覽中的文字可以拖曳排版。</p></div></div>
      <div className="mt-6 space-y-5">{Object.entries(groups).map(([section, blocks]) => <div key={section}><p className="mb-2 text-xs font-bold tracking-wide text-[hsl(var(--muted-foreground))]">{section}</p><div className="space-y-1">{blocks.map((block) => <button key={block.id} type="button" onClick={() => setSelectedId(block.id)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${selected?.id === block.id ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'hover:bg-[hsl(var(--muted))]'}`}><GripVertical size={14} className="shrink-0 opacity-50" /><span className="truncate">{block.label}</span></button>)}</div></div>)}</div>
    </aside>
    <main className="space-y-5">
      {selected ? <><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-[hsl(var(--primary))]">EDIT TEXT / 編輯文字</p><h2 className="serif mt-2 text-3xl font-bold">{selected.label}</h2></div><button type="button" onClick={() => updateSelected({ x: 0, y: 0, width: 100, align: 'left' })} className="btn-outline px-3 py-2 text-xs">重設位置</button></div><RichTextEditor key={selected.id} value={selected.html} onChange={(html) => updateSelected({ html })} /><div className="mt-6 grid gap-4 sm:grid-cols-3"><label className="text-sm font-semibold">水平位移（px）<input type="number" value={selected.x} onChange={(event) => updateSelected({ x: Number(event.target.value) || 0 })} className="input-archive mt-2" /></label><label className="text-sm font-semibold">垂直位移（px）<input type="number" value={selected.y} onChange={(event) => updateSelected({ y: Number(event.target.value) || 0 })} className="input-archive mt-2" /></label><label className="text-sm font-semibold">最大寬度（%）<input type="number" min={10} max={100} value={selected.width} onChange={(event) => updateSelected({ width: Math.min(100, Math.max(10, Number(event.target.value) || 10)) })} className="input-archive mt-2" /></label></div><div className="mt-4"><p className="text-sm font-semibold">文字對齊</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => updateSelected({ align: 'left' })} className={`btn-outline px-3 py-2 ${selected.align === 'left' ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]' : ''}`} aria-label="靠左對齊"><AlignLeft size={16} /></button><button type="button" onClick={() => updateSelected({ align: 'center' })} className={`btn-outline px-3 py-2 ${selected.align === 'center' ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]' : ''}`} aria-label="置中對齊"><AlignCenter size={16} /></button><button type="button" onClick={() => updateSelected({ align: 'right' })} className={`btn-outline px-3 py-2 ${selected.align === 'right' ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]' : ''}`} aria-label="靠右對齊"><AlignRight size={16} /></button></div></div></div><div className="rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--primary))] p-5 text-white"><p className="mb-3 text-xs text-white/60">拖曳預覽中的文字調整位置</p><div className="relative min-h-[250px] overflow-hidden rounded-xl border border-white/15 bg-white/5"><div className="absolute left-1/2 top-1/2 cursor-move rounded-lg border border-dashed border-[hsl(var(--accent))] bg-[hsl(var(--primary)/.85)] p-4 shadow-xl" style={{ ...siteBlockStyle(selected), left: '50%', top: '50%', maxWidth: `${selected.width}%`, width: `${Math.min(selected.width, 100)}%`, transform: `translate(-50%, -50%) translate(${selected.x}px, ${selected.y}px)`, textAlign: selected.align }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { startX: event.clientX, startY: event.clientY, x: selected.x, y: selected.y }; }} onPointerMove={updatePositionFromPointer} onPointerUp={() => { dragRef.current = null; }} dangerouslySetInnerHTML={{ __html: sanitizeStoryHtml(selected.html) }} /></div></div></> : <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-10 text-center">還沒有可編輯的頁面文字。</div>}
    </main>
  </div>;
}

function LegacyEditor({ archive, onSave, onCancel, onLock }: { archive: ArchiveData; onSave: (data: ArchiveData) => void; onCancel: () => void; onLock: () => void }) {
  const [draft, setDraft] = useState<ArchiveData>(() => structuredClone(archive));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);
  const selected = draft.memories.find((memory) => memory.id === selectedId);
  const updateSelected = (field: keyof Memory, value: string) => { if (!selectedId) return; setDraft((current) => ({ ...current, memories: current.memories.map((memory) => memory.id === selectedId ? { ...memory, [field]: value } : memory) })); };
  const updateSelectedImages = (values: string[]) => { if (!selectedId) return; setDraft((current) => ({ ...current, memories: current.memories.map((memory) => memory.id === selectedId ? { ...memory, images: values, image: undefined } : memory) })); };
  const removeSelected = () => { if (!selectedId || !window.confirm('確定要刪除這則記憶嗎？刪除後請按「保存變更」才會生效。')) return; setDraft((current) => ({ ...current, memories: current.memories.filter((memory) => memory.id !== selectedId) })); setSelectedId(null); };
  const addNew = () => { const nextId = String(Math.max(0, ...draft.memories.map((memory) => Number(memory.id))) + 1).padStart(2, '0'); const story = '請在這裡寫下完整的故事。可以記錄遊戲怎麼開始、誰和你一起玩，以及那時候的天氣和聲音。'; const memory: Memory = { id: nextId, title: '一段還沒命名的記憶', location: '台灣・', era: '年代待補', category: '童玩', storyteller: '說故事的人', excerpt: '在這裡寫下一句讓人想繼續聽的話。', story, storyHtml: storyToHtml(story), color: '#3e8090', mark: '新藏', images: [], }; setDraft((current) => ({ ...current, memories: [...current.memories, memory] })); setSelectedId(nextId); setShowNew(false); };
  return <div className="fixed inset-0 z-40 overflow-y-auto bg-[hsl(var(--background))]"><div className="mx-auto min-h-dvh max-w-7xl px-5 pb-20 lg:px-8"><div className="sticky top-0 z-10 -mx-5 mb-10 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.94)] px-5 py-4 backdrop-blur lg:-mx-8 lg:px-8"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow text-[hsl(var(--primary))]">EDITOR MODE / 編輯模式</p><h1 className="serif mt-1 text-xl font-bold">整理這些被記住的事</h1></div><div className="flex gap-2"><button onClick={onCancel} className="btn-outline px-3 py-2 text-xs" data-testid="button-cancel-editor">取消</button><button onClick={onLock} className="btn-ghost text-xs" data-testid="button-lock-editor"><LockKeyhole size={15} /> 鎖定</button><button onClick={() => { onSave(draft); setSaved(true); setTimeout(() => setSaved(false), 2200); }} className="btn-primary text-xs" data-testid="button-save-archive">{saved ? <><Check size={15} /> 已保存</> : <><Check size={15} /> 保存變更</>}</button></div></div></div><div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]"><aside><div className="rounded-2xl bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))]"><p className="eyebrow text-[hsl(var(--accent))]">ARCHIVE SETTINGS</p><h2 className="serif mt-3 text-2xl font-bold">資料庫介紹</h2><textarea value={draft.introduction} onChange={(event) => setDraft({ ...draft, introduction: event.target.value })} className="mt-5 min-h-[190px] w-full resize-y rounded-xl border border-white/20 bg-white/10 p-4 text-sm leading-relaxed text-white outline-none placeholder:text-white/45 focus:border-[hsl(var(--accent))]" aria-label="編輯資料庫介紹" data-testid="textarea-introduction" /><p className="mt-3 text-xs text-white/55">這段文字會出現在首頁的第一個畫面。</p></div><div className="mt-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"><div className="flex items-center justify-between"><div><p className="eyebrow text-[hsl(var(--primary))]">COLLECTION</p><p className="mt-1 font-bold">記憶清單 <span className="text-[hsl(var(--muted-foreground))]">({draft.memories.length})</span></p></div><button onClick={() => setShowNew(true)} className="btn-primary px-3 py-2 text-xs" data-testid="button-add-memory"><Plus size={15} /> 新增</button></div><div className="mt-4 space-y-1">{draft.memories.map((memory) => <button key={memory.id} onClick={() => setSelectedId(memory.id)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${selectedId === memory.id ? 'bg-[hsl(var(--muted))]' : 'hover:bg-[hsl(var(--muted)/.65)]'}`} data-testid={`button-edit-memory-${memory.id}`}><span className="h-8 w-8 rounded-lg bg-cover bg-center" style={{ backgroundColor: memory.color, ...(memory.image ? { backgroundImage: `url(${memory.image})` } : {}) }} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{memory.title}</span><span className="block text-xs text-[hsl(var(--muted-foreground))]">{memory.location}</span></span><ChevronDown size={14} className="-rotate-90 text-[hsl(var(--muted-foreground))]" /></button>)}</div></div></aside><main>{selected ? <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8"><div className="mb-7 flex items-start justify-between"><div><p className="eyebrow text-[hsl(var(--primary))]">EDIT MEMORY / 編輯故事</p><h2 className="serif mt-2 text-3xl font-bold">{selected.title}</h2></div><button onClick={removeSelected} className="btn-ghost text-[hsl(var(--destructive))]" aria-label="刪除此記憶" data-testid={`button-delete-memory-${selected.id}`}><Trash2 size={17} /> <span className="hidden sm:inline">刪除</span></button></div><div className="grid gap-5 sm:grid-cols-2">{[['title','標題'],['location','地點'],['era','年代'],['category','分類'],['storyteller','說故事的人'],['mark','卡片標記'],['color','卡片色彩']].map(([field, label]) => <label key={field} className="text-sm font-semibold">{label}<input value={String(selected[field as keyof Memory])} onChange={(event) => updateSelected(field as keyof Memory, event.target.value)} className="input-archive mt-2" data-testid={`input-memory-${field}-${selected.id}`} /></label>)}</div><label className="mt-5 block text-sm font-semibold">一句話摘錄<textarea value={selected.excerpt} onChange={(event) => updateSelected('excerpt', event.target.value)} className="input-archive mt-2 min-h-[95px] resize-y" data-testid={`textarea-memory-excerpt-${selected.id}`} /></label><label className="mt-5 block text-sm font-semibold">完整故事<textarea value={selected.story} onChange={(event) => updateSelected('story', event.target.value)} className="input-archive mt-2 min-h-[250px] resize-y leading-loose" data-testid={`textarea-memory-story-${selected.id}`} /></label><MemoryImageField image={selected.image} inputId={`memory-image-${selected.id}`} onChange={(value) => updateSelected('image', value)} onClear={() => updateSelected('image', '')} /><p className="mt-6 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Eye size={14} /> 編輯完成後，請按右上角「保存變更」讓首頁看見最新內容。</p></div> : <div className="flex min-h-[430px] items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] p-8 text-center"><div><BookOpen className="mx-auto text-[hsl(var(--secondary))]" size={34} /><h2 className="serif mt-5 text-2xl font-bold">選一則記憶開始整理</h2><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">或從左側新增一個故事。</p></div></div>}</main></div></div>{showNew && <div className="detail-backdrop fixed inset-0 z-50 flex items-center justify-center p-5"><div className="modal-panel max-w-sm rounded-3xl bg-[hsl(var(--background))] p-8 text-center shadow-2xl"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--secondary)/.2)] text-[hsl(var(--secondary))]"><Plus /></div><h2 className="serif mt-5 text-2xl font-bold">放進一段新記憶</h2><p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">先建立一張空白收藏卡，再慢慢把故事補完整。</p><div className="mt-6 flex justify-center gap-2"><button onClick={() => setShowNew(false)} className="btn-outline" data-testid="button-cancel-new-memory">先不要</button><button onClick={addNew} className="btn-primary" data-testid="button-confirm-new-memory">建立收藏 <ArrowRight size={15} /> </button></div></div></div>}</div>;
}

const cardColorOptions = [
  { value: '#cf7657', label: '赭橘' },
  { value: '#3e8090', label: '湖藍' },
  { value: '#7d8e58', label: '苔綠' },
  { value: '#b98a35', label: '金黃' },
  { value: '#a25b53', label: '磚紅' },
  { value: '#6c6a8d', label: '暮紫' },
];

function CardColorPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="mt-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/.45)] p-3">
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0" aria-label="自訂卡片色彩" /><span>自訂顏色</span></label>
      <span className="text-xs text-[hsl(var(--muted-foreground))]">或選擇預設色</span>
    </div>
    <div className="mt-3 flex flex-wrap gap-2">{cardColorOptions.map((option) => <button key={option.value} type="button" onClick={() => onChange(option.value)} className={`color-preset ${value.toLowerCase() === option.value ? 'color-preset-selected' : ''}`} style={{ backgroundColor: option.value }} aria-label={`選擇${option.label}`} title={option.label} />)}</div>
    <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">目前選擇：{cardColorOptions.find((option) => option.value === value.toLowerCase())?.label ?? '自訂顏色'}</p>
  </div>;
}

function PageBackgroundField({ value, onChange }: { value?: string; onChange: (value?: string) => void }) {
  const [error, setError] = useState('');
  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('請選擇圖片檔案。');
      return;
    }
    try {
      setError('');
      onChange(await imageToDataUrl(file));
    } catch {
      setError('圖片讀取失敗，請換一張圖片再試一次。');
    }
  };
  return <div className="mt-5 rounded-2xl border border-dashed border-[hsl(var(--border))] p-4">
    <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">頁面背景圖片</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">背景只套用在這個自訂頁面。</p></div><label className="btn-outline cursor-pointer px-3 py-2 text-xs"><ImagePlus size={14} />{value ? '更換圖片' : '上傳圖片'}<input type="file" accept="image/*" onChange={handleChange} className="sr-only" /></label></div>
    {value ? <div className="relative mt-4 overflow-hidden rounded-xl"><img src={value} alt="頁面背景預覽" className="h-28 w-full object-cover" /><button type="button" onClick={() => onChange(undefined)} className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white">移除</button></div> : <div className="mt-4 rounded-xl bg-[hsl(var(--muted))] px-4 py-5 text-center text-xs text-[hsl(var(--muted-foreground))]">目前使用主題底色</div>}
    {error && <p className="mt-2 text-xs text-[hsl(var(--destructive))]" role="alert">{error}</p>}
  </div>;
}

function CustomPagesEditor({ pages, onChange }: { pages: CustomPage[]; onChange: (pages: CustomPage[]) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(pages[0]?.id ?? null);
  const selected = pages.find((page) => page.id === selectedId) ?? pages[0];
  const updatePage = (patch: Partial<CustomPage>) => {
    if (!selected) return;
    onChange(pages.map((page) => page.id === selected.id ? { ...page, ...patch } : page));
  };
  const addPage = () => {
    const id = `page-${Date.now()}`;
    const page: CustomPage = {
      id,
      title: '新的主題',
      slug: id,
      blocks: [{ id: `${id}.body`, label: '頁面內容', section: '頁面內容', html: '<p>在這裡寫下新的主題內容。</p>', x: 0, y: 0, width: 100, align: 'left' }],
    };
    onChange([...pages, page]);
    setSelectedId(id);
  };
  const removePage = () => {
    if (!selected || !window.confirm(`確定要刪除「${selected.title}」嗎？保存後這個頁面和導覽連結都會移除。`)) return;
    const remaining = pages.filter((page) => page.id !== selected.id);
    onChange(remaining);
    setSelectedId(remaining[0]?.id ?? null);
  };
  return <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
    <aside className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
      <div className="flex items-start justify-between gap-3"><div><p className="eyebrow text-[hsl(var(--primary))]">SITE PAGES / 網站頁面</p><h2 className="serif mt-2 text-2xl font-bold">自訂主題</h2></div><button type="button" onClick={addPage} className="btn-primary px-3 py-2 text-xs"><Plus size={14} />新增</button></div>
      <p className="mt-3 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">新增的主題會自動出現在右上角三條線的選單，點擊後會開啟獨立頁面。</p>
      <div className="mt-5 space-y-1">{pages.length ? pages.map((page) => <button key={page.id} type="button" onClick={() => setSelectedId(page.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${selected?.id === page.id ? 'bg-[hsl(var(--primary))] text-white' : 'hover:bg-[hsl(var(--muted))]'}`}><span className="h-8 w-8 shrink-0 rounded-lg bg-[hsl(var(--secondary)/.2)]" style={page.backgroundImage ? { backgroundImage: `url("${page.backgroundImage}")`, backgroundSize: 'cover' } : undefined} /><span className="min-w-0 truncate text-sm font-semibold">{page.title}</span></button>) : <div className="rounded-xl bg-[hsl(var(--muted))] px-3 py-4 text-center text-xs text-[hsl(var(--muted-foreground))]">還沒有自訂頁面</div>}</div>
    </aside>
    {selected ? <main className="min-w-0"><div className="mb-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-[hsl(var(--primary))]">PAGE SETTINGS / 頁面設定</p><h2 className="serif mt-2 text-3xl font-bold">{selected.title}</h2></div><button type="button" onClick={removePage} className="btn-ghost text-[hsl(var(--destructive))]"><Trash2 size={16} />刪除頁面</button></div><label className="mt-5 block text-sm font-semibold">選單顯示名稱<input value={selected.title} onChange={(event) => updatePage({ title: event.target.value })} className="input-archive mt-2" placeholder="例如：我們的理念" /></label><p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">頁面網址：/page/{selected.slug}</p><PageBackgroundField value={selected.backgroundImage} onChange={(backgroundImage) => updatePage({ backgroundImage })} /></div><PageLayoutEditor key={selected.id} siteContent={{ blocks: selected.blocks, pages: [] }} onChange={(content) => updatePage({ blocks: content.blocks })} /></main> : <main className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] p-8 text-center"><div><LayoutTemplate className="mx-auto text-[hsl(var(--secondary))]" size={34} /><h2 className="serif mt-5 text-2xl font-bold">建立第一個自訂主題</h2><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">例如「我們的理念」、「參與方式」或「合作夥伴」。</p><button type="button" onClick={addPage} className="btn-primary mt-5"><Plus size={15} />建立頁面</button></div></main>}
  </div>;
}

function Editor({ archive, onSave, onCancel, onLock }: { archive: ArchiveData; onSave: (data: ArchiveData) => Promise<void>; onCancel: () => void; onLock: () => void }) {
  const [draft, setDraft] = useState<ArchiveData>(() => structuredClone(archive));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [editorTab, setEditorTab] = useState<'memories' | 'page' | 'pages'>('memories');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const selected = draft.memories.find((memory) => memory.id === selectedId);
  const updateSelected = (field: keyof Memory, value: string) => {
    if (!selectedId) return;
    setDraft((current) => ({ ...current, memories: current.memories.map((memory) => memory.id === selectedId ? { ...memory, [field]: value } : memory) }));
  };
  const updateSelectedImages = (values: string[]) => {
    if (!selectedId) return;
    setDraft((current) => ({ ...current, memories: current.memories.map((memory) => memory.id === selectedId ? { ...memory, images: values, image: undefined } : memory) }));
  };
  const removeSelected = () => {
    if (!selectedId || !window.confirm('確定要刪除這則記憶嗎？刪除後請按「保存變更」才會生效。')) return;
    setDraft((current) => ({ ...current, memories: current.memories.filter((memory) => memory.id !== selectedId) }));
    setSelectedId(null);
  };
  const addNew = () => {
    const nextId = String(Math.max(0, ...draft.memories.map((memory) => Number(memory.id))) + 1).padStart(2, '0');
    const story = '請在這裡寫下完整的故事。可以記錄遊戲怎麼開始、誰和你一起玩，以及那時候的天氣和聲音。';
    const memory: Memory = { id: nextId, title: '一段還沒命名的記憶', location: '台灣・', era: '年代待補', category: '童玩', storyteller: '說故事的人', excerpt: '在這裡寫下一句讓人想繼續聽的話。', story, storyHtml: storyToHtml(story), color: '#3e8090', mark: '新藏', images: [] };
    setDraft((current) => ({ ...current, memories: [...current.memories, memory] }));
    setSelectedId(nextId);
    setShowNew(false);
  };

  return <div className="fixed inset-0 z-40 overflow-y-auto bg-[hsl(var(--background))]">
    <div className="mx-auto min-h-dvh max-w-7xl px-5 pb-20 lg:px-8">
      <div className="sticky top-0 z-10 -mx-5 mb-10 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.94)] px-5 py-4 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div><p className="eyebrow text-[hsl(var(--primary))]">EDITOR MODE / 編輯模式</p><h1 className="serif mt-1 text-xl font-bold">整理這些被記住的事</h1></div>
          <div className="flex gap-2"><button onClick={onCancel} className="btn-outline px-3 py-2 text-xs" data-testid="button-cancel-editor">取消</button><button onClick={onLock} className="btn-ghost text-xs" data-testid="button-lock-editor"><LockKeyhole size={15} /> 鎖定</button><button disabled={saving} onClick={async () => { setSaving(true); try { await onSave(draft); setSaved(true); setTimeout(() => setSaved(false), 2200); } catch { /* saveArchive reports the error and keeps the editor open */ } finally { setSaving(false); } }} className="btn-primary text-xs disabled:cursor-wait disabled:opacity-60" data-testid="button-save-archive">{saving ? '保存中…' : saved ? <><Check size={15} /> 已保存</> : <><Check size={15} /> 保存變更</>}</button></div>
        </div>
      </div>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-[hsl(var(--border))] pb-4"><button type="button" onClick={() => setEditorTab('memories')} className={`rounded-full px-4 py-2 text-sm font-semibold ${editorTab === 'memories' ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`} data-testid="button-editor-tab-memories">故事收藏</button><button type="button" onClick={() => setEditorTab('page')} className={`rounded-full px-4 py-2 text-sm font-semibold ${editorTab === 'page' ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`} data-testid="button-editor-tab-page"><LayoutTemplate size={15} className="mr-1 inline-block" />首頁文字與排版</button><button type="button" onClick={() => setEditorTab('pages')} className={`rounded-full px-4 py-2 text-sm font-semibold ${editorTab === 'pages' ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`} data-testid="button-editor-tab-pages"><Layers3 size={15} className="mr-1 inline-block" />自訂主題頁面</button></div>
      {editorTab === 'pages' ? <CustomPagesEditor pages={draft.siteContent.pages} onChange={(pages) => setDraft((current) => ({ ...current, siteContent: { ...current.siteContent, pages } }))} /> : editorTab === 'page' ? <PageLayoutEditor siteContent={draft.siteContent} onChange={(siteContent) => setDraft((current) => ({ ...current, siteContent }))} /> : <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
        <aside>
          <div className="rounded-2xl bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))]">
            <p className="eyebrow text-[hsl(var(--accent))]">ARCHIVE SETTINGS</p><h2 className="serif mt-3 text-2xl font-bold">資料庫介紹</h2>
            <textarea value={draft.introduction} onChange={(event) => setDraft({ ...draft, introduction: event.target.value })} className="mt-5 min-h-[190px] w-full resize-y rounded-xl border border-white/20 bg-white/10 p-4 text-sm leading-relaxed text-white outline-none placeholder:text-white/45 focus:border-[hsl(var(--accent))]" aria-label="編輯資料庫介紹" data-testid="textarea-introduction" />
            <p className="mt-3 text-xs text-white/55">這段文字會出現在首頁的第一個畫面。</p>
          </div>
          <div className="mt-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
            <div className="flex items-center justify-between"><div><p className="eyebrow text-[hsl(var(--primary))]">COLLECTION</p><p className="mt-1 font-bold">記憶清單 <span className="text-[hsl(var(--muted-foreground))]">({draft.memories.length})</span></p></div><button onClick={() => setShowNew(true)} className="btn-primary px-3 py-2 text-xs" data-testid="button-add-memory"><Plus size={15} /> 新增</button></div>
            <div className="mt-4 space-y-1">{draft.memories.map((memory) => { const thumbnail = getMemoryImages(memory)[0]; return <button key={memory.id} onClick={() => setSelectedId(memory.id)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${selectedId === memory.id ? 'bg-[hsl(var(--muted))]' : 'hover:bg-[hsl(var(--muted)/.65)]'}`} data-testid={`button-edit-memory-${memory.id}`}><span className="h-8 w-8 rounded-lg bg-cover bg-center" style={{ backgroundColor: memory.color, ...(thumbnail ? { backgroundImage: `url(${thumbnail})` } : {}) }} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{memory.title}</span><span className="block text-xs text-[hsl(var(--muted-foreground))]">{memory.location}</span></span><ChevronDown size={14} className="-rotate-90 text-[hsl(var(--muted-foreground))]" /></button>; })}</div>
          </div>
        </aside>
        <main>
          {selected ? <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8">
            <div className="mb-7 flex items-start justify-between"><div><p className="eyebrow text-[hsl(var(--primary))]">EDIT MEMORY / 編輯故事</p><h2 className="serif mt-2 text-3xl font-bold">{selected.title}</h2></div><button onClick={removeSelected} className="btn-ghost text-[hsl(var(--destructive))]" aria-label="刪除此記憶" data-testid={`button-delete-memory-${selected.id}`}><Trash2 size={17} /> <span className="hidden sm:inline">刪除</span></button></div>
            <div className="grid gap-5 sm:grid-cols-2">{[['title', '標題'], ['location', '地點'], ['era', '年代'], ['category', '分類'], ['storyteller', '說故事的人'], ['mark', '卡片標記']].map(([field, label]) => <label key={field} className="text-sm font-semibold">{label}<input value={String(selected[field as keyof Memory] ?? '')} onChange={(event) => updateSelected(field as keyof Memory, event.target.value)} className="input-archive mt-2" data-testid={`input-memory-${field}-${selected.id}`} /></label>)}</div>
            <div className="mt-5"><p className="text-sm font-semibold">卡片色彩</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">這是卡片上方的背景色；若有故事圖片，圖片會優先顯示。</p><CardColorPicker value={selected.color} onChange={(value) => updateSelected('color', value)} /></div>
            <label className="mt-5 block text-sm font-semibold">一句話摘錄<textarea value={selected.excerpt} onChange={(event) => updateSelected('excerpt', event.target.value)} className="input-archive mt-2 min-h-[95px] resize-y" data-testid={`textarea-memory-excerpt-${selected.id}`} /></label>
            <div className="mt-5"><p className="text-sm font-semibold">完整故事</p><RichTextEditor key={selected.id} value={selected.storyHtml ?? storyToHtml(selected.story)} onChange={(html) => { updateSelected('storyHtml', html); updateSelected('story', storyToPlainText(html)); }} /></div>
            <MemoryImagesField images={getMemoryImages(selected)} inputId={`memory-images-${selected.id}`} onChange={updateSelectedImages} />
            <p className="mt-6 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Eye size={14} /> 編輯完成後，請按右上角「保存變更」讓首頁看見最新內容。</p>
          </div> : <div className="flex min-h-[430px] items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] p-8 text-center"><div><BookOpen className="mx-auto text-[hsl(var(--secondary))]" size={34} /><h2 className="serif mt-5 text-2xl font-bold">選一則記憶開始整理</h2><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">或從左側新增一個故事。</p></div></div>}
        </main>
      </div>}
    </div>
    {showNew && <div className="detail-backdrop fixed inset-0 z-50 flex items-center justify-center p-5"><div className="modal-panel max-w-sm rounded-3xl bg-[hsl(var(--background))] p-8 text-center shadow-2xl"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--secondary)/.2)] text-[hsl(var(--secondary))]"><Plus /></div><h2 className="serif mt-5 text-2xl font-bold">放進一段新記憶</h2><p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">先建立一張空白收藏卡，再慢慢把故事補完整。</p><div className="mt-6 flex justify-center gap-2"><button onClick={() => setShowNew(false)} className="btn-outline" data-testid="button-cancel-new-memory">先不要</button><button onClick={addNew} className="btn-primary" data-testid="button-confirm-new-memory">建立收藏 <ArrowRight size={15} /></button></div></div></div>}
  </div>;
}

function Footer({ siteContent, onEdit }: { siteContent: SiteContent; onEdit: () => void }) {
  return <footer className="masthead"><div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20"><div className="footer-grid"><div><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-[hsl(var(--accent)/.65)] text-[hsl(var(--accent))]"><BookOpen size={16} /></span><SiteText siteContent={siteContent} id="footer.brand" fallback="台灣玩耍記憶資料庫" className="serif text-lg font-bold" /></div><SiteText siteContent={siteContent} id="footer.body" fallback="讓那些曾經一起玩過的事，繼續在不同世代之間找到彼此。" className="mt-5 max-w-xs text-sm leading-loose text-white/55" as="p" /></div><div><SiteText siteContent={siteContent} id="footer.explore" fallback="EXPLORE" className="eyebrow text-[hsl(var(--accent))]" as="p" /><div className="mt-4 flex flex-col gap-3 text-sm text-white/65"><a href={`${import.meta.env.BASE_URL}#memories`} data-testid="link-footer-memories"><SiteText siteContent={siteContent} id="nav.memories" fallback="記憶索引" /></a><a href={`${import.meta.env.BASE_URL}#about`} data-testid="link-footer-about"><SiteText siteContent={siteContent} id="nav.about" fallback="關於資料庫" /></a></div></div><div><SiteText siteContent={siteContent} id="footer.contribute" fallback="CONTRIBUTE" className="eyebrow text-[hsl(var(--accent))]" as="p" /><SiteText siteContent={siteContent} id="footer.contributeBody" fallback="你也有一段想保存的童年嗎？" className="mt-4 text-sm leading-loose text-white/65" as="p" /><button onClick={onEdit} className="mt-3 text-sm font-bold text-[hsl(var(--secondary))]" data-testid="button-footer-editor"><SiteText siteContent={siteContent} id="footer.contributeCta" fallback="進入編輯入口　→" /></button></div></div><div className="mt-14 flex flex-col justify-between gap-3 border-t border-white/10 pt-5 text-xs text-white/35 sm:flex-row"><SiteText siteContent={siteContent} id="footer.copyright" fallback="一個開放給所有人的家庭記憶計畫" /><SiteText siteContent={siteContent} id="footer.copyrightMark" fallback="© 台灣玩耍記憶資料庫" /></div></div></footer>;
}

function Home() {
  const [location] = useLocation();
  const [archive, setArchive] = useState<ArchiveData>(loadArchive);
  const [detail, setDetail] = useState<Memory | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    let active = true;
    getSharedArchive().then((sharedArchive) => {
      if (!active) return;
      const normalized = normalizeArchive(sharedArchive);
      setArchive(normalized);
      localStorage.setItem('taiwan-memory-archive', JSON.stringify(normalized));
    }).catch(() => {
      // A new project has no saved archive yet; seedData/localStorage remains the local fallback.
    });
    return () => { active = false; };
  }, []);
  const saveArchive = async (data: ArchiveData) => {
    try {
      const sharedArchive = await saveSharedArchive({ editorPassword: '00000', archive: data });
      const normalized = normalizeArchive(sharedArchive);
      setArchive(normalized);
      localStorage.setItem('taiwan-memory-archive', JSON.stringify(normalized));
      setEditing(false);
    } catch {
      window.alert('共享資料保存失敗，請確認 API 服務正在運作後再試一次。');
      throw new Error('Shared archive save failed');
    }
  };
  const explore = () => document.getElementById('memories')?.scrollIntoView({ behavior: 'smooth' });
  const pageSlug = location.startsWith('/page/') ? decodeURIComponent(location.slice('/page/'.length).split('/')[0]) : '';
  const activePage = archive.siteContent.pages.find((page) => page.slug === pageSlug);
  if (pageSlug && !activePage) return <NotFound />;
  if (activePage) return <><CustomPageView page={activePage} siteContent={archive.siteContent} onEdit={() => setGateOpen(true)} />{gateOpen && <PasswordGate onClose={() => setGateOpen(false)} onUnlock={() => { setGateOpen(false); setEditing(true); }} />}{editing && <Editor archive={archive} onSave={saveArchive} onCancel={() => setEditing(false)} onLock={() => setEditing(false)} />}</>;
  return <div className="archive-shell texture"><Header siteContent={archive.siteContent} /><main><Hero introduction={archive.introduction} siteContent={archive.siteContent} onExplore={explore} /><IndexSection memories={archive.memories} siteContent={archive.siteContent} onOpen={setDetail} /><AboutSection siteContent={archive.siteContent} /></main><Footer siteContent={archive.siteContent} onEdit={() => setGateOpen(true)} />{detail && <MemoryModal memory={detail} siteContent={archive.siteContent} onClose={() => setDetail(null)} />}{gateOpen && <PasswordGate onClose={() => setGateOpen(false)} onUnlock={() => { setGateOpen(false); setEditing(true); }} />}{editing && <Editor archive={archive} onSave={saveArchive} onCancel={() => setEditing(false)} onLock={() => setEditing(false)} />}</div>;
}

function Router() {
  return <ErrorBoundary><Switch><Route path="/" component={Home} /><Route path="/page/:slug" component={Home} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;