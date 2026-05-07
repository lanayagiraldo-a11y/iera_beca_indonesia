# iERA Brand Guidelines

> Visual identity reference for digital products built for iERA Latam — Islamic Education and Research Academy.

Source of truth: [latin.iera.org](https://latin.iera.org) (Latam) · [iera.org](https://iera.org) (Global)
Logo files: `public/iera-logo.png` (color on light) · `public/iera-logo-white.png` (color on dark)

---

## 1 · Logo

The iERA logo combines a **bold black wordmark** with a small **CMYK-style diamond** above the letter "i". The diamond is the brand's signature element — never alter its proportions or colors.

### Variants
- **Color on light backgrounds**: standard logo (`iera-logo.png`)
- **Color on dark backgrounds**: same logo with light text (`iera-logo-white.png`)

### Tagline (regional)
- **Latam**: "APRENDIENDO EL ISLAM" / "INVITANDO AL ISLAM"
- **Global**: "Islamic Education and Research Academy"

### Clear space
Always leave at least the height of the "i" as padding on all sides.

### Don't
- Don't recolor the diamond
- Don't stretch or distort
- Don't use the logo at sizes smaller than 28px height
- Don't apply effects (shadows, gradients on the logo itself)

---

## 2 · Color palette

### Primary
| Token | Hex | Use |
|---|---|---|
| `iera-500` | **#0A0A0A** | Primary brand color · backgrounds, headlines, CTAs |
| `iera-700` / `iera-600` | **#000000** | Hover states, deepest accents |
| `iera-50` | **#FAFAFA** | Page backgrounds (off-white) |
| `iera-100` | **#F1F1F1** | Card backgrounds, subtle dividers |
| `iera-200` | **#D9D9D9** | Borders, separators |
| `iera-400` | **#404040** | Secondary text |

### Brand accent (diamond colors — CMYK-inspired)
| Token | Hex | Connotation |
|---|---|---|
| `iera-cyan` | **#1AA3DE** | 💙 Trust, learning, primary action accent |
| `iera-green` | **#8FC93A** | 💚 Growth, success, positive states |
| `iera-yellow` | **#F5C518** | 💛 Energy, attention, highlights |
| `iera-pink` | **#D60C8C** | ❤️ Passion, urgency, dawah focus |

### Usage rules
- **Black is dominant.** ~80% of pixels should be black/grey/white.
- **Cyan is the primary accent** for interactive elements (links, focus states, highlighted CTAs).
- **The 4 colors together** can be used to differentiate parallel categories (e.g. the 4 program benefits, the 4 phases of the candidate journey, etc.) — never mix them randomly.
- **Never use these colors as primary text** on light backgrounds (only black is allowed for body text).

---

## 3 · Typography

### Font family
System UI stack (no custom fonts to keep load time fast):
```css
font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif;
```

If a custom font is ever introduced, candidates that match the iERA tech-bold aesthetic:
- **Inter** (Google Fonts) — neutral, modern
- **Space Grotesk** — bolder, more distinctive

### Hierarchy
| Level | Size | Weight | Use |
|---|---|---|---|
| H1 | 32px | 800 (extrabold) | Page titles |
| H2 | 24px | 700 (bold) | Section headers |
| H3 | 16-18px | 700 (bold) | Card titles |
| Body | 14px | 400 | Default text |
| Small | 12px | 400-600 | Captions, metadata |
| Tiny | 10-11px | 600-700 | Labels, badges |

### Tone of voice
- **Confident** — like a teacher, not a salesperson
- **Inclusive** — welcoming to new Muslims and born Muslims alike
- **Action-oriented** — "Apply now", "Submit report", "Approve as Director"
- **Reverent without being pious** — "Baraka Allahu feekum" / "Insha Allah" used sparingly, in genuine context
- **Bilingual when relevant** — Spanish/English/Arabic for stakeholder docs (BIU document, contract)

---

## 4 · Iconography & emoji

iERA's audience is global Muslim. Use:
- ✅ **Functional emoji** for navigation/status: 📂 documents, ⭐ score, 👔 director, 🇮🇩 Indonesia
- ✅ **Cultural-appropriate emoji**: 🕌 mosque, ☪️ moon-star, 📚 books, 🤲 dua hands
- ❌ Never use: emoji that imply alcohol, music celebrations, gambling, etc.

---

## 5 · Component patterns

### Primary button
- Background: `bg-iera-500` (black)
- Text: white
- Hover: `bg-black` + shadow
- Padding: `px-4 py-2`
- Radius: `rounded-lg`

### Secondary button
- Background: white
- Border: `border-slate-300`
- Text: `text-slate-700`
- Hover: `bg-slate-50`

### Cards
- Background: white
- Border: `border-slate-200`
- Radius: `rounded-xl`
- Header: `bg-slate-50` divider

### Phase color mapping (for status badges, kanban columns, etc.)
Each program phase gets one of the iERA accent colors:
- 📝 **Application** → slate (neutral start)
- 📂 **Review** → yellow (attention/in-progress)
- 👔 **Approval** → pink (decision moment)
- ✈️ **Pre-travel** → cyan (forward motion)
- 🇮🇩 **Indonesia** → green (active program)

### iera-diamond accent
A small CSS-only diamond (4-color split) for premium/branded UI moments:
```html
<span className="iera-diamond"></span>
```
Use sparingly — only on hero sections, official document headers, and brand pills.

---

## 6 · Voice in user-facing copy

### Application form (postulants)
- Friendly, welcoming, second-person: "What's your name?", "Tell us about your motivation"
- Confidence-building: "Your data is safe", "Don't worry — just fix the missing parts"
- Uses Islamic greeting in messages: "Assalamu alaikum [name]"

### Admin interface (Country Managers, Director)
- Direct and operational: "Approve as Director", "Mark documents validated"
- Provides next-step guidance: "What's next?" cards

### Student reports (active students)
- Personal, encouraging: "Hi [name] 👋", "Tell us how your month is going"
- Emotionally supportive: "If everything is fine, leave blank"
- Warm closing: "May Allah bless you · Baraka Allahu feekum"

### BIU & external official documents
- Formal, bilingual (English/Spanish)
- Uses the title "Continental Director", "Coordinator" with full names
- Includes confidentiality notice and document ID

---

## 7 · Implementation in the app

### Tailwind tokens
All brand colors are defined in `tailwind.config.js` under the `iera` namespace:
```js
iera: {
  50: '#FAFAFA', 100: '#F1F1F1', 200: '#D9D9D9',
  300: '#9E9E9E', 400: '#404040',
  500: '#0A0A0A', 600: '#000000',
  yellow: '#F5C518', green: '#8FC93A',
  pink: '#D60C8C', cyan: '#1AA3DE'
}
```

### CSS components
Pre-defined component classes in `src/index.css`:
- `.btn-primary` — black button with white text
- `.btn-secondary` — white button with grey border
- `.btn-cyan` — cyan button (used for non-destructive secondary actions)
- `.card`, `.card-header`, `.card-body` — standard card structure
- `.input-base`, `.label-base` — form controls (cyan focus ring)
- `.iera-diamond` — branded 4-color diamond accent

### Logo component pattern
Always reference logos from `/public`:
```jsx
<img src="/iera-logo.png" alt="iERA" className="h-12" />          // light bg
<img src="/iera-logo-white.png" alt="iERA" className="h-12" />    // dark bg (sidebar)
```

---

## 8 · Brand checklist before shipping

Before deploying any new screen or document:

- [ ] Logo is present and correctly sized
- [ ] Black is the dominant color (≥70% of pixels)
- [ ] Accent colors used purposefully (not randomly)
- [ ] Tagline or program reference visible somewhere
- [ ] Tone matches audience (postulant / admin / student / external)
- [ ] No competing fonts beyond the system stack
- [ ] iERA name written correctly: lowercase "i", uppercase "ERA"
- [ ] Mobile responsive (test on 375px width)

---

**Maintained by:** iERA digital team
**Last updated:** Apr 2026
**Repo:** `iera-scholarship-tracker`
