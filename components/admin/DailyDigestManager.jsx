import { useState } from 'react';
import { 
  Clock, 
  Send, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Calendar,
  TrendingUp,
  Settings,
  AlertCircle
} from 'lucide-react';

export default function DailyDigestManager() {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [testMode, setTestMode] = useState(true);

  const sendTestDigest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/daily-digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`
        },
        body: JSON.stringify({
          action: 'test',
          testMode: true
        })
      });

      const result = await response.json();
      setLastResult(result);
      
    } catch (error) {
      console.error('Test digest failed:', error);
      setLastResult({
        success: false,
        error: 'Failed to send test digest'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendDigestNow = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/daily-digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`
        },
        body: JSON.stringify({
          action: 'send',
          testMode: testMode
        })
      });

      const result = await response.json();
      setLastResult(result);
      
    } catch (error) {
      console.error('Send digest failed:', error);
      setLastResult({
        success: false,
        error: 'Failed to send digest'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daily Digest Manager</h2>
          <p className="text-gray-600">Automated daily SMS summaries of contact form submissions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Scheduled: 1:00 PM Daily</span>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Digest Status</p>
              <p className="text-2xl font-bold text-green-600">Active</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Automatic daily digest at 1:00 PM CST
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Next Digest</p>
              <p className="text-lg font-bold text-blue-600">
                {new Date().toLocaleDateString()} 1:00 PM
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Memphis timezone (CST/CDT)
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Delivery Method</p>
              <p className="text-2xl font-bold text-purple-600">SMS</p>
            </div>
            <MessageSquare className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Sent to admin phone number
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Digest Controls</h3>
        
        <div className="space-y-4">
          {/* Test Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={testMode}
                  onChange={(e) => setTestMode(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium">Test Mode</span>
              </label>
              <p className="text-sm text-gray-500 ml-6">
                Adds "[TEST]" prefix to digest messages
              </p>
            </div>
            <TestTube className="w-5 h-5 text-gray-400" />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={sendTestDigest}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <TestTube className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Send Test Digest
            </button>

            <button
              onClick={sendDigestNow}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Send className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Send Digest Now
            </button>
          </div>
        </div>
      </div>

      {/* Last Result */}
      {lastResult && (
        <div className={`rounded-lg border p-6 ${
          lastResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {lastResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 mr-3" />
              )}
              <h3 className={`text-lg font-semibold ${
                lastResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {lastResult.success ? 'Digest Sent Successfully' : 'Digest Failed'}
              </h3>
            </div>
            <span className={`text-sm ${
              lastResult.success ? 'text-green-600' : 'text-red-600'
            }`}>
              {lastResult.timestamp && new Date(lastResult.timestamp).toLocaleString()}
            </span>
          </div>

          {lastResult.data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">{lastResult.data.date}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600">Submissions</p>
                <p className="font-semibold">{lastResult.data.submissionCount}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600">SMS Delivered</p>
                <p className="font-semibold">
                  {lastResult.data.smsDelivered ? 'Yes' : 'No'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600">Notification Health</p>
                <p className="font-semibold">{lastResult.data.notificationHealth}%</p>
              </div>
            </div>
          )}

          {lastResult.data?.messagePreview && (
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Message Preview:</p>
              <p className="text-sm font-mono bg-gray-50 p-3 rounded">
                {lastResult.data.messagePreview}
              </p>
            </div>
          )}

          {lastResult.error && (
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-red-600 font-medium">Error:</p>
              <p className="text-sm text-red-800">{lastResult.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Configuration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-blue-800">Configuration</h3>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-700">Schedule:</span>
            <span className="font-medium">Daily at 1:00 PM CST/CDT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Timezone:</span>
            <span className="font-medium">America/Chicago (Memphis)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Delivery:</span>
            <span className="font-medium">SMS to admin phone</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Content:</span>
            <span className="font-medium">Form count, event types, recent leads</span>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
          <h3 className="text-lg font-semibold text-yellow-800">Setup Requirements</h3>
        </div>
        
        <div className="space-y-2 text-sm text-yellow-700">
          <p>• <strong>ADMIN_PHONE_NUMBER</strong> environment variable must be set</p>
          <p>• <strong>CRON_SECRET</strong> environment variable for Vercel cron security</p>
          <p>• <strong>Twilio credentials</strong> configured for SMS delivery</p>
          <p>• <strong>Database migration</strong> applied for notification logging</p>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-100 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> The digest runs automatically via Vercel cron jobs. 
            Manual controls above are for testing and immediate sending.
          </p>
        </div>
      </div>
    </div>
  );
}
