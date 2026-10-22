export default function SearchLoading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
      <div className="shelf-skeleton h-8 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="shelf-skeleton mt-3 h-4 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex gap-4 py-4">
            <div className="shelf-skeleton h-20 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <div className="shelf-skeleton h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="shelf-skeleton h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
