export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="flex items-center gap-1 overflow-x-auto border-b border-manila-dark"
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={`relative flex-none px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust/30 ${
            value === tab.value ? "text-ink" : "text-steel hover:text-ink"
          }`}
        >
          {tab.label}
          {value === tab.value && (
            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-rust" />
          )}
        </button>
      ))}
    </div>
  );
}
