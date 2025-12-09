'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toasts/use-toast';

export default function EmbedPage() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Example embed code - replace with actual user-specific code
  const embedCode = `<script src="https://tipjar.live/embed.js" data-tipjar-id="your-id"></script>`;
  
  const wordpressCode = `<!-- Add this to your WordPress theme's footer.php or use a plugin -->
${embedCode}`;
  
  const wixCode = `<!-- Add this to your Wix site's Settings > Custom Code > Footer -->
${embedCode}`;
  
  const squarespaceCode = `<!-- Add this to Settings > Advanced > Code Injection > Footer -->
${embedCode}`;
  
  const htmlCode = `<!-- Add this before closing </body> tag -->
${embedCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="bg-tipjar-gradient dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Embed TipJar on Your Website
          </h1>
          <p className="text-xl text-center text-gray-300 max-w-2xl mx-auto">
            One line of code. Works on any website. Customize colors, logo, and more.
          </p>
        </div>
      </section>

      {/* Embed Code Generator */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Customization Panel */}
            <div>
              <Card className="p-8 dark:bg-gray-900 dark:border-gray-800">
                <h2 className="text-2xl font-bold mb-6 dark:text-white">Customize Your Widget</h2>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="primary-color" className="dark:text-white">Primary Color</Label>
                    <Input
                      id="primary-color"
                      type="color"
                      defaultValue="#7C3AED"
                      className="h-12 mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="logo-url" className="dark:text-white">Logo URL (optional)</Label>
                    <Input
                      id="logo-url"
                      type="url"
                      placeholder="https://yourwebsite.com/logo.png"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="welcome-message" className="dark:text-white">Welcome Message</Label>
                    <textarea
                      id="welcome-message"
                      className="w-full mt-2 p-3 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      rows={3}
                      placeholder="Drop a tip for DJ Mike!"
                      defaultValue="Drop a tip for DJ Mike!"
                    />
                  </div>
                  <Button
                    className="w-full bg-tipjar-primary-500 hover:bg-tipjar-primary-600 text-white"
                    onClick={() => toast({
                      title: "Updated!",
                      description: "Your customization settings have been saved",
                    })}
                  >
                    Update Preview
                  </Button>
                </div>
              </Card>
            </div>

            {/* Live Preview */}
            <div>
              <Card className="p-8 dark:bg-gray-900 dark:border-gray-800">
                <h2 className="text-2xl font-bold mb-6 dark:text-white">Live Preview</h2>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 aspect-[9/16] flex flex-col items-center justify-center">
                  <div className="bg-gradient-to-br from-tipjar-primary-500 to-tipjar-accent-500 rounded-lg p-6 w-full text-white text-center">
                    <h3 className="text-xl font-bold mb-2">Drop a tip for DJ Mike!</h3>
                    <p className="text-sm opacity-90 mb-4">Tap to tip instantly</p>
                    <Button className="bg-white text-tipjar-primary-600 hover:bg-gray-100">
                      Tip Now
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Platform-Specific Instructions */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">
            Platform-Specific Instructions
          </h2>
          <Tabs defaultValue="wordpress" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="wordpress">WordPress</TabsTrigger>
              <TabsTrigger value="wix">Wix</TabsTrigger>
              <TabsTrigger value="squarespace">Squarespace</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
            </TabsList>

            <TabsContent value="wordpress">
              <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 dark:text-white">WordPress Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-6">
                  <li>Go to Appearance → Theme Editor</li>
                  <li>Select footer.php</li>
                  <li>Paste the code before the closing &lt;/body&gt; tag</li>
                  <li>Or use a plugin like &quot;Insert Headers and Footers&quot;</li>
                </ol>
                <div className="bg-gray-900 rounded-lg p-4 relative">
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    <code>{wordpressCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(wordpressCode)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="wix">
              <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Wix Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-6">
                  <li>Go to Settings → Custom Code</li>
                  <li>Click &quot;Add Code&quot; → &quot;Body - End&quot;</li>
                  <li>Paste the embed code</li>
                  <li>Click &quot;Apply&quot;</li>
                </ol>
                <div className="bg-gray-900 rounded-lg p-4 relative">
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    <code>{wixCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(wixCode)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="squarespace">
              <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Squarespace Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-6">
                  <li>Go to Settings → Advanced → Code Injection</li>
                  <li>Paste the code in the &quot;Footer&quot; section</li>
                  <li>Click &quot;Save&quot;</li>
                </ol>
                <div className="bg-gray-900 rounded-lg p-4 relative">
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    <code>{squarespaceCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(squarespaceCode)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="html">
              <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 dark:text-white">HTML Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-6">
                  <li>Open your HTML file</li>
                  <li>Find the closing &lt;/body&gt; tag</li>
                  <li>Paste the code before it</li>
                  <li>Save and upload</li>
                </ol>
                <div className="bg-gray-900 rounded-lg p-4 relative">
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    <code>{htmlCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(htmlCode)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-tipjar-cta-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Don&apos;t Have a TipJar Yet?
          </h2>
          <Button
            size="lg"
            className="bg-white text-tipjar-primary-600 hover:bg-gray-100 font-semibold uppercase tracking-wider text-lg px-8 py-6"
            asChild
          >
            <a href="/signup">Create Your TipJar – Takes 60 Seconds</a>
          </Button>
        </div>
      </section>
    </div>
  );
}

