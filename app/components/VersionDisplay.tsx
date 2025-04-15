'use client';

import React, { useEffect, useState } from 'react';

export default function VersionDisplay() {
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
    <span className="text-sm text-gray-500 ml-2">
      v{version}
    </span>
  );
} 