# Sonoran Layer Co. — 3D printing studio website

A three-page static site (Gallery, Pricing, Contact) for a 3D printing service in Tucson, Arizona.

- **Jekyll** renders every page as static HTML from content files.
- **Tailwind CSS v4** handles styling.
- **React** powers three interactive "islands": the gallery filter + lightbox, the instant price estimator, and the quote request form.
- **Siteleaf** edits all content (pages, gallery, plans, materials, FAQs, contact details) without touching code.

> **Everything business-specific is placeholder content.** The name "Sonoran Layer Co.", email, phone, hours, prices, material rates and gallery images were not provided and must be replaced before launch. See *Before launch* below.

---

## Pages

| URL | File | Layout | What it shows |
|---|---|---|---|
| `/` | `index.md` | `_layouts/gallery.html` | Hero, capabilities, filterable gallery with lightbox |
| `/pricing/` | `pricing.md` | `_layouts/pricing.html` | Plans, instant estimator, material rate table, FAQ |
| `/contact/` | `contact.md` | `_layouts/contact.html` | Contact details, process steps, quote request form |

The gallery is the home page so the site stays at exactly three pages.

## Where content lives (what's editable in Siteleaf)

| Content | Location | Siteleaf section |
|---|---|---|
| Business name, email, phone, hours, pickup note, form endpoint | `_config.yml` → `title`, `business:` | Settings → Metadata |
| Page headlines, intro text, capabilities, contact steps | Front matter + body of `index.md`, `pricing.md`, `contact.md` | Pages |
| Estimator setup fee, minimum order, rush multiplier, finishes, quantity discounts | `pricing.md` → `estimator:` | Pages → Pricing |
| Gallery prints (image, title, category, material, process, size, description) | `_gallery/*.md` | Gallery collection |
| Pricing plans | `_plans/*.md` | Plans collection |
| Material rates (used by the table **and** the estimator) | `_materials/*.md` | Materials collection |
| FAQs | `_faqs/*.md` | Faqs collection |
| Images | `uploads/` | Uploads |

Each collection document has an `order` field that controls display order. Gallery categories (the filter buttons) are generated automatically from the `category` values used.

## Connecting to Siteleaf

1. Push this folder to a GitHub repository.
2. In Siteleaf, create a new site and choose to sync it with that GitHub repository.
3. Siteleaf picks up `_config.yml`, the three pages, and the four collections. Edits made in Siteleaf are committed back to the repo, and publishing builds the site with Jekyll.

Siteleaf builds with Jekyll only — it does **not** run `npm`. That's why the compiled `assets/css/site.css` and `assets/js/app.js` are committed. Content edits made in Siteleaf need no rebuild; only changes to templates, Tailwind classes or React code do (see below).

## Local development

Requirements: Ruby 3.x with Bundler, Node 18+.

```bash
bundle install
npm install
npm run dev      # watches Tailwind + React and runs `jekyll serve` at http://localhost:4000
```

Before committing template or code changes:

```bash
npm run build    # writes minified assets/css/site.css and assets/js/app.js
```

### Project structure

```
_config.yml            site settings, business details, collections, Siteleaf defaults
index.md / pricing.md / contact.md   the three pages
_layouts/              default + one layout per page
_includes/             header, footer, logo, call-to-action
_gallery/ _plans/ _materials/ _faqs/  Siteleaf-managed collections
uploads/               images (placeholders included)
src/css/site.css       Tailwind source (theme tokens live in @theme)
src/js/main.jsx        mounts the React islands
src/js/components/     Gallery, QuoteEstimator, ContactForm
assets/                compiled CSS/JS + favicon (committed)
```

### How React gets Siteleaf content

Each layout prints the relevant content as JSON in a `<script type="application/json">` tag (e.g. `#gallery-data`), built with Liquid from the collections. `main.jsx` reads that JSON and mounts the component. The static markup inside each mount point is a no-JavaScript fallback.

## The estimator

```
material cost = rate per gram × grams × quantity
                − quantity discount (highest tier reached)
finishing     = material cost × (finish multiplier − 1)
total         = setup fee + material cost + finishing
                × rush multiplier (if rush)
                raised to the minimum order if below it
```

Every number comes from `pricing.md` and `_materials/`. "Request this quote" carries the selection to the contact form and pre-fills it.

## The contact form

- With `business.form_endpoint` **blank**, submitting opens the visitor's email app with the request pre-filled, addressed to `business.email`.
- To receive submissions directly, sign up for a static-form service that accepts `POST` with `Accept: application/json` (Formspree, Basin, Getform and similar), and paste its endpoint URL into `form_endpoint`. A hidden `_gotcha` honeypot field is included for spam filtering.
- Visitors share files by link (Drive, Dropbox, etc.), since static hosting can't accept uploads directly.

## Before launch

- [ ] Replace `title`, `business.email`, `business.phone`, `business.hours`, `business.pickup_note` in `_config.yml`
- [ ] Set `url` in `_config.yml` to the live domain (used for the social-share image)
- [ ] Replace every price in `_plans/`, every `rate_per_gram` in `_materials/`, and the `estimator:` values in `pricing.md`
- [ ] Clear `sample_pricing_notice` in `pricing.md` (removes the "Sample prices shown" badge)
- [ ] Replace the placeholder SVGs in `uploads/` with real photos and update each gallery item's `image`, `alt`, details and description
- [ ] Review FAQ answers and plan features (turnaround, file types, pickup) against how the business actually works
- [ ] Set `form_endpoint`, or confirm the email fallback is acceptable
- [ ] Replace `uploads/og-image.svg` with a 1200×630 PNG or JPG — many social networks don't display SVG share images
