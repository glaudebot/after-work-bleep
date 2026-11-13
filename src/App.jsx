import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import oaths from './data/oaths.json';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getDayPart, getMood, getWorkPhase, todayKey } from './lib/time';
import Countdown from './components/Countdown';
import SettingsSheet from './components/SettingsSheet';
import RewardModal from './components/RewardModal';
import Collection from './components/Collection';
import MemeMaker from './components/MemeMaker';
import Character from './components/Character';
import Burst from './components/Burst';

// 등급 가중치 랜덤 뽑기 (미수집 단어 우선)
// 시간대 배경 (D-18). 배경 그림이 오기 전까지 그라데이션
const SKY = {
  morning: 'linear-gradient(180deg, #ffd9b3 0%, #fff1e0 100%)',
  noon: 'linear-gradient(180deg, #9fd3f7 0%, #e6f4ff 100%)',
  night: 'linear-gradient(180deg, #1e2a5a 0%, #3b4a7a 100%)',
};

const WEIGHT = { common: 60, rare: 25, epic: 12, legendary: 3 };
function drawOath(collected) {
  const pool = oaths.filter((o) => !collected.includes(o.id));
  const list = pool.length ? pool : oaths; // 다 모으면 중복 허용
  const total = list.reduce((sum, o) => sum + WEIGHT[o.rarity], 0);
  let r = Math.random() * total;
  return list.find((o) => (r -= WEIGHT[o.rarity]) < 0) ?? list[0];
}

export default function App() {
  const [settings, setSettings] = useLocalStorage('bleep:settings', { start: '09:00', end: '18:00' });
  const [collected, setCollected] = useLocalStorage('bleep:collected', []);
  const [lastReward, setLastReward] = useLocalStorage('bleep:lastReward', null);

  // phase는 '경계 시각'에만 바뀌므로 매초가 아니라 카운트다운 종료 시에만 재계산
  const [phaseTick, setPhaseTick] = useState(0);
  const work = useMemo(() => getWorkPhase(settings), [settings, phaseTick]);

  const [reward, setReward] = useState(null); // { oath, isNew }
  const [burst, setBurst] = useState(false);  // 보상 창 앞의 펑 연출 (M1.5-3)
  const endBurst = useCallback(() => setBurst(false), []);
  const [showSettings, setShowSettings] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [meme, setMeme] = useState(null);     // { oathId } | null

  // 퇴근 보상 (근무일 기준 하루 1회)
  // ref 가드: 같은 렌더의 effect가 두 번 돌아도(StrictMode 등) lastReward 갱신 전 중복 지급 방지
  const rewardedKeyRef = useRef(lastReward);
  const giveReward = useCallback(() => {
    const key = todayKey(work.workEnd);
    if (lastReward === key || rewardedKeyRef.current === key) return;
    rewardedKeyRef.current = key;
    const oath = drawOath(collected);
    const isNew = !collected.includes(oath.id);
    if (isNew) setCollected((c) => (c.includes(oath.id) ? c : [...c, oath.id]));
    setLastReward(key);
    setReward({ oath, isNew });
    // 동작 줄이기를 켠 기기는 연출 없이 바로 보상 창
    setBurst(!matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, [work.workEnd, lastReward, collected, setCollected, setLastReward]);

  // 앱을 퇴근 후에 처음 열었을 때도 보상 지급
  useEffect(() => {
    if (work.phase === 'off') giveReward();
  }, [work.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // 표정·배경은 30초마다, 화면으로 돌아올 때 다시 계산 (매초는 Countdown만, D-08)
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 30_000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, []);
  const mood = getMood(work, now);
  const dayPart = getDayPart(now);
  const night = dayPart === 'night';

  const handleCountdownDone = useCallback(() => setPhaseTick((t) => t + 1), []);

  return (
    <main data-daypart={dayPart} style={{ background: SKY[dayPart] }} className="flex min-h-dvh flex-col px-5 pb-28 pt-6">
      <header className={`flex items-center justify-between ${night ? 'text-white' : ''}`}>
        <h1 className="text-xl font-black">퇴근 후 삐-처리</h1>
        <button className={`text-sm ${night ? 'text-white/70' : 'text-gray-500'}`} onClick={() => setShowSettings(true)}>
          {settings.start}~{settings.end} ⚙️
        </button>
      </header>

      <section className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <Countdown
          key={work.target.getTime()} // 목표가 바뀌면 타이머 리셋
          targetMs={work.target.getTime()}
          phase={work.phase}
          onDone={handleCountdownDone}
        />
      </section>

      <section className="flex flex-1 items-center justify-center py-6">
        <Character mood={mood} />
      </section>

      <nav className="fixed inset-x-0 bottom-0 flex gap-2 px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button className="flex-1 rounded-xl bg-white py-4 font-semibold shadow-sm" onClick={() => setShowCollection(true)}>
          📖 도감
        </button>
        <button className="flex-1 rounded-xl bg-blue-500 py-4 font-semibold text-white disabled:bg-gray-300"
          disabled={!collected.length} onClick={() => setMeme({ oathId: null })}>
          짤 만들기
        </button>
      </nav>

      {showCollection && (
        <Collection collected={collected} onPick={(o) => setMeme({ oathId: o.id })} onClose={() => setShowCollection(false)} />
      )}

      {showSettings && (
        <SettingsSheet settings={settings} onSave={setSettings} onClose={() => setShowSettings(false)} />
      )}
      {reward && burst && <Burst word={reward.oath.word} onDone={endBurst} />}
      {reward && !burst && (
        <RewardModal {...reward}
          onClose={() => setReward(null)}
          onMakeMeme={() => { setMeme({ oathId: reward.oath.id }); setReward(null); }} />
      )}
      {meme && (
        <MemeMaker collected={collected} initialOathId={meme.oathId} onClose={() => setMeme(null)} />
      )}
    </main>
  );
}
