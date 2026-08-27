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

create or replace function match_documents(
  query_embedding vector(1536),
  match_count int default 5,
  filter_country text default null,
  filter_airline text default null
)
returns table (
  id uuid,
  source text,
  content text,
  metadata jsonb,
  similarity float
)
language sql
stable
as $$
  select
    documents.id,
    documents.source,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where (filter_country is null or filter_country = '' or documents.metadata->>'entity_code' = filter_country)
    and (filter_airline is null or filter_airline = '' or documents.metadata->>'entity' ilike '%' || filter_airline || '%')
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;
