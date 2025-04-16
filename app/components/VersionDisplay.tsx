'use client';

import React from 'react';
import { useVersion } from '@/app/hooks/useVersion';

export default function VersionDisplay() {
  const version = useVersion();

  if (!version) return null;

  return (
    <span className="text-sm text-gray-500 ml-2">
      v{version}
    </span>
  );
} 