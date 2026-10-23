'use client';

import React, { useEffect, useState } from 'react';
import { Card, Button } from '@/components/ui';

interface QuestionPerformance {
  id: string;
  text: string;
  status: string;
  difficulty: string | null;
  experienceTitle: string | null;
  experienceKey: string | null;
  totalResponses: number | null;
  correctRate: string | null;
  distribution: Record<string, number> | null;
  statsUpdatedAt: string | null;
}

export default function QuestionPerformancePage() {
  const [questions, setQuestions] = useState<QuestionPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExperience, setSelectedExperience] = useState<string>('all');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/analytics/questions');
      if (res.ok) {
        const json = await res.json();
        setQuestions(json.questions || []);
      }
    } catch {
      // error handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredQuestions =
    selectedExperience === 'all'
      ? questions
      : questions.filter((q) => q.experienceKey === selectedExperience);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Question Performance
          </h1>
          <p className="text-sm text-naija-muted mt-1">
            Track answer distribution, popularity and accuracy across all experiences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedExperience}
            onChange={(e) => setSelectedExperience(e.target.value)}
            className="px-3 py-2 rounded-xl bg-naija-surface border border-naija-border text-white text-xs min-h-[44px] focus:outline-none"
          >
            <option value="all">All Experiences</option>
            <option value="slang-quiz">Slang Quiz</option>
            <option value="how-nigerian">How Nigerian Are You?</option>
            <option value="would-you-rather">Would You Rather</option>
            <option value="guess-the-price">Guess the Price</option>
          </select>
          <Button onClick={loadData} variant="primary" size="default">
            🔄 Refresh
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-naija-muted animate-pulse">
            Loading question performance metrics...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-8 text-center text-xs text-naija-muted">
            No questions or responses recorded for this filter.
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-naija-surface/80 border-b border-naija-border uppercase text-naija-muted">
              <tr>
                <th className="py-3 px-4 font-semibold">Question</th>
                <th className="py-3 px-4 font-semibold">Experience</th>
                <th className="py-3 px-4 font-semibold text-right">Responses</th>
                <th className="py-3 px-4 font-semibold text-right">Accuracy Rate</th>
                <th className="py-3 px-4 font-semibold">Answer Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-naija-border/40">
              {filteredQuestions.map((q) => {
                const total = q.totalResponses || 0;
                const correctPct = q.correctRate ? `${(parseFloat(q.correctRate) * 100).toFixed(0)}%` : 'N/A';

                return (
                  <tr key={q.id} className="hover:bg-naija-surface/40">
                    <td className="py-3 px-4 max-w-xs font-medium text-white truncate">
                      {q.text}
                    </td>
                    <td className="py-3 px-4 text-naija-muted">
                      {q.experienceTitle || q.experienceKey || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      {total.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {correctPct !== 'N/A' ? (
                        <span className="font-bold text-brand-400">{correctPct}</span>
                      ) : (
                        <span className="text-naija-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {q.distribution && Object.keys(q.distribution).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {Object.entries(q.distribution).map(([opt, count]) => {
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                              <span
                                key={opt}
                                className="px-2 py-0.5 rounded bg-naija-surface border border-naija-border/60 text-[10px] text-gray-300"
                                title={`${count} votes`}
                              >
                                {opt}: <span className="font-bold text-brand-300">{pct}%</span>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-naija-muted italic">No votes yet</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
