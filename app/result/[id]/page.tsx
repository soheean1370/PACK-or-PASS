import { notFound } from 'next/navigation';

interface ResultProps {
  params: { id: string };
}

const resultData: Record<string, { verdict: string; title: string; description: string; badge: string; explanation: string; detail: string; color: string }> = {
  pass: {
    verdict: 'PASS',
    title: '육개장 사발면',
    description: '식품 > 컵라면',
    badge: '🔴 PASS',
    explanation: '육류 성분 포함으로 반입이 제한될 가능성이 높습니다.',
    detail: '미국 입국 시 검역 규정에 따라 육류 성분이 포함된 식품은 반입이 제한될 수 있어요.',
    color: 'bg-rose-500/10 text-rose-300',
  },
  check: {
    verdict: 'CHECK',
    title: '보조배터리 (20,000mAh)',
    description: '전자기기 > 배터리',
    badge: '🟡 CHECK',
    explanation: '개수와 기내 수하물 규정을 확인해야 합니다.',
    detail: '100Wh 이하 배터리는 기내 반입이 가능하지만, 항공사 별 개수 제한을 확인해야 합니다.',
    color: 'bg-amber-500/10 text-amber-300',
  },
  pack: {
    verdict: 'PACK',
    title: '일회용 면도기',
    description: '생활용품 > 개인용품',
    badge: '🟢 PACK',
    explanation: '기내 및 위탁 모두 문제없이 반입할 수 있습니다.',
    detail: '안전한 제품으로, 특별한 제한 없이 수하물에 포함할 수 있어요.',
    color: 'bg-emerald-500/10 text-emerald-300',
  },
};

export default function ResultPage({ params }: ResultProps) {
  const result = resultData[params.id];
  if (!result) return notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur md:p-12">
        <div className="space-y-6 text-slate-100">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-cyan-300">결과 확인</p>
              <h1 className="mt-3 text-4xl font-black text-white">{result.badge}</h1>
            </div>
            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${result.color}`}>{result.verdict}</span>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-2xl font-semibold text-white">{result.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{result.description}</p>
            <p className="mt-4 text-base leading-7 text-slate-300">{result.explanation}</p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
            <h3 className="text-lg font-semibold text-white">판단 근거</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">{result.detail}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <a href="/scan" className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm font-semibold text-slate-100 transition hover:bg-white/10">
              다른 물품 검사하기
            </a>
            <a href="/luggage" className="rounded-3xl bg-cyan-400 px-5 py-4 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              내 캐리어 확인
            </a>
            <a href="/" className="rounded-3xl border border-white/10 bg-slate-900/80 px-5 py-4 text-center text-sm font-semibold text-slate-100 transition hover:bg-slate-800/90">
              홈으로 돌아가기
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
