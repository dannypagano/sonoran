import React, { useMemo, useState } from "react";

const usd = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function QuoteEstimator({ config }) {
  const { materials = [], finishes = [], discounts = [], setupFee = 0, minimumOrder = 0, rushMultiplier = 1, contactUrl = "/contact/" } =
    config;

  const [materialIdx, setMaterialIdx] = useState(0);
  const [grams, setGrams] = useState(60);
  const [qty, setQty] = useState(1);
  const [finishIdx, setFinishIdx] = useState(0);
  const [rush, setRush] = useState(false);

  const material = materials[materialIdx];
  const finish = finishes[finishIdx] || { name: "Raw", multiplier: 1 };

  const q = useMemo(() => {
    const g = Math.max(0, Number(grams) || 0);
    const n = Math.max(1, Math.floor(Number(qty) || 1));
    const tier = [...discounts].sort((a, b) => b.min_qty - a.min_qty).find((d) => n >= d.min_qty);
    const pct = tier ? tier.percent : 0;
    const materialCost = (material?.rate || 0) * g * n;
    const discounted = materialCost * (1 - pct / 100);
    const finishing = discounted * (Number(finish.multiplier) - 1);
    let total = setupFee + discounted + finishing;
    const rushFee = rush ? total * (rushMultiplier - 1) : 0;
    total += rushFee;
    const minApplied = total < minimumOrder;
    if (minApplied) total = minimumOrder;
    return { n, pct, materialCost, discount: materialCost - discounted, finishing, rushFee, total, perPart: total / n, minApplied };
  }, [grams, qty, material, finish, rush, discounts, setupFee, minimumOrder, rushMultiplier]);

  const quoteLink = `${contactUrl}?${new URLSearchParams({
    material: material?.name || "",
    qty: String(q.n),
    finish: finish.name,
    estimate: usd(q.total),
  })}`;

  if (!materials.length) return <p className="text-sm text-muted">Add materials in Siteleaf to enable the estimator.</p>;

  return (
    <div className="rounded-2xl bg-bone p-5 shadow-sm shadow-ink/5 sm:p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <span className="label">Material</span>
          <div className="flex flex-wrap gap-2">
            {materials.map((m, i) => (
              <button
                key={m.name}
                type="button"
                onClick={() => setMaterialIdx(i)}
                aria-pressed={i === materialIdx}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  i === materialIdx ? "bg-ink text-bone" : "border border-ink/15 hover:border-ink/40"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="label">Part weight (grams)</span>
          <input type="number" min="1" inputMode="decimal" value={grams} onChange={(e) => setGrams(e.target.value)} className="field font-mono" />
        </label>
        <label className="block">
          <span className="label">Quantity</span>
          <input type="number" min="1" step="1" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} className="field font-mono" />
        </label>

        <label className="block">
          <span className="label">Finish</span>
          <select value={finishIdx} onChange={(e) => setFinishIdx(Number(e.target.value))} className="field">
            {finishes.map((f, i) => (
              <option key={f.name} value={i}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-4 self-end rounded-xl border border-ink/15 bg-white/70 px-4 py-3">
          <span className="text-[0.95rem]">Rush order</span>
          <span className="relative inline-flex">
            <input type="checkbox" checked={rush} onChange={(e) => setRush(e.target.checked)} className="peer sr-only" />
            <span className="h-6 w-11 rounded-full bg-ink/15 transition-colors peer-checked:bg-clay peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-clay" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </span>
        </label>
      </div>

      <dl className="mt-7 space-y-2 border-t border-dashed border-ink/20 pt-5 font-mono text-[0.8rem]">
        <Row k="Setup" v={usd(setupFee)} />
        <Row k={`Material · ${material.rate.toFixed(2)}/g × ${Number(grams) || 0}g × ${q.n}`} v={usd(q.materialCost)} />
        {q.discount > 0 && <Row k={`Quantity discount (${q.pct}%)`} v={`−${usd(q.discount)}`} accent />}
        {q.finishing > 0 && <Row k={`Finishing · ${finish.name}`} v={usd(q.finishing)} />}
        {q.rushFee > 0 && <Row k="Rush" v={usd(q.rushFee)} />}
        {q.minApplied && <Row k={`Minimum order applies`} v={usd(minimumOrder)} accent />}
      </dl>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 rounded-xl bg-ink px-5 py-4 text-bone">
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-bone/60">Estimated total</p>
          <p className="font-display text-4xl font-semibold tracking-tight" aria-live="polite">
            {usd(q.total)}
          </p>
          {q.n > 1 && <p className="mt-0.5 font-mono text-xs text-bone/60">{usd(q.perPart)} per part</p>}
        </div>
        <a href={quoteLink} className="btn bg-clay text-bone hover:bg-bone hover:text-ink">
          Request this quote
        </a>
      </div>
    </div>
  );
}

function Row({ k, v, accent }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className={accent ? "text-clay" : ""}>{v}</dd>
    </div>
  );
}
