'use client';

/**
 * Shared form for LiveKit voice agent settings (Ben).
 * Used by the admin Voice Agent Settings page and by the Dialer agent-settings modal.
 * All fields are dynamic and persisted to the DB via PATCH /api/livekit/agent-settings.
 */

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Mic, MessageSquare, Volume2, Save, Loader2 } from 'lucide-react';

export type VoiceAgentSettingsFormData = {
  id?: string;
  agent_name: string;
  instructions: string | null;
  greeting_text: string | null;
  stt_model: string;
  stt_language: string;
  llm_model: string;
  tts_model: string;
  tts_voice_id: string | null;
  tts_language: string;
  background_audio_clip: string;
  background_audio_volume: number;
  role: string;
  company_name: string;
  prompt: string | null;
  first_message_template: string | null;
  extra?: Record<string, unknown>;
  updated_at?: string;
};

interface VoiceAgentSettingsFormProps {
  settings: VoiceAgentSettingsFormData;
  setSettings: React.Dispatch<React.SetStateAction<VoiceAgentSettingsFormData>>;
  onSave: () => Promise<void>;
  saving: boolean;
  /** When true, show a link to the full admin page (e.g. from Dialer modal) */
  showLinkToFullPage?: boolean;
  /** Compact mode: fewer rows on textareas, no cards (for modal) */
  compact?: boolean;
}

export function VoiceAgentSettingsForm({
  settings,
  setSettings,
  onSave,
  saving,
  showLinkToFullPage,
  compact,
}: VoiceAgentSettingsFormProps) {
  const CardWrapper = compact ? React.Fragment : Card;
  const cardProps = compact ? {} : { className: 'border-border bg-card text-card-foreground dark:border-border' };
  const headerProps = compact ? {} : { className: 'border-border bg-card text-card-foreground dark:border-border' };

  return (
    <div className="space-y-4">
      {showLinkToFullPage && (
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/calls/agent-settings" className="text-primary hover:underline">
            Open full Voice agent settings page
          </Link>
        </p>
      )}

      <CardWrapper {...cardProps}>
        {!compact && (
          <CardHeader {...headerProps}>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Agent identity & display
            </CardTitle>
            <CardDescription>
              LiveKit agent name (must match deployed agent) and how the agent appears in the Dialer.
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className={compact ? 'p-0 space-y-4' : 'space-y-4'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vas-agent_name">Agent name (LiveKit)</Label>
              <Input
                id="vas-agent_name"
                value={settings.agent_name}
                onChange={(e) => setSettings((s) => ({ ...s, agent_name: e.target.value }))}
                placeholder="Ben"
              />
              {!compact && (
                <p className="text-xs text-muted-foreground">Must match the agent_name in your deployed Python agent.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vas-role">Role</Label>
              <Input
                id="vas-role"
                value={settings.role}
                onChange={(e) => setSettings((s) => ({ ...s, role: e.target.value }))}
                placeholder="Voice Assistant"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vas-company_name">Company name</Label>
            <Input
              id="vas-company_name"
              value={settings.company_name}
              onChange={(e) => setSettings((s) => ({ ...s, company_name: e.target.value }))}
              placeholder="M10 DJ Company"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vas-prompt">Short prompt (optional)</Label>
            <Textarea
              id="vas-prompt"
              value={settings.prompt ?? ''}
              onChange={(e) => setSettings((s) => ({ ...s, prompt: e.target.value || null }))}
              placeholder="You are the voice assistant for M10 DJ Company..."
              rows={compact ? 2 : 2}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vas-first_message_template">First message template (optional)</Label>
            <Input
              id="vas-first_message_template"
              value={settings.first_message_template ?? ''}
              onChange={(e) => setSettings((s) => ({ ...s, first_message_template: e.target.value || null }))}
              placeholder="{agentName} with {companyName}. Am I speaking with {firstName}?"
            />
            {!compact && (
              <p className="text-xs text-muted-foreground">Placeholders: agentName, companyName, firstName</p>
            )}
          </div>
        </CardContent>
      </CardWrapper>

      <CardWrapper {...cardProps}>
        {!compact && (
          <CardHeader {...headerProps}>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Instructions & greeting
            </CardTitle>
            <CardDescription>
              System instructions for the LLM and the first thing the agent says when joining a call.
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className={compact ? 'p-0 space-y-4' : 'space-y-4'}>
          <div className="space-y-2">
            <Label htmlFor="vas-instructions">System instructions</Label>
            <Textarea
              id="vas-instructions"
              value={settings.instructions ?? ''}
              onChange={(e) => setSettings((s) => ({ ...s, instructions: e.target.value || null }))}
              placeholder="You are the voice assistant for M10 DJ Company..."
              rows={compact ? 8 : 12}
              className="resize-y font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vas-greeting_text">Greeting (on enter)</Label>
            <Textarea
              id="vas-greeting_text"
              value={settings.greeting_text ?? ''}
              onChange={(e) => setSettings((s) => ({ ...s, greeting_text: e.target.value || null }))}
              placeholder="Greet the caller and say you're with M10 DJ Company..."
              rows={2}
              className="resize-none"
            />
          </div>
        </CardContent>
      </CardWrapper>

      <CardWrapper {...cardProps}>
        {!compact && (
          <CardHeader {...headerProps}>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Speech-to-Text (STT)
            </CardTitle>
            <CardDescription>Model and language for transcribing the user.</CardDescription>
          </CardHeader>
        )}
        <CardContent className={compact ? 'p-0 space-y-4' : 'space-y-4'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vas-stt_model">STT model</Label>
              <Input
                id="vas-stt_model"
                value={settings.stt_model}
                onChange={(e) => setSettings((s) => ({ ...s, stt_model: e.target.value }))}
                placeholder="assemblyai/universal-streaming"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vas-stt_language">STT language</Label>
              <Input
                id="vas-stt_language"
                value={settings.stt_language}
                onChange={(e) => setSettings((s) => ({ ...s, stt_language: e.target.value }))}
                placeholder="en"
              />
            </div>
          </div>
        </CardContent>
      </CardWrapper>

      <CardWrapper {...cardProps}>
        {!compact && (
          <CardHeader {...headerProps}>
            <CardTitle>LLM</CardTitle>
            <CardDescription>Model for the language model.</CardDescription>
          </CardHeader>
        )}
        <CardContent className={compact ? 'p-0' : ''}>
          <div className="space-y-2">
            <Label htmlFor="vas-llm_model">LLM model</Label>
            <Input
              id="vas-llm_model"
              value={settings.llm_model}
              onChange={(e) => setSettings((s) => ({ ...s, llm_model: e.target.value }))}
              placeholder="openai/gpt-4.1-mini"
            />
          </div>
        </CardContent>
      </CardWrapper>

      <CardWrapper {...cardProps}>
        {!compact && (
          <CardHeader {...headerProps}>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Text-to-Speech (TTS)
            </CardTitle>
            <CardDescription>Model, voice, and language for the agent&apos;s speech.</CardDescription>
          </CardHeader>
        )}
        <CardContent className={compact ? 'p-0 space-y-4' : 'space-y-4'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vas-tts_model">TTS model</Label>
              <Input
                id="vas-tts_model"
                value={settings.tts_model}
                onChange={(e) => setSettings((s) => ({ ...s, tts_model: e.target.value }))}
                placeholder="elevenlabs/eleven_turbo_v2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vas-tts_voice_id">TTS voice ID</Label>
              <Input
                id="vas-tts_voice_id"
                value={settings.tts_voice_id ?? ''}
                onChange={(e) => setSettings((s) => ({ ...s, tts_voice_id: e.target.value || null }))}
                placeholder="iP95p4xoKVk53GoZ742B"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vas-tts_language">TTS language</Label>
            <Input
              id="vas-tts_language"
              value={settings.tts_language}
              onChange={(e) => setSettings((s) => ({ ...s, tts_language: e.target.value }))}
              placeholder="en"
            />
          </div>
        </CardContent>
      </CardWrapper>

      <CardWrapper {...cardProps}>
        {!compact && (
          <CardHeader {...headerProps}>
            <CardTitle>Background audio</CardTitle>
            <CardDescription>Ambient sound and volume (e.g. crowded_room).</CardDescription>
          </CardHeader>
        )}
        <CardContent className={compact ? 'p-0 space-y-4' : 'space-y-4'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vas-background_audio_clip">Clip</Label>
              <Input
                id="vas-background_audio_clip"
                value={settings.background_audio_clip}
                onChange={(e) => setSettings((s) => ({ ...s, background_audio_clip: e.target.value }))}
                placeholder="crowded_room"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vas-background_audio_volume">Volume (0–1)</Label>
              <Input
                id="vas-background_audio_volume"
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={settings.background_audio_volume}
                onChange={(e) => setSettings((s) => ({ ...s, background_audio_volume: parseFloat(e.target.value) || 0.3 }))}
              />
            </div>
          </div>
        </CardContent>
      </CardWrapper>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {settings.updated_at ? `Last updated: ${new Date(settings.updated_at).toLocaleString()}` : 'Save to apply changes.'}
        </p>
        <Button onClick={onSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save all
        </Button>
      </div>
    </div>
  );
}
