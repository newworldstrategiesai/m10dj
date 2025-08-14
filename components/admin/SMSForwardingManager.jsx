import { useState } from 'react';
import { 
  MessageSquare, 
  Phone, 
  Send, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  Clock,
  Settings,
  AlertCircle,
  Smartphone,
  Mail
} from 'lucide-react';

export default function SMSForwardingManager() {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testMessage, setTestMessage] = useState('This is a test message to verify SMS forwarding is working correctly.');

  const testSMSForwarding = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-sms-forwarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`
        },
        body: JSON.stringify({
          testMessage: testMessage
        })
      });

      const result = await response.json();
      setTestResult(result);
      
    } catch (error) {
      console.error('SMS forwarding test failed:', error);
      setTestResult({
        success: false,
        error: 'Failed to test SMS forwarding'
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
          <h2 className="text-2xl font-bold text-gray-900">SMS Forwarding Manager</h2>
          <p className="text-gray-600">Manage incoming SMS forwarding and auto-replies</p>
        </div>
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Active Forwarding</span>
        </div>
      </div>

      {/* SMS Flow Diagram */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">SMS Flow Process</h3>
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium">Customer Sends SMS</p>
            <p className="text-xs text-gray-500">to Twilio number</p>
          </div>
          
          <ArrowRight className="w-5 h-5 text-gray-400" />
          
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Settings className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium">System Processes</p>
            <p className="text-xs text-gray-500">logs & forwards</p>
          </div>
          
          <ArrowRight className="w-5 h-5 text-gray-400" />
          
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Phone className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm font-medium">Admin Notification</p>
            <p className="text-xs text-gray-500">SMS + Email backup</p>
          </div>
          
          <ArrowRight className="w-5 h-5 text-gray-400" />
          
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-sm font-medium">Auto-Reply</p>
            <p className="text-xs text-gray-500">to customer</p>
          </div>
        </div>
      </div>

      {/* Current Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-blue-600" />
            Admin Notifications
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">SMS Forwarding</span>
              <span className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Enabled
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Email Backup</span>
              <span className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Enabled
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Database Logging</span>
              <span className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Enabled
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Retry Logic</span>
              <span className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                3 Attempts
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-green-600" />
            Auto-Reply Settings
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Auto-Reply</span>
              <span className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Enabled
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Business Hours Logic</span>
              <span className="flex items-center text-green-600">
                <Clock className="w-4 h-4 mr-1" />
                9 AM - 5 PM CST
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Response Time</span>
              <span className="text-gray-900">30 min (business hrs)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Contact Info</span>
              <span className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Included
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Test SMS Forwarding */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Test SMS Forwarding</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Message
            </label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter a test message to simulate incoming SMS..."
            />
          </div>
          
          <button
            onClick={testSMSForwarding}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <TestTube className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Test SMS Forwarding
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className={`rounded-lg border p-6 ${
          testResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {testResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 mr-3" />
              )}
              <h3 className={`text-lg font-semibold ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.success ? 'Test Successful' : 'Test Failed'}
              </h3>
            </div>
            <span className={`text-sm ${
              testResult.success ? 'text-green-600' : 'text-red-600'
            }`}>
              {testResult.timestamp && new Date(testResult.timestamp).toLocaleString()}
            </span>
          </div>

          {testResult.testData && (
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-semibold mb-2">Test Data Sent:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">From:</span>
                  <span className="ml-2 font-mono">{testResult.testData.From}</span>
                </div>
                <div>
                  <span className="text-gray-600">To:</span>
                  <span className="ml-2 font-mono">{testResult.testData.To}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Message:</span>
                  <p className="ml-2 mt-1 p-2 bg-gray-50 rounded text-sm">{testResult.testData.Body}</p>
                </div>
              </div>
            </div>
          )}

          {testResult.error && (
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-red-600 font-medium">Error:</p>
              <p className="text-sm text-red-800">{testResult.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Configuration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-blue-800">How It Works</h3>
        </div>
        
        <div className="space-y-3 text-sm text-blue-700">
          <p><strong>1. Customer sends SMS</strong> to your Twilio business number</p>
          <p><strong>2. Twilio webhook</strong> calls /api/sms/incoming-message endpoint</p>
          <p><strong>3. System logs</strong> the message to database as a new contact submission</p>
          <p><strong>4. Enhanced notifications</strong> forward SMS to admin phone + email backup</p>
          <p><strong>5. Auto-reply sent</strong> to customer with business hours-aware message</p>
          <p><strong>6. Admin can reply</strong> directly to the customer via SMS</p>
        </div>
      </div>

      {/* Setup Requirements */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
          <h3 className="text-lg font-semibold text-yellow-800">Setup Requirements</h3>
        </div>
        
        <div className="space-y-2 text-sm text-yellow-700">
          <p>• <strong>Twilio webhook URL</strong> must be set to: https://your-domain.com/api/sms/incoming-message</p>
          <p>• <strong>ADMIN_PHONE_NUMBER</strong> environment variable for forwarding</p>
          <p>• <strong>Enhanced notification system</strong> configured for redundancy</p>
          <p>• <strong>Database access</strong> for logging incoming messages</p>
        </div>
      </div>
    </div>
  );
}
