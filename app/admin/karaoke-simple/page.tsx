'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import KaraokeLayout from '@/components/karaoke/KaraokeLayout';
import DiscoverPage from '@/components/karaoke/DiscoverPage';

export default function KaraokeSimplePage() {
  const [activeTab, setActiveTab] = useState('discover');

  return (
    <KaraokeLayout title="Discover" currentPage="discover">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <DiscoverPage isPremium={false} />
        </TabsContent>

        <TabsContent value="queue" className="space-y-6">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Queue functionality coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-6">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Video management coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Settings coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </KaraokeLayout>
  );
}