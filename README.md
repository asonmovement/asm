# Anh Sơn Movement — complete project

**Heard. Valued. Seen.** — a bilingual (English / Vietnamese) website for the kindness
movement founded by Anh Sơn. This folder contains everything: the site, the media,
the brand assets and the documentation.

---

## Quick start

Open a terminal **in this folder** and run:

```
vercel --prod
```

First time on a machine:

```
sudo npm i -g vercel
vercel login
vercel link      # Y · scope vertize · existing project Y · anh-son-website
vercel --prod
```

See **START-HIER.md** for the full step-by-step guide in Dutch.

---

## File structure

```
anh-son-movement/
│
├── index.html                  the site — markup only (8 views, EN + VN)
│
├── css/
│   ├── style.css               all styling: layout, palette, components
│   └── fonts.css               Fraunces, Hanken Grotesk, Caveat (base64-embedded)
│
├── js/
│   └── app.js                  all behaviour + ASM_CONFIG (see below)
│
├── api/                        Vercel serverless functions
│   ├── nominate.js             "Know someone?" form → email via Web3Forms
│   └── chat.js                 optional LLM endpoint for the assistant Lynn
│
├── assets/                     photography and video (compressed, ~3.6 MB total)
│   ├── hero.mp4 / story.mp4 / moment.mp4 / clip1.mp4 / clip2.mp4
│   ├── *-poster.jpg            first frame of each video
│   └── elder-smile.jpg, elder-work.jpg, man-market.jpg,
│       father-child.jpg, children-joy.jpg, seller.jpg
│
├── og-image.png                1200×630 social share image
├── package.json
├── START-HIER.md               Dutch step-by-step guide
│
└── merk-en-materiaal/          brand kit (not needed to run the site)
    ├── logo.svg
    ├── deelafbeelding-waarden.png
    ├── merkportfolio.html       brand story + 3 design directions
    ├── concepten/               the 3 directions as images
    └── documenten/              2 PDFs + technical documentation
```

`index.html`, `css/`, `js/`, `api/` and `assets/` must stay together.
`merk-en-materiaal/` can be moved anywhere without breaking the site.

---

## The one place you edit: ASM_CONFIG

At the top of `js/app.js`:

```js
var ASM_CONFIG = {
  whatsapp: 'https://whatsapp.com/channel/...',   // already live
  email:    'hello@anhsonmovement.org',
  site:     'https://anh-son-website.vercel.app',
  instagram:'', facebook:'',
  pay: {
    once:    { 5:'', 10:'', 25:'', 50:'' },       // Stripe/Mollie payment links
    monthly: { 5:'', 10:'', 25:'', 50:'' },
    custom:  ''
  },
  paypal:  '',
  zalopay: '',
  bank: { name:'', accountName:'', accountNumber:'', note:'' }
};
```

Any payment method left empty is **hidden automatically** in the gift modal —
there is never a dead button.

---

## Environment variables (Vercel → Settings → Environment Variables)

| Variable | Required | Purpose |
|---|---|---|
| `WEB3FORMS_KEY` | yes | delivers the nomination form to your inbox (already set) |
| `ANTHROPIC_API_KEY` | no | turns Lynn into a real LLM; without it Lynn uses her built-in bilingual answers |

---

## The site at a glance

| View | Content |
|---|---|
| Home | hero video, live counters, three values, photos, donate call |
| Our Story | the story in beats, "This movement is for…", a note from Sơn |
| The Values | Heard · Valued · Seen |
| Stories | testimonials + three videos |
| Give | 100% promise, amounts, one-time/monthly, gift modal, trust, FAQ |
| Know someone? | nominate a person anonymously |
| Privacy & Terms | privacy, terms, cookies, transparency |

Plus **Lynn**, the assistant (bottom right), a mobile hamburger menu and a
sticky give bar on phones.

---

## Please keep these

1. The **crisis notice** on the nomination form (emergency numbers, "we are not
   an emergency service").
2. **Lynn's crisis handling** — if someone writes about self-harm she responds
   with care, says plainly that she is an AI, and points to emergency services
   and a real human. This runs **locally in the browser**, so it works even when
   the API is down.

People in real distress will use this site. That path has to stay reliable.

---

## Still to do

- [ ] Add Stripe/Mollie payment links to `ASM_CONFIG.pay`
- [ ] Connect the domain (Vercel → Settings → Domains), then replace
      `/og-image.png` in `index.html` with the absolute URL
- [ ] Legal review of the Privacy & Terms texts; fill in `[ORGANISATION]`,
      `[ADDRESS]`, `[COUNTRY]`
- [ ] Replace the Vietnamese stock photography with your own photos of Sơn
      and the community
- [ ] Connect the impact counters to real numbers, or label them as indicative
- [ ] Create the `hello@anhsonmovement.org` mailbox

---

*Heard. Valued. Seen. — built with care by Vertize.*
