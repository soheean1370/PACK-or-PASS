import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PACK or PASS',
  description: 'AI 기반 해외여행 짐 반입 가능 여부 검사 서비스',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
