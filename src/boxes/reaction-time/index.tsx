'use client';

import React from 'react';
import { BoxProps } from '../types';

export default function ReactionTimeBox({ title }: BoxProps) {
  return (
    <div className="p-6 text-center max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-naija-muted">Tap when the screen turns green.</p>
    </div>
  );
}
