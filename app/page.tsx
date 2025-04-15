'use client';

import React, { Suspense } from 'react';
import Chat from './components/Chat';

export default function Home() {
  return (
    <main className="h-screen w-screen">
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
        <Chat />
      </Suspense>
    </main>
  );
} 