-- Add review tracking to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS review_url TEXT,
ADD COLUMN IF NOT EXISTS review_reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_review_reminder_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS google_review_link TEXT;

-- Add event completion tracking to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS event_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS post_event_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS review_request_sent BOOLEAN DEFAULT FALSE;

-- Create automation_queue table for scheduled tasks
CREATE TABLE IF NOT EXISTS public.automation_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_type TEXT NOT NULL, -- 'review_request', 'review_reminder', 'thank_you', 'follow_up'
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
    priority INTEGER DEFAULT 5, -- 1-10, higher = more important
    email_subject TEXT,
    email_body TEXT,
    metadata JSONB, -- Additional data for the automation
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for automation_queue
CREATE INDEX IF NOT EXISTS idx_automation_queue_scheduled ON public.automation_queue(scheduled_for) 
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_automation_queue_contact ON public.automation_queue(contact_id);
CREATE INDEX IF NOT EXISTS idx_automation_queue_type ON public.automation_queue(automation_type);
CREATE INDEX IF NOT EXISTS idx_automation_queue_status ON public.automation_queue(status);

-- Create automation_templates table
CREATE TABLE IF NOT EXISTS public.automation_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name TEXT UNIQUE NOT NULL,
    template_type TEXT NOT NULL, -- 'review_request', 'review_reminder', 'thank_you', 'follow_up'
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    delay_hours INTEGER, -- How many hours after trigger event
    is_active BOOLEAN DEFAULT TRUE,
    send_order INTEGER DEFAULT 1, -- For sequences (1st email, 2nd email, etc.)
    variables JSONB, -- Available variables for this template
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create automation_log table to track all automated communications
CREATE TABLE IF NOT EXISTS public.automation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_type TEXT NOT NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    template_used TEXT,
    email_sent BOOLEAN DEFAULT FALSE,
    email_opened BOOLEAN DEFAULT FALSE,
    link_clicked BOOLEAN DEFAULT FALSE,
    review_completed BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for automation_log
CREATE INDEX IF NOT EXISTS idx_automation_log_contact ON public.automation_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_automation_log_type ON public.automation_log(automation_type);
CREATE INDEX IF NOT EXISTS idx_automation_log_sent ON public.automation_log(sent_at);

-- RLS Policies for automation tables
ALTER TABLE public.automation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can manage automation queue"
    ON public.automation_queue
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Admin users can manage automation templates"
    ON public.automation_templates
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Admin users can view automation log"
    ON public.automation_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Insert default automation templates
INSERT INTO public.automation_templates (template_name, template_type, subject_template, body_template, delay_hours, send_order, variables) VALUES
(
    'post_event_thank_you',
    'thank_you',
    '❤️ Thank you for celebrating with M10 DJ!',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi {{first_name}}!</h2>
        
        <p>We hope you''re still buzzing from your amazing {{event_type}}! It was an absolute honor to be part of your special day{{#if event_date}} on {{event_date}}{{/if}}.</p>
        
        <p>Your energy on the dance floor was incredible! 🎉</p>
        
        <h3>We''d Love Your Feedback</h3>
        <p>Would you mind sharing your experience with a quick Google review? It helps future couples find us and means the world to our team!</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{review_link}}" style="background-color: #4285f4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                ⭐ Leave a Review
            </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">Takes just 60 seconds and helps us continue providing amazing entertainment!</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <h3>🎁 Refer a Friend, Get $50 Off!</h3>
        <p>Know someone planning an event? Refer them to M10 DJ Company and you''ll both get $50 off your next event!</p>
        
        <p style="font-size: 14px; color: #666;">Just have them mention your name when they book.</p>
        
        <p style="margin-top: 30px;">Thank you again for choosing M10 DJ Company!</p>
        
        <p>Best,<br>
        {{owner_name}}<br>
        M10 DJ Company<br>
        (901) 410-2020</p>
    </div>',
    48,
    1,
    '{"first_name": "text", "event_type": "text", "event_date": "date", "review_link": "url", "owner_name": "text"}'
),
(
    'review_reminder_1',
    'review_reminder',
    '⭐ Quick favor? 60 seconds for a review',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi {{first_name}},</h2>
        
        <p>Hope you''re still enjoying the memories from your {{event_type}}!</p>
        
        <p>I wanted to follow up on my previous email. If you have 60 seconds, a Google review would mean so much to us. Your feedback helps other Memphis couples find quality DJ services.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{review_link}}" style="background-color: #4285f4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                ⭐ Leave Your Review
            </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">No pressure - only if you had a great experience!</p>
        
        <p>Thank you!<br>
        {{owner_name}}<br>
        M10 DJ Company</p>
    </div>',
    168,
    2,
    '{"first_name": "text", "event_type": "text", "review_link": "url", "owner_name": "text"}'
),
(
    'review_reminder_2',
    'review_reminder',
    '🙏 Last reminder: Share your M10 DJ experience?',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi {{first_name}},</h2>
        
        <p>I promise this is my last reminder! 😊</p>
        
        <p>We''re working hard to reach 50 Google reviews to help more Memphis couples find us. Your review would bring us one step closer to that goal.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{review_link}}" style="background-color: #34a853; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                ⭐ Help Us Reach Our Goal
            </a>
        </div>
        
        <p>As a thank you, I''d love to send you a $10 Starbucks gift card for taking the time. Just reply to this email after leaving your review!</p>
        
        <p style="font-size: 14px; color: #666;">Thank you for considering!</p>
        
        <p>Gratefully,<br>
        {{owner_name}}<br>
        M10 DJ Company</p>
    </div>',
    336,
    3,
    '{"first_name": "text", "review_link": "url", "owner_name": "text"}'
),
(
    'lead_follow_up_1',
    'follow_up',
    'Following up on your inquiry - M10 DJ Company',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi {{first_name}},</h2>
        
        <p>I wanted to follow up on your inquiry about DJ services for your {{event_type}}{{#if event_date}} on {{event_date}}{{/if}}.</p>
        
        <p>I''d love to learn more about your vision and see if we''re a great fit!</p>
        
        <h3>What Makes M10 DJ Different:</h3>
        <ul>
            <li>✅ 22 five-star Google reviews</li>
            <li>✅ 15+ years of Memphis event experience</li>
            <li>✅ Professional sound & lighting equipment</li>
            <li>✅ Custom playlist creation</li>
            <li>✅ MC services included</li>
            <li>✅ Unlimited planning consultations</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{calendar_link}}" style="background-color: #4285f4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                📅 Schedule a Call
            </a>
        </div>
        
        <p>Or simply reply to this email with any questions!</p>
        
        <p>Looking forward to hearing from you,<br>
        {{owner_name}}<br>
        M10 DJ Company<br>
        (901) 410-2020</p>
    </div>',
    72,
    1,
    '{"first_name": "text", "event_type": "text", "event_date": "date", "calendar_link": "url", "owner_name": "text"}'
),
(
    'lead_follow_up_2',
    'follow_up',
    'Still looking for a Memphis DJ? Let''s chat!',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi {{first_name}},</h2>
        
        <p>I know planning an event can be overwhelming with so many decisions to make!</p>
        
        <p>If you''re still searching for the perfect DJ for your {{event_type}}, I''d love to chat about how M10 DJ Company can make your celebration unforgettable.</p>
        
        <h3>🎵 What You Can Expect:</h3>
        <p>We''ll discuss your music preferences, event timeline, special moments (first dance, cake cutting, etc.), and any concerns you have.</p>
        
        <p><strong>No pressure, no commitment - just a friendly conversation!</strong></p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="tel:+19014102020" style="background-color: #34a853; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                📞 Call Now: (901) 410-2020
            </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">Or reply with the best time to reach you!</p>
        
        <p>Best,<br>
        {{owner_name}}<br>
        M10 DJ Company</p>
    </div>',
    168,
    2,
    '{"first_name": "text", "event_type": "text", "owner_name": "text"}'
);

-- Comment on tables
COMMENT ON TABLE public.automation_queue IS 'Queue for scheduled automated emails and tasks';
COMMENT ON TABLE public.automation_templates IS 'Email templates for automated communications';
COMMENT ON TABLE public.automation_log IS 'Log of all automated communications sent';

-- Comment on columns
COMMENT ON COLUMN public.contacts.review_requested_at IS 'When the first review request was sent';
COMMENT ON COLUMN public.contacts.review_completed IS 'Whether the contact left a Google review';
COMMENT ON COLUMN public.contacts.review_reminder_count IS 'Number of review reminders sent';
COMMENT ON COLUMN public.contacts.google_review_link IS 'Direct link to Google review page';

