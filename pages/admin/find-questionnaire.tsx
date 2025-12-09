'use client';

import React, { useState } from 'react';
import { Search, Loader2, Music, CheckCircle, Clock, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toasts/use-toast';
import Link from 'next/link';

export default function FindQuestionnairePage() {
  const [searchTerm, setSearchTerm] = useState('veronica gomez');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a search term',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/find-questionnaire?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search');
      }

      setResults(data);
    } catch (error: any) {
      console.error('Error searching:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to search for questionnaire',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Link copied to clipboard'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Music className="w-6 h-6" />
            Find Questionnaire
          </h1>
          
          <div className="flex gap-2 mb-4">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone (e.g., veronica gomez)"
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>

        {results && (
          <div className="space-y-4">
            {results.found ? (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Found <strong>{results.totalContacts}</strong> contact(s) matching "{results.searchTerm}"
                    {results.contactsWithQuestionnaires > 0 && (
                      <> • <strong>{results.contactsWithQuestionnaires}</strong> have questionnaire(s)</>
                    )}
                    {results.completedQuestionnaires > 0 && (
                      <> • <strong>{results.completedQuestionnaires}</strong> completed</>
                    )}
                  </p>
                </div>

                {results.results.map((result: any, index: number) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {result.contact.name}
                        </h2>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {result.contact.email && (
                            <p>📧 {result.contact.email}</p>
                          )}
                          {result.contact.phone && (
                            <p>📞 {result.contact.phone}</p>
                          )}
                          {result.contact.eventType && (
                            <p>🎉 {result.contact.eventType}</p>
                          )}
                          {result.contact.eventDate && (
                            <p>📅 {new Date(result.contact.eventDate).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/admin/contacts/${result.contact.id}`}>
                          <Button variant="outline" size="sm">
                            View Contact
                          </Button>
                        </Link>
                        {result.questionnaireUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(result.questionnaireUrl)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy Link
                          </Button>
                        )}
                      </div>
                    </div>

                    {result.hasQuestionnaire ? (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <div className="flex items-center gap-2 mb-4">
                          {result.questionnaireStatus === 'completed' ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                Questionnaire Completed
                              </span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                              <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                                Questionnaire In Progress
                              </span>
                            </>
                          )}
                        </div>

                        {result.questionnaire && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {result.questionnaire.startedAt && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Started:</span>
                                  <p className="font-medium">
                                    {new Date(result.questionnaire.startedAt).toLocaleString()}
                                  </p>
                                </div>
                              )}
                              {result.questionnaire.updatedAt && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                                  <p className="font-medium">
                                    {new Date(result.questionnaire.updatedAt).toLocaleString()}
                                  </p>
                                </div>
                              )}
                              {result.questionnaire.completedAt && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Completed:</span>
                                  <p className="font-medium text-green-600 dark:text-green-400">
                                    {new Date(result.questionnaire.completedAt).toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>

                            {result.questionnaire.hasData && (
                              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Questionnaire Responses:</h3>
                                
                                {result.questionnaire.data.bigNoSongs && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      ❌ Do Not Play Songs:
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {result.questionnaire.data.bigNoSongs}
                                    </p>
                                  </div>
                                )}

                                {result.questionnaire.data.specialDances && result.questionnaire.data.specialDances.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      💃 Special Dances:
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {result.questionnaire.data.specialDances.join(', ')}
                                    </p>
                                  </div>
                                )}

                                {result.questionnaire.data.playlistLinks && Object.values(result.questionnaire.data.playlistLinks).some((link: any) => link) && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      🎧 Playlist Links:
                                    </p>
                                    <div className="space-y-1">
                                      {Object.entries(result.questionnaire.data.playlistLinks).map(([type, link]: [string, any]) => (
                                        link && (
                                          <a
                                            key={type}
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                          >
                                            {type}: {link}
                                            <ExternalLink className="w-3 h-3" />
                                          </a>
                                        )
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {result.questionnaire.data.ceremonyMusicType && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      🎼 Ceremony Music Type:
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {result.questionnaire.data.ceremonyMusicType}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {result.questionnaireUrl && (
                              <div className="mt-4">
                                <Link href={result.questionnaireUrl} target="_blank">
                                  <Button className="w-full">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Open Questionnaire
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <AlertCircle className="w-5 h-5" />
                          <span>No questionnaire found for this contact</span>
                        </div>
                        {result.questionnaireUrl && (
                          <Link href={result.questionnaireUrl} target="_blank" className="mt-2 inline-block">
                            <Button variant="outline" size="sm">
                              Create Questionnaire
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertCircle className="w-5 h-5" />
                  <p>{results.message}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

