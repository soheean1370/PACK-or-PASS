'use client'

import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  ArrowLeft,
  BatteryCharging,
  Camera,
  Check,
  ClipboardList,
  Droplets,
  Home,
  Luggage,
  PackageCheck,
  Pill,
  Plane,
  Plug,
  Scissors,
  Settings,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Upload,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

type Screen =
  | 'home'
  | 'travel-setup'
  | 'scan'
  | 'analyzing'
  | 'result-pass'
  | 'result-check'
  | 'result-pack'
  | 'luggage'
  | 'final-check'

type Verdict = 'PACK' | 'CHECK' | 'PASS'

type VisionResult = {
  name: string
  category: 'battery' | 'liquids' | 'food' | 'medicine' | 'electronics' | 'unknown'
  summary: string
  visibleDetails: string[]
  confidence: number
  needsManualInput: boolean
}

type AnalysisResult = VisionResult & {
  verdict: Verdict
  explanation: string
}

interface LuggageItem {
  id: number
  name: string
  verdict: Verdict
  category: string
  icon: LucideIcon
  reason?: string
}

const DEMO_ITEMS: LuggageItem[] = [
  {
    id: 1,
    name: '육개장 사발면',
    verdict: 'PASS',
    category: '식품 > 컵라면',
    icon: UtensilsCrossed,
    reason: '쇠고기 성분 포함으로 목적지 검역 규정 위반 가능',
  },
  {
    id: 2,
    name: '보조배터리 (20,000mAh)',
    verdict: 'CHECK',
    category: '전자기기 > 배터리',
    icon: BatteryCharging,
    reason: '개수 제한 확인 필요',
  },
  {
    id: 3,
    name: '일회용 면도기',
    verdict: 'PACK',
    category: '생활용품 > 개인용품',
    icon: Scissors,
  },
  {
    id: 4,
    name: '치약 (100ml)',
    verdict: 'PACK',
    category: '생활용품 > 세면도구',
    icon: Droplets,
  },
  {
    id: 5,
    name: '멀티 어댑터',
    verdict: 'PACK',
    category: '전자기기 > 충전기',
    icon: Plug,
  },
]

const COUNTRIES = [
  { code: 'KR', name: '대한민국', flag: '🇰🇷' },
  { code: 'US', name: '미국', flag: '🇺🇸' },
  { code: 'JP', name: '일본', flag: '🇯🇵' },
  { code: 'AU', name: '호주', flag: '🇦🇺' },
  { code: 'GB', name: '영국', flag: '🇬🇧' },
]

const AIRLINES = [
  { name: '대한항공', flag: '🛫' },
  { name: '아시아나항공', flag: '🛫' },
  { name: '제주항공', flag: '🛫' },
  { name: 'United Airlines', flag: '🛫' },
]

const DEMO_RESULTS: Record<
  string,
  {
    verdict: Verdict
    name: string
    category: string
    ingredients: string
    weight: string
    baggage: string
    reason: string
    tip: string
    icon: LucideIcon
  }
> = {
  'result-pass': {
    verdict: 'PASS',
    name: '육개장 사발면',
    category: '식품 > 컵라면',
    ingredients: '소고기 성분 포함',
    weight: '86g',
    baggage: '기내 / 위탁 모두 제한',
    reason: '미국 입국 시 육류 성분이 포함된 식품은 검역 규정에 따라 반입이 제한될 수 있어요.',
    tip: '다른 제품으로 대체하는 것을 권장해요.',
    icon: UtensilsCrossed,
  },
  'result-check': {
    verdict: 'CHECK',
    name: '보조배터리 (20,000mAh)',
    category: '전자기기 > 배터리',
    ingredients: '리튬이온 배터리',
    weight: '74Wh',
    baggage: '기내 반입 가능 / 위탁 불가',
    reason: '100Wh 이하 배터리는 기내 반입 가능해요. 개수는 항공사 규정을 확인해주세요.',
    tip: '위탁 수하물로는 반입이 불가해요.',
    icon: BatteryCharging,
  },
  'result-pack': {
    verdict: 'PACK',
    name: '일회용 면도기',
    category: '생활용품 > 개인용품',
    ingredients: '플라스틱, 금속',
    weight: '-',
    baggage: '기내 / 위탁 모두 가능',
    reason: '특별한 제한 사항이 없어요. 안심하고 가져가세요!',
    tip: '',
    icon: Scissors,
  },
}

function VerdictBadge({ verdict, large }: { verdict: Verdict; large?: boolean }) {
  const styles = {
    PACK: 'bg-green-100 text-green-700',
    CHECK: 'bg-amber-100 text-amber-700',
    PASS: 'bg-red-100 text-red-700',
  }
  const icons = {
    PACK: ShieldCheck,
    CHECK: AlertTriangle,
    PASS: PackageCheck,
  }
  const Icon = icons[verdict]

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full ${styles[verdict]} ${
        large ? 'text-base px-4 py-1.5' : 'text-xs px-2.5 py-0.5'
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {verdict}
    </span>
  )
}

function BottomNav({ screen, onNav }: { screen: Screen; onNav: (s: Screen) => void }) {
  const tabs = [
    { id: 'home' as Screen, label: '홈', icon: Home },
    { id: 'scan' as Screen, label: '스캔 기록', icon: ClipboardList },
    { id: 'luggage' as Screen, label: '내 캐리어', icon: Luggage },
    { id: 'travel-setup' as Screen, label: '설정', icon: Settings },
  ]
  const activeScreen = ['home'].includes(screen)
    ? 'home'
    : ['scan', 'analyzing', 'result-pass', 'result-check', 'result-pack'].includes(screen)
    ? 'scan'
    : screen === 'luggage' || screen === 'final-check'
    ? 'luggage'
    : 'travel-setup'

  return (
    <div className="flex border-t border-gray-100 bg-white">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onNav(t.id)}
          className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
            activeScreen === t.id ? 'text-[#1a9e5c]' : 'text-gray-400'
          }`}
        >
          <t.icon className="h-5 w-5" />
          <span className="text-[10px] font-medium">{t.label}</span>
        </button>
      ))}
    </div>
  )
}

function HomeScreen({ onScan, onSetup }: { onScan: () => void; onSetup: () => void }) {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-2xl font-black tracking-tight">
            <span className="text-[#1a9e5c]">PACK</span>
            <span className="text-gray-300 mx-1">or</span>
            <span className="text-[#e8354a]">PASS</span>
          </span>
          <button onClick={onSetup} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <span className="text-xl">⚙️</span>
          </button>
        </div>
        <p className="text-xs text-gray-500">AI가 여행 짐의 반입 가능 여부를 알려드려요</p>
      </div>

      <div className="mx-4 rounded-3xl bg-gradient-to-br from-[#1a9e5c] to-[#0d7a46] p-6 mb-5 relative overflow-hidden">
        <div className="absolute right-4 top-4 opacity-20">
          <Plane className="h-12 w-12 text-white" />
        </div>
        <div className="absolute -right-6 -bottom-4 opacity-10">
          <Luggage className="h-28 w-28 text-white" />
        </div>
        <p className="text-white/70 text-xs font-medium mb-1">AI 여행 짐 검사</p>
        <h2 className="text-white text-xl font-black leading-tight mb-1">
          What's in
          <br />
          your bag?
        </h2>
        <p className="text-white/80 text-sm mb-4">
          가져갈 물건을 찍어보세요.
          <br />
          AI가 반입 가능 여부를 알려드릴게요!
        </p>
        <button
          onClick={onScan}
          className="bg-white text-[#1a9e5c] font-bold text-sm px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm active:scale-95 transition-transform"
        >
          <Camera className="h-4 w-4" /> 물품 촬영하기
        </button>
      </div>

      <div className="mx-4 mb-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3">이렇게 사용해요</h3>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Camera, label: '찍고' },
            { icon: Sparkles, label: '분석하고' },
            { icon: Plane, label: '비교하고' },
            { icon: Check, label: '판단해요' },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="bg-white rounded-2xl p-3 flex flex-col items-center gap-1 shadow-sm">
                <Icon className="h-5 w-5 text-[#1a9e5c]" />
                <span className="text-[10px] text-gray-500 font-medium">{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mx-4 mb-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3">자주 검사하는 물품</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: UtensilsCrossed, name: '식품', desc: '컵라면, 김치, 육류 등', color: 'bg-orange-50' },
            { icon: BatteryCharging, name: '배터리', desc: '보조배터리, 전자기기', color: 'bg-blue-50' },
            { icon: Droplets, name: '액체류', desc: '화장품, 음료, 향수', color: 'bg-purple-50' },
            { icon: Pill, name: '의약품', desc: '약, 영양제, 주사기', color: 'bg-green-50' },
          ].map((c) => {
            const Icon = c.icon
            return (
              <button
                key={c.name}
                onClick={onScan}
                className={`${c.color} rounded-2xl p-3 flex items-center gap-3 text-left active:scale-95 transition-transform`}
              >
                <Icon className="h-5 w-5 text-slate-700" />
                <div>
                  <p className="text-xs font-bold text-gray-800">{c.name}</p>
                  <p className="text-[10px] text-gray-500">{c.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mx-4 mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <Sparkles className="h-4 w-4 text-amber-500 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          PACK or PASS는 참고 정보 제공 서비스입니다.
          <br />
          최종 반입 여부는 출발 전 항공사 및 관련 기관의 공식 규정을 꼭 확인해주세요.
        </p>
      </div>
    </div>
  )
}

function TravelSetupScreen({
  onConfirm,
  onBack,
}: {
  onConfirm: () => void
  onBack: () => void
}) {
  const [origin, setOrigin] = useState('KR')
  const [dest, setDest] = useState('US')
  const [airline, setAirline] = useState('대한항공')
  const [baggage, setBaggage] = useState<'carry' | 'checked'>('carry')

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack} className="p-1.5 rounded-full hover:bg-gray-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-900">여행 정보 설정</h1>
      </div>

      <div className="flex-1 px-5 pt-5 pb-8 space-y-5">
        <p className="text-sm text-gray-600">여행 정보를 선택해주세요</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">출발지</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#1a9e5c]/30"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">도착지</label>
            <select
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#1a9e5c]/30"
            >
              {COUNTRIES.filter((c) => c.code !== origin).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">항공사</label>
            <select
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#1a9e5c]/30"
            >
              {AIRLINES.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.flag} {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">수하물 유형</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBaggage('carry')}
                className={`py-3 rounded-2xl text-sm font-semibold border-2 transition-all ${
                  baggage === 'carry'
                    ? 'border-[#1a9e5c] bg-[#e8f7ee] text-[#1a9e5c]'
                    : 'border-gray-200 text-gray-500 bg-white'
                }`}
              >
                기내 수하물
              </button>
              <button
                onClick={() => setBaggage('checked')}
                className={`py-3 rounded-2xl text-sm font-semibold border-2 transition-all ${
                  baggage === 'checked'
                    ? 'border-[#1a9e5c] bg-[#e8f7ee] text-[#1a9e5c]'
                    : 'border-gray-200 text-gray-500 bg-white'
                }`}
              >
                위탁 수하물
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onConfirm}
          className="w-full bg-[#1a9e5c] text-white font-bold py-4 rounded-2xl text-sm active:scale-95 transition-transform shadow-md"
        >
          확인
        </button>
      </div>
    </div>
  )
}

function ScanScreen({ onResult, onBack }: { onResult: (result: AnalysisResult) => void; onBack: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'recognizing' | 'confirming' | 'checking' | 'error'>('idle')
  const [recognized, setRecognized] = useState<VisionResult | null>(null)
  const [itemName, setItemName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const resizeForAnalysis = async (file: File) => {
    const source = URL.createObjectURL(file)
    try {
      const image = new Image()
      image.src = source
      await image.decode()
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('이미지를 처리할 수 없습니다.')
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/jpeg', 0.86)
    } finally {
      URL.revokeObjectURL(source)
    }
  }

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드할 수 있어요.')
        setStatus('error')
        return
      }
      const url = URL.createObjectURL(file)
      setPreview(url)
      setRecognized(null)
      setError(null)
      setStatus('recognizing')

      try {
        const image = await resizeForAnalysis(file)
        const visionResponse = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image }),
        })
        const vision = await visionResponse.json()
        if (!visionResponse.ok) throw new Error(vision.error || '이미지를 인식하지 못했습니다.')
        setRecognized(vision)
        setItemName(vision.name)
        setStatus('confirming')
      } catch (error) {
        console.error('Image analysis failed', error)
        setError(error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.')
        setStatus('error')
      }
    },
    [onResult],
  )

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setRecognized(null)
    setItemName('')
    setError(null)
    setStatus('idle')
    if (fileRef.current) fileRef.current.value = ''
  }

  const checkRegulation = async () => {
    if (!recognized || !itemName.trim()) return
    setError(null)
    setStatus('checking')
    try {
      const query = `${itemName.trim()}. ${recognized.summary} ${recognized.visibleDetails.join(', ')}. 기내 수하물 반입 가능 여부를 한국어로 판정해 주세요.`
      const ragResponse = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, category: recognized.category }),
      })
      const rag = await ragResponse.json()
      if (!ragResponse.ok || !['PACK', 'CHECK', 'PASS'].includes(rag.verdict)) {
        throw new Error(rag.error || '규정 판정에 실패했습니다.')
      }
      onResult({ ...recognized, name: itemName.trim(), verdict: rag.verdict, explanation: rag.explanation || recognized.summary })
    } catch (error) {
      console.error('RAG analysis failed', error)
      setError(error instanceof Error ? error.message : '규정 분석 중 오류가 발생했습니다.')
      setStatus('confirming')
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack} className="p-1.5 rounded-full hover:bg-gray-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-900">물품 촬영</h1>
        <div className="ml-auto">💡</div>
      </div>

      <div className="flex-1 px-5 pt-5 pb-8 flex flex-col gap-4">
        <p className="text-sm text-gray-600 text-center">물품을 화면에 맞춰 촬영해주세요</p>
        <p className="text-xs text-gray-400 text-center -mt-2">제품 정보가 잘 보이도록 촬영하면 더 정확하게 분석할 수 있어요.</p>

        <div
          className="flex-1 min-h-64 rounded-3xl bg-gray-900 relative overflow-hidden flex items-center justify-center cursor-pointer"
          onClick={() => fileRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {preview ? (
            <>
              <img src={preview} alt="촬영된 물품" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center px-6 text-center">
                <div className="w-16 h-16 border-4 border-white rounded-full flex items-center justify-center mb-3 animate-pulse">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <p className="text-white font-semibold text-sm">
                  {status === 'recognizing' ? '사진에서 물품을 읽는 중...' : status === 'checking' ? '여행 규정을 확인하는 중...' : status === 'confirming' ? '인식 결과를 확인해주세요' : '사진을 준비했어요'}
                </p>
                {recognized && <p className="mt-1 text-xs text-white/80">인식: {recognized.name}</p>}
                {status === 'error' && (
                  <button onClick={(event) => { event.stopPropagation(); reset() }} className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-800">
                    다른 사진 선택
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-white/70 rounded-tl-lg" />
              <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-white/70 rounded-tr-lg" />
              <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-white/70 rounded-bl-lg" />
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-white/70 rounded-br-lg" />
              <div className="flex flex-col items-center gap-3 text-white/60">
                <Camera className="h-12 w-12" />
                <p className="text-sm">탭하여 사진 업로드</p>
                <p className="text-xs opacity-60">또는 파일을 드래그하세요</p>
              </div>
            </>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />

        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-center text-xs text-red-700">{error}</p>}

        {recognized && status === 'confirming' && (
          <div className="rounded-2xl border border-[#1a9e5c]/20 bg-[#e8f7ee] p-4">
            <p className="mb-2 text-xs font-bold text-[#1a9e5c]">인식 결과를 확인해주세요</p>
            <input
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
              className="w-full rounded-xl border border-green-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#1a9e5c]/30"
              aria-label="인식한 물품 이름"
            />
            <p className="mt-2 text-xs text-green-800">{recognized.summary}</p>
            {recognized.needsManualInput && <p className="mt-1 text-xs font-medium text-amber-700">용량·성분 등은 사진에서 확인되지 않아 제품 표기를 직접 확인해주세요.</p>}
            <button onClick={checkRegulation} disabled={!itemName.trim()} className="mt-3 w-full rounded-xl bg-[#1a9e5c] py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300">
              이 물품으로 규정 확인
            </button>
          </div>
        )}

        <div className="flex items-center justify-between px-4">
          <button onClick={preview ? reset : () => fileRef.current?.click()} className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center" aria-label={preview ? '사진 다시 선택' : '사진 업로드'}>
            <Upload className="h-5 w-5 text-slate-700" />
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-18 h-18 bg-white border-4 border-gray-300 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
            style={{ width: 72, height: 72 }}
          >
            <div className="w-14 h-14 bg-[#1a9e5c] rounded-full flex items-center justify-center">
              <Camera className="h-7 w-7 text-white" />
            </div>
          </button>
          <button className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-slate-700" />
          </button>
        </div>

        <div className="bg-[#e8f7ee] rounded-2xl p-4">
          <p className="text-xs font-semibold text-[#1a9e5c] mb-2">📌 잘 찍는 팁</p>
          <ul className="text-xs text-green-800 space-y-1 list-disc list-inside">
            <li>성분표가 보이게 찍으면 더 정확해요</li>
            <li>제품명이 잘 보이도록 해주세요</li>
            <li>배터리는 용량(mAh) 표시 부분을 포함해주세요</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function ResultScreen({
  resultKey,
  analysis,
  onAddToLuggage,
  onScanAgain,
  onBack,
}: {
  resultKey: 'result-pass' | 'result-check' | 'result-pack'
  analysis: AnalysisResult | null
  onAddToLuggage: () => void
  onScanAgain: () => void
  onBack: () => void
}) {
  const categoryLabels: Record<VisionResult['category'], string> = {
    battery: '전자기기 > 배터리',
    liquids: '액체류',
    food: '식품',
    medicine: '의약품',
    electronics: '전자기기',
    unknown: '확인 필요',
  }
  const categoryIcons: Record<VisionResult['category'], LucideIcon> = {
    battery: BatteryCharging,
    liquids: Droplets,
    food: UtensilsCrossed,
    medicine: Pill,
    electronics: Plug,
    unknown: PackageCheck,
  }
  const fallback = DEMO_RESULTS[resultKey]
  const data = analysis
    ? {
        ...fallback,
        verdict: analysis.verdict,
        name: analysis.name,
        category: categoryLabels[analysis.category],
        ingredients: analysis.visibleDetails.join(', ') || '사진에서 확인되지 않음',
        weight: analysis.needsManualInput ? '사진에서 확인 필요' : '사진 인식 결과 참고',
        reason: analysis.explanation,
        tip: analysis.needsManualInput ? '사진에서 읽기 어려운 정보가 있어 제품 표기를 직접 확인해주세요.' : analysis.summary,
        icon: categoryIcons[analysis.category],
      }
    : fallback
  const { verdict } = data

  const verdictStyle = {
    PACK: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      header: 'bg-green-500',
      text: 'text-green-700',
      tagline: '가져가도 괜찮아요!',
    },
    CHECK: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      header: 'bg-amber-500',
      text: 'text-amber-700',
      tagline: '조건을 확인해주세요',
    },
    PASS: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      header: 'bg-red-500',
      text: 'text-red-700',
      tagline: '가져가지 않는 것을 권장해요',
    },
  }[verdict]

  const checkItems =
    verdict === 'CHECK'
      ? ['100Wh 이하 배터리는 기내 반입 가능해요.', '개수는 항공사 규정을 확인해주세요.', '위탁 수하물로는 반입이 불가해요.']
      : []

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack} className="p-1.5 rounded-full hover:bg-gray-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-900">분석 결과</h1>
      </div>

      <div className="flex-1 px-4 pt-4 pb-8 space-y-3">
        <div className={`${verdictStyle.bg} border ${verdictStyle.border} rounded-3xl overflow-hidden`}>
          <div className={`${verdictStyle.header} px-5 py-4 flex items-center gap-3`}>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {verdict === 'PACK' ? <ShieldCheck className="h-5 w-5 text-white" /> : verdict === 'CHECK' ? <AlertTriangle className="h-5 w-5 text-white" /> : <PackageCheck className="h-5 w-5 text-white" />}
            </div>
            <div>
              <p className="text-white font-black text-xl">{verdict}</p>
              <p className="text-white/80 text-xs">{verdictStyle.tagline}</p>
            </div>
          </div>
          <div className="px-5 py-4 flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
              <data.icon className="h-8 w-8 text-slate-700" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">{data.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{data.category}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">분석 정보</p>
          <div className="space-y-2">
            {[
              ['카테고리', data.category],
              ['주요 성분', data.ingredients],
              ['용량', data.weight],
              ['수하물', data.baggage],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-900 text-right">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">이유</p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.reason}</p>
          {checkItems.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {checkItems.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-amber-800">
                  <span className="mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          {data.tip && (
            <div className="mt-3 flex items-start gap-2 bg-gray-50 rounded-xl p-3">
              <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5" />
              <p className="text-xs text-gray-600">{data.tip}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">수하물 구분</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '기내수하물', ok: verdict !== 'PASS' },
              { label: '위탁수하물', ok: verdict === 'PACK' },
            ].map((row) => (
              <div key={row.label} className={`rounded-xl p-3 text-center ${row.ok ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-xs font-medium text-gray-600 mb-1">{row.label}</p>
                <p className={`text-sm font-bold ${row.ok ? 'text-green-700' : 'text-red-600'}`}>{row.ok ? '✓ 가능' : '✗ 불가'}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-gray-400 text-center px-4 flex items-center justify-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          실제 반입 여부는 출국 전 공식 규정을 확인해주세요.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={onAddToLuggage}
            className="bg-[#1a9e5c] text-white font-bold py-3.5 rounded-2xl text-sm active:scale-95 transition-transform"
          >
            내 캐리어에 추가
          </button>
          <button
            onClick={onScanAgain}
            className="bg-gray-100 text-gray-700 font-bold py-3.5 rounded-2xl text-sm active:scale-95 transition-transform"
          >
            다시 스캔
          </button>
        </div>
      </div>
    </div>
  )
}

function LuggageScreen({
  items,
  onFinalCheck,
  onBack,
}: {
  items: LuggageItem[]
  onFinalCheck: () => void
  onBack: () => void
}) {
  const packCount = items.filter((i) => i.verdict === 'PACK').length
  const checkCount = items.filter((i) => i.verdict === 'CHECK').length
  const passCount = items.filter((i) => i.verdict === 'PASS').length

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-full hover:bg-gray-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-gray-900">내 캐리어</h1>
        </div>
        <button className="p-1.5 rounded-full hover:bg-gray-100 text-xl">
          <Sparkles className="h-5 w-5 text-slate-700" />
        </button>
      </div>

      <div className="flex-1 px-4 pt-4 pb-8 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4">
          <p className="text-sm font-bold text-amber-800 mb-1">최종 체크 전이에요!</p>
          <p className="text-xs text-amber-700">총 {items.length}개의 물품을 추가했어요</p>
          <div className="flex gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              <span className="text-xs font-bold text-gray-700">PACK {packCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="text-xs font-bold text-gray-700">CHECK {checkCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              <span className="text-xs font-bold text-gray-700">PASS {passCount}</span>
            </div>
          </div>
          <div className="flex gap-1 mt-3 h-2 rounded-full overflow-hidden">
            <div className="bg-green-500 rounded-full" style={{ flex: packCount }} />
            <div className="bg-amber-400 rounded-full" style={{ flex: checkCount }} />
            <div className="bg-red-500 rounded-full" style={{ flex: passCount }} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2 px-1">물품 목록</p>
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-4 py-3.5">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-slate-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                  {item.reason && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{item.reason}</p>}
                </div>
                <VerdictBadge verdict={item.verdict} />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onFinalCheck}
          className="w-full bg-[#1a9e5c] text-white font-black py-4 rounded-2xl text-base active:scale-95 transition-transform shadow-md"
        >
          최종 체크하기 🎯
        </button>
      </div>
    </div>
  )
}

function FinalCheckScreen({
  items,
  onBack,
  onSave,
}: {
  items: LuggageItem[]
  onBack: () => void
  onSave: () => void
}) {
  const packItems = items.filter((i) => i.verdict === 'PACK')
  const checkItems = items.filter((i) => i.verdict === 'CHECK')
  const passItems = items.filter((i) => i.verdict === 'PASS')
  const needsAction = [...passItems, ...checkItems]

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack} className="p-1.5 rounded-full hover:bg-gray-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-900">최종 체크 결과</h1>
      </div>

      <div className="flex-1 px-4 pt-4 pb-8 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 text-center">
          <p className="text-sm font-bold text-amber-800">확인 후 출국 준비를 완료하세요!</p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm flex items-center gap-6">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="16" />
              {(() => {
                const total = items.length || 1
                const segments = [
                  { count: packItems.length, color: '#22c55e' },
                  { count: checkItems.length, color: '#f59e0b' },
                  { count: passItems.length, color: '#ef4444' },
                ]
                const circumference = 2 * Math.PI * 40
                let offset = 0
                return segments.map((seg, i) => {
                  const dash = (seg.count / total) * circumference
                  const el = (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="16"
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={-offset}
                    />
                  )
                  offset += dash
                  return el
                })
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xl font-black text-gray-900">{items.length}</p>
              <p className="text-[9px] text-gray-500">총 {items.length}개</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'PACK', count: packItems.length, color: 'text-green-600', dot: 'bg-green-500' },
              { label: 'CHECK', count: checkItems.length, color: 'text-amber-600', dot: 'bg-amber-500' },
              { label: 'PASS', count: passItems.length, color: 'text-red-600', dot: 'bg-red-500' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${row.dot}`} />
                <span className="text-xs text-gray-500 w-12">{row.label}</span>
                <span className={`text-sm font-bold ${row.color}`}>{row.count}개</span>
              </div>
            ))}
          </div>
        </div>

        {needsAction.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">확인 필요한 물품</p>
            <div className="space-y-3">
              {needsAction.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-4 w-4 text-slate-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                      <VerdictBadge verdict={item.verdict} />
                    </div>
                    {item.reason && <p className="text-[11px] text-gray-500">{item.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#e8f7ee] rounded-3xl p-5 text-center">
          <p className="text-base font-black text-[#1a9e5c]">
            {needsAction.length > 0 ? `${needsAction.length}개의 물품을 확인하면` : '모든 물품이'}
          </p>
          <p className="text-base font-black text-[#1a9e5c]">출국 준비 완료!</p>
        </div>

        <button
          onClick={onSave}
          className="w-full bg-[#1a9e5c] text-white font-bold py-4 rounded-2xl text-sm active:scale-95 transition-transform shadow-md"
        >
          리스트 저장하기
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [luggageItems, setLuggageItems] = useState<LuggageItem[]>(DEMO_ITEMS)
  const [resultKey, setResultKey] = useState<'result-pass' | 'result-check' | 'result-pack'>('result-pass')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [saved, setSaved] = useState(false)

  const goTo = (s: Screen) => setScreen(s)

  const handleResult = (result: AnalysisResult) => {
    const screenByVerdict: Record<Verdict, 'result-pass' | 'result-check' | 'result-pack'> = {
      PACK: 'result-pack',
      CHECK: 'result-check',
      PASS: 'result-pass',
    }
    const nextScreen = screenByVerdict[result.verdict]
    setAnalysis(result)
    setResultKey(nextScreen)
    setScreen(nextScreen)
  }

  const handleAddToLuggage = () => {
    const data = DEMO_RESULTS[resultKey]
    const newItem: LuggageItem = {
      id: Date.now(),
      name: data.name,
      verdict: data.verdict,
      category: data.category,
      icon: data.icon,
      reason: data.reason,
    }
    setLuggageItems((prev) => {
      const exists = prev.some((i) => i.name === newItem.name)
      return exists ? prev : [newItem, ...prev]
    })
    setScreen('luggage')
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <HomeScreen onScan={() => goTo('travel-setup')} onSetup={() => goTo('travel-setup')} />
      case 'travel-setup':
        return <TravelSetupScreen onConfirm={() => goTo('scan')} onBack={() => goTo('home')} />
      case 'scan':
        return <ScanScreen onResult={handleResult} onBack={() => goTo('home')} />
      case 'result-pass':
      case 'result-check':
      case 'result-pack':
        return (
          <ResultScreen
            resultKey={resultKey}
            analysis={analysis}
            onAddToLuggage={handleAddToLuggage}
            onScanAgain={() => goTo('scan')}
            onBack={() => goTo('scan')}
          />
        )
      case 'luggage':
        return <LuggageScreen items={luggageItems} onFinalCheck={() => goTo('final-check')} onBack={() => goTo('home')} />
      case 'final-check':
        return <FinalCheckScreen items={luggageItems} onBack={() => goTo('luggage')} onSave={handleSave} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] px-4 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col rounded-[2rem] bg-white shadow-2xl shadow-slate-200/60 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          {renderScreen()}
        </div>
        <BottomNav screen={screen} onNav={goTo} />
      </div>

      {saved && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white shadow-lg flex items-center gap-2">
          <Check className="h-3.5 w-3.5" />
          리스트가 저장되었어요!
        </div>
      )}
    </div>
  )
}
