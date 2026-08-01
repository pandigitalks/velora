begin;

create index if not exists blog_posts_author_idx on public.blog_posts (author_id);

drop policy if exists "Published blog posts are public" on public.blog_posts;
drop policy if exists "Admins read all blog posts" on public.blog_posts;

create policy "Published posts or admin access"
on public.blog_posts for select
to anon, authenticated
using (
  (status = 'published' and published_at is not null and published_at <= now())
  or (select public.current_user_is_admin())
);

commit;
