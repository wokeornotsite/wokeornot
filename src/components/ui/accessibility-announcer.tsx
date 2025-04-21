import React from 'react';

export const AccessibilityAnnouncer = () => (
  <div aria-live="polite" aria-atomic="true" style={{ position: 'absolute', left: '-9999px', height: 1, width: 1, overflow: 'hidden' }}>
    {/* Announcements will be injected here for screen readers */}
  </div>
);
