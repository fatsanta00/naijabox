export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
        Naija<span className="text-brand-500">Box</span>
      </h1>
      <p className="mt-4 text-lg text-naija-muted max-w-md">
        A box full of things to do. Games, quizzes, weird questions, and useful tools.
      </p>
    </main>
  );
}
