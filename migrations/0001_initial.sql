create table if not exists articles (
  id text primary key,
  slug text not null unique,
  category text not null,
  source_id text not null,
  source_name text not null,
  url text unique,
  image_url text,
  published_at text not null,
  fetched_at text,
  original_language text,
  needs_translation integer not null default 0,
  importance text not null default 'normal',
  image_icon text not null default 'UN',
  tags_json text not null default '[]',
  title_pt text not null,
  title_en text not null,
  title_ja text not null,
  summary_pt text not null,
  summary_en text not null,
  summary_ja text not null,
  body_pt text not null,
  body_en text not null,
  body_ja text not null
);

create index if not exists idx_articles_published_at on articles (published_at desc);
create index if not exists idx_articles_category on articles (category);
create index if not exists idx_articles_source_id on articles (source_id);
