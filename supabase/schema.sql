create extension if not exists vector;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  source text,
  content text not null,
  metadata jsonb,
  embedding vector(1536),
  created_at timestamptz default now()
);

create index if not exists documents_embedding_idx
  on documents using ivfflat (embedding vector_l2_ops)
  with (lists = 100);
