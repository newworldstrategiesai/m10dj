# Karaoke Admin UX Improvements - Implementation Plan

## Phase 1: Critical Workflow Improvements (Immediate Impact)

### 1.1 Promote Primary Actions - Add Quick Action Buttons

**Current Problem:** Complete/Start actions buried in dropdown menu

**Solution:** Add visible action buttons on queue items

```tsx
// In queue item rendering
<div className="flex items-center gap-2 flex-shrink-0">
  {/* Quick Actions - Visible on hover */}
  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    {signup.status === 'queued' && (
      <Button
        size="sm"
        variant="outline"
        onClick={() => updateStatus(signup.id, 'next')}
        className="h-8 px-2"
        title="Mark as Next"
      >
        <ArrowUp className="w-3 h-3" />
      </Button>
    )}
    {signup.status === 'next' && (
      <Button
        size="sm"
        onClick={() => updateStatus(signup.id, 'singing')}
        className="h-8 px-2 bg-yellow-600 hover:bg-yellow-700"
        title="Start Now"
      >
        <Play className="w-3 h-3" />
      </Button>
    )}
    {signup.status === 'singing' && (
      <Button
        size="sm"
        onClick={() => updateStatus(signup.id, 'completed')}
        className="h-8 px-2 bg-green-600 hover:bg-green-700"
        title="Mark Complete"
      >
        <CheckCircle2 className="w-3 h-3" />
      </Button>
    )}
  </div>
  
  {/* Existing dropdown for other actions */}
  <DropdownMenu>
    {/* ... existing dropdown content ... */}
  </DropdownMenu>
</div>
```

**Add to queue item div:**
```tsx
<div
  key={signup.id}
  className="group p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
>
```

---

### 1.2 Keyboard Shortcuts

**Add keyboard shortcuts for common actions:**

```tsx
// Add useEffect for keyboard shortcuts
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Don't trigger if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Space = Advance queue (complete current, start next)
    if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (currentSinger) {
        updateStatus(currentSinger.id, 'completed');
        if (nextSinger) {
          setTimeout(() => updateStatus(nextSinger.id, 'singing'), 500);
        }
      }
    }

    // N = Mark next singer as current
    if (e.key === 'n' && nextSinger) {
      e.preventDefault();
      updateStatus(nextSinger.id, 'singing');
    }

    // C = Complete current singer
    if (e.key === 'c' && currentSinger) {
      e.preventDefault();
      updateStatus(currentSinger.id, 'completed');
    }

    // Delete = Skip current (with confirmation)
    if (e.key === 'Delete' && currentSinger) {
      e.preventDefault();
      if (confirm('Skip current singer?')) {
        updateStatus(currentSinger.id, 'skipped');
      }
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [currentSinger, nextSinger, updateStatus]);
```

**Add visual indicator:**
```tsx
{/* Keyboard shortcuts hint */}
<div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Space</kbd> Advance • 
  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">N</kbd> Next • 
  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">C</kbd> Complete
</div>
```

---

### 1.3 Optimistic UI Updates

**Update UI immediately, sync in background:**

```tsx
const updateStatus = async (signupId: string, newStatus: KaraokeSignup['status'], adminNotes?: string) => {
  // Optimistic update
  setSignups(prev => prev.map(s => 
    s.id === signupId ? { ...s, status: newStatus } : s
  ));

  try {
    const response = await fetch('/api/karaoke/update-status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signup_id: signupId,
        status: newStatus,
        admin_notes: adminNotes
      }),
    });

    if (!response.ok) {
      // Revert on error
      setSignups(prev => prev.map(s => 
        s.id === signupId ? { ...s, status: signup.status } : s
      ));
      throw new Error('Failed to update status');
    }

    toast({
      title: 'Success',
      description: `Status updated to ${newStatus}`,
    });
  } catch (error: any) {
    // Revert on error
    setSignups(prev => prev.map(s => 
      s.id === signupId ? { ...s, status: signup.status } : s
    ));
    
    toast({
      title: 'Error',
      description: error.message || 'Failed to update status',
      variant: 'destructive'
    });
  }
};
```

---

### 1.4 Enhanced Current/Next Display

**Make current and next singer more prominent:**

```tsx
{/* Current Singer - Enhanced */}
{currentSinger && (
  <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 mb-4 shadow-lg border-4 border-green-400">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">NOW SINGING</h3>
            {currentSinger.started_at && (
              <p className="text-green-100 text-sm">
                Started {Math.floor((Date.now() - new Date(currentSinger.started_at).getTime()) / 60000)} min ago
              </p>
            )}
          </div>
        </div>
        <p className="text-3xl font-black text-white mb-2">
          {formatGroupDisplayName(
            currentSinger.singer_name,
            currentSinger.group_members,
            currentSinger.group_size
          )}
        </p>
        <p className="text-xl text-green-100 mb-1">
          <Music className="w-5 h-5 inline mr-2" />
          "{currentSinger.song_title}"
          {currentSinger.song_artist && ` by ${currentSinger.song_artist}`}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          onClick={() => updateStatus(currentSinger.id, 'completed')}
          className="bg-white text-green-700 hover:bg-green-50 font-bold px-6"
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Complete
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => updateStatus(currentSinger.id, 'skipped')}
          className="border-white text-white hover:bg-white/10"
        >
          <SkipForward className="w-5 h-5 mr-2" />
          Skip
        </Button>
      </div>
    </div>
  </div>
)}
```

---

### 1.5 Estimated Wait Times

**Add wait time calculations:**

```tsx
// Add to utils/karaoke-queue.ts
export function calculateEstimatedWait(
  signup: KaraokeSignup,
  queue: KaraokeSignup[],
  averageSongDurationMinutes: number = 3
): number {
  const position = calculateQueuePosition(signup, queue);
  const aheadInQueue = position - 1;
  return aheadInQueue * averageSongDurationMinutes;
}

// In component
const estimatedWait = calculateEstimatedWait(signup, queue);

// Display in queue item
{estimatedWait > 0 && (
  <span className="text-xs text-gray-500 dark:text-gray-400">
    ~{estimatedWait} min wait
  </span>
)}
```

---

### 1.6 Queue Health Indicator

**Add visual queue health:**

```tsx
// Add to stats cards
<div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
  <div className="flex items-center justify-between mb-2">
    <p className="text-sm text-gray-600 dark:text-gray-400">Queue Health</p>
    {queue.length < 3 ? (
      <Badge className="bg-yellow-500">Low</Badge>
    ) : queue.length > 15 ? (
      <Badge className="bg-red-500">Long Wait</Badge>
    ) : (
      <Badge className="bg-green-500">Good</Badge>
    )}
  </div>
  <p className="text-2xl font-bold text-gray-900 dark:text-white">
    {queue.length} in queue
  </p>
  {queue.length > 0 && (
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
      ~{queue.length * 3} min total wait
    </p>
  )}
</div>
```

---

### 1.7 Event Code Selector - Prominent

**Make event selection more obvious:**

```tsx
{/* Event Selector - Prominent */}
<div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg p-4 mb-4">
  <div className="flex items-center justify-between">
    <div>
      <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
        Current Event
      </label>
      <select
        value={eventCodeFilter || ''}
        onChange={(e) => {
          setEventCodeFilter(e.target.value);
          if (e.target.value && organization) {
            loadSignups(organization.id);
          }
        }}
        className="px-4 py-2 border-2 border-blue-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold"
      >
        <option value="">All Events</option>
        {availableEvents.map(code => (
          <option key={code} value={code}>{code}</option>
        ))}
      </select>
    </div>
    {eventCodeFilter && (
      <Button
        variant="outline"
        onClick={() => setShowDisplaySetup(true)}
        className="border-blue-500 text-blue-700 dark:text-blue-300"
      >
        <Monitor className="w-4 h-4 mr-2" />
        TV Display
      </Button>
    )}
  </div>
</div>
```

---

### 1.8 Quick Filter Chips

**Add visual filter chips:**

```tsx
{/* Quick Filter Chips */}
<div className="flex flex-wrap gap-2 mb-4">
  <Button
    variant={statusFilter === 'active' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setStatusFilter('active')}
  >
    Active
  </Button>
  <Button
    variant={statusFilter === 'all' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setStatusFilter('all')}
  >
    All
  </Button>
  <Button
    variant={statusFilter === 'completed' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setStatusFilter('completed')}
  >
    Completed
  </Button>
  {eventCodeFilter && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setEventCodeFilter('')}
      className="text-red-600"
    >
      <X className="w-3 h-3 mr-1" />
      Clear Event Filter
    </Button>
  )}
</div>
```

---

### 1.9 Empty State with CTA

**Improve empty state:**

```tsx
{queue.length === 0 && !loading && (
  <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
    <Mic className="w-16 h-16 mx-auto mb-4 text-gray-400" />
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
      No one in queue
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-6">
      Generate a QR code to start receiving karaoke signups
    </p>
    <div className="flex gap-3 justify-center">
      <Button onClick={() => setShowQRGenerator(true)}>
        <QrCode className="w-4 h-4 mr-2" />
        Generate Signup QR Code
      </Button>
      <Button variant="outline" onClick={() => setShowDisplaySetup(true)}>
        <Monitor className="w-4 h-4 mr-2" />
        Set Up TV Display
      </Button>
    </div>
  </div>
)}
```

---

### 1.10 Mobile Swipe Actions

**Add swipe gestures for mobile:**

```tsx
// Install react-swipeable or use touch events
const [swipeStart, setSwipeStart] = useState<number | null>(null);

const handleTouchStart = (e: React.TouchEvent, signupId: string) => {
  setSwipeStart(e.touches[0].clientX);
};

const handleTouchEnd = (e: React.TouchEvent, signup: KaraokeSignup) => {
  if (!swipeStart) return;
  
  const swipeEnd = e.changedTouches[0].clientX;
  const diff = swipeStart - swipeEnd;
  
  if (Math.abs(diff) > 100) {
    if (diff > 0) {
      // Swipe left = Skip
      updateStatus(signup.id, 'skipped');
    } else {
      // Swipe right = Advance
      if (signup.status === 'queued') {
        updateStatus(signup.id, 'next');
      } else if (signup.status === 'next') {
        updateStatus(signup.id, 'singing');
      }
    }
  }
  
  setSwipeStart(null);
};

// Add to queue item
<div
  onTouchStart={(e) => handleTouchStart(e, signup.id)}
  onTouchEnd={(e) => handleTouchEnd(e, signup)}
  className="touch-pan-y"
>
```

---

## Phase 2: Information Architecture

### 2.1 Queue Summary Header

**Add summary information:**

```tsx
{/* Queue Summary */}
<div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-4 mb-4 text-white">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-2xl font-bold mb-1">Queue Summary</h2>
      <p className="text-purple-100">
        {queue.length} in queue • {currentSinger ? '1 singing' : 'No one singing'} • 
        {queue.length > 0 && ` ~${queue.length * 3} min total wait`}
      </p>
    </div>
    <div className="text-right">
      <p className="text-sm text-purple-100">Total Signups</p>
      <p className="text-3xl font-bold">{signups.length}</p>
    </div>
  </div>
</div>
```

---

### 2.2 Enhanced Search

**Improve search with suggestions:**

```tsx
const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

// Debounced search
useEffect(() => {
  const timer = setTimeout(() => {
    if (searchTerm.length > 2) {
      const suggestions = signups
        .map(s => [s.singer_name, s.song_title, s.song_artist].filter(Boolean))
        .flat()
        .filter((item, index, self) => 
          item.toLowerCase().includes(searchTerm.toLowerCase()) && 
          self.indexOf(item) === index
        )
        .slice(0, 5);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, 300);
  
  return () => clearTimeout(timer);
}, [searchTerm, signups]);

// In search input
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
  <Input
    type="text"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    placeholder="Search by name, song, phone..."
    className="pl-10"
  />
  {searchSuggestions.length > 0 && (
    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg">
      {searchSuggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => setSearchTerm(suggestion)}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )}
</div>
```

---

## Implementation Checklist

- [ ] Add quick action buttons to queue items
- [ ] Implement keyboard shortcuts
- [ ] Add optimistic UI updates
- [ ] Enhance current/next display
- [ ] Add estimated wait times
- [ ] Add queue health indicator
- [ ] Make event selector prominent
- [ ] Add quick filter chips
- [ ] Improve empty state
- [ ] Add mobile swipe actions
- [ ] Add queue summary header
- [ ] Enhance search with suggestions

---

## Testing Checklist

- [ ] Test keyboard shortcuts don't interfere with typing
- [ ] Test optimistic updates revert on error
- [ ] Test mobile swipe gestures
- [ ] Test all filter combinations
- [ ] Test with empty queue
- [ ] Test with large queue (50+ signups)
- [ ] Test real-time updates
- [ ] Test error handling
