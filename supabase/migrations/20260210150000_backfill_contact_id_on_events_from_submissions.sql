-- Backfill: Ensure every event (project) created from a form submission has a contact.
-- Events with submission_id but no contact_id get linked to an existing contact by email,
-- or a new contact is created from the submission so the customer shows in the contacts section.

DO $$
DECLARE
  v_event RECORD;
  v_sub RECORD;
  v_contact_id UUID;
  v_name_parts TEXT[];
  v_first_name TEXT;
  v_last_name TEXT;
  v_linked INT := 0;
  v_created INT := 0;
BEGIN
  FOR v_event IN
    SELECT e.id AS event_id, e.submission_id, e.client_email, e.client_name
    FROM public.events e
    WHERE e.contact_id IS NULL
      AND e.submission_id IS NOT NULL
  LOOP
    v_contact_id := NULL;

    -- Get the submission
    SELECT cs.id, cs.name, cs.email, cs.phone, cs.event_type, cs.event_date, cs.event_time,
           cs.venue_name, cs.venue_address, cs.location, cs.message, cs.organization_id
    INTO v_sub
    FROM public.contact_submissions cs
    WHERE cs.id = v_event.submission_id
      AND (cs.is_draft IS NULL OR cs.is_draft = false)
    LIMIT 1;

    IF v_sub.id IS NULL THEN
      RAISE NOTICE 'Submission % not found for event %, skipping', v_event.submission_id, v_event.event_id;
      CONTINUE;
    END IF;

    -- Try to find existing contact by email (case-insensitive)
    SELECT c.id INTO v_contact_id
    FROM public.contacts c
    WHERE LOWER(TRIM(c.email_address)) = LOWER(TRIM(v_sub.email))
      AND (c.deleted_at IS NULL)
    ORDER BY c.created_at DESC
    LIMIT 1;

    IF v_contact_id IS NOT NULL THEN
      -- Link event to existing contact
      UPDATE public.events SET contact_id = v_contact_id WHERE id = v_event.event_id;
      v_linked := v_linked + 1;
      RAISE NOTICE 'Linked event % to existing contact %', v_event.event_id, v_contact_id;
      CONTINUE;
    END IF;

    -- No contact found: create one from submission
    v_name_parts := string_to_array(TRIM(v_sub.name), ' ');
    v_first_name := COALESCE(v_name_parts[1], 'Unknown');
    v_last_name := NULL;
    IF array_length(v_name_parts, 1) > 1 THEN
      v_last_name := array_to_string(v_name_parts[2:], ' ');
    END IF;
    IF v_last_name IS NULL OR v_last_name = '' THEN
      v_last_name := 'Customer';
    END IF;

    INSERT INTO public.contacts (
      first_name,
      last_name,
      email_address,
      phone,
      event_type,
      event_date,
      event_time,
      venue_name,
      venue_address,
      special_requests,
      organization_id,
      lead_status,
      lead_source,
      notes,
      last_contact_type,
      opt_in_status,
      lead_score,
      priority_level
    ) VALUES (
      v_first_name,
      v_last_name,
      TRIM(v_sub.email),
      NULLIF(TRIM(v_sub.phone), ''),
      NULLIF(TRIM(v_sub.event_type), ''),
      v_sub.event_date,
      v_sub.event_time,
      NULLIF(TRIM(COALESCE(v_sub.venue_name, v_sub.location)), ''),
      NULLIF(TRIM(COALESCE(v_sub.venue_address, v_sub.location)), ''),
      NULLIF(TRIM(v_sub.message), ''),
      v_sub.organization_id,
      'New',
      'Website',
      'Contact created by backfill from form submission (event ' || v_event.event_id::TEXT || ').',
      'form_submission',
      true,
      50,
      'Medium'
    )
    RETURNING id INTO v_contact_id;

    IF v_contact_id IS NOT NULL THEN
      UPDATE public.events SET contact_id = v_contact_id WHERE id = v_event.event_id;
      v_created := v_created + 1;
      RAISE NOTICE 'Created contact % and linked event %', v_contact_id, v_event.event_id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Backfill complete: % events linked to existing contacts, % new contacts created', v_linked, v_created;
END $$;
