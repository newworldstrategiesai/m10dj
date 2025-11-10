'use client';

import React, { useState } from 'react';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface SMSAssistantSettingsProps {
  enabled: boolean;
  prompt: string;
  onEnabledChange: (enabled: boolean) => void;
  onPromptChange: (prompt: string) => void;
  onSave: () => void;
}

export default function SMSAssistantSettings({
  enabled,
  prompt,
  onEnabledChange,
  onPromptChange,
  onSave
}: SMSAssistantSettingsProps) {
  return (
    <div className="w-full max-w-3xl m-auto my-8 border rounded-md p-6 border-zinc-700">
      <h3 className="text-lg font-semibold mb-4">SMS Assistant Settings</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="sms-assistant"
            checked={enabled}
            onCheckedChange={onEnabledChange}
          />
          <Label htmlFor="sms-assistant">
            Enable SMS Assistant
          </Label>
        </div>

        {enabled && (
          <div>
            <Label htmlFor="assistant-prompt" className="block mb-2">
              Assistant Prompt
            </Label>
            <Textarea
              id="assistant-prompt"
              placeholder="Enter your AI assistant prompt here..."
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              rows={4}
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">
              This prompt will guide how the AI assistant responds to SMS messages.
            </p>
          </div>
        )}

        <Button onClick={onSave} className="w-full">
          Save Settings
        </Button>
      </div>
    </div>
  );
}