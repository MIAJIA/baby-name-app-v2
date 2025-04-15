'use client';

import React, { useEffect, useState } from 'react';

export default function TitleWithVersion() {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/api/v1/healthz');
        const data = await response.json();
        setVersion(data.version);
      } catch (error) {
        console.error('Failed to fetch version:', error);
      }
    };

    fetchVersion();
  }, []);

  useEffect(() => {
    document.title = `Callme-本名${version ? ` v${version}` : ''}`;
  }, [version]);

  return null;
} 