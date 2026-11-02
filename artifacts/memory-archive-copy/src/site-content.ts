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

export type SiteContent = { blocks: SiteTextBlock[]; wonderScouts: WonderScoutsContent };

export type SiteTextBlockInput = Omit<SiteTextBlock, 'align'> & { align: string };

export type WonderScoutsVideo = { place: string; title: string; youtubeId: string; image: string };
export type WonderScoutsFeedback = { quote: string; by: string };
export type WonderScoutsService = { number: string; title: string; body: string; tags: string };
export type WonderScoutsJoinStep = { number: string; title: string; body: string };
export type WonderScoutsDonation = { organization: string; intro: string; url: string; purposes: string[] };
export type WonderScoutsLinks = { partnershipForm: string; joinForm: string; resultsVideo: string; digitalTour: string };
export type WonderScoutsContent = {
  videos: WonderScoutsVideo[];
  feedback: WonderScoutsFeedback[];
  partnershipBenefits: string[];
  squadBenefits: string[];
  services: WonderScoutsService[];
  joinSteps: WonderScoutsJoinStep[];
  donation: WonderScoutsDonation;
  links: WonderScoutsLinks;
};
export type WonderScoutsContentInput = Partial<Omit<WonderScoutsContent, 'donation' | 'links'>> & {
  donation?: Partial<WonderScoutsDonation>;
  links?: Partial<WonderScoutsLinks>;
};
export type SiteContentInput = { blocks?: SiteTextBlockInput[]; wonderScouts?: WonderScoutsContentInput };

export const defaultWonderScoutsContent: WonderScoutsContent = {
  videos: [
    { place: '新竹將軍村', title: '影響力市集成果紀錄', youtubeId: '025HOvHCdP4', image: '/wonder-scouts/image_1.avif' },
    { place: '台中霧峰林家宮保第', title: '宮保第夏日派對導覽紀錄', youtubeId: 'KWGm5TQCVxs', image: '/wonder-scouts/image_2.avif' },
    { place: '精選紀錄', title: '美國高中生來台交流', youtubeId: 'yUfGYheqBIs', image: '/wonder-scouts/image_3.avif' },
  ],
  feedback: [
    { quote: '孩子們口條清晰、熱情開朗。每位同學都不僅是了解林家的歷史，還內化了以後能夠這樣呈現出來。', by: '霧峰林家宮保第 參觀民眾' },
    { quote: '導覽的同學熟悉負責的導覽內容，還可以展現自我風格很厲害。有比較害羞的同學，也鼓起勇氣進行導覽，值得鼓勵！', by: '台東縣政府人事主任' },
    { quote: '非常令人感動的活動，謝謝！NPC 導覽方法讓參觀的小孩更容易接觸了解歷史。', by: '竹塹社區大學副校長' },
    { quote: '小朋友表現很棒！講解生動，努力互動。透過互動式，讓遊客對宮保第的故事印象加深！', by: '霧峰林家 參觀民眾' },
    { quote: '我覺得讓小朋友導覽是一件很讚的事情。支持！認真且落落大方，面對陌生人不緊張，很棒！', by: '影響力市集 民眾回饋' },
    { quote: '孩子很活潑，借由導覽活動讓孩子激發腦子，很棒的創意設計活動。自信大方，內容豐富，一級棒！', by: '影響力市集 民眾回饋' },
  ],
  partnershipBenefits: [
    '引入青少年視角，吸引年輕世代與親子客群',
    '獲得一套免費數位導覽影片資產（QR Code 永久展示）',
    '獲得一套完整的導覽活動設計內容',
    '活化場域人氣，提升社群媒體曝光',
    '無需負擔高額導覽人力成本',
  ],
  squadBenefits: [
    '提供真實場域讓學生深度學習文史知識',
    '提供教育舞台讓學生與真實社會互動接軌',
    '場域方提供交通、餐點經費支持',
    '協助文獻資料、耆老訪談等資源媒合',
    '若有活動宣傳，協助露出少年導覽隊品牌',
  ],
  services: [
    { number: '01', title: '一次性活動企劃導覽', body: '由少年導覽隊負責研究、設計、執行完整導覽活動，適合節慶特展、週年慶或單次推廣活動。', tags: '內容研究・活動設計・現場執行' },
    { number: '02', title: '數位導覽影片製作與 QR Code 佈建', body: '由學生扮演場域角色拍攝實境導覽影片，製作 QR Code 標示佈建於現場，打造不打烊的文化體驗。', tags: '影片製作・QR Code 佈建・永久資產' },
    { number: '03', title: '在地少年導覽見習隊養成計畫', body: '由場域方聯繫當地學校招募見習學生，少年導覽隊提供完整模組培訓，讓你的場域擁有自己的在地少年導覽隊。', tags: '見習培訓・在地生根・永續傳承' },
  ],
  joinSteps: [
    { number: '01', title: '場域方招募見習學生', body: '由場域方聯繫當地學校、教育團體或社區，招募有興趣的青少年加入見習隊。' },
    { number: '02', title: '觀摩完整模組執行', body: '見習隊全程參與實人少年導覽隊的企劃、設計到導覽現場，從做中學。' },
    { number: '03', title: '見習隊自主企劃執行', body: '在少年導覽隊的培訓指導下，見習隊獨立設計並完成屬於自己場域的沉浸式導覽。' },
  ],
  donation: {
    organization: '社團法人新竹縣實人教育協會',
    intro: '感謝您願意成為我們教育路上最堅強的力量，讓最動人的教育陪伴更多孩子成長。您的捐款將用於：',
    purposes: [
      '少年導覽隊計畫推動——支持孩子走進古蹟、自然場域，研究、設計並執行沉浸式導覽體驗，培育下一代文化與知識的傳承者',
      '在地少年導覽見習隊孵化——協助全台各地學校與教育單位建立自己的少年導覽隊，讓這套模式在更多地方生根',
      '軟硬體設備建置——導覽道具、數位影片製作、QR Code 佈建等場域資源',
      '師資招募與增能培訓課程——持續提升教師引導學生行動學習的專業能力',
      '公益教育營隊推動——讓更多孩子有機會參與真實場域的探索學習',
      '弱勢孩子獎助學金——確保每個孩子不因經濟因素而錯失學習機會',
      '全國性親職講座與活動舉辦——支持家長與教育者共同理解新時代的教育方式',
      '其他各項營運費用',
    ],
    url: 'https://www.surveycake.com/s/ayPAY?utm_id=97758_v0_s00_e233_tv2_tp1_a1den5ez9v5f9m',
  },
  links: {
    partnershipForm: 'https://docs.google.com/forms/d/e/1FAIpQLSd3bYH1n5HX569WxzNzub4dR5kgBN8yGw9mLjVakEfFVzULEA/viewform',
    joinForm: 'https://forms.gle/2575hnCrJk556J3cA',
    resultsVideo: 'https://reurl.cc/laEAeY',
    digitalTour: 'https://reurl.cc/Ebqe6A',
  },
};

export const defaultSiteBlocks: SiteTextBlock[] = [
  { id: 'header.eyebrow', label: '頁首英文標誌', section: '頁首', html: 'TEEN GUIDE SQUAD', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'header.title', label: '頁首網站名稱', section: '頁首', html: '少年導覽隊', x: 0, y: 0, width: 100, align: 'left' },
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
  { id: 'footer.brand', label: '頁尾網站名稱', section: '頁尾', html: '少年導覽隊', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'footer.body', label: '頁尾說明', section: '頁尾', html: '讓那些曾經一起玩過的事，繼續在不同世代之間找到彼此。', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'footer.explore', label: '頁尾導覽標題', section: '頁尾', html: 'EXPLORE', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'footer.contribute', label: '頁尾投稿標題', section: '頁尾', html: 'CONTRIBUTE', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'footer.contributeBody', label: '頁尾投稿說明', section: '頁尾', html: '你也有一段想保存的童年嗎？', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'footer.contributeCta', label: '頁尾編輯連結', section: '頁尾', html: '進入編輯入口　→', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'footer.copyright', label: '頁尾版權文字', section: '頁尾', html: '一個開放給所有人的家庭記憶計畫', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'footer.copyrightMark', label: '頁尾版權標記', section: '頁尾', html: '© 少年導覽隊', x: 0, y: 0, width: 100, align: 'right' },
  { id: 'ws.migration', label: '搬遷版本標記', section: '網站設定', html: 'wonder-scouts-2026-10', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'ws.hero.title', label: '首頁主標題', section: '主視覺', html: '少年導覽隊', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'ws.hero.body', label: '首頁介紹', section: '主視覺', html: '我們是台灣的孩子、是一群中小學生；我們走進古蹟、研究歷史、探索自然科學與天文生物，用青少年的視角設計沉浸式體驗，為每一個有故事的地方注入新的生命力。', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'ws.about.0.title', label: '從聽歷史到走進歷史：標題', section: '關於我們', html: '從「聽歷史」到「走進歷史」', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'ws.about.0.body', label: '從聽歷史到走進歷史：介紹', section: '關於我們', html: '以感官體驗為主軸，設計角色扮演、情境佈置與互動體驗，讓參與者透過行動探索、觸碰歷史的溫度。', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'ws.about.1.title', label: '從旁觀敘述到時空轉譯：標題', section: '關於我們', html: '從「旁觀敘述」到「時空轉譯」', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'ws.about.1.body', label: '從旁觀敘述到時空轉譯：介紹', section: '關於我們', html: '少年主動研究歷史、理解背景、整理觀點，透過導覽角色轉換，讓文化傳承成為跨世代共創。', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'ws.about.2.title', label: '從單點行動到數位聯網：標題', section: '關於我們', html: '從「單點行動」到「數位聯網」', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'ws.about.2.body', label: '從單點行動到數位聯網：介紹', section: '關於我們', html: '拍攝實境導覽影片、佈置現場 QR Code，將青少年的導覽與創意轉化為不限時空的數位資產。', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'ws.results.title', label: '成果區標題', section: '導覽成果', html: '從將軍村到霧峰，我們走過的每一步', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'ws.results.body', label: '成果區介紹', section: '導覽成果', html: '從一次市集擺攤開始，到接待縣政府、社區大學，再到跨縣市複製模組。每一場導覽都是一次真實的學習。', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'ws.partner.title', label: '合作區標題', section: '場域合作', html: '讓你的場域也有少年導覽隊', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'ws.partner.body', label: '合作區介紹', section: '場域合作', html: '我們提供從研究、設計到數位永續的完整服務，一起讓更多人感受到歷史的溫度。', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'ws.join.title', label: '見習隊標題', section: '加入我們', html: '你的場域，可以是下一個起點', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'ws.join.body', label: '見習隊介紹', section: '加入我們', html: '少年導覽隊的模式已經驗證可以複製。如果你也相信年輕人有能力說好歷史的故事，我們邀請你一起來。', x: 0, y: 0, width: 100, align: 'left' },
  { id: 'ws.donate.title', label: '支持我們標題', section: '支持我們', html: '讓每一個有故事的地方，都有少年導覽隊。', x: 0, y: 0, width: 100, align: 'left' },
];

export function createDefaultSiteContent(): SiteContent {
  return {
    blocks: defaultSiteBlocks.map((block) => ({ ...block })),
    wonderScouts: structuredClone(defaultWonderScoutsContent),
  };
}

export function normalizeWonderScoutsContent(input?: WonderScoutsContentInput): WonderScoutsContent {
  const defaults = defaultWonderScoutsContent;
  return {
    videos: input?.videos === undefined ? structuredClone(defaults.videos) : input.videos.map((item) => ({ ...item })),
    feedback: input?.feedback === undefined ? structuredClone(defaults.feedback) : input.feedback.map((item) => ({ ...item })),
    partnershipBenefits: input?.partnershipBenefits === undefined ? [...defaults.partnershipBenefits] : [...input.partnershipBenefits],
    squadBenefits: input?.squadBenefits === undefined ? [...defaults.squadBenefits] : [...input.squadBenefits],
    services: input?.services === undefined ? structuredClone(defaults.services) : input.services.map((item) => ({ ...item })),
    joinSteps: input?.joinSteps === undefined ? structuredClone(defaults.joinSteps) : input.joinSteps.map((item) => ({ ...item })),
    donation: { ...defaults.donation, ...input?.donation, purposes: input?.donation?.purposes === undefined ? [...defaults.donation.purposes] : [...input.donation.purposes] },
    links: { ...defaults.links, ...input?.links },
  };
}

export function normalizeSiteContent(siteContent?: SiteContentInput): SiteContent {
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
  return { blocks, wonderScouts: normalizeWonderScoutsContent(siteContent?.wonderScouts) };
}