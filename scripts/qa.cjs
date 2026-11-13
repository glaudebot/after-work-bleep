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
const rewardShown = (p) => p.getByText('오늘도 퇴근 성공').count();
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
    check('T-03', (await rewardShown(p)) === 0);
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
    check('T-18', (await mark()) === '고쉬' && bg === 'rgb(31, 41, 55)', `단어 ${await mark()}, 마지막 템플릿 배경 ${bg}`);
    await p.getByRole('button', { name: '← 뒤로' }).last().click(); // 짤(위에 겹침) → 도감
    const backToCol = await p.getByText('비속어 도감').isVisible();
    await p.getByRole('button', { name: '← 뒤로' }).click(); // 도감 → 메인
    check('T-17', backToCol && (await p.getByText('비속어 도감').count()) === 0 && (await p.getByText('퇴근까지').isVisible()));
    await p.screenshot({ path: `${OUT}/main.png` });
    await p.context().close();

    check('T-11', wide.every(([, ok]) => ok), wide.filter(([, ok]) => !ok).map(([n]) => n).join(', '));
  } finally {
    await browser.close();
    server.kill();
  }

  results.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id}${r.note ? `  (${r.note})` : ''}`);
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})();
