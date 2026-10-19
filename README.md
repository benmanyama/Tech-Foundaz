# Tech Foundaz website

Single-page marketing site for Tech Foundaz, an IT, software and security company in Dar es Salaam. It is plain HTML, CSS and JavaScript, so there is no build step and nothing to install.

## Structure

```
index.html              Page markup (all sections)
assets/css/styles.css   Styles; colours and fonts are CSS variables at the top
assets/js/i18n.js       Kiswahili translations (English lives in index.html)
assets/js/main.js       Language switch, mobile menu, quote form, scroll reveals, hero animation
assets/images/          Service photos (WebP, 800px and 1600px), logo icon and favicons
```

## Languages (English / Kiswahili)

The EN | SW switch in the header changes all page text, the browser title and the search description.

- English text is written directly in `index.html`. Every translatable element has a `data-i18n="key"` attribute.
- The Kiswahili text for each key is in `assets/js/i18n.js`. To change a translation, edit it there.
- To add new text, give the element a `data-i18n` key and add the same key to `i18n.js`.
- The visitor's choice is remembered. On first visit, phones and browsers set to Swahili get Kiswahili automatically.
- Link straight to a language with `index.html?lang=sw` or `?lang=en`.
- Quote requests include a `language` field so you know which language to reply in.

## Animations

- **Hero background:** a network animation drawn on a `<canvas>`. It pauses when off-screen or when the tab is hidden.
- **Scroll reveals:** add `data-reveal` to any element to fade it in (`="left"` or `="right"` slide it in from that side). Add `data-stagger` to a container to reveal its children one after another.
- Visitors whose device is set to reduce motion see the page without animations.

## Run locally

Open `index.html` in a browser, or serve the folder:

```
npx serve .
# or
python -m http.server 8000
```

## Before going live

- **Kiswahili:** have a native speaker proofread `assets/js/i18n.js`.

Company details (phone, email, address, registration number, tagline, vision, mission, values and core service areas) come from the Tech Foundaz company profile.
- **Quote form:** submissions go to Formspree (`FORM_ENDPOINT` in `assets/js/main.js`, form "Tech Founders Quote Requests"). Name and phone are required. View requests and change the recipient email in the Formspree dashboard.

## Deploying

Any static host works: GitHub Pages, Netlify, Vercel, Cloudflare Pages or cPanel hosting. Upload the folder contents with `index.html` at the root.
