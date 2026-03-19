export default function SearchBar({
  search,
  setSearch,
  placeholder = "Search businesses…",
}: {
  search: string;
  setSearch: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <form onSubmit={(e) => e.preventDefault()} className="w-full">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 shadow-sm">
        <span className="text-[var(--muted)]">⌕</span>
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)] sm:text-base"
        />
        {search ? (
          <button type="button" onClick={() => setSearch("")} className="rounded-xl px-2 py-1 text-sm font-semibold text-[var(--muted)] hover:bg-black/5" aria-label="Clear search">
            ✕
          </button>
        ) : null}
      </div>
    </form>
  );
}
