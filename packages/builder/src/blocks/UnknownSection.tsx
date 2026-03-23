export function UnknownSection({
  type,
  dev,
}: {
  type: string;
  dev?: boolean;
}) {
  if (dev) {
    return (
      <div className="rounded border border-dashed border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
        Unknown section type: <code className="font-mono">{type}</code>
      </div>
    );
  }
  return <div className="min-h-[1rem]" aria-hidden />;
}
