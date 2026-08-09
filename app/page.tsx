const features = [
  {
    title: '사진 한 장으로 검사',
    description: '여행 짐을 촬영하면 AI가 물품을 분석해 반입 가능 여부를 알려줍니다.',
  },
  {
    title: '국가와 항공사 규정 반영',
    description: '목적지 국가와 항공사 정책에 맞춰 PACK / CHECK / PASS를 구분합니다.',
  },
  {
    title: '출국 전 마지막 확인',
    description: '내 짐에 담은 물품들을 한눈에 확인해 출국 준비를 더 쉽게 마무리합니다.',
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-16 lg:px-8">
      <section className="grid items-center gap-10 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur md:grid-cols-[1.2fr_0.8fr] md:p-12">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-300">
            AI 기반 해외여행 짐 검사 서비스
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              이 짐, 가져가도 될까?
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              PACK or PASS가 여행 짐을 분석하고, 목적지 국가와 항공사 규정을 바탕으로
              반입 가능 여부를 빠르게 알려드립니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="/scan"
              className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              검사 시작하기
            </a>
            <a
              href="#features"
              className="rounded-full border border-white/15 px-5 py-3 font-semibold text-slate-200 transition hover:bg-white/10"
            >
              서비스 소개
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">오늘의 검사 흐름</p>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
                PACK
              </span>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-slate-800/70 p-4">
                <p className="text-sm text-slate-400">사진 업로드</p>
                <p className="mt-1 font-semibold text-white">컵라면 · 보조배터리 · 화장품</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-800/70 p-4">
                <p className="text-sm text-slate-400">AI 분석</p>
                <p className="mt-1 font-semibold text-white">성분 · 용량 · 규정 비교</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-800/70 p-4">
                <p className="text-sm text-slate-400">결과</p>
                <p className="mt-1 font-semibold text-white">PACK / CHECK / PASS</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mt-12 grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white">{feature.title}</h2>
            <p className="mt-3 leading-7 text-slate-300">{feature.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
