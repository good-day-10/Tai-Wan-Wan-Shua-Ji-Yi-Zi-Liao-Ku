import { useState, type ReactNode } from 'react';
import './wonder-scouts.css';

type Story = {
  id: string; title: string; location: string; era: string; category: string;
  storyteller: string; excerpt: string; story: string; color: string; mark: string; image?: string;
};
type SiteText = { blocks: Array<{ id: string; html: string }> };
type Props = { memories: Story[]; siteContent: SiteText; authControls: ReactNode; onEdit: () => void; onOpen: (story: Story) => void };

export const wonderScoutsMemories: Story[] = [
  { id: '01', title: '新竹將軍村', location: '新竹', era: '2024.09 — 持續進行中', category: '眷村文化', storyteller: '少年導覽隊', excerpt: '少年導覽隊的起點場域，以眷村歷史文化為主題設計角色扮演、互動遊戲與 QR Code 數位導覽。', story: '累計 2,000+ 人次｜7 個 QR Code 點位', color: '#b8803e', mark: '起點', image: '/wonder-scouts/image_1.avif' },
  { id: '02', title: '台中霧峰林家宮保第', location: '台中・霧峰', era: '2025.07.19–20', category: '歷史宅邸', storyteller: '少年導覽隊', excerpt: '首次跨縣市複製導覽模組，以林家歷史人物為腳本設計沉浸式互動體驗，驗證模式可移植性。', story: '兩天 200+ 人次｜首次跨縣市複製', color: '#b85c3a', mark: '跨縣市', image: '/wonder-scouts/image_2.avif' },
  { id: '03', title: '台東縣政府參訪團', location: '台東', era: '2025.04.24', category: '機關接待', storyteller: '少年導覽隊', excerpt: '承接政府機關正式接待導覽任務，以將軍村歷史為主題，為 70 位公務員提供專業導覽服務。', story: '70+ 參與人數｜95% 好評率', color: '#497d79', mark: '接待', image: '/wonder-scouts/image_3.avif' },
  { id: '04', title: '竹塹社區大學', location: '新竹', era: '2025.06.09', category: '社區教育', storyteller: '少年導覽隊', excerpt: '為社區大學學員導覽，獲副校長高度讚揚，展現少年導覽跨年齡層的影響力。', story: '40+ 參與人數｜副校長直呼感動', color: '#6d8153', mark: '社區', image: '/wonder-scouts/image_4.avif' },
  { id: '05', title: '清交大創客市集', location: '新竹', era: '2024 & 2025 連續兩年', category: '創客論壇', storyteller: '少年導覽隊', excerpt: '受邀於頂尖大學創客論壇分享少年導覽模式，擴散青少年主導文化行動的理念。', story: '連續 2 年受邀分享｜跨校影響力擴散', color: '#987446', mark: '分享', image: '/wonder-scouts/image_5.avif' },
  { id: '06', title: '影響力市集', location: '新竹', era: '2026.01.24–25', category: '成果驗收', storyteller: '少年導覽隊', excerpt: '作為最終成果驗收場域，收集 118 份回饋問卷，94% 民眾正向認同少年導覽的價值。', story: '118 份回饋問卷｜94% 正向認同', color: '#a45b48', mark: '成果', image: '/wonder-scouts/image_6.avif' },
  { id: '07', title: '台北・台南・高雄 街頭導覽', location: '台北・台南・高雄', era: '2024–2026', category: '街頭導覽', storyteller: '少年導覽隊', excerpt: '走入城市街頭，以青少年視角詮釋在地歷史與文化脈絡，向路過民眾提供即興導覽服務。', story: '累計 1,000+ 人次｜走訪 3 個城市', color: '#58808a', mark: '城市' },
  { id: '08', title: '接待日本・美國師生', location: '新竹', era: '2024–2026', category: '國際交流', storyteller: '少年導覽隊', excerpt: '以英語、日語接待來自日本與美國的教師與學生，進行台灣在地文化導覽。', story: '英語・日語雙語導覽｜日本・美國', color: '#6b7390', mark: '交流' },
  { id: '09', title: '日本沖繩 街頭導覽', location: '日本・沖繩', era: '2026', category: '海外導覽', storyteller: '少年導覽隊', excerpt: '將台灣少年導覽模式帶到海外，在沖繩街頭以日語向當地民眾介紹台灣文化，首次海外實踐。', story: '200+ 導覽人次｜首次海外導覽', color: '#4f8170', mark: '海外' },
];

const videos = [
  ['新竹將軍村', '影響力市集成果紀錄', '025HOvHCdP4', '/wonder-scouts/image_1.avif'],
  ['台中霧峰林家宮保第', '宮保第夏日派對導覽紀錄', 'KWGm5TQCVxs', '/wonder-scouts/image_2.avif'],
  ['精選紀錄', '美國高中生來台交流', 'yUfGYheqBIs', '/wonder-scouts/image_3.avif'],
];
const feedback = [
  ['孩子們口條清晰、熱情開朗。每位同學都不僅是了解林家的歷史，還內化了以後能夠這樣呈現出來。', '霧峰林家宮保第 參觀民眾'],
  ['導覽的同學熟悉負責的導覽內容，還可以展現自我風格很厲害。有比較害羞的同學，也鼓起勇氣進行導覽，值得鼓勵！', '台東縣政府人事主任'],
  ['非常令人感動的活動，謝謝！NPC 導覽方法讓參觀的小孩更容易接觸了解歷史。', '竹塹社區大學副校長'],
  ['小朋友表現很棒！講解生動，努力互動。透過互動式，讓遊客對宮保第的故事印象加深！', '霧峰林家 參觀民眾'],
  ['我覺得讓小朋友導覽是一件很讚的事情。支持！認真且落落大方，面對陌生人不緊張，很棒！', '影響力市集 民眾回饋'],
  ['孩子很活潑，借由導覽活動讓孩子激發腦子，很棒的創意設計活動。自信大方，內容豐富，一級棒！', '影響力市集 民眾回饋'],
];
const partnershipBenefits = ['引入青少年視角，吸引年輕世代與親子客群', '獲得一套免費數位導覽影片資產（QR Code 永久展示）', '獲得一套完整的導覽活動設計內容', '活化場域人氣，提升社群媒體曝光', '無需負擔高額導覽人力成本'];
const squadBenefits = ['提供真實場域讓學生深度學習文史知識', '提供教育舞台讓學生與真實社會互動接軌', '場域方提供交通、餐點經費支持', '協助文獻資料、耆老訪談等資源媒合', '若有活動宣傳，協助露出少年導覽隊品牌'];
const serviceCards = [
  ['01', '一次性活動企劃導覽', '由少年導覽隊負責研究、設計、執行完整導覽活動，適合節慶特展、週年慶或單次推廣活動。', '內容研究・活動設計・現場執行'],
  ['02', '數位導覽影片製作與 QR Code 佈建', '由學生扮演場域角色拍攝實境導覽影片，製作 QR Code 標示佈建於現場，打造不打烊的文化體驗。', '影片製作・QR Code 佈建・永久資產'],
  ['03', '在地少年導覽見習隊養成計畫', '由場域方聯繫當地學校招募見習學生，少年導覽隊提供完整模組培訓，讓你的場域擁有自己的在地少年導覽隊。', '見習培訓・在地生根・永續傳承'],
];
const joinSteps = [
  ['01', '場域方招募見習學生', '由場域方聯繫當地學校、教育團體或社區，招募有興趣的青少年加入見習隊。'],
  ['02', '觀摩完整模組執行', '見習隊全程參與實人少年導覽隊的企劃、設計到導覽現場，從做中學。'],
  ['03', '見習隊自主企劃執行', '在少年導覽隊的培訓指導下，見習隊獨立設計並完成屬於自己場域的沉浸式導覽。'],
];
const donationPurposes = [
  '少年導覽隊計畫推動——支持孩子走進古蹟、自然場域，研究、設計並執行沉浸式導覽體驗，培育下一代文化與知識的傳承者',
  '在地少年導覽見習隊孵化——協助全台各地學校與教育單位建立自己的少年導覽隊，讓這套模式在更多地方生根',
  '軟硬體設備建置——導覽道具、數位影片製作、QR Code 佈建等場域資源',
  '師資招募與增能培訓課程——持續提升教師引導學生行動學習的專業能力',
  '公益教育營隊推動——讓更多孩子有機會參與真實場域的探索學習',
  '弱勢孩子獎助學金——確保每個孩子不因經濟因素而錯失學習機會',
  '全國性親職講座與活動舉辦——支持家長與教育者共同理解新時代的教育方式',
  '其他各項營運費用',
];
const partnershipForm = 'https://docs.google.com/forms/d/e/1FAIpQLSd3bYH1n5HX569WxzNzub4dR5kgBN8yGw9mLjVakEfFVzULEA/viewform';
const joinForm = 'https://forms.gle/2575hnCrJk556J3cA';
const donationUrl = 'https://www.surveycake.com/s/ayPAY?utm_id=97758_v0_s00_e233_tv2_tp1_a1den5ez9v5f9m';

function Copy({ content, id, fallback, className = '' }: { content: SiteText; id: string; fallback: string; className?: string }) {
  const html = content.blocks.find((block) => block.id === id)?.html ?? fallback;
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function WonderScoutsSite({ memories, siteContent, authControls, onEdit, onOpen }: Props) {
  const [tab, setTab] = useState<'venues' | 'videos' | 'feedback'>('venues');
  const [video, setVideo] = useState<string | null>(null);
  const intro = '我們是台灣的孩子、是一群中小學生；我們走進古蹟、研究歷史、探索自然科學與天文生物，用青少年的視角設計沉浸式體驗，為每一個有故事的地方注入新的生命力。';
  return <div className="wonder-site">
    <header className="ws-nav"><a className="ws-brand" href="#top"><img src={`${import.meta.env.BASE_URL}wonder-scouts/logo.png`} alt="" /><span>少年導覽隊</span></a><nav><a href="#about">關於我們</a><a href="#results">導覽成果</a><a href="#partner">場域合作</a><a href="#join">加入我們</a><a href="#donate">支持我們</a></nav><div className="ws-auth">{authControls}</div></header>
    <section className="ws-hero" id="top"><div className="ws-glow" /><div className="ws-hero-grid"><div><p className="ws-eyebrow">台灣</p><h1><Copy content={siteContent} id="ws.hero.title" fallback="少年導覽隊" /></h1><p className="ws-lead"><Copy content={siteContent} id="ws.hero.body" fallback={intro} /></p><div className="ws-awards"><span>🏆　金車文教基金會 第15屆<br />　　 文化理解組 全國首獎</span><span>🎖️　2026 IASE 影響力創新獎<br />　　 教學創新與實踐組 楷模獎</span></div><div className="ws-actions"><a className="ws-button" href="#partner">場域合作提案　→</a><a className="ws-button ws-button-ghost" href="#results">看看我們做了什麼</a><a className="ws-donate-link" href="#donate">♥ 捐款支持</a></div></div><div className="ws-hero-photos"><img className="ws-hero-main" src={`${import.meta.env.BASE_URL}wonder-scouts/hero.avif`} alt="少年導覽隊在導覽場域" /><img src={`${import.meta.env.BASE_URL}wonder-scouts/award-1.jpg`} alt="少年導覽隊獲獎紀錄" /><img src={`${import.meta.env.BASE_URL}wonder-scouts/award-2.jpg`} alt="少年導覽隊影響力創新獎" /><p>金車文教基金會第15屆・文化理解組全國首獎　｜　2026 IASE 影響力創新獎</p></div></div><a className="ws-scroll" href="#about">SCROLL　↓</a></section>
    <section className="ws-section ws-about" id="about"><div className="ws-wrap"><p className="ws-kicker">關於少年導覽隊</p><h2>我們從腳下這塊土地出發</h2><div className="ws-about-grid"><div><p className="ws-quote">2024年9月，我們在新竹將軍村學習，卻對這塊土地的故事一無所知。那份「近在眼前卻陌生的疏離感」，成了少年導覽隊的起點。</p><img className="ws-about-img" src={`${import.meta.env.BASE_URL}wonder-scouts/image_4.avif`} alt="少年導覽隊共同進行導覽" /></div><div className="ws-points">{[['從「聽歷史」到「走進歷史」','以「感官體驗」為主軸，設計「角色扮演」、「情境佈置」與「互動體驗」活動，讓參與者透過行動與感官實地探索、觸碰歷史的溫度，藉此縮短時空距離，讓歷史從知識轉化為觸動全身的感受。'],['從「旁觀敘述」到「時空轉譯」','少年主動研究歷史、理解背景、整理觀點，專業志工成為學習資源之一。透過導覽角色轉換，文化傳承成為一道跨世代的共創風景。'],['從「單點行動」到「數位聯網」','將真實的青少年導覽員結合虛擬的數位平台，拍攝實境導覽影片、佈置現場 QR Code，將青少年的導覽與創意轉化為不限時空的數位資產。']].map(([title, body], i) => <article className="ws-point" key={title}><span>0{i + 1}</span><div><h3><Copy content={siteContent} id={`ws.about.${i}.title`} fallback={title} /></h3><p><Copy content={siteContent} id={`ws.about.${i}.body`} fallback={body} /></p></div></article>)}</div></div><div className="ws-steps">{[['01','研究','訪談耆老與文史專家、查閱文獻資料、實地觀察記錄，建立導覽所需的知識厚度。'],['02','設計','把歷史知識轉化為遊戲、角色扮演腳本與互動任務，讓參觀者「主動學」而非「被動聽」。'],['03','行動','實際站上場域，面對各年齡層的參觀者，在一次次導覽中調整、優化、成長。'],['04','數位永續','拍攝實境導覽影片，結合 QR Code 佈建於場域，打造不受時間限制的文化資產。']].map(([num,title,body])=><article key={num}><b>{num}</b><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>
    <section className="ws-section ws-results" id="results"><div className="ws-wrap"><p className="ws-kicker">導覽成果與影片</p><h2><Copy content={siteContent} id="ws.results.title" fallback="從將軍村到霧峰，我們走過的每一步" /></h2><p className="ws-section-lead"><Copy content={siteContent} id="ws.results.body" fallback="從一次市集擺攤開始，到接待縣政府、社區大學，再到跨縣市複製模組。每一場導覽都是一次真實的學習。" /></p><div className="ws-tabs"><button className={tab==='venues'?'active':''} onClick={()=>setTab('venues')}>導覽場域</button><button className={tab==='videos'?'active':''} onClick={()=>setTab('videos')}>精選影片</button><button className={tab==='feedback'?'active':''} onClick={()=>setTab('feedback')}>民眾回饋</button></div>{tab==='venues'&&<div className="ws-venue-grid">{memories.map((item)=><article className="ws-venue" key={item.id} onClick={()=>onOpen(item)} role="button" tabIndex={0} onKeyDown={(event)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onOpen(item);}}}><div className="ws-venue-img">{item.image&&<img src={item.image.startsWith('/')?`${import.meta.env.BASE_URL}${item.image.slice(1)}`:item.image} alt="" />}<span>{item.category}</span></div><div className="ws-venue-body"><p className="ws-date">{item.era}</p><h3>{item.title}</h3><p>{item.excerpt}</p><small>{item.story}</small></div></article>)}</div>}{tab==='videos'&&<div className="ws-video-grid">{videos.map(([place,title,id,image])=><button className="ws-video" key={id} onClick={()=>setVideo(id)}><img src={`${import.meta.env.BASE_URL}${image.slice(1)}`} alt="" /><b>{place}</b><span>{title}　▶</span></button>)}</div>}{tab==='feedback'&&<div className="ws-feedback-grid">{feedback.map(([quote,by])=><blockquote key={by+quote}>「{quote}」<cite>— {by}</cite></blockquote>)}</div>}</div></section>
    <section className="ws-section ws-partner" id="partner"><div className="ws-wrap"><p className="ws-kicker">場域合作提案</p><h2><Copy content={siteContent} id="ws.partner.title" fallback="讓你的場域也有少年導覽隊" /></h2><p className="ws-section-lead"><Copy content={siteContent} id="ws.partner.body" fallback="我們提供從研究、設計到數位永續的完整服務，一起讓更多人感受到歷史的溫度。" /></p><div className="ws-benefits"><div><h3>✦ 合作對場域（你們）的價值</h3><ul>{partnershipBenefits.map(x=><li key={x}>{x}</li>)}</ul></div><div><h3>✦ 合作對少年導覽隊的價值</h3><ul>{squadBenefits.map(x=><li key={x}>{x}</li>)}</ul></div></div><div className="ws-services">{serviceCards.map(([num,title,body,tags])=><article key={num}><b>{num}</b><h3>{title}</h3><p>{body}</p><small>{tags}</small></article>)}</div><div className="ws-cta"><div><h3>填寫合作提案表單</h3><p>填寫後 7 個工作天內主動與您聯繫，安排初步說明會。</p></div><a className="ws-button" href={partnershipForm} target="_blank" rel="noreferrer">📋 填寫合作表單 ↗</a><a className="ws-button ws-button-ghost" href="https://reurl.cc/laEAeY" target="_blank" rel="noreferrer">📺 觀看成果影片</a></div></div></section>
    <section className="ws-section ws-join" id="join"><div className="ws-wrap ws-join-grid"><div><p className="ws-kicker">加入我們／見習隊</p><h2><Copy content={siteContent} id="ws.join.title" fallback="你的場域，可以是下一個起點" /></h2><p className="ws-section-lead"><Copy content={siteContent} id="ws.join.body" fallback="少年導覽隊的模式已經驗證可以複製。如果你也相信年輕人有能力說好歷史的故事，我們邀請你一起來。" /></p><div className="ws-join-steps">{joinSteps.map(([num,title,body])=><article key={num}><b>{num}</b><div><h3>{title}</h3><p>{body}</p></div></article>)}</div></div><aside><img src={`${import.meta.env.BASE_URL}wonder-scouts/image_5.avif`} alt="少年導覽隊見習學習" /><h3>在地少年導覽見習隊</h3><p>少年導覽隊目前為非營利性質，合作以文化共創、資源互惠為原則。我們已整理全台 22 個古蹟文化單位，預計 2026 年陸續聯繫推廣。歡迎各規模場域主動洽詢。</p><a className="ws-button" href={joinForm} target="_blank" rel="noreferrer">立即填寫表單 →</a><small>填表不代表正式承諾；收到後將主動與您聯繫，一起討論最適合的合作方式。填表約 3 分鐘。</small></aside></div></section>
    <section className="ws-donate" id="donate"><div className="ws-wrap"><p className="ws-kicker">支持我們</p><h2><Copy content={siteContent} id="ws.donate.title" fallback="讓每一個有故事的地方，<br />都有少年導覽隊。" /></h2><p>社團法人新竹縣實人教育協會</p><p>感謝您願意成為我們教育路上最堅強的力量，讓最動人的教育陪伴更多孩子成長。您的捐款將用於：</p><ul className="ws-donation-list">{donationPurposes.map((purpose)=><li key={purpose}>{purpose}</li>)}</ul><a className="ws-button" href={donationUrl} target="_blank" rel="noreferrer">立即捐款 →</a></div></section>
    <footer className="ws-footer"><div className="ws-wrap ws-footer-inner"><div><img src={`${import.meta.env.BASE_URL}wonder-scouts/logo.png`} alt="" /><h3>少年導覽隊</h3><p>實人實驗教育<br />古蹟時光機・沉浸式體驗計畫</p></div><div><b>網站導覽</b><a href="#about">關於少年導覽隊</a><a href="#results">導覽成果與影片</a><a href="#partner">場域合作提案</a><a href="#join">加入我們／見習隊</a></div><div><b>資源連結</b><a href="https://reurl.cc/laEAeY" target="_blank" rel="noreferrer">成果紀錄影片</a><a href="https://reurl.cc/Ebqe6A" target="_blank" rel="noreferrer">將軍村數位導覽</a><a href={partnershipForm} target="_blank" rel="noreferrer">場域合作表單</a><a href={joinForm} target="_blank" rel="noreferrer">教育單位合作表單</a><a href={donationUrl} target="_blank" rel="noreferrer">支持少年導覽隊</a></div></div><div className="ws-wrap ws-bottom"><span>© 2026 實人實驗教育 少年導覽隊・非營利文化共創計畫。合作洽詢請填寫表單，我們將於 7 個工作天內回覆。</span><button onClick={onEdit}>編輯本站</button></div></footer>
    {video&&<div className="ws-video-modal" role="dialog" aria-modal="true" onClick={()=>setVideo(null)}><button aria-label="關閉影片" onClick={()=>setVideo(null)}>×</button><iframe src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1`} title="少年導覽隊影片" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>}
  </div>;
}
