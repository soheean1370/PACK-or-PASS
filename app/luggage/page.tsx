const luggageItems = [
  { emoji: '🍜', title: '육개장 사발면', label: 'PASS' },
  { emoji: '🔋', title: '보조배터리 (20,000mAh)', label: 'CHECK' },
  { emoji: '🪒', title: '일회용 면도기', label: 'PACK' },
  { emoji: '🪥', title: '치약 100ml', label: 'PACK' },
];

const labelStyles: Record<string, string> = {
  PACK: 'bg-emerald-500/10 text-emerald-300',
  CHECK: 'bg-amber-500/10 text-amber-300',
  PASS: 'bg-rose-500/10 text-rose-300',
};

export default function LuggagePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16 lg:px-8">
      <section className="space-y-8 rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur md:p-12">
        <div className="space-y-3">
          <p className="text-sm text-cyan-300">MY LUGGAGE</p>
          <h1 className="text-4xl font-black text-white">출국 전 내 캐리어 점검</h1>
          <p className="max-w-2xl text-slate-300">
            검사한 물품을 모아서 한 번에 확인할 수 있어요. PACK, CHECK, PASS 상태를
            한눈에 보고 준비를 완료하세요.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {luggageItems.map((item) => (
            <div key={item.title} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-3xl">{item.emoji}</p>
                  <h2 className="mt-4 text-lg font-semibold text-white">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">카테고리 예시</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${labelStyles[item.label]}`}>
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[1.75rem] border border-cyan-400/10 bg-slate-900/80 p-6 text-slate-200">
          <p className="text-sm text-cyan-300">FINAL CHECK</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm leading-7 text-slate-300">
              4개 물품 중 1개는 확인이 필요해요. 출국 전 다시 한 번 검토하면
              준비가 더 안전해집니다.
            </p>
            <button className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              최종 확인하기
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
