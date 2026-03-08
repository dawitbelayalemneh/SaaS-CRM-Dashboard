
-- Insert demo data using the current authenticated user's ID
-- We'll use a function to insert for the first admin user found

DO $$
DECLARE
  demo_user_id uuid;
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; c6 uuid; c7 uuid; c8 uuid; c9 uuid; c10 uuid;
BEGIN
  -- Get first user with admin role, or first user in profiles
  SELECT ur.user_id INTO demo_user_id FROM public.user_roles ur LIMIT 1;
  IF demo_user_id IS NULL THEN
    SELECT p.user_id INTO demo_user_id FROM public.profiles p LIMIT 1;
  END IF;
  IF demo_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found to assign demo data';
  END IF;

  -- Contacts
  INSERT INTO public.contacts (id, user_id, name, email, phone, company, job_title) VALUES
    (gen_random_uuid(), demo_user_id, 'Sarah Chen', 'sarah.chen@acmecorp.com', '+1 (415) 555-0101', 'Acme Corp', 'VP of Engineering')
    RETURNING id INTO c1;
  INSERT INTO public.contacts (id, user_id, name, email, phone, company, job_title) VALUES
    (gen_random_uuid(), demo_user_id, 'James Rodriguez', 'j.rodriguez@nexagen.io', '+1 (512) 555-0202', 'NexaGen Solutions', 'Head of Product')
    RETURNING id INTO c2;
  INSERT INTO public.contacts (id, user_id, name, email, phone, company, job_title) VALUES
    (gen_random_uuid(), demo_user_id, 'Emily Watson', 'emily.w@brightpath.co', '+1 (303) 555-0303', 'BrightPath Analytics', 'CTO')
    RETURNING id INTO c3;
  INSERT INTO public.contacts (id, user_id, name, email, phone, company, job_title) VALUES
    (gen_random_uuid(), demo_user_id, 'Michael Park', 'm.park@vortexlabs.com', '+1 (206) 555-0404', 'Vortex Labs', 'Director of Operations')
    RETURNING id INTO c4;
  INSERT INTO public.contacts (id, user_id, name, email, phone, company, job_title) VALUES
    (gen_random_uuid(), demo_user_id, 'Lisa Thompson', 'lisa.t@cloudstride.com', '+1 (617) 555-0505', 'CloudStride Inc', 'CEO')
    RETURNING id INTO c5;
  INSERT INTO public.contacts (id, user_id, name, email, phone, company, job_title) VALUES
    (gen_random_uuid(), demo_user_id, 'David Kim', 'd.kim@peakvision.co', '+1 (408) 555-0606', 'PeakVision Group', 'VP of Sales')
    RETURNING id INTO c6;
  INSERT INTO public.contacts (id, user_id, name, email, phone, company, job_title) VALUES
    (gen_random_uuid(), demo_user_id, 'Rachel Green', 'rachel@ironforge.io', '+1 (312) 555-0707', 'IronForge Systems', 'Product Manager')
    RETURNING id INTO c7;
  INSERT INTO public.contacts (id, user_id, name, email, phone, company, job_title) VALUES
    (gen_random_uuid(), demo_user_id, 'Alex Rivera', 'a.rivera@quantumleap.tech', '+1 (650) 555-0808', 'QuantumLeap Tech', 'Engineering Lead')
    RETURNING id INTO c8;
  INSERT INTO public.contacts (id, user_id, name, email, phone, company, job_title) VALUES
    (gen_random_uuid(), demo_user_id, 'Natalie Brooks', 'n.brooks@silverlining.com', '+1 (720) 555-0909', 'SilverLining Media', 'Marketing Director')
    RETURNING id INTO c9;
  INSERT INTO public.contacts (id, user_id, name, email, phone, company, job_title) VALUES
    (gen_random_uuid(), demo_user_id, 'Tom Henderson', 't.henderson@apexglobal.com', '+1 (213) 555-1010', 'Apex Global Partners', 'Managing Partner')
    RETURNING id INTO c10;

  -- Leads (varied statuses and sources)
  INSERT INTO public.leads (user_id, name, email, phone, company, status, source, notes, created_at) VALUES
    (demo_user_id, 'Olivia Martinez', 'o.martinez@stellarworks.com', '+1 (415) 555-1111', 'StellarWorks Inc', 'new', 'Website', 'Interested in enterprise plan', now() - interval '2 days'),
    (demo_user_id, 'Ryan Foster', 'r.foster@blueocean.co', '+1 (512) 555-1212', 'BlueOcean Ventures', 'contacted', 'LinkedIn', 'Follow-up call scheduled for Friday', now() - interval '5 days'),
    (demo_user_id, 'Jessica Liu', 'j.liu@summitpeak.io', '+1 (303) 555-1313', 'SummitPeak Digital', 'qualified', 'Referral', 'Strong interest, requesting demo', now() - interval '8 days'),
    (demo_user_id, 'Brandon Wright', 'b.wright@novahorizon.com', '+1 (206) 555-1414', 'Nova Horizon Ltd', 'new', 'Cold Email', 'Opened proposal email twice', now() - interval '1 day'),
    (demo_user_id, 'Amanda Scott', 'a.scott@truenorth.co', '+1 (617) 555-1515', 'TrueNorth Analytics', 'contacted', 'Conference', 'Met at SaaStr Annual 2026', now() - interval '12 days'),
    (demo_user_id, 'Kevin Patel', 'k.patel@ironclad.io', '+1 (408) 555-1616', 'IronClad Security', 'qualified', 'Website', 'Needs SOC2 compliance features', now() - interval '15 days'),
    (demo_user_id, 'Sophie Adams', 's.adams@luminary.co', '+1 (312) 555-1717', 'Luminary Group', 'new', 'LinkedIn', 'Downloaded whitepaper', now() - interval '3 days'),
    (demo_user_id, 'Daniel Nguyen', 'd.nguyen@crestline.tech', '+1 (650) 555-1818', 'Crestline Technologies', 'lost', 'Referral', 'Went with competitor - budget constraints', now() - interval '30 days'),
    (demo_user_id, 'Maria Garcia', 'm.garcia@aurorasys.com', '+1 (720) 555-1919', 'Aurora Systems', 'contacted', 'Website', 'Requested pricing comparison', now() - interval '7 days'),
    (demo_user_id, 'Chris Taylor', 'c.taylor@pinnacle.io', '+1 (213) 555-2020', 'Pinnacle Software', 'new', 'Cold Email', 'CTO referral from Acme Corp', now() - interval '1 day'),
    (demo_user_id, 'Jennifer Lee', 'j.lee@zenithdata.com', '+1 (415) 555-2121', 'Zenith Data Corp', 'qualified', 'Conference', 'Ready to start pilot program', now() - interval '10 days'),
    (demo_user_id, 'Mark Johnson', 'm.johnson@redwood.co', '+1 (503) 555-2222', 'Redwood Partners', 'lost', 'LinkedIn', 'Timing not right, revisit Q3', now() - interval '45 days');

  -- Deals (varied stages, values, and dates across last 6 months)
  INSERT INTO public.deals (user_id, title, value, stage, contact_id, expected_close_date, notes, created_at) VALUES
    (demo_user_id, 'Acme Corp Enterprise License', 85000, 'won', c1, '2026-02-15', 'Annual enterprise license - 50 seats', now() - interval '4 months'),
    (demo_user_id, 'NexaGen Platform Integration', 42000, 'won', c2, '2026-01-20', 'Custom API integration package', now() - interval '5 months'),
    (demo_user_id, 'BrightPath Analytics Suite', 120000, 'negotiation', c3, '2026-04-01', 'Full analytics suite with training', now() - interval '3 weeks'),
    (demo_user_id, 'Vortex Labs Consulting', 28000, 'won', c4, '2026-03-01', '3-month consulting engagement', now() - interval '2 months'),
    (demo_user_id, 'CloudStride Annual Contract', 156000, 'won', c5, '2025-12-15', 'Multi-year deal with growth clause', now() - interval '5 months'),
    (demo_user_id, 'PeakVision Sales Tools', 35000, 'contacted', c6, '2026-05-15', 'Sales enablement toolkit', now() - interval '1 week'),
    (demo_user_id, 'IronForge Security Audit', 18500, 'lost', c7, '2026-02-28', 'Lost to incumbent vendor', now() - interval '3 months'),
    (demo_user_id, 'QuantumLeap Dev Tools', 67000, 'new', c8, '2026-06-01', 'Developer productivity suite', now() - interval '3 days'),
    (demo_user_id, 'SilverLining Marketing Platform', 44000, 'won', c9, '2026-01-10', 'Marketing automation package', now() - interval '4 months'),
    (demo_user_id, 'Apex Global Partnership', 210000, 'negotiation', c10, '2026-04-30', 'Strategic partnership deal', now() - interval '2 weeks'),
    (demo_user_id, 'CloudStride Expansion', 72000, 'won', c5, '2026-02-28', 'Additional 30 seats + premium support', now() - interval '1 month'),
    (demo_user_id, 'NexaGen Phase 2', 55000, 'contacted', c2, '2026-05-01', 'Phase 2 implementation', now() - interval '5 days'),
    (demo_user_id, 'Acme Corp Training Program', 22000, 'won', c1, '2026-03-05', 'On-site training for engineering team', now() - interval '3 weeks'),
    (demo_user_id, 'Vortex Labs Extension', 15000, 'lost', c4, '2026-01-31', 'Budget reallocated internally', now() - interval '4 months');

  -- Activities for timeline
  INSERT INTO public.activities (user_id, action, entity_type, entity_name, details, created_at) VALUES
    (demo_user_id, 'created', 'lead', 'Olivia Martinez', 'New lead from StellarWorks Inc', now() - interval '2 days'),
    (demo_user_id, 'created', 'lead', 'Brandon Wright', 'New lead from Nova Horizon Ltd', now() - interval '1 day'),
    (demo_user_id, 'updated', 'lead', 'Jessica Liu', 'Status changed to qualified', now() - interval '6 days'),
    (demo_user_id, 'created', 'deal', 'QuantumLeap Dev Tools', 'New deal worth $67,000', now() - interval '3 days'),
    (demo_user_id, 'updated', 'deal', 'BrightPath Analytics Suite', 'Stage changed: Contacted → Negotiation', now() - interval '1 week'),
    (demo_user_id, 'updated', 'deal', 'Apex Global Partnership', 'Deal value updated to $210,000', now() - interval '2 days'),
    (demo_user_id, 'created', 'contact', 'Tom Henderson', 'Added from Apex Global Partners', now() - interval '2 weeks'),
    (demo_user_id, 'updated', 'contact', 'Sarah Chen', 'Updated job title to VP of Engineering', now() - interval '4 days'),
    (demo_user_id, 'updated', 'deal', 'CloudStride Expansion', 'Stage changed: Negotiation → Won', now() - interval '1 month'),
    (demo_user_id, 'created', 'lead', 'Chris Taylor', 'CTO referral from Acme Corp', now() - interval '1 day'),
    (demo_user_id, 'updated', 'deal', 'Acme Corp Training Program', 'Stage changed: New → Won', now() - interval '3 weeks'),
    (demo_user_id, 'updated', 'lead', 'Amanda Scott', 'Status changed to contacted', now() - interval '10 days');
END $$;
