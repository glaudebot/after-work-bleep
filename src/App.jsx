import { useCallback, useEffect, useMemo, useState } from 'react';
import oaths from './data/oaths.json';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getWorkPhase, todayKey } from './lib/time';
import Countdown from './components/Countdown';
import SettingsSheet from './components/SettingsSheet';
import RewardModal from './components/RewardModal';
import Collection from './components/Collection';
import MemeMaker from './components/MemeMaker';

// 등급 가중치 랜덤 뽑기 (미수집 단어 우선)
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
  const [showSettings, setShowSettings] = useState(false);
  const [meme, setMeme] = useState(null);     // { oathId } | null

  // 퇴근 보상 (근무일 기준 하루 1회)
  const giveReward = useCallback(() => {
    const key = todayKey(work.workEnd);
    if (lastReward === key) return;
    const oath = drawOath(collected);
    const isNew = !collected.includes(oath.id);
    if (isNew) setCollected((c) => [...c, oath.id]);
    setLastReward(key);
    setReward({ oath, isNew });
  }, [work.workEnd, lastReward, collected, setCollected, setLastReward]);

  // 앱을 퇴근 후에 처음 열었을 때도 보상 지급
  useEffect(() => {
    if (work.phase === 'off') giveReward();
  }, [work.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCountdownDone = useCallback(() => setPhaseTick((t) => t + 1), []);

  return (
    <main className="min-h-dvh bg-gray-50 px-5 pb-10 pt-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-black">퇴근 후 삐-처리</h1>
        <button className="text-sm text-gray-500" onClick={() => setShowSettings(true)}>
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

      <button className="mt-4 w-full rounded-xl bg-blue-500 py-4 font-semibold text-white disabled:bg-gray-300"
        disabled={!collected.length} onClick={() => setMeme({ oathId: null })}>
        짤 만들기
      </button>

      <div className="mt-8">
        <Collection collected={collected} onPick={(o) => setMeme({ oathId: o.id })} />
      </div>

      {showSettings && (
        <SettingsSheet settings={settings} onSave={setSettings} onClose={() => setShowSettings(false)} />
      )}
      {reward && (
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
