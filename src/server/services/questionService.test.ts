import { describe, it, expect } from 'vitest';
import { QuestionService } from './questionService';
import type { Question } from '../db/schema';

describe('QuestionService', () => {
  const dummyQuestions: Question[] = [
    {
      id: 'q1',
      experienceId: 'exp-1',
      text: 'Question 1',
      categoryId: null,
      difficulty: 'easy',
      options: [{ id: 'a', text: 'Option A' }],
      correct: ['a'],
      scoring: null,
      explanation: null,
      sortOrder: 1,
      status: 'published',
      source: 'admin',
      authorName: null,
      showAttribution: false,
      submittedBySession: null,
      moderation: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
    },
    {
      id: 'q2',
      experienceId: 'exp-1',
      text: 'Question 2',
      categoryId: null,
      difficulty: 'easy',
      options: [{ id: 'a', text: 'Option A' }],
      correct: ['a'],
      scoring: null,
      explanation: null,
      sortOrder: 2,
      status: 'published',
      source: 'admin',
      authorName: null,
      showAttribution: false,
      submittedBySession: null,
      moderation: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
    },
    {
      id: 'q3',
      experienceId: 'exp-1',
      text: 'Question 3 (Draft)',
      categoryId: null,
      difficulty: 'easy',
      options: [{ id: 'a', text: 'Option A' }],
      correct: ['a'],
      scoring: null,
      explanation: null,
      sortOrder: 3,
      status: 'draft',
      source: 'admin',
      authorName: null,
      showAttribution: false,
      submittedBySession: null,
      moderation: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
    },
    {
      id: 'q4',
      experienceId: 'exp-1',
      text: 'Question 4 (Hard)',
      categoryId: null,
      difficulty: 'hard',
      options: [{ id: 'a', text: 'Option A' }],
      correct: ['a'],
      scoring: null,
      explanation: null,
      sortOrder: 4,
      status: 'published',
      source: 'admin',
      authorName: null,
      showAttribution: false,
      submittedBySession: null,
      moderation: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
    },
    {
      id: 'q5',
      experienceId: 'exp-1',
      text: 'Question 5',
      categoryId: null,
      difficulty: 'easy',
      options: [{ id: 'a', text: 'Option A' }],
      correct: ['a'],
      scoring: null,
      explanation: null,
      sortOrder: 5,
      status: 'published',
      source: 'admin',
      authorName: null,
      showAttribution: false,
      submittedBySession: null,
      moderation: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
    },
  ];

  it('filters out non-published questions (draft, pending, rejected)', () => {
    const res = QuestionService.filterAndSortQuestions(dummyQuestions, {
      selectionMode: 'ordered',
      count: 10,
    });
    expect(res.some((q) => q.status !== 'published')).toBe(false);
    expect(res.map((q) => q.id)).not.toContain('q3');
  });

  it('respects ordered selection mode sorting by sortOrder', () => {
    const res = QuestionService.filterAndSortQuestions(dummyQuestions, {
      selectionMode: 'ordered',
      count: 10,
    });
    expect(res[0].id).toBe('q1');
    expect(res[1].id).toBe('q2');
  });

  it('respects count limit', () => {
    const res = QuestionService.filterAndSortQuestions(dummyQuestions, {
      selectionMode: 'ordered',
      count: 2,
    });
    expect(res.length).toBe(2);
  });

  it('respects no-repeat excludeIds', () => {
    const res = QuestionService.filterAndSortQuestions(dummyQuestions, {
      selectionMode: 'ordered',
      count: 10,
      excludeIds: ['q1', 'q2'],
    });
    expect(res.some((q) => q.id === 'q1' || q.id === 'q2')).toBe(false);
  });

  it('respects difficulty filter', () => {
    const res = QuestionService.filterAndSortQuestions(dummyQuestions, {
      selectionMode: 'ordered',
      difficulty: 'hard',
    });
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('q4');
  });

  it('handles empty pools gracefully without throwing', () => {
    const res = QuestionService.filterAndSortQuestions([], {
      selectionMode: 'random',
    });
    expect(res).toEqual([]);
  });
});
