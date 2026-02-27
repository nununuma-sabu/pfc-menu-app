-- Enable pgvector extension
create extension if not exists vector
with schema extensions;

-- Create ingredients_master table
create table public.ingredients_master (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    common_name text,
    category text,
    calories_per_100g double precision not null,
    protein_per_100g double precision not null,
    fat_per_100g double precision not null,
    carbs_per_100g double precision not null,
    embedding vector(1536),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.ingredients_master enable row level security;

-- Policy for reading: anyone can read ingredients
create policy "Allow public read access"
on public.ingredients_master
for select
to public
using (true);

-- Create match_ingredients function for vector search
create or replace function public.match_ingredients (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  name text,
  common_name text,
  calories_per_100g double precision,
  protein_per_100g double precision,
  fat_per_100g double precision,
  carbs_per_100g double precision,
  similarity float
)
language sql stable
as $$
  select
    im.id,
    im.name,
    im.common_name,
    im.calories_per_100g,
    im.protein_per_100g,
    im.fat_per_100g,
    im.carbs_per_100g,
    1 - (im.embedding <=> query_embedding) as similarity
  from public.ingredients_master im
  where 1 - (im.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
