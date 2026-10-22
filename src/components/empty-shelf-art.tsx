export function EmptyShelfArt({ className }: { className?: string }) {
  const slots = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div
      aria-hidden="true"
      className={`grid grid-cols-4 gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800 sm:grid-cols-8 ${className ?? ""}`}
    >
      {slots.map((slot) => (
        <div
          key={slot}
          className="aspect-square rounded-sm bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
        />
      ))}
    </div>
  );
}
