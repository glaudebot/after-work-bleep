// 짤 카드. 캡처 대상이므로 인라인 색과 Tailwind 클래스만, 외부 이미지 X (D-14)
export default function MemeCard({ template: t, oath, name, cardRef }) {
  const parts = t.text.split(/(\{XX\}|\{YY\}|\n)/);
  return (
    <div ref={cardRef} data-card={cardRef ? '' : undefined} style={{ background: t.bg }}
      className="mx-auto aspect-square w-full max-w-sm rounded-3xl p-6 flex flex-col justify-center">
      <p className="text-xs font-semibold" style={{ color: t.sub }}>{oath.country} · {oath.original}</p>
      <p className="mt-3 break-keep text-3xl font-black leading-snug" style={{ color: t.ink }}>
        {parts.map((p, i) =>
          p === '{XX}' ? <span key={i} className="break-all" style={{ color: t.nameColor }}>{name}</span>
          : p === '{YY}' ? <span key={i} data-mark="" className="px-2" style={{ background: t.markBg, color: t.markFg }}>{oath.word}</span>
          : p === '\n' ? <br key={i} />
          : p)}
      </p>
      <p className="mt-4 text-xs" style={{ color: t.sub }}>뜻: {oath.meaning}</p>
      <p className="mt-auto text-right text-[10px]" style={{ color: t.sub }}>퇴근 후 삐-처리</p>
    </div>
  );
}
