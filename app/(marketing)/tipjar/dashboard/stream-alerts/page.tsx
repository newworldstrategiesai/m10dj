'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TipJarHeader from '@/components/tipjar/Header';

interface StreamAlertConfig {
  id?: string;
  user_id?: string;
  username: string;
  theme: 'dark' | 'neon' | 'retro' | 'minimal' | 'pride';
  background_image_url: string;
  font_color: string;
  layout_position: 'left' | 'right' | 'top' | 'bottom' | 'center';
  alert_duration_ms: number;
  sound_enabled: boolean;
  sound_volume: number;
  sound_file_url: string;
  built_in_sound: 'default' | 'cash' | 'coin' | 'success' | 'celebration';
  tts_enabled: boolean;
  goal_enabled: boolean;
  goal_title: string;
  goal_amount: number;
  goal_current: number;
  ticker_enabled: boolean;
  ticker_count: number;
  show_branding: boolean;
  pointer_events_disabled: boolean;
  alert_token?: string;
}

export default function StreamAlertsDashboard() {
  const [config, setConfig] = useState<StreamAlertConfig>({
    username: '',
    theme: 'dark',
    background_image_url: '',
    font_color: '#FFFFFF',
    layout_position: 'center',
    alert_duration_ms: 5000,
    sound_enabled: true,
    sound_volume: 0.7,
    sound_file_url: '',
    built_in_sound: 'default',
    tts_enabled: false,
    goal_enabled: false,
    goal_title: '',
    goal_amount: 0,
    goal_current: 0,
    ticker_enabled: true,
    ticker_count: 5,
    show_branding: true,
    pointer_events_disabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertUrl, setAlertUrl] = useState('');
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadConfig() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/tipjar/signin');
        return;
      }

      const { data: existingConfig } = await supabase
        .from('stream_alert_configs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingConfig) {
        setConfig(existingConfig as StreamAlertConfig);
        generateAlertUrl(existingConfig);
      } else {
        // Create default config
        const { data: newConfig } = await supabase
          .from('stream_alert_configs')
          .insert({
            user_id: user.id,
            username: user.email?.split('@')[0] || '',
            alert_token: generateToken(),
          } as any)
          .select()
          .single();

        if (newConfig) {
          setConfig(newConfig as StreamAlertConfig);
          generateAlertUrl(newConfig);
        }
      }

      setLoading(false);
    }

    loadConfig();
  }, [supabase, router]);

  function generateToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function generateAlertUrl(configData: any) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tipjar.live';
    if (configData.username) {
      setAlertUrl(`${baseUrl}/tipjar/alerts/@${configData.username}`);
    } else if (configData.alert_token) {
      setAlertUrl(`${baseUrl}/tipjar/alerts?user=${configData.alert_token}`);
    }
  }

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('stream_alert_configs')
      .upsert({
        user_id: user.id,
        ...config,
        updated_at: new Date().toISOString(),
      } as any, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration');
    } else {
      alert('Configuration saved!');
      generateAlertUrl(config);
    }

    setSaving(false);
  }

  async function handleTestAlert() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create a test alert event
    const testEvent = {
      user_id: user.id,
      event_type: 'tip',
      event_data: {
        amount: 20,
        name: 'Test Donor',
        message: 'This is a test alert!',
      },
    };

    const { error } = await supabase
      .from('stream_alert_events')
      .insert(testEvent as any);

    if (error) {
      console.error('Error creating test alert:', error);
      alert('Failed to create test alert');
    } else {
      alert('Test alert sent! Check your alerts page.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <TipJarHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TipJarHeader />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Stream Alerts Configuration</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your real-time stream alerts for OBS, Streamlabs, and more
          </p>
        </div>

        {/* Alert URL Card */}
        <Card className="mb-8 border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle>Your Alert URL</CardTitle>
            <CardDescription>
              Copy this URL and add it as a Browser Source in OBS Studio, Streamlabs, or your streaming software
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={alertUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(alertUrl);
                  alert('URL copied to clipboard!');
                }}
              >
                Copy
              </Button>
            </div>
            <div className="mt-4">
              <Button onClick={handleTestAlert} variant="outline">
                Test Alert
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="appearance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="sounds">Sounds</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Theme</Label>
                  <Select
                    value={config.theme}
                    onValueChange={(value: any) => setConfig({ ...config, theme: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="neon">Neon</SelectItem>
                      <SelectItem value="retro">Retro</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="pride">Pride</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Layout Position</Label>
                  <Select
                    value={config.layout_position}
                    onValueChange={(value: any) => setConfig({ ...config, layout_position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Font Color</Label>
                  <Input
                    type="color"
                    value={config.font_color}
                    onChange={(e) => setConfig({ ...config, font_color: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Background Image URL (optional)</Label>
                  <Input
                    type="url"
                    value={config.background_image_url}
                    onChange={(e) => setConfig({ ...config, background_image_url: e.target.value })}
                    placeholder="https://example.com/background.jpg"
                  />
                </div>

                <div>
                  <Label>Alert Duration (milliseconds)</Label>
                  <Input
                    type="number"
                    value={config.alert_duration_ms}
                    onChange={(e) => setConfig({ ...config, alert_duration_ms: parseInt(e.target.value) || 5000 })}
                    min="1000"
                    max="30000"
                    step="500"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sounds">
            <Card>
              <CardHeader>
                <CardTitle>Sound Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label>Enable Sounds</Label>
                  <Switch
                    checked={config.sound_enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, sound_enabled: checked })}
                  />
                </div>

                {config.sound_enabled && (
                  <>
                    <div>
                      <Label>Built-in Sound</Label>
                      <Select
                        value={config.built_in_sound}
                        onValueChange={(value: any) => setConfig({ ...config, built_in_sound: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="coin">Coin</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="celebration">Celebration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Custom Sound URL (optional)</Label>
                      <Input
                        type="url"
                        value={config.sound_file_url}
                        onChange={(e) => setConfig({ ...config, sound_file_url: e.target.value })}
                        placeholder="https://example.com/sound.mp3"
                      />
                    </div>

                    <div>
                      <Label>Volume: {Math.round(config.sound_volume * 100)}%</Label>
                      <Input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.sound_volume}
                        onChange={(e) => setConfig({ ...config, sound_volume: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Text-to-Speech</Label>
                      <Switch
                        checked={config.tts_enabled}
                        onCheckedChange={(checked) => setConfig({ ...config, tts_enabled: checked })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Feature Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label>Enable Goal Bar</Label>
                  <Switch
                    checked={config.goal_enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, goal_enabled: checked })}
                  />
                </div>

                {config.goal_enabled && (
                  <>
                    <div>
                      <Label>Goal Title</Label>
                      <Input
                        value={config.goal_title}
                        onChange={(e) => setConfig({ ...config, goal_title: e.target.value })}
                        placeholder="New Deck"
                      />
                    </div>

                    <div>
                      <Label>Goal Amount ($)</Label>
                      <Input
                        type="number"
                        value={config.goal_amount}
                        onChange={(e) => setConfig({ ...config, goal_amount: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <Label>Enable Donor Ticker</Label>
                  <Switch
                    checked={config.ticker_enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, ticker_enabled: checked })}
                  />
                </div>

                {config.ticker_enabled && (
                  <div>
                    <Label>Number of Donors to Show</Label>
                    <Input
                      type="number"
                      value={config.ticker_count}
                      onChange={(e) => setConfig({ ...config, ticker_count: parseInt(e.target.value) || 5 })}
                      min="1"
                      max="20"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label>Show "Powered by TipJar.live" Badge</Label>
                  <Switch
                    checked={config.show_branding}
                    onCheckedChange={(checked) => setConfig({ ...config, show_branding: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Disable Pointer Events</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Recommended for OBS overlays. Prevents clicks from interfering with your stream.
                    </p>
                  </div>
                  <Switch
                    checked={config.pointer_events_disabled}
                    onCheckedChange={(checked) => setConfig({ ...config, pointer_events_disabled: checked })}
                  />
                </div>

                <div>
                  <Label>Username (for @username URL)</Label>
                  <Input
                    value={config.username}
                    onChange={(e) => setConfig({ ...config, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    placeholder="yourusername"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    This allows viewers to access your alerts at /alerts/@yourusername
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
}

