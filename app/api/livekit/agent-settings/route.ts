import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type AgentSettingsRow = {
  id: string;
  organization_id: string | null;
  name: string;
  agent_name: string;
  instructions: string | null;
  greeting_text: string | null;
  stt_model: string | null;
  stt_language: string | null;
  llm_model: string | null;
  tts_model: string | null;
  tts_voice_id: string | null;
  tts_language: string | null;
  background_audio_clip: string | null;
  background_audio_volume: number | null;
  role: string | null;
  company_name: string | null;
  prompt: string | null;
  first_message_template: string | null;
  extra: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

/** GET: return platform default M10 agent settings (for admin UI and Dialer). */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseService
      .from('livekit_agent_settings')
      .select('*')
      .is('organization_id', null)
      .eq('name', 'default_m10')
      .maybeSingle();

    if (error) {
      console.error('livekit_agent_settings GET:', error);
      return NextResponse.json(
        { error: 'Failed to load agent settings', message: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({
        agent_name: 'Ben',
        role: 'Voice Assistant',
        company_name: 'M10 DJ Company',
        prompt: '',
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
        first_message_template: null,
        extra: {},
      });
    }

    const row = data as AgentSettingsRow;
    return NextResponse.json({
      id: row.id,
      organization_id: row.organization_id,
      name: row.name,
      agent_name: row.agent_name,
      instructions: row.instructions ?? null,
      greeting_text: row.greeting_text ?? null,
      stt_model: row.stt_model ?? 'assemblyai/universal-streaming',
      stt_language: row.stt_language ?? 'en',
      llm_model: row.llm_model ?? 'openai/gpt-4.1-mini',
      tts_model: row.tts_model ?? 'elevenlabs/eleven_turbo_v2',
      tts_voice_id: row.tts_voice_id ?? null,
      tts_language: row.tts_language ?? 'en',
      background_audio_clip: row.background_audio_clip ?? 'crowded_room',
      background_audio_volume: row.background_audio_volume ?? 0.3,
      role: row.role ?? 'Voice Assistant',
      company_name: row.company_name ?? 'M10 DJ Company',
      prompt: row.prompt ?? null,
      first_message_template: row.first_message_template ?? null,
      extra: row.extra ?? {},
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (e) {
    console.error('agent-settings GET:', e);
    return NextResponse.json(
      { error: 'Failed to load agent settings', message: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/** PATCH: update platform default M10 agent settings (admin only). */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      agent_name,
      instructions,
      greeting_text,
      stt_model,
      stt_language,
      llm_model,
      tts_model,
      tts_voice_id,
      tts_language,
      background_audio_clip,
      background_audio_volume,
      role,
      company_name,
      prompt,
      first_message_template,
      extra,
    } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (agent_name !== undefined) updates.agent_name = agent_name;
    if (instructions !== undefined) updates.instructions = instructions;
    if (greeting_text !== undefined) updates.greeting_text = greeting_text;
    if (stt_model !== undefined) updates.stt_model = stt_model;
    if (stt_language !== undefined) updates.stt_language = stt_language;
    if (llm_model !== undefined) updates.llm_model = llm_model;
    if (tts_model !== undefined) updates.tts_model = tts_model;
    if (tts_voice_id !== undefined) updates.tts_voice_id = tts_voice_id;
    if (tts_language !== undefined) updates.tts_language = tts_language;
    if (background_audio_clip !== undefined) updates.background_audio_clip = background_audio_clip;
    if (typeof background_audio_volume === 'number') updates.background_audio_volume = background_audio_volume;
    if (role !== undefined) updates.role = role;
    if (company_name !== undefined) updates.company_name = company_name;
    if (prompt !== undefined) updates.prompt = prompt;
    if (first_message_template !== undefined) updates.first_message_template = first_message_template;
    if (extra !== undefined) updates.extra = extra;

    const { data, error } = await supabaseService
      .from('livekit_agent_settings')
      .update(updates)
      .is('organization_id', null)
      .eq('name', 'default_m10')
      .select()
      .single();

    if (error) {
      console.error('livekit_agent_settings PATCH:', error);
      return NextResponse.json(
        { error: 'Failed to update agent settings', message: error.message },
        { status: 500 }
      );
    }

    const row = data as AgentSettingsRow;
    return NextResponse.json({
      id: row.id,
      agent_name: row.agent_name,
      instructions: row.instructions,
      greeting_text: row.greeting_text,
      stt_model: row.stt_model,
      stt_language: row.stt_language,
      llm_model: row.llm_model,
      tts_model: row.tts_model,
      tts_voice_id: row.tts_voice_id,
      tts_language: row.tts_language,
      background_audio_clip: row.background_audio_clip,
      background_audio_volume: row.background_audio_volume,
      role: row.role,
      company_name: row.company_name,
      prompt: row.prompt,
      first_message_template: row.first_message_template,
      extra: row.extra,
      updated_at: row.updated_at,
    });
  } catch (e) {
    console.error('agent-settings PATCH:', e);
    return NextResponse.json(
      { error: 'Failed to update agent settings', message: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
