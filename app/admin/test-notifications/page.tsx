'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconAlertCircle, IconCheck, IconX, IconLoader2, IconMail, IconPhone } from '@tabler/icons-react';

export default function TestNotificationsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/test-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Test failed:', error);
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Notification System Diagnostics
          </h1>
          <p className="text-gray-600 mb-6">
            Test SMS and Email notifications to ensure contact form submissions trigger alerts
          </p>

          <Button
            onClick={runTest}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
          >
            {isLoading ? (
              <>
                <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                Run Notification Tests
              </>
            )}
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className={`p-4 rounded-lg border-2 ${results.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
              <div className="flex items-center gap-2">
                {results.success ? (
                  <>
                    <IconCheck className="h-5 w-5 text-green-600" />
                    <span className="text-green-900 font-semibold">
                      At least one notification method is working
                    </span>
                  </>
                ) : (
                  <>
                    <IconX className="h-5 w-5 text-red-600" />
                    <span className="text-red-900 font-semibold">
                      All notification methods failed
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Environment Variables */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Environment Configuration</h2>
              <div className="grid grid-cols-2 gap-4">
                {results.results?.environment && Object.entries(results.results.environment).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center gap-2">
                    {value === true || (typeof value === 'string' && !value.includes('NOT SET')) ? (
                      <IconCheck className="h-4 w-4 text-green-600" />
                    ) : (
                      <IconX className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm text-gray-700">{key}:</span>
                    <span className="text-sm font-mono text-gray-900">
                      {typeof value === 'boolean' ? (value ? '✓' : '✗') : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SMS Test Results */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <IconPhone className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">SMS Notification Test</h2>
              </div>
              
              {results.results?.sms ? (
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg ${results.results.sms.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {results.results.sms.success ? (
                        <>
                          <IconCheck className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-900">SMS Test Passed</span>
                        </>
                      ) : (
                        <>
                          <IconX className="h-5 w-5 text-red-600" />
                          <span className="font-semibold text-red-900">SMS Test Failed</span>
                        </>
                      )}
                    </div>
                    
                    {results.results.sms.success ? (
                      <div className="text-sm text-gray-700 space-y-1">
                        <p><strong>Message SID:</strong> {results.results.sms.sid}</p>
                        <p><strong>Status:</strong> {results.results.sms.status}</p>
                        <p><strong>To:</strong> {results.results.sms.to}</p>
                        <p><strong>From:</strong> {results.results.sms.from}</p>
                        <p className="text-green-700 font-semibold mt-2">
                          ✅ Check your phone for the test message!
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-red-700">
                        <p><strong>Error:</strong> {results.results.sms.error}</p>
                        {results.results.sms.stack && (
                          <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                            {results.results.sms.stack}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No SMS test results available</p>
              )}
            </div>

            {/* Email Test Results */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <IconMail className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Email Notification Test</h2>
              </div>
              
              {results.results?.email ? (
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg ${results.results.email.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {results.results.email.success ? (
                        <>
                          <IconCheck className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-900">Email Test Passed</span>
                        </>
                      ) : (
                        <>
                          <IconX className="h-5 w-5 text-red-600" />
                          <span className="font-semibold text-red-900">Email Test Failed</span>
                        </>
                      )}
                    </div>
                    
                    {results.results.email.success ? (
                      <div className="text-sm text-gray-700 space-y-1">
                        <p><strong>Email ID:</strong> {results.results.email.emailId}</p>
                        <p><strong>To:</strong> {results.results.email.to}</p>
                        <p className="text-green-700 font-semibold mt-2">
                          ✅ Check your inbox for the test email!
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-red-700">
                        <p><strong>Error:</strong> {results.results.email.error}</p>
                        {results.results.email.stack && (
                          <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                            {results.results.email.stack}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No email test results available</p>
              )}
            </div>

            {/* Recommendations */}
            {results.summary?.recommendations && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <IconAlertCircle className="h-6 w-6 text-orange-600" />
                  Recommendations
                </h2>
                <ul className="space-y-2">
                  {results.summary.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">→</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Raw Results */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Raw Test Results</h2>
              <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-2">How to use this tool:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Click "Run Notification Tests" button above</li>
            <li>The system will attempt to send both SMS and email</li>
            <li>Check your phone and email inbox for test messages</li>
            <li>Review any errors or configuration issues reported</li>
            <li>Fix any environment variables that are missing</li>
            <li>Run the test again to verify fixes</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

