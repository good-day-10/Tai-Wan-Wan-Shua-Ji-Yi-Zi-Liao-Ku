import { useEffect, useMemo, useState } from 'react';

type Memory = {
  id: string;
  title: string;
  location: string;
  era: string;
  category: string;
  storyteller: string;
  excerpt: string;
  color: string;
  img: string;
};

const memoryCards: Memory[] = [
  {
    id: '01',
    title: '鐵皮屋頂下的紙上遊戲',
    location: '臺南・新化',
    era: '1970 年代',
    category: '童玩',
    storyteller: '陳阿姨，1958 年生',
    excerpt: '下雨天不准外出，我們就在鐵皮屋頂上用紙張、石子和想像力畫出一座小小王國。',
    color: '#B84A39',
    img: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '02',
    title: '圍牆邊的彈珠王國',
    location: '彰化・鹿港',
    era: '1980 年代',
    category: '巷弄遊戲',
    storyteller: '林志明，1972 年生',
    excerpt: '那面牆不是界線，而是遊戲的舞台；你一聲「彈珠！」，整條巷子都熱起來了。',
    color: '#4A7C59',
    img: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '03',
    title: '阿公的竹蜻蜓',
    location: '花蓮・壽豐',
    era: '1990 年代',
    category: '家族手作',
    storyteller: '黃小芳，1985 年生',
    excerpt: '阿公把竹片和紙張剪成翅膀，教我們在午後的風裡學會如何看見一雙微小的翅膀。',
    color: '#F0A830',
    img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '04',
    title: '四點半的紅白機',
    location: '臺北・萬華',
    era: '1990 年代',
    category: '電玩時光',
    storyteller: '周柏翰，1981 年生',
    excerpt: '四點半之後，巷子安靜下來，只有控制器和我們的笑聲在房間裡面打轉。',
    color: '#B84A39',
    img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '05',
    title: '廟埕的影子追逐戰',
    location: '高雄・旗山',
    era: '1960 年代',
    category: '集體遊戲',
    storyteller: '王金蘭，1951 年生',
    excerpt: '夕陽把每個人都變成了追逐的影子，跑得快的人總是最先笑出來。',
    color: '#4A7C59',
    img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '06',
    title: '河堤邊的橡皮筋',
    location: '宜蘭・羅東',
    era: '1980 年代',
    category: '童謠遊戲',
    storyteller: '吳秀真，1969 年生',
    excerpt: '我們一起唱，一起跳，彈力繩像一條把所有笑聲綁在一起的線。',
    color: '#F0A830',
    img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
  },
];

const responseCards = [
  {
    name: '李阿姨',
    email: 'li@memory.tw',
    message: '我最懷念的是巷口那一群人一起玩骰子和輪盤，真的很溫暖。',
    time: '2026-09-20',
  },
  {
    name: '王先生',
    email: 'wang@memory.tw',
    message: '這個資料庫讓我想起小時候和兄弟姊妹一起在公園裡跑來跑去。',
    time: '2026-09-18',
  },
  {
    name: '曾小妹',
    email: 'tseng@memory.tw',
    message: '我也想把阿公教我的竹蜻蜓故事保存起來。',
    time: '2026-09-11',
  },
];

export default function App() {
  const [fontScale, setFontScale] = useState(1);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--site-scale', `${fontScale}`);
  }, [fontScale]);

  const stats = useMemo(
    () => [
      { label: '記憶收藏', value: '326+' },
      { label: '故事分享', value: '84 篇' },
      { label: '世代連結', value: '12 組' },
    ],
    [],
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand-wrap">
            <div className="brand-mark">童</div>
            <div>
              <p className="eyebrow">Taiwan Play Memories</p>
              <h1 className="brand-name">台灣玩耍記憶資料庫</h1>
            </div>
          </div>

          <nav className="main-nav" aria-label="主導覽">
            <a href="#memory-index">記憶索引</a>
            <a href="#about">關於資料庫</a>
            <a href="#responses">回饋牆</a>
            <a href="#contact">聯絡我們</a>
          </nav>

          <div className="tool-group">
            <div className="font-tools" aria-label="字級調整">
              <button type="button" onClick={() => setFontScale((value) => Math.max(0.9, Number((value - 0.1).toFixed(2))))} aria-label="縮小字級">
                A-
              </button>
              <button type="button" onClick={() => setFontScale((value) => Math.min(1.25, Number((value + 0.1).toFixed(2))))} aria-label="放大字級">
                A+
              </button>
            </div>
            <button type="button" className="login-btn" onClick={() => setLoginOpen(true)}>
              登入
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-bg" aria-hidden="true" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="section-kicker">一座正在長大的集體記憶</p>
              <h2 className="hero-title">
                玩過的，
                <span>就不會消失。</span>
              </h2>
              <p className="hero-text">
                我們在巷口、廟埕、斜坡、校園裡留下過笑聲與腳步，這裡就是把那些生活裡最小的幸福，一筆一筆保存起來的地方。
              </p>

              <div className="hero-actions">
                <button type="button" className="primary-btn" onClick={() => document.getElementById('memory-index')?.scrollIntoView({ behavior: 'smooth' })}>
                  走進記憶索引
                </button>
                <button type="button" className="ghost-btn" onClick={() => setLoginOpen(true)}>
                  管理入口
                </button>
              </div>

              <div className="stats-row" aria-label="網站統計">
                {stats.map((item) => (
                  <div key={item.label} className="stat-box">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-card-wrap">
              <div className="memory-note">
                <div className="note-head">
                  <span>ARCHIVE NOTE</span>
                  <span className="status-pill">保存中</span>
                </div>
                <p className="quote-mark">「</p>
                <p className="quote-body">
                  那時候沒有手機，
                  <br />
                  但我們每天都約得到。
                </p>
                <div className="note-meta">
                  <span>彰化・鹿港</span>
                  <span>1980 年代</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="memory-index" className="content-section">
          <div className="container section-top">
            <div>
              <p className="section-kicker alt">MEMORY INDEX / 記憶索引</p>
              <h3 className="section-title">一人說起，大家想起。</h3>
            </div>
            <p className="lead-copy">
              每一筆記憶都由一位說故事的人開始，用地點、年代或一個你熟悉的詞，翻開屬於你那一段童年。
            </p>
          </div>

          <div className="container filter-row">
            <div className="search-box">搜尋地點、人物或記憶…</div>
            <div className="chip-group" aria-label="分類切換">
              {['全部', '童玩', '巷弄遊戲', '家族手作', '電玩時光', '集體遊戲', '童謠遊戲'].map((kit) => (
                <button key={kit} type="button" className="chip" aria-label={kit}>
                  {kit}
                </button>
              ))}
            </div>
          </div>

          <div className="container memory-grid">
            {memoryCards.map((memory) => (
              <article key={memory.id} className="memory-card" style={{ ['--card-accent' as string]: memory.color }}>
                <div className="memory-image" style={{ backgroundImage: `url(${memory.img})`, backgroundColor: memory.color }}>
                  <div className="image-badge">{memory.category}</div>
                  <div className="card-stamp">NO.{memory.id}</div>
                </div>

                <div className="memory-body">
                  <div className="meta-row">
                    <span>{memory.era}</span>
                    <span className="tag-pill">{memory.category}</span>
                  </div>

                  <h4>{memory.title}</h4>
                  <p className="memory-location">📍 {memory.location}</p>
                  <p className="memory-excerpt">{memory.excerpt}</p>
                  <div className="story-row">
                    <span>{memory.storyteller}</span>
                    <button type="button" className="mini-btn">
                      閱讀故事
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="about-section">
          <div className="container about-grid">
            <div className="about-copy">
              <p className="section-kicker alt">WHY WE KEEP / 為什麼保存</p>
              <h3 className="section-title">把「以前」交給以後。</h3>
            </div>

            <div className="about-panels">
              <div className="panel card-spotlight">
                <div className="spotlight-icon">∎</div>
                <p>每個人都是收藏家。</p>
              </div>

              <div className="panel mini-panel">
                <p className="mini-year">1960 →</p>
                <span>跨越不同年代，持續收錄中</span>
              </div>

              <div className="panel text-panel">
                <p>
                  一個孩子記得的遊戲，常常也是一個家庭、一條街、甚至一整個時代的共同記憶。
                  我們希望把那些不一定寫進教科書的日常，留成下一代可以回看的生活地圖。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="responses" className="responses-section">
          <div className="container">
            <p className="section-kicker alt">Responses / 回饋</p>
            <h3 className="section-title">最新回應</h3>
          </div>

          <div className="container response-grid">
            {responseCards.map((item, index) => (
              <article key={`${item.name}-${index}`} className="response-card">
                <div className="response-head">
                  <strong>{item.name}</strong>
                  <span>{item.time}</span>
                </div>
                <p className="response-email">{item.email}</p>
                <p className="response-message">{item.message}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="cta-section">
          <div className="container contact-box">
            <div>
              <p className="section-kicker alt">聯絡我們</p>
              <h3 className="section-title">有一段想保存的童年故事嗎？</h3>
            </div>
            <button type="button" className="primary-btn" onClick={() => setLoginOpen(true)}>
              進入管理入口
            </button>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <div className="brand-wrap footer-brand">
              <div className="brand-mark">童</div>
              <div>
                <p className="eyebrow">Taiwan Play Memories</p>
                <h4>台��玩耍記憶資料庫</h4>
              </div>
            </div>
            <p className="footer-copy">讓那些曾經一起玩過的事，在不同世代之間找到彼此。</p>
          </div>

          <div>
            <p className="footer-title">EXPLORE</p>
            <ul>
              <li>首頁</li>
              <li>記憶索引</li>
              <li>關於資料庫</li>
            </ul>
          </div>

          <div>
            <p className="footer-title">CONTRIBUTE</p>
            <p className="footer-copy small">你也有一段想保存的童年嗎？</p>
            <button type="button" className="footer-btn" onClick={() => setLoginOpen(true)}>
              進入編輯入口 →
            </button>
          </div>
        </div>
      </footer>

      {loginOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-head">
              <div>
                <p className="section-kicker alt dark">LOGIN / 登入</p>
                <h4>管理入口</h4>
              </div>
              <button type="button" className="close-btn" onClick={() => setLoginOpen(false)}>
                關閉
              </button>
            </div>

            <label className="field-label">
              帳號
              <input type="text" placeholder="請輸入帳號" defaultValue="admin" />
            </label>

            <label className="field-label">
              密碼
              <input type="password" placeholder="請輸入密碼" defaultValue="00000" />
            </label>

            <button
              type="button"
              className="primary-btn full"
              onClick={() => {
                setLoginOpen(false);
                window.alert('登入模式已啟用（示範版本）');
              }}
            >
              登入
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
