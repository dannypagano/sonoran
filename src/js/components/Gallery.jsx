import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function Gallery({ items, contactUrl = "/contact/" }) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))],
    [items]
  );
  const [filter, setFilter] = useState("All");
  const [openIndex, setOpenIndex] = useState(null);

  const visible = useMemo(
    () => (filter === "All" ? items : items.filter((i) => i.category === filter)),
    [items, filter]
  );

  return (
    <div>
      <div className="-mx-1 flex flex-wrap gap-2" role="toolbar" aria-label="Filter prints">
        {categories.map((cat) => {
          const active = cat === filter;
          const count = cat === "All" ? items.length : items.filter((i) => i.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              aria-pressed={active}
              className={`mx-1 rounded-full px-4 py-2 text-sm transition-colors ${
                active ? "bg-ink text-bone" : "border border-ink/15 text-ink-soft hover:border-ink/40 hover:text-ink"
              }`}
            >
              {cat}
              <span className={`ml-2 font-mono text-[0.7rem] ${active ? "text-bone/60" : "text-muted"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item, idx) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(idx)}
              className="group block w-full overflow-hidden rounded-[var(--radius-card)] bg-sand text-left"
            >
              <div className="overflow-hidden">
                <img
                  src={item.image}
                  alt={item.alt}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
                />
              </div>
              <div className="flex items-start justify-between gap-4 p-5">
                <div>
                  <p className="font-display font-semibold tracking-tight">{item.title}</p>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {[item.material, item.process].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink/15 transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-bone">
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 13 13 7M8 7h5v5" />
                  </svg>
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null && (
        <Lightbox contactUrl={contactUrl} items={visible} index={openIndex} onChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      )}
    </div>
  );
}

function Lightbox({ items, index, onChange, onClose, contactUrl }) {
  const item = items[index];
  const closeRef = useRef(null);
  const lastFocus = useRef(null);
  const go = useCallback((d) => onChange((index + d + items.length) % items.length), [index, items.length, onChange]);

  useEffect(() => {
    lastFocus.current = document.activeElement;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      lastFocus.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const specs = [
    ["Material", item.material],
    ["Process", item.process],
    ["Size", item.dimensions],
    ["Category", item.category],
  ].filter(([, v]) => v);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-3 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="grid max-h-full w-full max-w-5xl overflow-auto rounded-[1.5rem] bg-bone shadow-2xl md:grid-cols-[1.5fr_1fr]">
        <img src={item.image} alt={item.alt} className="aspect-[4/3] w-full bg-sand object-cover md:h-full" />
        <div className="flex flex-col p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <p className="eyebrow">
              {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-2 flex h-9 w-9 items-center justify-center rounded-full hover:bg-ink/5"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">{item.title}</h3>
          {item.description && <p className="mt-3 leading-relaxed text-ink-soft">{item.description}</p>}
          <dl className="mt-6 divide-y divide-ink/10 border-y border-ink/10 text-sm">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-mono text-[0.8rem]">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-auto flex items-center justify-between gap-3 pt-8">
            <div className="flex gap-2">
              <NavBtn label="Previous print" onClick={() => go(-1)} d="M12.5 15 7.5 10l5-5" />
              <NavBtn label="Next print" onClick={() => go(1)} d="m7.5 15 5-5-5-5" />
            </div>
            <a href={`${contactUrl}?project=${encodeURIComponent(item.title)}`} className="btn-primary">
              Print something similar
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavBtn({ label, onClick, d }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 hover:border-ink"
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={d} />
      </svg>
    </button>
  );
}
