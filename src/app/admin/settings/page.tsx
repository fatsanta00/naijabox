import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

export default async function AdminSettingsPage() {
  const allCategories = await db.select().from(schema.categories);
  const allExperiences = await db.select().from(schema.experiences);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Experience Settings & Categories</h1>
        <p className="text-sm text-naija-muted mt-1">
          Adjust randomization modes, question limits, and add content categories.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Experiences Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Experiences Configuration</CardTitle>
            <CardDescription>Toggle random vs ordered modes and pool counts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {allExperiences.map((exp) => (
              <div
                key={exp.id}
                className="p-3 rounded-xl bg-naija-surface border border-naija-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <h4 className="font-semibold text-white text-sm">{exp.title}</h4>
                  <span className="text-xs text-naija-muted">
                    Key: <code className="text-brand-400">{exp.key}</code>
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2 py-1 rounded bg-naija-card text-gray-300 border border-naija-border capitalize">
                    {exp.selectionMode}
                  </span>
                  <span className="px-2 py-1 rounded bg-naija-card text-gray-300 border border-naija-border">
                    {exp.questionCount ? `${exp.questionCount} Qs` : 'All Qs'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Categories Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Categories</CardTitle>
            <CardDescription>Active taxonomy for organizing quiz and community content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {allCategories.map((cat) => (
              <div
                key={cat.id}
                className="p-2.5 rounded-lg bg-naija-surface border border-naija-border/60 flex items-center justify-between"
              >
                <span className="text-sm font-medium text-white">{cat.name}</span>
                <span className="text-xs text-naija-muted font-mono">{cat.slug}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
