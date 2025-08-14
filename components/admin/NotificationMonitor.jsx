import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Mail, 
  Phone,
  RefreshCw,
  Clock,
  TrendingUp,
  Settings
} from 'lucide-react';

export default function NotificationMonitor() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    fetchNotificationLogs();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchNotificationLogs, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotificationLogs = async () => {
    try {
      const response = await fetch('/api/admin/notification-logs');
      if (response.ok) {
        const data = await response.json();
        setRecentLogs(data.logs || []);
        setLastCheck(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch notification logs:', error);
    }
  };

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const results = await response.json();
        setHealthStatus(results);
        setLastCheck(new Date());
        
        // Refresh logs after health check
        await fetchNotificationLogs();
      } else {
        const error = await response.json();
        setHealthStatus({
          status: 'CRITICAL',
          error: error.message || 'Health check failed'
        });
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus({
        status: 'CRITICAL',
        error: 'Failed to run health check'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600 bg-green-50 border-green-200';
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSuccessRate = () => {
    if (recentLogs.length === 0) return 0;
    const successful = recentLogs.filter(log => log.successful_methods > 0).length;
    return Math.round((successful / recentLogs.length) * 100);
  };

  const getFailedNotifications = () => {
    return recentLogs.filter(log => log.successful_methods === 0).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Monitor</h2>
          <p className="text-gray-600">Monitor SMS and email notification health</p>
        </div>
        <button
          onClick={runHealthCheck}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Run Health Check
        </button>
      </div>

      {/* Health Status */}
      {healthStatus && (
        <div className={`rounded-lg border p-6 ${getStatusColor(healthStatus.status)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {healthStatus.status === 'HEALTHY' ? (
                <CheckCircle className="w-6 h-6 mr-3" />
              ) : (
                <XCircle className="w-6 h-6 mr-3" />
              )}
              <h3 className="text-lg font-semibold">
                System Status: {healthStatus.status}
              </h3>
            </div>
            {lastCheck && (
              <span className="text-sm opacity-75">
                Last checked: {lastCheck.toLocaleTimeString()}
              </span>
            )}
          </div>

          {healthStatus.results && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                <span>SMS: {healthStatus.results.sms.success ? 'Working' : 'Failed'}</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                <span>Email: {healthStatus.results.email.success ? 'Working' : 'Failed'}</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                <span>Methods: {healthStatus.summary.successfulMethods}/2</span>
              </div>
            </div>
          )}

          {healthStatus.recommendations && healthStatus.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Recommendations:</h4>
              {healthStatus.recommendations.map((rec, index) => (
                <div key={index} className="mb-2">
                  <div className="flex items-center mb-1">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    <span className="font-medium">{rec.message}</span>
                  </div>
                  {rec.actions && (
                    <ul className="ml-5 text-sm opacity-90">
                      {rec.actions.map((action, i) => (
                        <li key={i}>• {action}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Success Rate (24h)</p>
              <p className="text-2xl font-bold text-green-600">{getSuccessRate()}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Failed Notifications</p>
              <p className="text-2xl font-bold text-red-600">{getFailedNotifications()}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Attempts</p>
              <p className="text-2xl font-bold text-blue-600">{recentLogs.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Recent Notification Logs */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Recent Notification Attempts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SMS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentLogs.slice(0, 10).map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.notification_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {log.sms_success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    {log.sms_attempts > 1 && (
                      <span className="ml-1 text-xs text-gray-500">
                        ({log.sms_attempts} attempts)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {log.email_success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      log.successful_methods > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {log.successful_methods}/2 methods
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {log.sms_error || log.email_error || 'None'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuration Reminder */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <Settings className="w-5 h-5 text-yellow-600 mr-2" />
          <div>
            <h4 className="text-yellow-800 font-semibold">Configuration Reminder</h4>
            <p className="text-yellow-700 text-sm mt-1">
              Ensure the following environment variables are set: ADMIN_PHONE_NUMBER, BACKUP_ADMIN_PHONE, 
              TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, RESEND_API_KEY, BACKUP_ADMIN_EMAIL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
