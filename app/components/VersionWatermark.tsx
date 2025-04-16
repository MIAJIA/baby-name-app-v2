'use client';

import React from 'react';
import { useVersion } from '@/app/hooks/useVersion';

export default function VersionWatermark() {
  const version = useVersion();

  if (!version) return null;

  return (
    <div className="fixed bottom-4 right-4 text-sm opacity-25 text-primary">
      v{version}
    </div>
  );
} 