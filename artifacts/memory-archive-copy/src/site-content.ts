export type SiteTextBlock = {
  id: string;
  label: string;
  section: string;
  html: string;
  x: number;
  y: number;
  width: number;
  align: 'left' | 'center' | 'right';
};

export type SiteContent = { blocks: SiteTextBlock[] };

export type SiteTextBlockInput = Omit<SiteTextBlock, 'align'> & { align: string };

export const defaultSiteBlocks: SiteTextBlock[] = [
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

export function createDefaultSiteContent(): SiteContent {
  return { blocks: defaultSiteBlocks.map((block) => ({ ...block })) };
}

export function normalizeSiteContent(siteContent?: { blocks?: SiteTextBlockInput[] }): SiteContent {
  const incoming = (siteContent?.blocks ?? []).map((block) => ({
    ...block,
    align: block.align === 'center' || block.align === 'right' ? block.align : 'left',
  })) as SiteTextBlock[];
  const byId = new Map(incoming.map((block) => [block.id, block]));
  const defaults = createDefaultSiteContent().blocks;
  const blocks = defaults.map((block) => ({ ...block, ...byId.get(block.id) }));
  incoming
    .filter((block) => !defaults.some((defaultBlock) => defaultBlock.id === block.id))
    .forEach((block) => blocks.push(block));
  return { blocks };
}