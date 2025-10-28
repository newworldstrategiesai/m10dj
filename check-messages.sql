-- Check if instagram_messages table has any data
SELECT COUNT(*) as instagram_count FROM instagram_messages;

-- Check if messenger_messages table has any data
SELECT COUNT(*) as messenger_count FROM messenger_messages;

-- Show recent Instagram messages if any
SELECT * FROM instagram_messages ORDER BY timestamp DESC LIMIT 5;

-- Show recent Messenger messages if any
SELECT * FROM messenger_messages ORDER BY timestamp DESC LIMIT 5;

-- Check webhook logs
SELECT * FROM instagram_sync_log ORDER BY started_at DESC LIMIT 5;
SELECT * FROM messenger_sync_log ORDER BY started_at DESC LIMIT 5;
