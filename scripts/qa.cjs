// QA 자동 실행 (docs/qa/QA_CHECKLIST.md T-01~T-12). `npm run qa`
// 브라우저 시계를 Playwright clock으로 바꿔 시각이 필요한 항목을 재현한다.
const { chromium } = require('playwright');
const { execSync, spawn } = require('node:child_process');
const fs = require('node:fs');

const PORT = 4180, URL = `http://localhost:${PORT}`, OUT = 'qa-out';
const results = [];
const check = (id, ok, note = '') => { results.push({ id, ok: !!ok, note }); };
const at = (h, m = 0, s = 0) => new Date(2026, 10, 13, h, m, s);

async function open(browser, { time, settings = { start: '09:00', end: '18:00' }, collected = ['es-caramba'], lastReward = null, toss = false, fresh = false }) {
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
  }, fresh ? {} : { 'bleep:settings': settings, 'bleep:collected': collected, 'bleep:lastReward': lastReward, 'bleep:onboarded': true }); // fresh: 처음 여는 폰 (T-25)
  if (toss) await ctx.addInitScript(() => { // T-24: 토스 웹뷰 흉내. T-31: SDK가 보낸 메시지를 모은다
    window.__bridgeMethods__ = ['closeView', '__subscribeAppEvent', '__unsubscribeAppEvent'];
    window.__toss = [];
    window.ReactNativeWebView = { postMessage: (m) => window.__toss.push(JSON.parse(m)) };
  });
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

  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
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

    await p.getByRole('button', { name: /근무 시간 설정/ }).click();
    wide.push(['설정 시트', await noHScroll(p)]);
    const [s, e] = await p.locator('input[type=time]').all();
    const save = p.getByRole('button', { name: '저장' });
    await e.fill('');
    check('T-07', await save.isDisabled());
    await s.fill('09:00'); await e.fill('09:00');
    check('T-07a', (await save.isDisabled()) && (await p.getByText('출근과 퇴근 시각이 같아요').isVisible()));
    await p.context().close();

    p = await open(browser, { time: at(12), collected: ['en-gosh', 'es-miercoles', 'en-nincompoop'] });
    await p.getByRole('button', { name: /도감/ }).click();
    wide.push(['도감', await noHScroll(p)]);
    // T-23: 국가별·등급별 묶음 소제목과 모은 수 (M3)
    {
      const oaths = require('../src/data/oaths.json');
      const heads = () => p.locator('[data-group]').allTextContents();
      await p.getByRole('button', { name: '국가별' }).click();
      const cards = await p.locator('[data-country]').count(), es = oaths.filter((o) => o.country === '🇪🇸 스페인').length;
      wide.push(['도감 국가별', await noHScroll(p)]);
      await p.locator('[data-country]', { hasText: '스페인' }).click();
      const byCountry = await heads(), esCells = await p.locator('.grid > *').count();
      await p.getByRole('button', { name: '뒤로' }).click(); // 나라 카드로 돌아감
      const okCountry = cards === new Set(oaths.map((o) => o.country)).size && byCountry.join() === `🇪🇸 스페인 1/${es}` && esCells === es
        && (await p.locator('[data-country]').count()) === cards;
      await p.getByRole('button', { name: '등급별' }).click();
      const byRarity = await heads();
      const okRarity = byRarity.length === 5 && byRarity[0] === `전설 0/${oaths.filter((o) => o.rarity === 'legendary').length}`;
      await p.screenshot({ path: `${OUT}/collection-rarity.png` });
      await p.getByRole('button', { name: '전체' }).click();
      const okAll = (await p.locator('[data-group]').count()) === 0;
      check('T-23', okCountry && okRarity && okAll, `나라 카드 ${cards}, 고른 나라 ${byCountry}, 등급 첫 줄 ${byRarity[0]}`);
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

    // T-09: 템플릿마다 10자 이름이 카드 밖으로 안 넘침. 템플릿 시트는 단어 분류에 맞는 것만 보이므로 분류에 맞는 단어를 먼저 고른다
    const templates = require('../src/data/templates.json');
    const pickWord = async (w) => { await p.getByRole('button', { name: /단어/ }).click(); await p.getByRole('dialog').getByRole('button', { name: w }).click(); };
    const WORD = { interjection: /고쉬/, noun: /미에르콜레스/, person: /닌컴푸프/, common: /고쉬/ };
    const overflow = [];
    for (const [i, t] of templates.entries()) {
      if (i === 0 || t.type !== templates[i - 1].type) await pickWord(WORD[t.type]);
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
    // T-18: 단어를 바꾸면 카드가 바로 바뀌고, 템플릿 시트에는 그 분류와 공용만 (2026-11-24)
    const shown = async () => { await p.getByRole('button', { name: /템플릿/ }).click(); const n = await p.getByRole('dialog').locator('button[aria-label]').allTextContents(); await p.keyboard.press('Escape'); await p.waitForTimeout(100); return n.length; };
    const want = (type) => 1 + templates.filter((t) => t.type === type || t.type === 'common').length; // 1: 직접 쓰기
    const curName = () => p.getByRole('button', { name: /템플릿/ }).textContent();
    const t18 = [await mark(), await shown() === want('interjection')];
    await pickWord(/미에르콜레스/);
    const nounName = await curName();
    t18.push(await shown() === want('noun') && templates.some((t) => nounName.includes(t.name) && (t.type === 'noun' || t.type === 'common')));
    await pickWord(/고쉬/);
    await p.getByRole('button', { name: /단어/ }).click();
    await p.getByRole('dialog').getByRole('button', { name: /단어 없이/ }).click();
    const bleep = await p.locator('[data-card] [data-mark]').evaluate((el) => [el.textContent, getComputedStyle(el).color]);
    const meaning = await p.locator('[data-card]').getByText('뜻:').count();
    await p.locator('[data-card]').screenshot({ path: `${OUT}/card-bleep.png` });
    // T-33: 직접 쓰기. 3줄·15자 제한, 단어는 끝에, 배경색, 이름 칸 숨김, 다시 열어도 남음 (2026-11-24 사용자)
    {
      await p.getByRole('button', { name: /템플릿/ }).click();
      await p.getByRole('dialog').getByRole('button', { name: '직접 쓰기' }).click();
      const noName = (await p.getByPlaceholder(/이름/).count()) === 0;
      await p.getByLabel('직접 쓸 문장').fill('일이삼사오육칠팔구십일이삼사오육칠\n둘째 줄\n셋째 줄\n넷째 줄');
      const val = await p.getByLabel('직접 쓸 문장').inputValue();
      await p.getByRole('button', { name: '배경색 3' }).click();
      const card = () => p.locator('[data-card]').evaluate((el) => [el.innerText, getComputedStyle(el).backgroundColor]);
      const [txt, bg] = await card();
      const fits = await p.evaluate(() => { const c = document.querySelector('[data-card]'), r = c.getBoundingClientRect(); return [...c.querySelectorAll('*')].every((el) => el.getBoundingClientRect().right <= r.right + 0.5); });
      const ok = val === '일이삼사오육칠팔구십일이삼사오\n둘째 줄\n셋째 줄' && txt.includes(`셋째 줄 ${await mark()}`) && bg === 'rgb(191, 219, 254)';
      await p.locator('[data-card]').screenshot({ path: `${OUT}/card-custom.png` });
      await p.getByRole('button', { name: /템플릿/ }).click();
      await p.getByRole('dialog').getByRole('button', { name: '인사형' }).click();
      const back = (await p.getByPlaceholder(/이름/).count()) === 1;
      const kept = await p.evaluate(() => JSON.parse(localStorage.getItem('bleep:custom')));
      check('T-33', noName && ok && fits && back && kept.text === val && kept.bg === '#bfdbfe', `이름 칸 숨김 ${noName}, 안 넘침 ${fits}, 입력 ${JSON.stringify(val)}, 카드 ${JSON.stringify(txt)} ${bg}, 저장 ${JSON.stringify(kept)}`);
    }

    check('T-19', bleep[0] === '삐-' && bleep[1] === 'rgb(239, 68, 68)' && meaning === 0, bleep.join(' '));
    check('T-18', t18[0] === '고쉬' && t18[1] && t18[2], `단어 ${t18[0]}, 감탄사 시트 ${t18[1]}, 명사로 바꾸면 ${nounName}`);
    await p.getByRole('button', { name: '뒤로' }).last().click(); // 짤(위에 겹침) → 도감
    const backToCol = await p.getByText('비속어 도감').isVisible();
    await p.getByRole('button', { name: '뒤로' }).click(); // 도감 → 메인
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
    await ctx.addInitScript(() => localStorage.setItem('bleep:onboarded', 'true')); // 첫 실행 안내 건너뜀 (T-25)
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

    // T-24: 토스 웹뷰에서는 자체 뒤로 버튼을 숨기고 토스 바 뒤로가기만 쓴다 (M4-2)
    {
      const errs = [];
      p = await open(browser, { time: at(12), collected: ['es-caramba'], toss: true });
      p.on('pageerror', (e) => errs.push(e.message));
      const homeOk = (await label(p)) === '퇴근까지';
      await p.getByRole('button', { name: '도감', exact: true }).click();
      const inCollection = await p.getByRole('button', { name: '뒤로' }).count();
      check('T-24', inCollection === 0 && homeOk && errs.length === 0, `뒤로 ${inCollection}개, 에러 ${errs.join('; ') || '없음'}`);
      await p.context().close();
    }

    // T-25: 처음 여는 폰은 안내 → 출퇴근 시간 설정 뒤에 퇴근 보상, 다시 열면 안내 없음 (M4-3)
    {
      p = await open(browser, { time: at(19), fresh: true });
      const tour = await p.getByRole('dialog', { name: '사용 안내' }).count();
      const noRewardYet = (await burstShown(p)) + (await p.getByText('오늘도 퇴근 성공').count()) === 0;
      await p.getByRole('button', { name: '다음' }).click();
      const sheet = await p.getByText('출퇴근 시간부터 정해요').count();
      await p.getByRole('button', { name: '저장' }).click(); await p.waitForTimeout(200);
      const reward = await rewardShown(p);
      await p.reload(); await p.waitForTimeout(300);
      const again = await p.getByRole('dialog', { name: '사용 안내' }).count();
      check('T-25', tour === 1 && noRewardYet && sheet === 1 && reward === 1 && again === 0, `안내 ${tour}, 보상 대기 ${noRewardYet}, 시트 ${sheet}, 보상 ${reward}, 재실행 안내 ${again}`);
      await p.context().close();
    }

    // T-34: 복어를 누르면 모은 단어(삐- 포함) 중 하나가 말풍선으로 나오고, 직전 단어는 연달아 안 나오며 2초 뒤 사라짐 (2026-11-25 사용자)
    {
      p = await open(browser, { time: at(12), collected: ['es-caramba'] });
      const said = [], reds = []; // 삐-만 빨간색
      for (let i = 0; i < 4; i++) {
        await p.locator('[data-mood]').click();
        said.push(await p.locator('[data-bubble]').innerText());
        reds.push(await p.locator('[data-bubble] span').evaluate((e) => (e.textContent === '삐-!') === (getComputedStyle(e).color === 'rgb(239, 68, 68)')));
      }
      const okWords = said.every((w) => ['삐-!', '카람바!'].includes(w)) && said.every((w, i) => !i || w !== said[i - 1]);
      await p.waitForTimeout(2300);
      const gone = (await p.locator('[data-bubble]').count()) === 0;
      check('T-34', okWords && reds.every(Boolean) && gone, `말풍선 ${said.join(' → ')}, 색 ${reds}, 사라짐 ${gone}`);
      await p.context().close();
    }

    // T-32: 근무 중에 처음 열면 안내 → 시간 설정 뒤 첫 단어 선물. 퇴근 보상은 그대로 남고, 다시 열면 안 뜸 (2026-11-23 사용자)
    {
      p = await open(browser, { time: at(12), fresh: true });
      await p.getByRole('button', { name: '다음' }).click();
      await p.getByRole('button', { name: '저장' }).click(); await p.waitForTimeout(200);
      await rewardShown(p); // 펑 연출 넘기기
      const gift = (await p.getByText('첫 단어 선물이에요').count()) === 1;
      const saved = await p.evaluate(() => [JSON.parse(localStorage.getItem('bleep:collected')).length, localStorage.getItem('bleep:lastReward')]);
      await p.reload(); await p.waitForTimeout(300);
      const again = (await burstShown(p)) + (await p.locator('dialog:modal').count());
      check('T-32', gift && saved[0] === 1 && JSON.parse(saved[1]) === null && again === 0, `선물 ${gift}, 모은 수 ${saved[0]}, 퇴근 보상 기록 ${saved[1]}, 재실행 ${again}`);
      await p.context().close();
    }

    // T-31: 토스 바 뒤로가기. 첫 화면(처음 연 폰은 안내 화면)이면 미니앱 종료, 도감 위에서는 도감만 닫힘 (2026-11-15 심사 반려)
    {
      const back = (pg) => pg.evaluate(() => {
        const sub = window.__toss.find((m) => m.body?.args?.[0]?.method === 'backEvent').body.args[0].subscriptionId;
        window.nativeEmitter.emit('postMessage/appsInTossEvent', { subscriptionId: sub, kind: 'event' });
      });
      const closed = (pg) => pg.evaluate(() => window.__toss.some((m) => m.body?.method === 'closeView'));
      p = await open(browser, { time: at(12), fresh: true, toss: true });
      const tour = await p.getByRole('dialog', { name: '사용 안내' }).count();
      await back(p); await p.waitForTimeout(200);
      const tourClose = await closed(p);
      await p.context().close();
      p = await open(browser, { time: at(12), toss: true });
      await p.getByRole('button', { name: '도감', exact: true }).click();
      await back(p); await p.waitForTimeout(200);
      const collClose = await closed(p);
      const home = await p.getByRole('button', { name: '도감', exact: true }).isVisible();
      await back(p); await p.waitForTimeout(200);
      const homeClose = await closed(p);
      check('T-31', tour === 1 && tourClose && !collClose && home && homeClose, `안내 화면 종료 ${tourClose}, 도감에서 종료 안 함 ${!collClose}, 홈 복귀 ${home}, 홈에서 종료 ${homeClose}`);
      await p.context().close();
    }

    // T-26: 시트·보상 창은 네이티브 모달. 뒤 화면 비활성화, Esc·바깥 탭으로 닫힘, 보상 창은 바깥 탭으로 안 닫힘 (M4-4)
    {
      p = await open(browser, { time: at(12) });
      const modal = () => p.locator('dialog:modal').count();
      const openSheet = () => p.getByRole('button', { name: /근무 시간 설정/ }).click();
      await openSheet();
      const opened = (await modal()) === 1 && (await p.getByRole('dialog', { name: '근무 시간 설정' }).count()) === 1;
      const inert = await p.evaluate(() => { const b = document.querySelector('nav button'); b.focus(); return document.activeElement !== b; });
      await p.keyboard.press('Escape'); await p.waitForTimeout(100);
      const esc = (await modal()) === 0;
      await openSheet(); await p.mouse.click(180, 60); await p.waitForTimeout(100);
      const outside = (await modal()) === 0;
      // closedby를 모르는 브라우저 흉내: 합성 클릭은 네이티브 바깥 탭 닫기를 일으키지 않으므로 대체 코드만 검사된다
      await p.evaluate(() => { delete HTMLDialogElement.prototype.closedBy; });
      await openSheet();
      await p.evaluate(() => document.querySelector('dialog h2').dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 180, clientY: 600 })));
      const insideKept = (await modal()) === 1;
      await p.evaluate(() => document.querySelector('dialog').dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 180, clientY: 60 })));
      await p.waitForTimeout(100);
      const fallback = insideKept && (await modal()) === 0;
      await p.context().close();
      p = await open(browser, { time: at(19) });
      await rewardShown(p); await p.mouse.click(10, 10); await p.waitForTimeout(100);
      const rewardKept = (await modal()) === 1;
      await p.context().close();
      check('T-26', opened && inert && esc && outside && fallback && rewardKept, `열림 ${opened}, 뒤 비활성 ${inert}, Esc ${esc}, 바깥 탭 ${outside}, 대체 코드 ${fallback}, 보상 창 유지 ${rewardKept}`);
    }

    check('T-11', wide.every(([, ok]) => ok), wide.filter(([, ok]) => !ok).map(([n]) => n).join(', '));
  } finally {
    await browser.close();
    server.kill();
  }

  results.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id}${r.note ? `  (${r.note})` : ''}`);
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})();
