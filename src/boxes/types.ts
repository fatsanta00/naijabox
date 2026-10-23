import React from 'react';

export interface BoxProps {
  slug: string;
  title: string;
}

export interface BoxDefinition {
  slug: string; // 'slang-quiz'
  title: string;
  tagline: string; // card copy
  description?: string;
  kind: 'game' | 'quiz' | 'tool' | 'test' | 'weird';
  navGroup: 'games' | 'quizzes' | 'tools' | 'pricecheck';
  badge?: string;
  usesQuestionSystem: boolean;
  experienceKey?: string; // links to experiences.key in the DB
  component: () => Promise<{ default: React.ComponentType<BoxProps> }>; // lazy loaded
  recommendNext?: string[]; // hints for "Try another box"
}
