-- Investing Reps
-- Apply this migration ONLY to the Supabase project named "investing perps".
-- Do not apply it to the Favos project or to any database whose name or URL contains "favos".
-- Answer keys live in the private schema. Authenticated users cannot select them.
-- Score rows are written only by public.submit_my_attempt. Clients never send a point total.

create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'New learner' check (char_length(display_name) between 1 and 40),
  bio text not null default '' check (char_length(bio) <= 280),
  experience text not null default 'beginner' check (experience in ('beginner', 'some')),
  interests text[] not null default '{}' check (cardinality(interests) <= 3),
  show_on_global_ranking boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  invite_code text not null unique check (char_length(invite_code) between 4 and 40),
  sample_label text,
  created_at timestamptz not null default now()
);

create table if not exists public.club_memberships (
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create table if not exists public.lessons (
  id text primary key,
  topic_id text not null,
  title text not null,
  curriculum_version text not null,
  review_status text not null default 'needs_review' check (review_status in ('needs_review', 'reviewed')),
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id text primary key,
  lesson_id text not null references public.lessons (id) on delete cascade,
  role text not null check (role in ('initial', 'transfer')),
  prompt text not null,
  unique (lesson_id, role)
);

create table if not exists public.frameworks (
  id text primary key,
  plain_name text not null,
  formal_name text not null,
  attributed_to text not null,
  one_sentence text not null,
  review_status text not null default 'needs_review' check (review_status in ('needs_review', 'reviewed'))
);

create table if not exists private.answer_keys (
  question_id text primary key references public.questions (id) on delete cascade,
  correct_choice_id text not null check (char_length(correct_choice_id) between 1 and 8)
);

create table if not exists public.weekly_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  week_start date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_challenge_questions (
  challenge_id uuid not null references public.weekly_challenges (id) on delete cascade,
  question_id text not null references public.questions (id),
  position integer not null check (position > 0),
  primary key (challenge_id, question_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  post_type text not null check (post_type in ('technique', 'thesis', 'challenge')),
  topic_id text not null,
  title text not null check (char_length(title) between 1 and 140),
  fields jsonb not null,
  sources jsonb not null default '[]'::jsonb,
  ai_assisted boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  visibility text not null default 'public' check (visibility in ('public', 'club')),
  club_id uuid references public.clubs (id),
  lesson_id text references public.lessons (id),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  check (visibility <> 'club' or club_id is not null)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  intent text not null default 'note' check (intent in ('question', 'evidence', 'assumption', 'note')),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.reactions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  kind text not null default 'helpful' check (kind = 'helpful'),
  created_at timestamptz not null default now(),
  primary key (user_id, post_id, kind)
);

create table if not exists public.bookmarks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.post_views (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id text not null references public.questions (id),
  choice_id text not null,
  explanation text not null check (char_length(explanation) between 1 and 1200),
  confidence text not null check (confidence in ('unsure', 'somewhat_sure', 'very_sure')),
  hint_used boolean not null,
  answer_revealed boolean not null,
  correct boolean not null,
  counts_for_ranking boolean not null,
  counts_for_accuracy boolean not null,
  points integer not null check (points in (0, 10)),
  weekly_challenge_id uuid references public.weekly_challenges (id),
  created_at timestamptz not null default now(),
  check (points = 0 or counts_for_ranking)
);

create unique index if not exists attempts_one_scored
  on public.attempts (user_id, question_id, weekly_challenge_id)
  where counts_for_ranking;

create unique index if not exists attempts_one_accuracy
  on public.attempts (user_id, question_id)
  where counts_for_accuracy;

create table if not exists public.score_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  attempt_id uuid not null unique references public.attempts (id) on delete cascade,
  question_id text not null,
  weekly_challenge_id uuid not null references public.weekly_challenges (id),
  points integer not null check (points = 10),
  created_at timestamptz not null default now()
);

create table if not exists public.misconception_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id text not null,
  tag text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'profile')),
  target_id text not null,
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references public.profiles (id),
  target_type text not null check (target_type in ('post', 'comment')),
  target_id text not null,
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists private.rate_limits (
  bucket_key text not null,
  window_start timestamptz not null,
  hits integer not null,
  primary key (bucket_key, window_start)
);

create index if not exists posts_author_idx on public.posts (author_id);
create index if not exists posts_club_idx on public.posts (club_id);
create index if not exists comments_post_idx on public.comments (post_id);
create index if not exists attempts_user_idx on public.attempts (user_id, question_id);
create index if not exists score_events_user_idx on public.score_events (user_id, created_at);
create index if not exists reports_reporter_idx on public.reports (reporter_id);
create index if not exists memberships_user_idx on public.club_memberships (user_id);

create or replace function private.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'moderator', false);
$$;

create or replace function public.comments_one_level()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.parent_id is not null then
    if exists (
      select 1 from public.comments parent
      where parent.id = new.parent_id and parent.parent_id is not null
    ) then
      raise exception 'Replies only go one level deep';
    end if;
    if exists (
      select 1 from public.comments parent
      where parent.id = new.parent_id and parent.post_id <> new.post_id
    ) then
      raise exception 'A reply has to stay on the same post';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists comments_one_level on public.comments;
create trigger comments_one_level
  before insert on public.comments
  for each row execute function public.comments_one_level();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, 'New learner')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.submit_my_attempt(
  p_question_id text,
  p_choice_id text,
  p_explanation text,
  p_confidence text,
  p_hint_used boolean,
  p_revealed boolean,
  p_weekly_challenge_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_correct_choice text;
  v_review text;
  v_in_published boolean := false;
  v_correct boolean;
  v_rank boolean := false;
  v_accuracy boolean := false;
  v_points integer := 0;
  v_attempt_id uuid;
begin
  if v_user is null then
    raise exception 'Sign in is required';
  end if;
  if p_explanation is null or char_length(p_explanation) < 1 or char_length(p_explanation) > 1200 then
    raise exception 'Explanation length is out of range';
  end if;
  if p_confidence not in ('unsure', 'somewhat_sure', 'very_sure') then
    raise exception 'Confidence is invalid';
  end if;

  select k.correct_choice_id into v_correct_choice
  from private.answer_keys k
  where k.question_id = p_question_id;

  if v_correct_choice is null then
    raise exception 'Unknown question';
  end if;

  select l.review_status into v_review
  from public.questions q
  join public.lessons l on l.id = q.lesson_id
  where q.id = p_question_id;

  if p_weekly_challenge_id is not null then
    select exists (
      select 1
      from public.weekly_challenges wc
      join public.weekly_challenge_questions wq on wq.challenge_id = wc.id
      where wc.id = p_weekly_challenge_id
        and wc.status = 'published'
        and wq.question_id = p_question_id
    ) into v_in_published;
  end if;

  v_correct := p_choice_id = v_correct_choice;

  if p_weekly_challenge_id is not null
     and p_hint_used = false
     and p_revealed = false
     and v_review = 'reviewed'
     and v_in_published
     and not exists (
       select 1 from public.attempts a
       where a.user_id = v_user
         and a.question_id = p_question_id
         and a.weekly_challenge_id = p_weekly_challenge_id
         and a.counts_for_ranking
     )
  then
    v_rank := true;
    if v_correct then
      v_points := 10;
    end if;
  end if;

  if p_hint_used = false
     and p_revealed = false
     and not exists (
       select 1 from public.attempts a
       where a.user_id = v_user
         and a.question_id = p_question_id
         and a.counts_for_accuracy
     )
  then
    v_accuracy := true;
  end if;

  insert into public.attempts (
    user_id, question_id, choice_id, explanation, confidence,
    hint_used, answer_revealed, correct, counts_for_ranking,
    counts_for_accuracy, points, weekly_challenge_id
  ) values (
    v_user, p_question_id, p_choice_id, p_explanation, p_confidence,
    p_hint_used, p_revealed, v_correct, v_rank,
    v_accuracy, v_points, p_weekly_challenge_id
  )
  returning id into v_attempt_id;

  if v_points = 10 and p_weekly_challenge_id is not null then
    insert into public.score_events (user_id, attempt_id, question_id, weekly_challenge_id, points)
    values (v_user, v_attempt_id, p_question_id, p_weekly_challenge_id, 10);
  end if;

  return jsonb_build_object(
    'correct', v_correct,
    'points', v_points,
    'countsForRanking', v_rank,
    'countsForAccuracy', v_accuracy,
    'idempotent', false
  );
exception
  when unique_violation then
    return jsonb_build_object(
      'correct', v_correct,
      'points', 0,
      'countsForRanking', false,
      'countsForAccuracy', false,
      'idempotent', true
    );
end;
$$;

create or replace function public.global_learning_ranks()
returns table (
  rank integer,
  display_name text,
  points integer,
  attempted integer,
  correct integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with totals as (
    select
      p.display_name,
      coalesce(sum(s.points), 0)::integer as points,
      count(a.id)::integer as attempted,
      count(a.id) filter (where a.correct)::integer as correct
    from public.profiles p
    left join public.score_events s on s.user_id = p.id
      and s.created_at >= date_trunc('week', now())
    left join public.attempts a on a.user_id = p.id
      and a.counts_for_ranking
      and a.created_at >= date_trunc('week', now())
    where p.show_on_global_ranking = true
    group by p.id, p.display_name
  ),
  ordered as (
    select
      display_name,
      points,
      attempted,
      correct,
      dense_rank() over (order by points desc) as rank
    from totals
  )
  select rank::integer, display_name, points, attempted, correct
  from ordered
  order by rank, display_name;
$$;

revoke all on function public.submit_my_attempt(text, text, text, text, boolean, boolean, uuid) from public, anon;
grant execute on function public.submit_my_attempt(text, text, text, text, boolean, boolean, uuid) to authenticated;

revoke all on function public.global_learning_ranks() from public;
grant execute on function public.global_learning_ranks() to anon, authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.comments_one_level() from public, anon, authenticated;
revoke all on function private.is_moderator() from public, anon;
grant execute on function private.is_moderator() to authenticated;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;
revoke all on all tables in schema private from public, anon, authenticated;
grant all on all tables in schema private to service_role;

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_memberships enable row level security;
alter table public.follows enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.frameworks enable row level security;
alter table public.weekly_challenges enable row level security;
alter table public.weekly_challenge_questions enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.bookmarks enable row level security;
alter table public.post_views enable row level security;
alter table public.attempts enable row level security;
alter table public.score_events enable row level security;
alter table public.misconception_history enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.moderation_actions enable row level security;

alter table public.profiles force row level security;
alter table public.clubs force row level security;
alter table public.club_memberships force row level security;
alter table public.follows force row level security;
alter table public.lessons force row level security;
alter table public.questions force row level security;
alter table public.frameworks force row level security;
alter table public.weekly_challenges force row level security;
alter table public.weekly_challenge_questions force row level security;
alter table public.posts force row level security;
alter table public.comments force row level security;
alter table public.reactions force row level security;
alter table public.bookmarks force row level security;
alter table public.post_views force row level security;
alter table public.attempts force row level security;
alter table public.score_events force row level security;
alter table public.misconception_history force row level security;
alter table public.reports force row level security;
alter table public.blocks force row level security;
alter table public.moderation_actions force row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy clubs_select on public.clubs
  for select to anon, authenticated
  using (true);

create policy memberships_select_own on public.club_memberships
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy memberships_insert_own on public.club_memberships
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy memberships_delete_own on public.club_memberships
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy follows_select on public.follows
  for select to authenticated
  using (follower_id = (select auth.uid()) or followee_id = (select auth.uid()));

create policy follows_write on public.follows
  for insert to authenticated
  with check (follower_id = (select auth.uid()));

create policy follows_delete on public.follows
  for delete to authenticated
  using (follower_id = (select auth.uid()));

create policy lessons_read on public.lessons
  for select to anon, authenticated
  using (true);

create policy questions_read on public.questions
  for select to anon, authenticated
  using (true);

create policy frameworks_read on public.frameworks
  for select to anon, authenticated
  using (true);

create policy challenges_read on public.weekly_challenges
  for select to anon, authenticated
  using (true);

create policy challenge_questions_read on public.weekly_challenge_questions
  for select to anon, authenticated
  using (true);

create policy posts_select on public.posts
  for select to anon, authenticated
  using (
    author_id = (select auth.uid())
    or (
      status = 'published' and visibility = 'public'
    )
    or (
      status = 'published' and visibility = 'club' and exists (
        select 1 from public.club_memberships m
        where m.club_id = posts.club_id and m.user_id = (select auth.uid())
      )
    )
  );

create policy posts_insert_own on public.posts
  for insert to authenticated
  with check (author_id = (select auth.uid()));

create policy posts_update_own on public.posts
  for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy posts_delete_own on public.posts
  for delete to authenticated
  using (author_id = (select auth.uid()));

create policy comments_select on public.comments
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = comments.post_id
    )
  );

create policy comments_insert_own on public.comments
  for insert to authenticated
  with check (author_id = (select auth.uid()));

create policy comments_delete_own on public.comments
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    or (select private.is_moderator())
  );

create policy reactions_own on public.reactions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy bookmarks_own on public.bookmarks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy views_own on public.post_views
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy attempts_select_own on public.attempts
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy scores_select_own on public.score_events
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy misconceptions_own on public.misconception_history
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy misconceptions_insert_own on public.misconception_history
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy reports_insert_own on public.reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()));

create policy reports_select on public.reports
  for select to authenticated
  using (
    reporter_id = (select auth.uid())
    or (select private.is_moderator())
  );

create policy blocks_own on public.blocks
  for all to authenticated
  using (blocker_id = (select auth.uid()))
  with check (blocker_id = (select auth.uid()));

create policy moderation_moderator on public.moderation_actions
  for all to authenticated
  using ((select private.is_moderator()))
  with check ((select private.is_moderator()) and moderator_id = (select auth.uid()));

grant usage on schema public to anon, authenticated, service_role;
grant select on public.lessons, public.questions, public.frameworks, public.weekly_challenges, public.weekly_challenge_questions, public.clubs, public.posts, public.comments to anon, authenticated;
grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, delete on public.comments to authenticated;
grant select, insert, update, delete on public.reactions, public.bookmarks, public.post_views, public.follows, public.blocks, public.club_memberships to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.attempts, public.score_events, public.misconception_history to authenticated;
grant insert on public.misconception_history to authenticated;
grant insert, select on public.reports to authenticated;
grant select, insert on public.moderation_actions to authenticated;
grant all on all tables in schema public to service_role;

insert into public.lessons (id, topic_id, title, curriculum_version, review_status) values
  ('valuation-whole-business', 'valuation', 'One share is not the whole business', '2026-09-26.1', 'needs_review'),
  ('valuation-same-business-price', 'valuation', 'Different stickers, same whole price', '2026-09-26.1', 'needs_review'),
  ('diversification-same-storm', 'diversification', 'Three tickets on the same storm', '2026-09-26.1', 'needs_review'),
  ('diversification-calm-then-crisis', 'diversification', 'Calm days can hide a shared crack', '2026-09-26.1', 'needs_review'),
  ('cash-profit-is-not-cash', 'cash', 'Profit on paper is not cash in the drawer', '2026-09-26.1', 'needs_review'),
  ('cash-revenue-and-machines', 'cash', 'Busy cash register, empty pocket after the machines', '2026-09-26.1', 'needs_review'),
  ('expectations-already-in-the-price', 'expectations', 'A good shop can still be a crowded price', '2026-09-26.1', 'needs_review'),
  ('expectations-two-prices', 'expectations', 'The same profit, a richer story', '2026-09-26.1', 'needs_review'),
  ('dilution-same-shares-smaller-slice', 'dilution', 'You kept every share and still own less', '2026-09-26.1', 'needs_review'),
  ('dilution-profit-per-slice', 'dilution', 'The same profit, thinner per share', '2026-09-26.1', 'needs_review'),
  ('thesis-what-would-change-your-mind', 'thesis', 'A belief needs an exit door', '2026-09-26.1', 'needs_review'),
  ('thesis-challenge-the-assumption', 'thesis', 'Argue with the assumption, not the person', '2026-09-26.1', 'needs_review')
on conflict (id) do nothing;

insert into public.questions (id, lesson_id, role, prompt) values
  ('q-price-whole', 'valuation-whole-business', 'initial', 'Which company has the lower price compared with its yearly profit?'),
  ('q-price-whole-transfer', 'valuation-whole-business', 'transfer', 'Which cafe is cheaper relative to last year''s profit?'),
  ('q-price-equal', 'valuation-same-business-price', 'initial', 'Which company has the lower price compared with yearly profit?'),
  ('q-price-equal-transfer', 'valuation-same-business-price', 'transfer', 'What happened to the price of the business compared with yearly profit?'),
  ('q-diverse-airlines', 'diversification-same-storm', 'initial', 'Is this basket protected against a shock that hits air travel?'),
  ('q-diverse-airlines-transfer', 'diversification-same-storm', 'transfer', 'What kind of protection did the list of ten actually give against that one customer?'),
  ('q-diverse-credit', 'diversification-calm-then-crisis', 'initial', 'Were they a hedge against a freeze in lending?'),
  ('q-diverse-credit-transfer', 'diversification-calm-then-crisis', 'transfer', 'What did the quiet years fail to show?'),
  ('q-cash-receivables', 'cash-profit-is-not-cash', 'initial', 'What was cash from operations?'),
  ('q-cash-receivables-transfer', 'cash-profit-is-not-cash', 'transfer', 'What was cash from operations?'),
  ('q-cash-fcf', 'cash-revenue-and-machines', 'initial', 'What was free cash flow?'),
  ('q-cash-fcf-transfer', 'cash-revenue-and-machines', 'transfer', 'Which calculation is free cash flow that year?'),
  ('q-expect-beat', 'expectations-already-in-the-price', 'initial', 'Which reading fits those facts?'),
  ('q-expect-beat-transfer', 'expectations-already-in-the-price', 'transfer', 'What can the 18% move support on its own?'),
  ('q-expect-two-prices', 'expectations-two-prices', 'initial', 'Which price embeds higher expectations for the future, if this year''s earnings are the same?'),
  ('q-expect-two-prices-transfer', 'expectations-two-prices', 'transfer', 'Which price requires the more optimistic story if you only know this year''s profit?'),
  ('q-dilution-percent', 'dilution-same-shares-smaller-slice', 'initial', 'What fraction does the founder own after the new shares exist?'),
  ('q-dilution-percent-transfer', 'dilution-same-shares-smaller-slice', 'transfer', 'What percentage do you own afterward?'),
  ('q-dilution-eps', 'dilution-profit-per-slice', 'initial', 'What is profit per share after the issue, under that assumption?'),
  ('q-dilution-eps-transfer', 'dilution-profit-per-slice', 'transfer', 'What is earnings per share after the new shares?'),
  ('q-thesis-mind', 'thesis-what-would-change-your-mind', 'initial', 'What is missing before this is a thesis you can learn from?'),
  ('q-thesis-mind-transfer', 'thesis-what-would-change-your-mind', 'transfer', 'What did the second sentence add?'),
  ('q-thesis-challenge', 'thesis-challenge-the-assumption', 'initial', 'Which reply challenges an assumption instead of attacking a person or citing fame?'),
  ('q-thesis-challenge-transfer', 'thesis-challenge-the-assumption', 'transfer', 'What kind of comment is that?')
on conflict (id) do nothing;

insert into private.answer_keys (question_id, correct_choice_id) values
  ('q-price-whole', 'b'),
  ('q-price-whole-transfer', 'b'),
  ('q-price-equal', 'c'),
  ('q-price-equal-transfer', 'c'),
  ('q-diverse-airlines', 'b'),
  ('q-diverse-airlines-transfer', 'b'),
  ('q-diverse-credit', 'b'),
  ('q-diverse-credit-transfer', 'b'),
  ('q-cash-receivables', 'c'),
  ('q-cash-receivables-transfer', 'b'),
  ('q-cash-fcf', 'c'),
  ('q-cash-fcf-transfer', 'd'),
  ('q-expect-beat', 'b'),
  ('q-expect-beat-transfer', 'a'),
  ('q-expect-two-prices', 'b'),
  ('q-expect-two-prices-transfer', 'b'),
  ('q-dilution-percent', 'b'),
  ('q-dilution-percent-transfer', 'b'),
  ('q-dilution-eps', 'b'),
  ('q-dilution-eps-transfer', 'b'),
  ('q-thesis-mind', 'b'),
  ('q-thesis-mind-transfer', 'b'),
  ('q-thesis-challenge', 'c'),
  ('q-thesis-challenge-transfer', 'c')
on conflict (question_id) do nothing;

insert into public.frameworks (id, plain_name, formal_name, attributed_to, one_sentence) values
  ('whole-business-price', 'Price the whole thing, not one slice', 'Market capitalization versus share price', 'Benjamin Graham and Warren Buffett', 'The number on one share is a slice. The business price is the slice times how many slices exist.'),
  ('margin-of-safety', 'Leave room for being wrong', 'Margin of safety', 'Benjamin Graham', 'If your estimate has to be perfect, you do not have room for a surprise.'),
  ('circle-of-competence', 'Stay near what you can explain', 'Circle of competence', 'Warren Buffett and Charlie Munger', 'If you cannot say how the business gets paid, you are guessing.'),
  ('invert', 'Ask how this fails', 'Inversion', 'Charlie Munger', 'A useful belief names the fact that would make you drop it.'),
  ('shared-storm', 'More names can still be one storm', 'Diversification and correlation', 'Harry Markowitz and Ray Dalio', 'Extra holdings help only when the same event does not hurt all of them.'),
  ('cash-versus-story', 'Profit on paper is not cash you can spend', 'Earnings versus cash flow', 'Warren Buffett, simplified', 'Uncollected sales and equipment spending can empty the drawer while the report looks fine.'),
  ('expectations', 'The price may already include the good news', 'Expectations in the price', 'Howard Marks and Robert Shiller', 'A fine business can still be a crowded price.'),
  ('prices-hold-information', 'A price already reflects a lot of public talk', 'Information in prices, and its limit', 'Eugene Fama and Robert Shiller shared the 2013 prize in economic sciences. The committee did not pick a winner. This is not the Peace Prize.', 'Beating a price after costs is hard, and a price can still swing with a story.'),
  ('dilution', 'New slices shrink your piece', 'Dilution', 'Ownership arithmetic', 'Keeping every share does not keep your percentage if new shares are created.'),
  ('costs-and-the-haystack', 'Costs quietly eat the result', 'Fees and long-term ownership', 'John Bogle and the stewardship theme in Larry Fink''s letters', 'A repeating cost changes what is left. A letter is not a personal instruction.'),
  ('overconfidence', 'Feeling sure is not the same as being right', 'Overconfidence', 'Daniel Kahneman and Richard Thaler', 'Confidence is not a point system, and a correct guess is not understanding.'),
  ('lemons', 'The seller may know something you do not', 'Asymmetric information', 'George Akerlof, 2001 economics prize', 'When quality is hard to see, a shiny story is not proof.'),
  ('access-is-not-a-good-deal', 'Being allowed to borrow is not the same as a good deal', 'Microcredit', 'Muhammad Yunus, 2006 Nobel Peace Prize, not the prize in economic sciences', 'Access to a loan is not the same thing as fair terms. Later studies often found modest effects, not a transformation.')
on conflict (id) do nothing;

insert into public.clubs (id, name, invite_code, sample_label)
values (
  '11111111-1111-4111-8111-111111111111',
  'North Quad Investment Club',
  'CAMPUS-DEMO',
  'Sample club inside the investing perps project. Not a real campus roster.'
)
on conflict (invite_code) do nothing;

insert into public.weekly_challenges (id, title, status, week_start)
values (
  '22222222-2222-4222-8222-222222222222',
  'Sample week, not published',
  'draft',
  '2026-09-21'
)
on conflict (id) do nothing;

insert into public.weekly_challenge_questions (challenge_id, question_id, position) values
  ('22222222-2222-4222-8222-222222222222', 'q-price-whole', 1),
  ('22222222-2222-4222-8222-222222222222', 'q-price-whole-transfer', 2)
on conflict do nothing;
