import React from "react";
import { createRoot } from "react-dom/client";
import Gallery from "./components/Gallery.jsx";
import QuoteEstimator from "./components/QuoteEstimator.jsx";
import ContactForm from "./components/ContactForm.jsx";

// Each "island" reads JSON that Jekyll renders from Siteleaf-managed content,
// then replaces its static fallback markup with the interactive version.
const islands = [
  { root: "gallery-root", data: "gallery-data", Component: Gallery, prop: "items" },
  { root: "estimator-root", data: "estimator-data", Component: QuoteEstimator, prop: "config" },
  { root: "contact-root", data: "contact-data", Component: ContactForm, prop: "config" },
];

function readJSON(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  try {
    return JSON.parse(el.textContent);
  } catch (err) {
    console.error(`Could not parse #${id}`, err);
    return null;
  }
}

for (const { root, data, Component, prop } of islands) {
  const el = document.getElementById(root);
  if (!el) continue;
  const payload = readJSON(data);
  if (payload == null) continue;
  createRoot(el).render(<Component {...{ [prop]: payload }} {...el.dataset} />);
}
