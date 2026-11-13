// QA 자동 실행 (docs/qa/QA_CHECKLIST.md T-01~T-12). `npm run qa`
// 브라우저 시계를 Playwright clock으로 바꿔 시각이 필요한 항목을 재현한다.
const { chromium } = require('playwright');
const { execSync, spawn } = require('node:child_process');
const fs = require('node:fs');

const PORT = 4180, URL = `http://localhost:${PORT}`, OUT = 'qa-out';
const results = [];
const check = (id, ok, note = '') => { results.push({ id, ok: !!ok, note }); };
const at = (h, m = 0, s = 0) => new Date(2026, 10, 13, h, m, s);

async function open(browser, { time, settings = { start: '09:00', end: '18:00' }, collected = [], lastReward = null }) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, acceptDownloads: true });
  await ctx.clock.install({ time });
  await ctx.addInitScript((d) => {
    if (!localStorage.getItem('qa:init')) {
      localStorage.setItem('qa:init', '1');
      for (const [k, v] of Object.entries(d)) localStorage.setItem(k, JSON.stringify(v));
    }
    window.alert = () => {};
    navigator.canShare = undefined; // 다운로드 경로로 고정
    let hidden = false; // T-06: 화면 가림 흉내
    Object.defineProperty(document, 'hidden', { get: () => hidden });
    window.__setHidden = (v) => { hidden = v; document.dispatchEvent(new Event('visibilitychange')); };
  }, { 'bleep:settings': settings, 'bleep:collected': collected, 'bleep:lastReward': lastReward });
  const p = await ctx.newPage();
  await p.goto(URL);
  await p.waitForTimeout(300);
  return p;
}
const label = (p) => p.locator('section p').nth(0).textContent();
const clock = (p) => p.locator('section p').nth(1).textContent();
// 시계는 설치 뒤에도 실제로 흐르므로 기대값에서 2초까지 허용
const near = (hms, want) => { const sec = (t) => t.split(':').reduce((a, n) => a * 60 + +n, 0); const d = sec(want) - sec(hms); return d >= 0 && d <= 2; };
const burstShown = (p) => p.locator('[data-burst]').count();
// 펑 연출이 떠 있으면 탭해서 건너뛴 뒤 보상 창 확인 (연출 자체는 T-21)
const rewardShown = async (p) => { if (await burstShown(p)) { await p.locator('[data-burst]').click(); await p.waitForTimeout(100); } return p.getByText('오늘도 퇴근 성공').count(); };
const noHScroll = (p) => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  // T-12 (먼저: 빌드 결과로 나머지를 돌린다)
  let t12 = true, note12 = '';
  try {
    execSync('npm test', { stdio: 'pipe' });
    const build = execSync('npm run build 2>&1').toString();
    if (/warn/i.test(build)) { t12 = false; note12 = '빌드 경고'; }
  } catch (e) { t12 = false; note12 = '테스트 또는 빌드 실패'; }
  check('T-12', t12, note12);

  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 1500));
  const browser = await chromium.launch();
  const wide = [];
  try {
    let p = await open(browser, { time: at(12) });
    check('T-01', (await label(p)) === '퇴근까지' && near(await clock(p), '06:00:00'), `${await label(p)} ${await clock(p)}`);
    wide.push(['홈', await noHScroll(p)]);
    await p.context().close();

    p = await open(browser, { time: at(19) });
    check('T-02', (await label(p)) === '출근까지' && near(await clock(p), '14:00:00') && (await rewardShown(p)) === 1, `${await label(p)} ${await clock(p)}`);
    wide.push(['보상 모달', await noHScroll(p)]);
    await p.screenshot({ path: `${OUT}/reward.png` });
    await p.reload(); await p.waitForTimeout(300);
    check('T-03', (await burstShown(p)) === 0 && (await rewardShown(p)) === 0);
    await p.context().close();

    p = await open(browser, { time: at(7), settings: { start: '22:00', end: '06:00' } });
    check('T-04', (await label(p)) === '출근까지' && near(await clock(p), '15:00:00') && (await rewardShown(p)) === 1, `${await label(p)} ${await clock(p)}`);
    await p.context().close();

    p = await open(browser, { time: at(17, 59, 58) });
    const before = await label(p);
    await p.clock.runFor(3000); await p.waitForTimeout(200);
    check('T-05', before === '퇴근까지' && (await label(p)) === '출근까지' && (await rewardShown(p)) === 1, `${before} → ${await label(p)}`);
    await p.context().close();

    p = await open(browser, { time: at(12) });
    await p.evaluate(() => window.__setHidden(true));
    await p.clock.runFor(60_000);
    await p.evaluate(() => window.__setHidden(false));
    check('T-06', near(await clock(p), '05:59:00'), await clock(p));

    await p.getByRole('button', { name: /⚙️/ }).click();
    wide.push(['설정 시트', await noHScroll(p)]);
    const [s, e] = await p.locator('input[type=time]').all();
    const save = p.getByRole('button', { name: '저장' });
    await e.fill('');
    check('T-07', await save.isDisabled());
    await s.fill('09:00'); await e.fill('09:00');
    check('T-07a', (await save.isDisabled()) && (await p.getByText('출근과 퇴근 시각이 같아요').isVisible()));
    await p.context().close();

    p = await open(browser, { time: at(12), collected: ['en-gosh', 'es-miercoles'] });
    await p.getByRole('button', { name: /도감/ }).click();
    wide.push(['도감', await noHScroll(p)]);
    // T-23: 국가별·등급별 묶음 소제목과 모은 수 (M3)
    {
      const oaths = require('../src/data/oaths.json');
      const heads = () => p.locator('[data-group]').allTextContents();
      await p.getByRole('button', { name: '국가별' }).click();
      const byCountry = await heads(), es = oaths.filter((o) => o.country === '🇪🇸 스페인').length;
      const okCountry = byCountry.length === new Set(oaths.map((o) => o.country)).size && byCountry.includes(`🇪🇸 스페인 1/${es}`);
      wide.push(['도감 국가별', await noHScroll(p)]);
      await p.getByRole('button', { name: '등급별' }).click();
      const byRarity = await heads();
      const okRarity = byRarity.length === 5 && byRarity[0] === `전설 0/${oaths.filter((o) => o.rarity === 'legendary').length}`;
      await p.screenshot({ path: `${OUT}/collection-rarity.png` });
      await p.getByRole('button', { name: '전체' }).click();
      const okAll = (await p.locator('[data-group]').count()) === 0;
      check('T-23', okCountry && okRarity && okAll, `국가 ${byCountry.length}묶음, 등급 첫 줄 ${byRarity[0]}`);
    }
    await p.getByRole('button', { name: /미에르콜레스/ }).first().click();
    const mark = () => p.locator('[data-card] [data-mark]').textContent();
    check('T-08', (await mark()) === '미에르콜레스');

    await p.fill('input', '김부장님의아들딸최고');
    const dl = p.waitForEvent('download');
    await p.getByRole('button', { name: /이미지 저장/ }).click();
    await (await dl).saveAs(`${OUT}/meme.png`);
    await p.locator('[data-card]').screenshot({ path: `${OUT}/meme-screen.png` });
    const png = fs.readFileSync(`${OUT}/meme.png`);
    const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
    check('T-10', w > 0 && w === h, `${w}x${h}, 눈으로 비교: ${OUT}/meme.png ↔ ${OUT}/meme-screen.png`);
    wide.push(['짤 만들기', await noHScroll(p)]);

    // T-09: 템플릿마다 10자 이름이 카드 밖으로 안 넘침. 템플릿 시트로 하나씩 고른다
    const templates = require('../src/data/templates.json');
    const overflow = [];
    for (const [i, t] of templates.entries()) {
      await p.getByRole('button', { name: /템플릿/ }).click();
      if (i === 0) { wide.push(['템플릿 시트', await noHScroll(p)]); await p.screenshot({ path: `${OUT}/sheet-template.png` }); }
      await p.getByRole('dialog').getByRole('button', { name: t.name }).click();
      const ok = await p.evaluate(() => {
        const card = document.querySelector('[data-card]');
        const r = card.getBoundingClientRect();
        return [...card.querySelectorAll('*')].every((el) => {
          const e = el.getBoundingClientRect();
          return e.right <= r.right + 0.5 && e.bottom <= r.bottom + 0.5 && e.left >= r.left - 0.5;
        });
      });
      if (!ok) overflow.push(t.id);
      await p.locator('[data-card]').screenshot({ path: `${OUT}/card-${t.id}.png` });
    }
    check('T-09', overflow.length === 0, overflow.join(', '));

    await p.getByRole('button', { name: /단어/ }).click();
    wide.push(['단어 시트', await noHScroll(p)]);
    await p.screenshot({ path: `${OUT}/sheet-word.png` });
    await p.getByRole('dialog').getByRole('button', { name: /고쉬/ }).click();
    const bg = await p.locator('[data-card]').evaluate((el) => getComputedStyle(el).backgroundColor);
    const t18 = [await mark(), bg];
    await p.getByRole('button', { name: /단어/ }).click();
    await p.getByRole('dialog').getByRole('button', { name: /단어 없이/ }).click();
    const bleep = await p.locator('[data-card] [data-mark]').evaluate((el) => [el.textContent, getComputedStyle(el).color]);
    const meaning = await p.locator('[data-card]').getByText('뜻:').count();
    await p.locator('[data-card]').screenshot({ path: `${OUT}/card-bleep.png` });
    check('T-19', bleep[0] === '삐-' && bleep[1] === 'rgb(239, 68, 68)' && meaning === 0, bleep.join(' '));
    check('T-18', t18[0] === '고쉬' && t18[1] === 'rgb(31, 41, 55)', `단어 ${t18[0]}, 마지막 템플릿 배경 ${t18[1]}`);
    await p.getByRole('button', { name: '← 뒤로' }).last().click(); // 짤(위에 겹침) → 도감
    const backToCol = await p.getByText('비속어 도감').isVisible();
    await p.getByRole('button', { name: '← 뒤로' }).click(); // 도감 → 메인
    check('T-17', backToCol && (await p.getByText('비속어 도감').count()) === 0 && (await p.getByText('퇴근까지').isVisible()));
    await p.screenshot({ path: `${OUT}/main.png` });
    await p.context().close();

    // T-21: 퇴근 순간 펑 연출 → 말풍선 단어 → 저절로 보상 창. 동작 줄이기면 연출 없이 바로
    p = await open(browser, { time: at(17, 59, 59) });
    await p.clock.runFor(1500); await p.waitForTimeout(100);
    const swell = (await burstShown(p)) === 1 && (await p.getByText('오늘도 퇴근 성공').count()) === 0;
    await p.clock.runFor(800); await p.waitForTimeout(100);
    await p.waitForTimeout(500);
    const bubble = await p.locator('[data-burst] p').first().textContent();
    await p.screenshot({ path: `${OUT}/burst.png` });
    await p.clock.runFor(1500); await p.waitForTimeout(100);
    const word = await p.locator('.text-3xl').textContent();
    const auto = (await burstShown(p)) === 0 && (await p.getByText('오늘도 퇴근 성공').count()) === 1;
    await p.context().close();
    p = await open(browser, { time: at(19) });
    await p.emulateMedia({ reducedMotion: 'reduce' }); await p.reload(); await p.waitForTimeout(300);
    const reduced = (await burstShown(p)) === 0; // 보상은 첫 로드에서 이미 받음: 연출이 다시 안 뜨는지만 본다
    await p.context().close();
    const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, reducedMotion: 'reduce' });
    await ctx.clock.install({ time: at(19) });
    p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(300);
    const reducedNow = (await burstShown(p)) === 0 && (await p.getByText('오늘도 퇴근 성공').count()) === 1;
    await ctx.close();
    check('T-21', swell && bubble === `${word}!` && auto && reduced && reducedNow, `부풀기 ${swell}, 말풍선 ${bubble}, 자동 ${auto}, 동작줄이기 ${reducedNow}`);

    // T-20: 근무 진행률별 표정, 시각별 배경 (09:00~18:00, 보상은 이미 받은 상태로)
    const moods = [];
    for (const [h, m, mood, part] of [[7, 0, 'sleepy', 'morning'], [10, 0, 'calm', 'morning'], [14, 0, 'annoyed', 'noon'], [16, 30, 'angry', 'noon'], [17, 40, 'furious', 'noon'], [19, 0, 'relieved', 'night']]) {
      p = await open(browser, { time: at(h, m), lastReward: '2026-11-13' });
      const got = [await p.locator('[data-mood]').getAttribute('data-mood'), await p.locator('main').getAttribute('data-daypart')];
      if (got[0] !== mood || got[1] !== part) moods.push(`${h}:${m} ${got.join('/')}`);
      if (mood === 'furious' || mood === 'relieved') wide.push([`홈 ${mood}`, await noHScroll(p)]);
      await p.screenshot({ path: `${OUT}/home-${mood}.png` });
      await p.context().close();
    }
    check('T-20', moods.length === 0, moods.join(', '));

    check('T-11', wide.every(([, ok]) => ok), wide.filter(([, ok]) => !ok).map(([n]) => n).join(', '));
  } finally {
    await browser.close();
    server.kill();
  }

  results.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id}${r.note ? `  (${r.note})` : ''}`);
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})();
