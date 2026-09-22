# كُتبي — نظام التصميم البصري (Visual System)

وثيقة مرجعية إلزامية. أي تعديل بصري جديد يجب أن يتبع هذه القيم؛ إن احتجت استثناء،
وثّقه هنا أولًا.

**الاتجاه:** "المكتبة الرقمية" — Editorial + Digital Publishing + Warm Premium.

---

## 1. المبادئ

1. الوضوح > الثقة > الأناقة > التفاعل > الزينة.
2. كل عنصر بصري يجب أن يخدم: توجيه، أو تغذية راجعة، أو هوية. وإلا حُذف.
3. الحركات تعمل للوظيفة؛ تعطيلها يجب أن يكسر الموقع 0%.
4. العربية أولاً: أي layout يُختبر بعنوان عربي طويل قبل الإنجليزي.
5. المنتج هو البطل: الغلاف/المعاينة أكبر عنصر بصري في أي سياق.

---

## 2. Typography

### الخطوط (next/font)
| دور | الخط | ملاحظة |
|---|---|---|
| عربي + لاتيني + أرقام | **IBM Plex Sans Arabic** (400,500,600,700) | خط واحد لكل الاتجاهات — Plex Sans Arabic يغطي اللاتيني والأرقام بتماسك |
| Display (عربي) | نفس Plex Sans Arabic وزن 700 | لا خط display منفصل — الاتساق أهم |

- `--font-plex` كـ CSS var؛ `font-family` أساسي: `var(--font-plex), system-ui, sans-serif`.
- **ممنوع:** `font-black` (900) في أي مكان. أقصى وزن 700 (بـ Plex) — يعيد "الهدوء".
- `letter-spacing`: **0 دائمًا على العربية**. `tracking-tight` (-0.01em) على H1 الإنجليزي فقط.

### Type Scale (responsive)
| Level | العربية (mobile→desktop) | use |
|---|---|---|
| Display | `clamp(2.25rem, 5.5vw, 3.5rem)` / lh 1.2 | Hero |
| H1 | `clamp(1.875rem, 3.6vw, 2.625rem)` / lh 1.25 | صفحات داخلية |
| H2 | `clamp(1.5rem, 2.6vw, 2rem)` / lh 1.3 | عناوين أقسام |
| H3 | `1.25rem` / lh 1.4 | عناوين بطاقات |
| H4 | `1.0625rem` / lh 1.45 | عناوين صغيرة |
| Lead | `1.125rem` / lh 1.9 | وصف hero |
| Body | `1rem` / lh 1.9 | محتوى (lh 1.9 للعربية) |
| Body Sm | `0.875rem` / lh 1.8 | metadata |
| Caption | `0.8125rem` / lh 1.6 | secondary |
| Label | `0.75rem` / lh 1.5 (weight 600) | eyebrows, pills — **بلا tracking على عربي** |
| Price | `1.375rem`–`1.75rem` weight 700, tabular | الأسعار |

- `max-width` للنصوص الطويلة: `65ch` عربي / `72ch` إنجليزي.
- الأرقام/الأسعار: `font-feature-settings: "tnum"` (tabular) عبر class `tabular-nums`.

### Tailwind mapping
```ts
fontFamily: { sans: ["var(--font-ar)","var(--font-en)","system-ui","sans-serif"] }
fontSize: { display, h1, h2, h3, h4, lead, body, "body-sm", caption, label, price, "price-lg" }
lineHeight: { tight: 1.2, snug: 1.3, normal: 1.45, body: 1.9, ... }
```

---

## 3. Color

### Palette (القيم النهائية)
```
--color-paper:        #FBF8F2   (خلفية الموقع — كريمي دافئ)
--color-paper-deep:   #F4EEE3   (سطوح alt, strips)
--color-surface:      #FFFFFF   (بطاقات)
--color-ink:          #1C1A17   (نص أساسي — بني أسود حبري)
--color-ink-soft:     #4A443C   (نص ثانوي)
--color-ink-faint:    #857D70   (مخفت)
--color-line:         #E6DFD2   (حدود)
--color-line-strong:  #D5CBB9
--color-brand:        #8A1538   (قرمزي — CTA, accents)
--color-brand-deep:   #6B102B   (hover)
--color-brand-soft:   #F7E9EE   (خلفية accent خفيفة)
--color-teal:         #0F766E   (success/confirmation)
--color-teal-soft:    #E4F3F1
--color-gold:         #B8892D   (badges: جديد/عرض)
--color-gold-soft:    #F7EFDC
--color-danger:       #B3261E
--color-danger-soft:  #FBEAE9
```
- **حذف من النظام:** zinc-* (يُستبدل بـ ink scale)، emerald (→ teal)، amber (→ gold)، `#2d1820` (→ `--color-ink` في dark sections: footer = `#221E1A` "حبر داكن" token باسم `--color-ink-deep`).
- **قاعدة الاستخدام:**
  - `brand` يظهر ≤15% من أي viewport.
  - CTA primary = brand على أبيض؛ على dark = أبيض على brand.
  - teal فقط لـ: "تم", "تحميل آمن", success states.
  - gold فقط لـ: "جديد", "خصم" badge, accents في dark sections.
- **Gradients:** ممنوعة في الخلفيات. مسموح: خط 2px تحت header (brand)، overlay خفيف على صور (0→ink 40%).
- **Dark mode:** نحتفظ بالبنية (`dark` class) لكن نتحقق منه في نهاية الـ polish pass؛ الأولوية light.

---

## 4. Spacing & Layout

### Scale (Tailwind spacing = 4px base, نستخدم فقط)
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`
**ممنوع** قيم خارج الشبكة (لا `p-[13px]`، لا `mt-7` إلا إذا = 28px مقبول? لا — نتبع الشبكة فقط).

### Sections
| سطح | padding-block |
|---|---|
| Hero | `80px` mobile / `128px` desktop |
| Section كبير | `72px` / `96px` |
| Section متوسط | `56px` / `80px` |
| Section ضيق (strips) | `40px` |
| مسافة بين sections | `0` (كل section يحمل padding الخاص به) |

### Containers
```
--container-wide:    1440px  (sections بعرض كامل, footers)
--container-content: 1200px  (المحتوى الأساسي)
--container-text:    720px   (نصوص طويلة)
```
- Padding جانبي: `20px` mobile / `24px` tablet / `40px` desktop (class `container-px`).
- Grid: **12 columns** desktop (gutter 24px) / **8** tablet / **4** mobile (gutter 16px).
  ننفذه عبر Tailwind grid utils لا عبر library.

---

## 5. Radius (4 مستويات فقط)
| Token | قيمة | الاستخدام |
|---|---|---|
| `--radius-sm` | `8px` | inputs, buttons, chips, thumbnails |
| `--radius-md` | `12px` | cards, panels, images inside cards |
| `--radius-lg` | `16px` | modals, drawers, big panels |
| `--radius-pill` | `999px` | pills, badges, avatars فقط |

**حذف:** القنبلة `:where([class*="rounded..."]) !important` من globals.css نهائيًا.
**ممنوع:** `rounded-3xl`, `rounded-[1.4rem]`... أي قيمة خارج الـ4.

---

## 6. Shadows & Elevation (3 مستويات)
| Token | القيمة | الاستخدام |
|---|---|---|
| `--shadow-soft` | `0 1px 2px rgb(28 26 23 / 0.04), 0 4px 12px rgb(28 26 23 / 0.04)` | cards حية (hover base) |
| `--shadow-lift` | `0 2px 4px rgb(28 26 23 / 0.05), 0 12px 28px rgb(28 26 23 / 0.08)` | hover lift, dropdowns |
| `--shadow-pop` | `0 4px 8px rgb(28 26 23 / 0.06), 0 24px 56px rgb(28 26 23 / 0.12)` | drawers, modals, overlays |

- البطاقة الأساسية: **border (`--color-line`) + بلا ظل**؛ الـ shadow يدخل فقط عند hover (soft→lift).
- dark sections (footer): بلا shadows إطلاقًا — عمق بـ borders.

---

## 7. Borders
- 1px فقط. `--color-line` للفصل الهادئ، `--color-line-strong` للـ focus/interactive.
- focus ring: `2px solid brand` + offset 2px (لا rings 4px ملونة).

---

## 8. Iconography
- **lucide-react فقط**، stroke width 1.75 (default 2 → نضبط `strokeWidth={1.75}` عبر wrapper `Icon`).
- أحجام: `14 / 16 / 18 / 20 / 24` فقط.
- الأيقونات داخل أزرار: `gap-2`، محاذاة baseline مع النص.
- لا emoji. لا SVG مخصص إلا لـ: logo + patterns زخرفية موثقة.

---

## 9. Components Contract (الأسماء + الحالات)

### Button (`components/ui/button.tsx`)
Variants: `primary | secondary | ghost | outline | danger | link`
Sizes: `sm (h-9) | md (h-11) | lg (h-12)`
States: default/hover/focus/active/disabled/**loading** (spinner صغير 14px + text ثابت width)
- hover: `bg` يتغير + `translateY(-1px)` (primary فقط) — **لا scale**.
- active: `translateY(0) scale(0.99)`.
- primary: bg brand, text white. secondary: bg white + border line, text ink. ghost: text فقط.
- **Magnetic**: غير مطبق (لا حاجة) — نلتزم بالحد.

### Input / SearchInput / Select
- h-11, radius-sm, border line, focus: border brand + ring 2px.
- error: border danger + رسالة inline 0.8125rem تحت (لا shake).

### Card
- surface bg, border line, radius-md, p-6, بلا ظل default.

### ProductCard (contract)
```
[Cover frame 4:3, bg paper-deep, image object-contain padding 12-16px]
  badges: top-start (category), discount top-end (gold)
[body p-5]
  grade · subject            (caption, ink-faint)
  Title (h3, 2 lines clamp)
  meta row: format · pages   (body-sm, ink-soft)
  [divider line]
  price row: price (price) + compareAt strike (body-sm faint) | CTA icon (add)
```
- hover (pointer devices): card `translateY(-3px)` + border `line-strong` + image `scale(1.02)`. 180ms.
- **إزالة:** الـ3 claims الثابتة، rating pill من البطاقة (يكون في detail)، ProductVisual الوهمي.

### Price
- `currencyLabel` → "USD 49" → **عرض مخصص:** رقم كبير + رمز عملة أصغر + `tabular-nums`.
- compareAt: strike-through body-sm.
- Discount badge: `−45%` bg gold-soft text gold.

### Badge
`neutral | brand | gold | teal | danger` — h-6, px-2.5, text-caption, weight 600.

### Skeleton
- `animate-pulse` بطيء (1.5s) + ألوان `paper-deep/line` — بلا shimmer gradient.
- ProductCardSkeleton يطابق الـ card بالضبط (نفس الـ ratio والمسافات).

### EmptyState / ErrorState
- أيقونة lucide في دائرة surface + border, عنوان h4, وصف body-sm, CTA واحد.
- Error: أيقونة TriangleAlert, نص هادئ, زر "إعادة المحاولة" (refetch).

### Breadcrumbs
`/` فاصل → نستخدم `·`؛ آخر عنصر ink, الباقي ink-faint + hover brand. **RTL-aware** (flex row، direction follows page).

### Tabs / Accordion
- Tabs: underline 2px brand على active, text ink-soft→ink.
- Accordion: border-b line, icon Plus/Minus, content fade+height 200ms.

### Dialog / Drawer
- Dialog: radius-lg, shadow-pop, backdrop `ink/40` + blur(4px) — glass هنا فقط مسموح.
- Drawer: يمين في LTR / **يسار في RTL** (end-side)، عرض 420px desktop / full mobile.
- focus trap + Esc + backdrop click. spring: `stiffness 320, damping 32` (انزلاق 240ms).

### Toast
- أعلى-وسط (top-center) في mobile، end-side desktop. auto-dismiss 3.5s. icon + نص قصير.

---

## 10. Page Layouts (contracts)

### Header
- h-16, bg paper/92 + blur(8px) + border-b line. شريط علوي أحمر 2px.
- desktop: logo (يمين في RTL) | nav (5 روابط: الرئيسية، المتجر، المكتبة، المدونة، مشترياتي) | actions: [بحث icon] [السلة badge] [حساب].
- **الـ "عمولة" و"الدفع" تخرج من nav** (العمولة → footer/account, الدفع → من السلة فقط).
- scroll > 24px: h-16→h-14 + ظل soft (CSS transition).
- mobile: logo + [بحث] [سلة] [menu] → **drawer navigation** كامل (روابط + لغة + ثيم).

### Homepage sections (الترتيب)
1. **Hero** — editorial: عمود نص (eyebrow, display headline, lead, CTA primary + secondary, trust row صغيرة 3 نقاط) + عمود visual (تكوين من 2-3 previews للمنتجات الحقيقية بـ layering هادئ + parallax خفيف). بلا بحث ضخم (البحث في الـ header).
2. **Featured editorial** — 1 منتج كبير (col-span 7) + 2 متوسط (col-span 5, stacked).
3. **Browse by grade** — 6 بطاقات grade (عدد المواد + مثال) → /library.
4. **Latest** — grid 4 أعمدة (8 منتجات) + "عرض الكل".
5. **How it works / trust strip** — 3 خطوات (اشترِ → ادفع → حمّل فورًا) + secure note.
6. **Blog preview** — مقالان.
7. **Footer**.

### Product page
- Breadcrumbs → [Gallery 4:3 | Info: category+badge, H1, rating, price block, CTA row (add + buy now), meta list (grade/subject/format/pages/level), trust points 2-3]
- description (container-text) → What's included (files list + format badges) → Specs table (2 col) → Reviews → Related grid 4.
- sticky CTA mobile.

### Store
- toolbar: search inline + grade/subject selects + sort + count.
- mobile: "تصفية" button → bottom sheet.
- grid 3 أعمدة (desktop) / 2 (tablet) / 1 (mobile ≤400? لا — 2 حتى 360 مع card مضغوط).
- stagger reveal 40ms.

### Cart
- قائمة سطور (سطر: thumbnail 72px, title, meta, price, remove) + order summary card (subtotal, bundle discount, total, CTA checkout, trust note).
- drawer version: نفس المحتوى مضغوط + "عرض السلة كاملة".

### Checkout
- عمودان (form 60% | summary 40%)؛ أقل زخرفة؛ feedback لكل خطوة (validating/success/error inline).

---

## 11. Imagery & Product Presentation

- **frame موحد:** aspect 4:3 (cards) / 4:3 (detail), bg `--color-paper-deep`, padding 16-24px، border line.
- الصور الحقيقية: `object-contain` (Nunca crop غطاء) + `next/image` + `sizes` responsive + `lazy` (لأول featured `priority`).
- بلا صورة: **placeholder مهيبة** (لا mockup وهمي): خلفية paper-deep + خطوط نصية خفيفة + اسم المنتج H3 + subject + format chip — كـ "غلاف مطبوع" أنيق.
- **ممنوع:** sweep-lines, meters, cards مائلة, videos autoplay, glows.
- cover + additionalImages → gallery: main + thumbs (80px) مع fade transition 200ms.

---

## 12. RTL Rules
1. كل المسافات horizontal عبر logical: `ps/pe/ms/me/start/end` (Tailwind: `ms-*, me-*, ps-*, pe-*`, `text-start`, `border-s/e`).
2. السهم "تقدم": `ArrowRight` في LTR / `ArrowLeft` في RTL — عبر component `ArrowIcon` يقرأ `dir`.
3. لا `tracking` على عربي. `line-height ≥ 1.8` للـ body العربي.
4. الأسعار: `dir="ltr"` + `unicode-bidi: isolate` داخل السعر فقط (لثبات `$49` vs `49$`) — العرض الحالي: `USD 49` (النظام يستخدم USD عبر Stripe/PayPal).
5. Breadcrumbs/drawers/modals: logical positions فقط.
6. اختبار إلزامي: عنوان عربي 40+ حرفًا في H1, H3, button.

---

## 13. Responsive Breakpoints
| Name | Width |
|---|---|
| `xs` | 360 (min test) |
| `sm` | 640 |
| `md` | 768 |
| `lg` | 1024 |
| `xl` | 1280 |
| `2xl` | 1440 |
سلوك: mobile-first؛ الـ hover enhancements خلف `@media (hover: hover)`؛ الـ parallax desktop فقط.

---

## 14. Anti-patterns (قائمة منع إلزامية)
- ✗ font-black / وزن 900
- ✗ tracking على عربي
- ✗ gradients في خلفيات
- ✗ glassmorphism (عدا dialog backdrop)
- ✗ glow / neon / blob
- ✗ particles / floating circles
- ✗ rotate/scale في hover أكبر من 1.02
- ✗ shadows أكبر من pop
- ✗ rounded خارج الـ4 مستويات
- ✗ `<img>` بدون next/image
- ✗ "AI marketing" copy: "seamless", "empower", "cutting-edge"
- ✗ claims وهمية (أرقام عملاء، تقييمات افتراضية، logos)
