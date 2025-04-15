'use client';

import React, { useEffect } from 'react';
import { useVersion } from '@/app/hooks/useVersion';

export default function TitleWithVersion() {
  const version = useVersion();

  useEffect(() => {
    document.title = `Callme-本名${version ? ` v${version}` : ''}`;
  }, [version]);

  return null;
} 