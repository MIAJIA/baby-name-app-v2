'use client';

import React, { useEffect, useState } from 'react';

export default function VersionWatermark() {
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

  if (!version) return null;

  return (
    <div className="fixed bottom-4 right-4 text-sm opacity-25 text-primary">
      v{version}
    </div>
  );
} 