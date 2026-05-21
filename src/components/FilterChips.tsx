interface FilterChipsProps {
  options: (string | number)[];
  selected: string | number | null;
  onSelect: (value: string | number | null) => void;
  label?: string;
}

export function FilterChips({ options, selected, onSelect, label }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && (
        <span className="text-sm text-zinc-500 dark:text-zinc-400 mr-1">
          {label}
        </span>
      )}
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1 rounded-full text-sm transition-colors ${
          selected === null
            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
        }`}
      >
        All
      </button>
      {options.map(option => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            selected === option
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
