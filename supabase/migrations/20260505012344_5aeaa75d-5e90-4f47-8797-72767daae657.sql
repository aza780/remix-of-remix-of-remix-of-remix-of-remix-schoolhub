-- Add missing indexes for posts filtering and calendar queries
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category_status ON public.posts(category, status);
CREATE INDEX IF NOT EXISTS idx_posts_open_date ON public.posts(open_date);
CREATE INDEX IF NOT EXISTS idx_posts_deadline ON public.posts(deadline);
CREATE INDEX IF NOT EXISTS idx_posts_announcement_date ON public.posts(announcement_date);

-- Drop unused is_admin() function (dead code, not referenced by any policy)
DROP FUNCTION IF EXISTS public.is_admin();