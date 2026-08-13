#!/usr/bin/env node
// 간단한 ingest 스크립트 스켈레톤
// 실행: node scripts/ingest.js <docs-dir>
// 목적: docs 폴더의 문서들을 읽고 분할(split), 임베딩 생성 후 벡터 DB에 upsert

const fs = require('fs')
const path = require('path')

async function main() {
  const docsDir = process.argv[2] || 'docs'
  if (!fs.existsSync(docsDir)) {
    console.error('docs 폴더가 없습니다. 예: docs/')
    process.exit(1)
  }

  const files = fs.readdirSync(docsDir)
  console.log('Found documents:', files)

  // TODO:
  // - 파일 유형(PDF/HTML/TXT)별 파서 추가
  // - 텍스트 분할(문장/단락) 후 메타데이터 추가
  // - OpenAI 등으로 임베딩 생성
  // - 벡터 DB에 upsert

  console.log('ingest 스켈레톤 완료. 실제 업로드 로직을 구현하세요.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
