-- Migration to normalize song title and artist casing for all existing crowd requests
-- Uses typical English title case by default

-- Create a function to convert text to title case (typical English casing)
CREATE OR REPLACE FUNCTION to_title_case(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  words TEXT[];
  word TEXT;
  result TEXT[];
  i INTEGER;
  lowercase_words TEXT[] := ARRAY['and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from'];
BEGIN
  -- Return empty string if input is null or empty
  IF input_text IS NULL OR TRIM(input_text) = '' THEN
    RETURN '';
  END IF;
  
  -- Split into words
  words := string_to_array(LOWER(TRIM(input_text)), ' ');
  result := ARRAY[]::TEXT[];
  
  -- Process each word
  FOR i IN 1..array_length(words, 1) LOOP
    word := words[i];
    
    -- First word is always capitalized
    IF i = 1 THEN
      result := array_append(result, UPPER(SUBSTRING(word, 1, 1)) || SUBSTRING(word, 2));
    -- Small words stay lowercase unless they're single-letter words
    ELSIF word = ANY(lowercase_words) AND LENGTH(word) > 1 THEN
      result := array_append(result, word);
    -- Capitalize first letter of other words
    ELSE
      result := array_append(result, UPPER(SUBSTRING(word, 1, 1)) || SUBSTRING(word, 2));
    END IF;
  END LOOP;
  
  -- Join words back together
  RETURN array_to_string(result, ' ');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update all existing song requests with normalized casing
-- Only update if the value is different (to avoid unnecessary updates)
UPDATE crowd_requests
SET 
  song_title = CASE 
    WHEN song_title IS NOT NULL AND TRIM(song_title) != '' 
    THEN to_title_case(song_title)
    ELSE song_title
  END,
  song_artist = CASE 
    WHEN song_artist IS NOT NULL AND TRIM(song_artist) != '' 
    THEN to_title_case(song_artist)
    ELSE song_artist
  END,
  updated_at = NOW()
WHERE 
  request_type = 'song_request'
  AND (
    -- Only update if the normalized value would be different
    (song_title IS NOT NULL AND TRIM(song_title) != '' AND song_title != to_title_case(song_title))
    OR
    (song_artist IS NOT NULL AND TRIM(song_artist) != '' AND song_artist != to_title_case(song_artist))
  );

-- Log the number of records updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % crowd request records with normalized casing', updated_count;
END $$;

-- Add comment to function for documentation
COMMENT ON FUNCTION to_title_case(TEXT) IS 'Converts text to title case following typical English language rules. First word is always capitalized, small words (and, or, the, etc.) remain lowercase unless first word.';

