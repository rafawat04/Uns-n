create table if not exists article_likes (
  article_slug text not null,
  user_id text not null,
  created_at text not null,
  primary key (article_slug, user_id)
);

create index if not exists idx_article_likes_slug on article_likes (article_slug);

create table if not exists article_comments (
  id text primary key,
  article_slug text not null,
  user_id text not null,
  user_name text not null,
  body text not null,
  created_at text not null
);

create index if not exists idx_article_comments_slug_created_at on article_comments (article_slug, created_at desc);
