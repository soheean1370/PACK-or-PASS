export default function ScanPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16 lg:px-8">
      <section className="rounded-3xl border border-slate-200/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur md:p-12">
        <div className="flex flex-col gap-6 text-slate-100">
          <div className="space-y-2">
            <p className="text-sm text-cyan-300">AI 여행 짐 검사</p>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              물품 사진을 찍고
              <br />
              반입 가능 여부를 확인해보세요.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-300">
              물건을 촬영하면 AI가 제품 정보를 분석하고, 목적지 국가와 항공사 규정을
              토대로 PACK / CHECK / PASS 결과를 제공합니다.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: '촬영', description: '물품을 촬영하거나 업로드합니다.' },
                { label: '분석', description: 'AI가 제품명, 성분, 용량을 판별합니다.' },
                { label: '판단', description: '규정에 따라 PACK/CHECK/PASS를 출력합니다.' },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl bg-slate-950/80 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">{item.label}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button className="rounded-3xl bg-cyan-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              📸 사진 촬영하기
            </button>
            <button className="rounded-3xl border border-white/10 bg-slate-900/80 px-6 py-4 text-sm font-semibold text-slate-100 transition hover:bg-slate-800/90">
              📁 사진 업로드
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
