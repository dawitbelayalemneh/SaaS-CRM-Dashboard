
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_stage_check;
ALTER TABLE public.deals ADD CONSTRAINT deals_stage_check CHECK (stage IN ('new', 'contacted', 'negotiation', 'won', 'lost'));
UPDATE public.deals SET stage = 'new' WHERE stage = 'discovery';
UPDATE public.deals SET stage = 'won' WHERE stage = 'closed_won';
UPDATE public.deals SET stage = 'lost' WHERE stage = 'closed_lost';
UPDATE public.deals SET stage = 'contacted' WHERE stage = 'proposal';
ALTER TABLE public.deals ALTER COLUMN stage SET DEFAULT 'new';
