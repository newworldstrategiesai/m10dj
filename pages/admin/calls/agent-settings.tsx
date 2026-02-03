/**
 * Voice Agent Settings – configure the default M10 LiveKit agent (Ben).
 * All changes are persisted and used by the Dialer and by the deployed Python agent.
 * Uses shared VoiceAgentSettingsForm (also used in Dialer modal).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/layouts/AdminLayout';
import PageLoadingWrapper from '@/components/ui/PageLoadingWrapper';
import { Button } from '@/components/ui/button';
import { VoiceAgentSettingsForm, type VoiceAgentSettingsFormData } from '@/components/admin/VoiceAgentSettingsForm';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const defaultSettings: VoiceAgentSettingsFormData = {
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
  role: 'Voice Assistant',
  company_name: 'M10 DJ Company',
  prompt: null,
  first_message_template: null,
};

export default function VoiceAgentSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<VoiceAgentSettingsFormData>(defaultSettings);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/livekit/agent-settings');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/signin?redirect=/admin/calls/agent-settings');
          return;
        }
        throw new Error((await res.json()).error || 'Failed to load');
      }
      const data = await res.json();
      setSettings({
        agent_name: data.agent_name ?? defaultSettings.agent_name,
        instructions: data.instructions ?? defaultSettings.instructions,
        greeting_text: data.greeting_text ?? defaultSettings.greeting_text,
        stt_model: data.stt_model ?? defaultSettings.stt_model,
        stt_language: data.stt_language ?? defaultSettings.stt_language,
        llm_model: data.llm_model ?? defaultSettings.llm_model,
        tts_model: data.tts_model ?? defaultSettings.tts_model,
        tts_voice_id: data.tts_voice_id ?? defaultSettings.tts_voice_id,
        tts_language: data.tts_language ?? defaultSettings.tts_language,
        background_audio_clip: data.background_audio_clip ?? defaultSettings.background_audio_clip,
        background_audio_volume: typeof data.background_audio_volume === 'number' ? data.background_audio_volume : defaultSettings.background_audio_volume,
        role: data.role ?? defaultSettings.role,
        company_name: data.company_name ?? defaultSettings.company_name,
        prompt: data.prompt ?? defaultSettings.prompt,
        first_message_template: data.first_message_template ?? defaultSettings.first_message_template,
        extra: data.extra,
        id: data.id,
        updated_at: data.updated_at,
      });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to load agent settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/livekit/agent-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_name: settings.agent_name,
          instructions: settings.instructions || null,
          greeting_text: settings.greeting_text || null,
          stt_model: settings.stt_model,
          stt_language: settings.stt_language,
          llm_model: settings.llm_model,
          tts_model: settings.tts_model,
          tts_voice_id: settings.tts_voice_id || null,
          tts_language: settings.tts_language,
          background_audio_clip: settings.background_audio_clip,
          background_audio_volume: settings.background_audio_volume,
          role: settings.role,
          company_name: settings.company_name,
          prompt: settings.prompt || null,
          first_message_template: settings.first_message_template || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Failed to save');
      }
      const data = await res.json();
      if (data.updated_at) setSettings((s) => ({ ...s, updated_at: data.updated_at }));
      toast({ title: 'Saved', description: 'Agent settings updated. They apply to the next call and to the deployed agent.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Voice Agent Settings" description="Configure the default M10 voice agent">
        <PageLoadingWrapper isLoading={true} message="Loading agent settings...">
          <div className="min-h-[40vh]" />
        </PageLoadingWrapper>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Voice Agent Settings"
      description="Configure the default M10 voice agent (Ben)"
      showPageTitle
      pageTitle="Voice Agent Settings"
      pageDescription="Edit instructions, greeting, STT/LLM/TTS, and display settings. Used by the Dialer and by the deployed LiveKit agent."
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/calls">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Calls
            </Button>
          </Link>
        </div>

        <VoiceAgentSettingsForm
          settings={settings}
          setSettings={setSettings}
          onSave={handleSave}
          saving={saving}
        />
      </div>
    </AdminLayout>
  );
}
