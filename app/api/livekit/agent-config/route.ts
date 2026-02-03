import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/livekit/agent-config
 *
 * Returns LiveKit agent config for the Python (or other) agent to use at runtime.
 * Auth: Bearer token must match LIVEKIT_AGENT_CONFIG_TOKEN (set in env).
 * Used by the config-driven Ben agent so it can load instructions, greeting, STT/LLM/TTS from the admin UI.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = process.env.LIVEKIT_AGENT_CONFIG_TOKEN;
  if (!token || authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('livekit_agent_settings')
    .select('*')
    .is('organization_id', null)
    .eq('name', 'default_m10')
    .maybeSingle();

  if (error) {
    console.error('agent-config GET:', error);
    return NextResponse.json(
      { error: 'Failed to load config', message: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({
      agent_name: 'Ben',
      instructions: null,
      greeting_text: 'Greet the user and offer your assistance.',
      stt_model: 'assemblyai/universal-streaming',
      stt_language: 'en',
      llm_model: 'openai/gpt-4.1-mini',
      tts_model: 'elevenlabs/eleven_turbo_v2',
      tts_voice_id: 'iP95p4xoKVk53GoZ742B',
      tts_language: 'en',
      background_audio_clip: 'crowded_room',
      background_audio_volume: 0.3,
      extra: {},
      auto_answer_enabled: true,
      auto_answer_delay_seconds: 20,
    });
  }

  const row = data as Record<string, unknown>;

  const autoAnswerEnabled =
    typeof row.auto_answer_enabled === 'boolean' ? row.auto_answer_enabled : true;
  let autoAnswerDelay = 20;
  const rawDelay = (row as { auto_answer_delay_seconds?: unknown }).auto_answer_delay_seconds;
  if (typeof rawDelay === 'number' && rawDelay > 0) {
    autoAnswerDelay = rawDelay;
  } else if (typeof rawDelay === 'string') {
    const parsed = parseInt(rawDelay, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      autoAnswerDelay = parsed;
    }
  }

  return NextResponse.json({
    agent_name: row.agent_name ?? 'Ben',
    instructions: row.instructions ?? null,
    greeting_text: row.greeting_text ?? 'Greet the user and offer your assistance.',
    stt_model: row.stt_model ?? 'assemblyai/universal-streaming',
    stt_language: row.stt_language ?? 'en',
    llm_model: row.llm_model ?? 'openai/gpt-4.1-mini',
    tts_model: row.tts_model ?? 'elevenlabs/eleven_turbo_v2',
    tts_voice_id: row.tts_voice_id ?? null,
    tts_language: row.tts_language ?? 'en',
    background_audio_clip: row.background_audio_clip ?? 'crowded_room',
    background_audio_volume: row.background_audio_volume ?? 0.3,
    role: row.role ?? null,
    company_name: row.company_name ?? null,
    prompt: row.prompt ?? null,
    first_message_template: row.first_message_template ?? null,
    extra: row.extra ?? {},
    auto_answer_enabled: autoAnswerEnabled,
    auto_answer_delay_seconds: autoAnswerDelay,
  });
}
