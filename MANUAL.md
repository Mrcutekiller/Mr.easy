# MR.easy Complete Reference Manual & Guide 🚀

> **"Write words. Render worlds. Build high-converting money-making websites in under 5 minutes."**

---

## Table of Contents

1. [Overview & Value Proposition](#1-overview--value-proposition)
2. [Quick Start & Installation](#2-quick-start--installation)
3. [Language Core Rules](#3-language-core-rules)
4. [Complete Tag & Element Reference](#4-complete-tag--element-reference)
5. [Style Modifiers & Custom CSS Rules](#5-style-modifiers--custom-css-rules)
6. [Command Line Interface (CLI) Guide](#6-command-line-interface-cli-guide)
7. [Web IDE & Export Guide](#7-web-ide--export-guide)
8. [Money-Site Blueprints (Profitable Web Templates)](#8-money-site-blueprints-profitable-web-templates)
   - [Blueprint 1: $5,000/mo SaaS Sales & Pricing Page](#blueprint-1-5000mo-saas-sales--pricing-page)
   - [Blueprint 2: Digital Product & E-Book Storefront](#blueprint-2-digital-product--e-book-storefront)
   - [Blueprint 3: High-Commission Affiliate Product Review Hub](#blueprint-3-high-commission-affiliate-product-review-hub)
   - [Blueprint 4: Agency & Local Business Lead Generation](#blueprint-4-agency--local-business-lead-generation)
   - [Blueprint 5: Online Course & Coaching Sales Funnel](#blueprint-5-online-course--coaching-sales-funnel)
9. [Troubleshooting & FAQ](#9-troubleshooting--faq)

---

## 1. Overview & Value Proposition

### How MR.easy Helps You Make Money Online
MR.easy is a human-readable web programming language designed to eliminate code friction. Traditional website creation requires learning complex HTML/CSS, JavaScript bundlers, npm setups, and heavy frameworks.

With **MR.easy**:
- **Speed to Market**: Build sales pages, landing pages, and product hubs in 5 minutes instead of 3 days.
- **Zero Technical Bloat**: No closing tags `</div>`, no semicolons `;`, no complex bundler configurations.
- **High-Converting Designs**: Built-in glassmorphism, responsive grids, call-to-action buttons, pricing cards, and dark-mode themes out of the box.
- **Instant Deployment**: Export static HTML bundles with 1-click ready to host on Vercel, Netlify, GitHub Pages, or any server.

---

## 2. Quick Start & Installation

### Method A: Automated Windows Installer (CLI)
Open **PowerShell as Administrator** and run:
```powershell
powershell -ExecutionPolicy Bypass -File installer\install.ps1
```
Or double-click `installer\install.bat`.

### Method B: Manual NPM Link
```bash
git clone https://github.com/Mrcutekiller/Mr.easy.git
cd Mr.easy
npm install
npm link
```

### Method C: Web IDE (No Install Needed)
Open `ide/index.html` directly in your web browser or visit the web hosted IDE. Write code on the left, see instant live preview on the right.

---

## 3. Language Core Rules

### Rule 1: Declaration Line (Required)
Every `.mreasy` document **MUST** start with the `Mr.easy` declaration:
```mreasy
Mr.easy "My Website Title"
```

### Rule 2: Indentation Defines Hierarchy
Nested elements use 2-space or tab indentation:
```mreasy
section "features"
  grid cols:3
    card shadow
      title "Feature 1"
```

### Rule 3: Strings in Quotes
Text containing spaces must be enclosed in double quotes `"..."`:
```mreasy
title "Welcome to my Store"
button "Buy Now - $29" blue big
```

### Rule 4: Comments Start with `#`
```mreasy
# This is a comment line that won't appear on the compiled website
```

---

## 4. Complete Tag & Element Reference

### Layout & Container Tags

| Keyword | Example | Description |
|---------|---------|-------------|
| `nav` | `nav bg:#0f0d0b` | Navigation header bar |
| `hero` | `hero bg:#080706 padding:80` | High-impact above-the-fold hero section |
| `section` | `section "pricing" bg:#141210` | Standard page section |
| `grid` | `grid cols:3 gap:24` | Responsive grid container |
| `row` | `row center gap:16` | Flex row (horizontal layout) |
| `column` / `col` | `column align:center` | Flex column (vertical layout) |
| `card` | `card bg:#1d1915 radius:12 shadow` | Content card block |
| `box` | `box padding:20` | Simple container box |
| `footer` | `footer bg:#080706` | Page footer container |
| `sidebar` | `sidebar width:260` | Layout sidebar panel |
| `divider` | `divider color:#333` | Horizontal divider line |
| `spacer` | `spacer size:30` | Empty vertical spacing block |

### Content & Media Tags

| Keyword | Example | Description |
|---------|---------|-------------|
| `title` | `title "Headline" size:48 glow` | Large heading element |
| `subtitle` | `subtitle "Sub-headline text"` | Secondary heading |
| `text` | `text "Paragraph text goes here"` | Standard body paragraph |
| `button` | `button "Get Started" bg:#c8963a big` | Interactive call-to-action button |
| `link` | `link "View Specs" url:#specs` | Anchor link |
| `image` / `img` | `image "hero.jpg" rounded width:400` | Image element |
| `video` | `video "demo.mp4" controls autoplay` | Video player |
| `icon` | `icon rocket color:#e8b45a size:32` | FontAwesome icon (star, heart, rocket, bolt, etc.) |
| `badge` / `tag` | `badge "NEW RELEASE" purple` | Pill badge indicator |
| `stat` | `stat number:"$12.5k" label:"MRR"` | Large metric display card |
| `quote` | `quote "Best tool we've used!" author:"Sarah C."` | Testimonial quote block |
| `code` | `code "mreasy run"` | Code snippet display |

### Forms & Interactive Components

| Keyword | Example | Description |
|---------|---------|-------------|
| `form` | `form action:"/submit" method:post` | Form container |
| `input` | `input placeholder:"Enter email" type:email` | Input field |
| `label` | `label "Email Address"` | Input field label |
| `select` | `select options:"Basic,Pro,Enterprise"` | Dropdown menu select |
| `checkbox` | `checkbox "I agree to terms"` | Toggle checkbox |
| `accordion` | `accordion title:"Is there a refund policy?"` | Expandable collapsible section |
| `modal` | `modal id:"checkout-modal"` | Popup modal dialog |

---

## 5. Style Modifiers & Custom CSS Rules

You can customize elements using inline modifier keywords or exact property values.

### Named Preset Modifiers
- **Sizes**: `tiny`, `small`, `medium`, `big`
- **Text Styles**: `glow`, `gradient`, `bold`, `italic`, `center`
- **Borders & Shadows**: `shadow`, `rounded`, `glass`, `outline`
- **Colors**: `blue`, `red`, `green`, `purple`, `orange`, `pink`, `yellow`, `white`, `black`, `gray`

### Custom Property Key:Value Rules

```mreasy
title "Custom Hero Title" size:56 color:#e8b45a
card bg:#141210 radius:16 padding:32 shadow
grid cols:4 gap:20
```

- `bg:#hex` or `bg:url('...')`: Custom background color or image URL.
- `color:#hex`: Text color.
- `size:number`: Font size in pixels.
- `radius:number`: Border radius in pixels.
- `padding:number`: Padding in pixels.
- `cols:number`: Number of grid columns (1 to 6).
- `gap:number`: Grid or row gap in pixels.

---

## 6. Command Line Interface (CLI) Guide

MR.easy comes with a powerful terminal tool `mreasy`.

### Creating a New Project
```powershell
mreasy new my-money-site
```
*Creates folder `my-money-site` with a starter `index.mreasy` file.*

### Live Preview Server with Auto-Reload
```powershell
cd my-money-site
mreasy run
```
*Launches live web server at `http://localhost:3000`. Any edits to `.mreasy` files immediately refresh the browser.*

### Compiling Standalone Files
```powershell
mreasy compile page.mreasy
```
*Generates standalone `page.html` in the current directory.*

### Building Production Dist Bundle
```powershell
mreasy build
```
*Compiles the project into clean, optimized production HTML inside `dist/index.html`.*

---

## 7. Web IDE & Export Guide

If you prefer writing without installing CLI tools:
1. Open `ide/index.html` in any browser.
2. Edit code in the left panel. Syntax highlighting and live auto-compilation update the right panel instantly.
3. Click **"Download ZIP"** at the top right to download a deployment-ready ZIP containing your compiled `index.html` and assets.

---

## 8. Money-Site Blueprints (Profitable Web Templates)

Use these complete ready-to-copy blueprints to launch profitable websites instantly.

### Blueprint 1: $5,000/mo SaaS Sales & Pricing Page
```mreasy
Mr.easy "FlowCraft SaaS — Automate Your Business"

nav bg:#080706 color:#f2ead8
  logo "FlowCraft" size:22 color:#e8b45a
  links Features Pricing FAQ Contact
  button "Start Free Trial" bg:#c8963a color:#080706 small

hero bg:#0f0d0b padding:90
  badge "⚡ LIMITED TIME 50% OFF" purple
  title "Automate Your Workflows in Minutes" size:54 color:#f2ead8 glow
  subtitle "Save 15+ hours every week by connecting your apps into automated pipelines." size:20 color:#a69a86
  spacer size:24
  row center gap:16
    button "Get Started Free" bg:#c8963a color:#080706 size:big
    button "Watch 2-Min Demo" outline size:big

section "stats" bg:#080706 padding:40
  grid cols:3 gap:24
    stat number:"10,000+" label:"Active Businesses"
    stat number:"$4.2M" label:"Hours Saved"
    stat number:"99.9%" label:"Uptime SLA"

section "pricing" bg:#141210 padding:80
  title "Simple, Transparent Pricing" size:36 color:#e8b45a center
  subtitle "Choose the plan that fits your growth." size:18 color:#a69a86 center
  spacer size:40
  grid cols:3 gap:24
    card bg:#1d1915 radius:16 padding:32 shadow
      title "Starter" size:24 color:#f2ead8
      text "$19 / month" size:32 color:#e8b45a bold
      text "Ideal for freelancers and side projects." color:#a69a86
      spacer size:16
      button "Choose Starter" outline big
    card bg:#211c16 radius:16 padding:32 shadow glow
      badge "MOST POPULAR" green
      title "Pro Growth" size:24 color:#f2ead8
      text "$49 / month" size:32 color:#e8b45a bold
      text "Unlimited workflows & priority support." color:#a69a86
      spacer size:16
      button "Start Pro Trial" bg:#c8963a color:#080706 big
    card bg:#1d1915 radius:16 padding:32 shadow
      title "Agency" size:24 color:#f2ead8
      text "$149 / month" size:32 color:#e8b45a bold
      text "Dedicated infrastructure & custom integrations." color:#a69a86
      spacer size:16
      button "Contact Sales" outline big

footer bg:#080706 color:#62584a
  text "© 2026 FlowCraft Inc. Built with MR.easy"
```

---

### Blueprint 2: Digital Product & E-Book Storefront
```mreasy
Mr.easy "The AI Freedom Guide — Digital Store"

hero bg:#080706 padding:80
  badge "BESTSELLER E-BOOK" gold
  title "Master AI Prompting & Monetization" size:50 color:#f2ead8 glow
  subtitle "The step-by-step playbook that generated $35,000 in digital downloads." size:18 color:#a69a86
  spacer size:20
  button "Download Playbook — $27" bg:#c8963a color:#080706 big

section "product" bg:#0f0d0b padding:60
  grid cols:2 gap:32
    card bg:#141210 radius:16 padding:24 shadow
      icon gem color:#e8b45a size:40
      title "What's Inside" size:24 color:#f2ead8
      text "• 150+ Copy-Paste Prompts for Marketing" color:#a69a86
      text "• 5 Automated Email Funnel Templates" color:#a69a86
      text "• Video Guide on Selling Digital Assets" color:#a69a86
    card bg:#141210 radius:16 padding:24 shadow
      title "Instant Instant Access" size:24 color:#f2ead8
      text "Receive PDF, EPUB, and Notion Dashboard immediately after purchase." color:#a69a86
      spacer size:16
      button "Buy Now with Stripe" bg:#22c55e color:#000 big

footer bg:#080706
  text "Built with MR.easy — Start selling digital goods today."
```

---

### Blueprint 3: High-Commission Affiliate Product Review Hub
```mreasy
Mr.easy "TechRadar — Top Hosting & AI Tools 2026"

nav bg:#080706
  logo "TechRadar" color:#e8b45a
  links Reviews Hosting Deals About

hero bg:#0f0d0b padding:70
  title "Top 5 AI Tools for Content Creators" size:44 color:#f2ead8
  subtitle "Unbiased reviews and exclusive discount codes." size:18 color:#a69a86

section "reviews" bg:#141210 padding:60
  grid cols:3 gap:24
    card bg:#1d1915 radius:12 shadow
      badge "9.8 / 10 RATING" green
      title "Jasper AI Review" size:22 color:#f2ead8
      text "Best AI writing assistant for long-form blog articles." color:#a69a86
      button "Claim 20% Discount ↗" bg:#3b82f6 color:#fff medium
    card bg:#1d1915 radius:12 shadow
      badge "9.6 / 10 RATING" green
      title "Midjourney v6 Guide" size:22 color:#f2ead8
      text "Generate photorealistic imagery for commercial sales." color:#a69a86
      button "Read Full Review ↗" outline medium
    card bg:#1d1915 radius:12 shadow
      badge "9.5 / 10 RATING" green
      title "Synthesia Video AI" size:22 color:#f2ead8
      text "Create studio quality video avatars without cameras." color:#a69a86
      button "Try Free Trial ↗" bg:#c8963a color:#080706 medium

footer bg:#080706
  text "Affiliate Disclosure: We earn a commission on qualifying clicks."
```

---

### Blueprint 4: Agency & Local Business Lead Generation
```mreasy
Mr.easy "Apex Digital Agency — Web Design & SEO"

hero bg:#080706 padding:90
  badge "ADDIS ABABA & GLOBAL" green
  title "We Build Websites That Get You Customers" size:52 color:#f2ead8 glow
  subtitle "High-converting web design, Google SEO ranking, and lead generation." size:20 color:#a69a86
  spacer size:20
  button "Book Free Strategy Call" bg:#c8963a color:#080706 big

section "services" bg:#0f0d0b padding:70
  grid cols:3 gap:24
    card bg:#141210 radius:16 padding:28 shadow
      icon rocket color:#e8b45a size:36
      title "Web Development" size:22 color:#f2ead8
      text "Ultra-fast custom sites built with MR.easy." color:#a69a86
    card bg:#141210 radius:16 padding:28 shadow
      icon bolt color:#3b82f6 size:36
      title "SEO Ranking" size:22 color:#f2ead8
      text "Rank #1 on Google for high-intent keywords." color:#a69a86
    card bg:#141210 radius:16 padding:28 shadow
      icon heart color:#22c55e size:36
      title "Conversion Ads" size:22 color:#f2ead8
      text "Run targeted ad campaigns with 4x ROI." color:#a69a86

section "contact" bg:#141210 padding:60
  title "Get Your Free Audit" size:32 color:#e8b45a center
  form action:"/submit" method:post
    input type:text placeholder:"Your Name"
    input type:email placeholder:"Your Email"
    button "Submit Lead Request" bg:#c8963a color:#080706 big

footer bg:#080706
  text "Apex Digital Agency © 2026"
```

---

### Blueprint 5: Online Course & Coaching Sales Funnel
```mreasy
Mr.easy "Code Accelerator — Master Web Dev in 7 Days"

hero bg:#080706 padding:90
  badge "ENROLLMENT OPEN" red
  title "Go From Zero to Full-Stack Creator" size:50 color:#f2ead8 glow
  subtitle "No prior coding background required. Learn by building real money sites." size:18 color:#a69a86
  button "Claim Your Spot — $199" bg:#c8963a color:#080706 big

section "curriculum" bg:#141210 padding:70
  grid cols:2 gap:24
    card bg:#1d1915 radius:16 padding:24 shadow
      title "Day 1-2: MR.easy Fundamentals" size:20 color:#f2ead8
      text "Master syntax, tags, layout grids, and color styling." color:#a69a86
    card bg:#1d1915 radius:16 padding:24 shadow
      title "Day 3-5: Building Money Sites" size:20 color:#f2ead8
      text "Create SaaS sales pages, e-commerce stores, and lead funnels." color:#a69a86

footer bg:#080706
  text "Code Accelerator Course © 2026"
```

---

## 9. Troubleshooting & FAQ

### Q: Why does my file error on line 1?
Every `.mreasy` file must begin with `Mr.easy "Your Title"`. Make sure the declaration is at the top.

### Q: How do I host my website online?
Run `mreasy build` in your terminal to create `dist/index.html`. You can drag and drop this `dist` folder directly onto [Netlify Drop](https://app.netlify.com/drop) or Vercel for free instant hosting!

### Q: Can I add custom HTML or Google Fonts?
Yes! MR.easy compiled code generates clean HTML5 that automatically includes font support and responsive styling.

---
*MR.easy Documentation Manual v2.0 — Created by Biruk (@mrcute_killer) in Ethiopia 🇪🇹*
