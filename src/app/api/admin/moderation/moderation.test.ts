import { describe, it, expect } from 'vitest';

type QuestionStatus = 'draft' | 'pending' | 'published' | 'unpublished' | 'rejected' | 'deleted';
type ModerationAction = 'approve' | 'edit_approve' | 'reject' | 'delete';

function transitionQuestionStatus(currentStatus: QuestionStatus, action: ModerationAction): QuestionStatus {
  if (currentStatus !== 'pending') {
    throw new Error(`Invalid state transition: cannot perform ${action} on ${currentStatus} question`);
  }

  switch (action) {
    case 'approve':
    case 'edit_approve':
      return 'published';
    case 'reject':
      return 'rejected';
    case 'delete':
      return 'deleted';
  }
}

describe('Moderation State Machine', () => {
  it('transitions pending to published upon approve', () => {
    expect(transitionQuestionStatus('pending', 'approve')).toBe('published');
  });

  it('transitions pending to published upon edit_approve', () => {
    expect(transitionQuestionStatus('pending', 'edit_approve')).toBe('published');
  });

  it('transitions pending to rejected upon reject', () => {
    expect(transitionQuestionStatus('pending', 'reject')).toBe('rejected');
  });

  it('transitions pending to deleted upon delete', () => {
    expect(transitionQuestionStatus('pending', 'delete')).toBe('deleted');
  });

  it('throws an error if attempting to moderate non-pending questions', () => {
    expect(() => transitionQuestionStatus('published', 'approve')).toThrow();
    expect(() => transitionQuestionStatus('draft', 'reject')).toThrow();
    expect(() => transitionQuestionStatus('rejected', 'approve')).toThrow();
  });
});
