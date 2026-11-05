import React, { useMemo, useState } from "react";

const initialFromQuery = () => {
  const p = new URLSearchParams(window.location.search);
  const lines = [];
  if (p.get("project")) lines.push(`I'd like something similar to: ${p.get("project")}`);
  if (p.get("estimate"))
    lines.push(`Online estimate: ${p.get("estimate")} (${p.get("qty") || 1} × ${p.get("material") || "—"}, ${p.get("finish") || "raw"})`);
  return {
    plan: p.get("plan") || "",
    material: p.get("material") || "",
    quantity: p.get("qty") || "",
    message: lines.length ? lines.join("\n") + "\n\n" : "",
  };
};

export default function ContactForm({ config }) {
  const { endpoint, email, projectTypes = [], materials = [], successMessage } = config;
  const pre = useMemo(initialFromQuery, []);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errors, setErrors] = useState({});

  const validate = (data) => {
    const e = {};
    if (!data.get("name")?.trim()) e.name = "Please add your name.";
    const em = data.get("email")?.trim();
    if (!em) e.email = "We need an email to send your quote.";
    else if (!/^\S+@\S+\.\S+$/.test(em)) e.email = "That email doesn't look right.";
    if (!data.get("message")?.trim()) e.message = "Tell us a little about the project.";
    return e;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const form = ev.currentTarget;
    const data = new FormData(form);
    if (data.get("_gotcha")) return; // spam honeypot
    const e = validate(data);
    setErrors(e);
    if (Object.keys(e).length) {
      form.querySelector(`[name="${Object.keys(e)[0]}"]`)?.focus();
      return;
    }

    if (!endpoint) {
      // No form service configured yet: hand off to the visitor's email app.
      const body = [...data.entries()]
        .filter(([k, v]) => k !== "_gotcha" && String(v).trim())
        .map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)}: ${v}`)
        .join("\n");
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(
        `Print request from ${data.get("name")}`
      )}&body=${encodeURIComponent(body)}`;
      setStatus("sent");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="flex min-h-[420px] flex-col items-start justify-center" role="status">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-clay text-bone">
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="m4.5 10.5 3.5 3.5 7.5-8" />
          </svg>
        </span>
        <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight">Request sent</h2>
        <p className="mt-3 max-w-md leading-relaxed text-ink-soft">
          {endpoint ? successMessage : `Your email app should open with the details filled in. If it didn't, write to ${email}.`}
        </p>
        <button type="button" onClick={() => setStatus("idle")} className="btn-ghost mt-8">
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Request a quote</h2>
        <p className="mt-1 text-sm text-muted">Fields marked * are required.</p>
      </div>

      <Field label="Name *" error={errors.name}>
        <input name="name" autoComplete="name" className="field" />
      </Field>
      <Field label="Email *" error={errors.email}>
        <input name="email" type="email" autoComplete="email" className="field" />
      </Field>

      <Field label="Project type">
        <select name="project_type" className="field" defaultValue="">
          <option value="">Choose one</option>
          {projectTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="Material">
        <select name="material" className="field" defaultValue={pre.material}>
          <option value="">Not sure — recommend one</option>
          {materials.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </Field>

      <Field label="Quantity">
        <input name="quantity" type="number" min="1" inputMode="numeric" defaultValue={pre.quantity} className="field font-mono" />
      </Field>
      <Field label="Needed by">
        <input name="needed_by" type="date" className="field" />
      </Field>

      <div className="sm:col-span-2">
        <Field label="Link to your files">
          <input name="file_link" type="url" placeholder="Google Drive, Dropbox, Printables…" className="field" />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Project details *" error={errors.message}>
          <textarea
            name="message"
            rows={5}
            defaultValue={pre.message}
            placeholder="What is it for, rough size, color, any tolerances that matter…"
            className="field resize-y"
          />
        </Field>
      </div>

      {pre.plan && <input type="hidden" name="plan" value={pre.plan} />}
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="flex flex-wrap items-center justify-between gap-4 sm:col-span-2">
        <p className="text-xs text-muted" role={status === "error" ? "alert" : undefined}>
          {status === "error" ? (
            <span className="text-clay">Something went wrong. Please email {email} instead.</span>
          ) : pre.plan ? (
            `Plan: ${pre.plan}`
          ) : (
            "We'll only use your details to reply to this request."
          )}
        </p>
        <button type="submit" disabled={status === "sending"} className="btn-primary disabled:opacity-60">
          {status === "sending" ? "Sending…" : "Send request"}
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 10h12m-5-5 5 5-5 5" />
          </svg>
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {React.cloneElement(children, {
        "aria-invalid": error ? "true" : undefined,
        className: `${children.props.className} ${error ? "border-clay" : ""}`,
      })}
      {error && <span className="mt-1.5 block text-xs text-clay">{error}</span>}
    </label>
  );
}
