import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AdminLayout from '@/components/layouts/AdminLayout';
import { GetServerSideProps } from 'next';
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AvailabilityPattern {
  id: string;
  name: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  timezone: string;
  is_active: boolean;
  meeting_type_id: string | null;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  meeting_types?: {
    name: string;
  };
}

interface AvailabilityOverride {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  is_available: boolean;
  meeting_type_id: string | null;
  reason: string | null;
  meeting_types?: {
    name: string;
  };
}

interface MeetingType {
  id: string;
  name: string;
  duration_minutes: number;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  return { props: {} };
};

export default function AdminAvailabilityPage() {
  const supabase = createClientComponentClient();
  
  const [patterns, setPatterns] = useState<AvailabilityPattern[]>([]);
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPatternForm, setShowPatternForm] = useState(false);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [editingPattern, setEditingPattern] = useState<AvailabilityPattern | null>(null);
  const [editingOverride, setEditingOverride] = useState<AvailabilityOverride | null>(null);

  // Form state
  const [patternForm, setPatternForm] = useState({
    name: '',
    day_of_week: null as number | null,
    start_time: '09:00',
    end_time: '17:00',
    timezone: 'America/Chicago',
    is_active: true,
    meeting_type_id: null as string | null,
    buffer_before_minutes: 0,
    buffer_after_minutes: 15
  });

  const [overrideForm, setOverrideForm] = useState({
    date: '',
    start_time: '09:00',
    end_time: '17:00',
    timezone: 'America/Chicago',
    is_available: false,
    meeting_type_id: null as string | null,
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [patternsRes, overridesRes, typesRes] = await Promise.all([
        supabase
          .from('availability_patterns')
          .select(`
            *,
            meeting_types (
              name
            )
          `)
          .order('day_of_week', { ascending: true, nullsFirst: false })
          .order('start_time', { ascending: true }),
        supabase
          .from('availability_overrides')
          .select(`
            *,
            meeting_types (
              name
            )
          `)
          .order('date', { ascending: false })
          .limit(50),
        supabase
          .from('meeting_types')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
      ]);

      if (patternsRes.error) throw patternsRes.error;
      if (overridesRes.error) throw overridesRes.error;
      if (typesRes.error) throw typesRes.error;

      setPatterns(patternsRes.data || []);
      setOverrides(overridesRes.data || []);
      setMeetingTypes(typesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePattern = async () => {
    try {
      if (editingPattern) {
        const { error } = await supabase
          .from('availability_patterns')
          .update(patternForm)
          .eq('id', editingPattern.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('availability_patterns')
          .insert([patternForm]);
        if (error) throw error;
      }
      await fetchData();
      resetPatternForm();
    } catch (error) {
      console.error('Error saving pattern:', error);
      alert('Failed to save availability pattern');
    }
  };

  const saveOverride = async () => {
    try {
      if (editingOverride) {
        const { error } = await supabase
          .from('availability_overrides')
          .update(overrideForm)
          .eq('id', editingOverride.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('availability_overrides')
          .insert([overrideForm]);
        if (error) throw error;
      }
      await fetchData();
      resetOverrideForm();
    } catch (error) {
      console.error('Error saving override:', error);
      alert('Failed to save availability override');
    }
  };

  const deletePattern = async (id: string) => {
    if (!confirm('Are you sure you want to delete this availability pattern?')) return;
    try {
      const { error } = await supabase
        .from('availability_patterns')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting pattern:', error);
      alert('Failed to delete availability pattern');
    }
  };

  const deleteOverride = async (id: string) => {
    if (!confirm('Are you sure you want to delete this override?')) return;
    try {
      const { error } = await supabase
        .from('availability_overrides')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting override:', error);
      alert('Failed to delete override');
    }
  };

  const resetPatternForm = () => {
    setPatternForm({
      name: '',
      day_of_week: null,
      start_time: '09:00',
      end_time: '17:00',
      timezone: 'America/Chicago',
      is_active: true,
      meeting_type_id: null,
      buffer_before_minutes: 0,
      buffer_after_minutes: 15
    });
    setEditingPattern(null);
    setShowPatternForm(false);
  };

  const resetOverrideForm = () => {
    setOverrideForm({
      date: '',
      start_time: '09:00',
      end_time: '17:00',
      timezone: 'America/Chicago',
      is_available: false,
      meeting_type_id: null,
      reason: ''
    });
    setEditingOverride(null);
    setShowOverrideForm(false);
  };

  const editPattern = (pattern: AvailabilityPattern) => {
    setPatternForm({
      name: pattern.name,
      day_of_week: pattern.day_of_week,
      start_time: pattern.start_time,
      end_time: pattern.end_time,
      timezone: pattern.timezone,
      is_active: pattern.is_active,
      meeting_type_id: pattern.meeting_type_id,
      buffer_before_minutes: pattern.buffer_before_minutes,
      buffer_after_minutes: pattern.buffer_after_minutes
    });
    setEditingPattern(pattern);
    setShowPatternForm(true);
  };

  const editOverride = (override: AvailabilityOverride) => {
    setOverrideForm({
      date: override.date,
      start_time: override.start_time,
      end_time: override.end_time,
      timezone: override.timezone,
      is_available: override.is_available,
      meeting_type_id: override.meeting_type_id,
      reason: override.reason || ''
    });
    setEditingOverride(override);
    setShowOverrideForm(true);
  };

  if (loading) {
    return (
      <AdminLayout title="Availability" description="Manage availability patterns">
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-[#fcba00]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Availability" description="Manage availability patterns">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Availability Management</h1>
            <p className="text-gray-600 mt-1">Set recurring availability patterns and one-time overrides</p>
          </div>
          <Button
            onClick={fetchData}
            className="bg-[#fcba00] hover:bg-[#d99f00] text-black"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Availability Patterns */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recurring Patterns</h2>
              <Button
                onClick={() => {
                  resetPatternForm();
                  setShowPatternForm(true);
                }}
                className="bg-[#fcba00] hover:bg-[#d99f00] text-black"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Pattern
              </Button>
            </div>

            {showPatternForm && (
              <Card className="p-4 mb-4 bg-gray-50">
                <h3 className="font-semibold mb-3">
                  {editingPattern ? 'Edit Pattern' : 'New Pattern'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={patternForm.name}
                      onChange={(e) => setPatternForm({ ...patternForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., Weekdays 9am-5pm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                    <select
                      value={patternForm.day_of_week ?? ''}
                      onChange={(e) => setPatternForm({ ...patternForm, day_of_week: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Every Day</option>
                      {DAYS_OF_WEEK.map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={patternForm.start_time}
                        onChange={(e) => setPatternForm({ ...patternForm, start_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={patternForm.end_time}
                        onChange={(e) => setPatternForm({ ...patternForm, end_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type (optional)</label>
                    <select
                      value={patternForm.meeting_type_id ?? ''}
                      onChange={(e) => setPatternForm({ ...patternForm, meeting_type_id: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">All Meeting Types</option>
                      {meetingTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={patternForm.is_active}
                        onChange={(e) => setPatternForm({ ...patternForm, is_active: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={savePattern}
                      className="flex-1 bg-[#fcba00] hover:bg-[#d99f00] text-black"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={resetPatternForm}
                      variant="outline"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {patterns.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No availability patterns set</p>
              ) : (
                patterns.map((pattern) => (
                  <div
                    key={pattern.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{pattern.name}</h3>
                          {pattern.is_active ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {pattern.day_of_week !== null
                            ? DAYS_OF_WEEK.find(d => d.value === pattern.day_of_week)?.label
                            : 'Every Day'}
                          {' • '}
                          {pattern.start_time} - {pattern.end_time}
                        </p>
                        {pattern.meeting_types && (
                          <p className="text-xs text-gray-500 mt-1">
                            For: {pattern.meeting_types.name}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => editPattern(pattern)}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => deletePattern(pattern.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Availability Overrides */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">One-Time Overrides</h2>
              <Button
                onClick={() => {
                  resetOverrideForm();
                  setShowOverrideForm(true);
                }}
                className="bg-[#fcba00] hover:bg-[#d99f00] text-black"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Override
              </Button>
            </div>

            {showOverrideForm && (
              <Card className="p-4 mb-4 bg-gray-50">
                <h3 className="font-semibold mb-3">
                  {editingOverride ? 'Edit Override' : 'New Override'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={overrideForm.date}
                      onChange={(e) => setOverrideForm({ ...overrideForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={overrideForm.start_time}
                        onChange={(e) => setOverrideForm({ ...overrideForm, start_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={overrideForm.end_time}
                        onChange={(e) => setOverrideForm({ ...overrideForm, end_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={overrideForm.is_available ? 'available' : 'blocked'}
                      onChange={(e) => setOverrideForm({ ...overrideForm, is_available: e.target.value === 'available' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="blocked">Blocked (Not Available)</option>
                      <option value="available">Available (Override)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                    <input
                      type="text"
                      value={overrideForm.reason}
                      onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., Out of town, Holiday"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type (optional)</label>
                    <select
                      value={overrideForm.meeting_type_id ?? ''}
                      onChange={(e) => setOverrideForm({ ...overrideForm, meeting_type_id: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">All Meeting Types</option>
                      {meetingTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={saveOverride}
                      className="flex-1 bg-[#fcba00] hover:bg-[#d99f00] text-black"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={resetOverrideForm}
                      variant="outline"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {overrides.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No overrides set</p>
              ) : (
                overrides.map((override) => (
                  <div
                    key={override.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            {new Date(override.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </h3>
                          {override.is_available ? (
                            <Badge className="bg-green-100 text-green-800">Available</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Blocked</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {override.start_time} - {override.end_time}
                        </p>
                        {override.reason && (
                          <p className="text-xs text-gray-500 mt-1">{override.reason}</p>
                        )}
                        {override.meeting_types && (
                          <p className="text-xs text-gray-500 mt-1">
                            For: {override.meeting_types.name}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => editOverride(override)}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => deleteOverride(override.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

