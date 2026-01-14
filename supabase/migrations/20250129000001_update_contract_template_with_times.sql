-- Update the default service agreement template to include start and end times
UPDATE public.contract_templates
SET template_content = REPLACE(
  template_content,
  '<p><strong>Event Date:</strong> {{event_date}}</p>',
  '<p><strong>Event Date:</strong> {{event_date}}</p>
{{event_time_display}}
{{end_time_display}}'
)
WHERE template_type = 'service_agreement'
  AND is_default = true
  AND template_content LIKE '%Event Date%{{event_date}}%'
  AND template_content NOT LIKE '%{{event_time_display}}%';

-- Also update any active service agreement templates
UPDATE public.contract_templates
SET template_content = REPLACE(
  template_content,
  '<p><strong>Event Date:</strong> {{event_date}}</p>',
  '<p><strong>Event Date:</strong> {{event_date}}</p>
{{event_time_display}}
{{end_time_display}}'
)
WHERE template_type = 'service_agreement'
  AND is_active = true
  AND template_content LIKE '%Event Date%{{event_date}}%'
  AND template_content NOT LIKE '%{{event_time_display}}%';
