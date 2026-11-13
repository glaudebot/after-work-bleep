import oaths from '../data/oaths.json';

export default function Collection({ collected, onPick, onClose }) {
  const owned = new Set(collected);
  return (
    <section className="fixed inset-0 z-30 overflow-y-auto bg-gray-50 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      <button className="text-gray-500" onClick={onClose}>← 뒤로</button>
      <h2 className="mb-3 mt-4 font-bold">
        비속어 도감 <span className="text-gray-400">{owned.size}/{oaths.length}</span>
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {oaths.map((o) =>
          owned.has(o.id) ? (
            <button key={o.id} onClick={() => onPick(o)}
              className="rounded-2xl bg-white p-3 text-center shadow-sm active:scale-95">
              <p className="text-xs">{o.country.split(' ')[0]}</p>
              <p className="mt-1 break-keep text-sm font-bold [overflow-wrap:anywhere]">{o.word}</p>
            </button>
          ) : (
            <div key={o.id} className="rounded-2xl bg-gray-200 p-3 text-center text-gray-400">
              <p className="text-xs font-black text-red-500">삐-</p>
              <p className="mt-1 text-sm">???</p>
            </div>
          )
        )}
      </div>
    </section>
  );
}
