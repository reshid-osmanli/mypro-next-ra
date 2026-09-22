# كُتبي — نظام الحركة (Animation System)

**المبدأ الحاكم:** الحركة = وظيفة (توجيه/تغذية راجعة/انتقال/تأكيد). لا حركة بلا وظيفة.
التقنية: **CSS أولًا → framer-motion ثانيًا**. لا GSAP، لا Three.js، لا Rive.

---

## 1. Motion Tokens

### Durations
| Token | قيمة | الاستخدام |
|---|---|---|
| `--dur-instant` | 120ms | color, opacity micro |
| `--dur-fast` | 180ms | hover, press, icon |
| `--dur-normal` | 260ms | reveals, accordions, tabs |
| `--dur-slow` | 420ms | drawer/dialog enter, page transitions |
| `--dur-dramatic` | 700ms | hero entrance sequence فقط |

### Easings
```
--ease-standard: cubic-bezier(0.2, 0, 0, 1)      (UI العام)
--ease-enter:    cubic-bezier(0.16, 1, 0.3, 1)   (دخول عناصر — decelerate)
--ease-exit:     cubic-bezier(0.7, 0, 0.84, 0)   (خروج — accelerate)
--ease-spring:   spring { stiffness: 340, damping: 30 }  (drawer, modal, cart badge)
```
**ممنوع:** `linear` (عدا progress bars)، bounce/elastic.

### Distances
- reveal: `y: 14px` (mobile 10px) — **لا أكبر من 20px**.
- hover lift: `y: -3px` cards / `y: -1px` buttons.
- page transition: `y: 10px`.

---

## 2. Motion Primitives (`components/motion/`)

| Component | السلوك |
|---|---|
| `<Reveal>` | fade+rise عند دخول viewport (once)، `delay` اختياري، respects reduced-motion |
| `<Stagger>` | يوزع `delay` (step 50ms, max 5 visible) على children |
| `<FadeIn>` | fade فقط (backdrops, overlays) |
| `<SlideIn side>` | drawers/dialogs |
| `<Press>` | wrapper: active scale 0.98 (120ms) |
| `<HoverLift>` | pointer-only: y -3px + shadow token 180ms |
| `<TextReveal>` | word-mask reveal — **Hero فقط** (كل كلمة في span، translateY 110%→0، stagger 60ms) |
| `<PageTransition>` | fade+rise 260ms لكل route (View Transitions API أساسًا) |
| `<SharedElement>` | `view-transition-name` للغلاف: card→product |
| `<MagneticButton>` | **غير مطبق** (قرار: لا حاجة) |

### قواعد عامة
- كل primitive يحترم `prefers-reduced-motion` عبر hook مركزي `useMotionPrefs()`:
  - reduced → durations 1ms، translateY 0، springs → opacity فقط.
- `once: true` في whileInView دائمًا (لا إعادة تشغيل reveals).
- `viewport: { once: true, margin: "-80px" }` (يبدأ قبل نهاية الدخول).
- **لا motion على عناصر خارج viewport** (لا infinite animations إطلاقًا).
- stable keys في كل lists (`key=slug` إلخ) — لا re-entrance عند filter.

---

## 3. Page Transitions (التوقيع الأساسي)

**التقنية:** View Transitions API (native) عبر `next/navigation`:
- تفعيل: `experimental: { clientTracing }` + `useTransition` + `document.startViewTransition` (progressive: إن لم يملك المتصفح → fallback fade).
- في `globals.css`:
```css
::view-transition-old(root), ::view-transition-new(root) {
  animation-duration: 260ms;
  animation-timing-function: var(--ease-enter);
}
::view-transition-group(root) { animation: none; } /* continuity */
```
- **Shared element** (توقيع كُتبي): غلاف المنتج يحصل على
  `view-transition-name: product-cover-{slug}` في البطاقة وفي صفحة المنتج →
  المتصفح ينقل الغلاف بصريًا بين القارتين. (Chrome/Edge 111+، Safari 18+).
- Fallback (بدون دعم): fade+rise عادي — التجربة تبقى ممتازة.

---

## 4. Hero Entrance (Homepage)

ترتيب stagger (إجمالي ≤ 700ms، يبدأ فورًا):
```
0ms    eyebrow (fade)
60ms   headline (TextReveal words, 350ms)
200ms  lead (fade+rise)
280ms  CTAs (fade+rise)
360ms  visual composition (fade+rise, parallax setup)
450ms  trust row (fade)
```
- reduced motion: يظهر الكل بدون ترتيب (opacity only).
- **لا انتظار على assets**: الـ visual placeholders تظهر فوريًا والصور تعزز فوقها.

---

## 5. Scroll Choreography (Homepage)

| Section | الحركة |
|---|---|
| Featured | 1st card fade+rise، 2-3rd delay 80ms |
| Grade cards | stagger 50ms ×6 |
| Latest grid | stagger 40ms (row-based) |
| Trust strip | fade فقط |
| Parallax (hero visual) | `transform: translateY(scrollY * 0.06)` على الطبقة الخلفية فقط — rAF + passive listener، **desktop فقط**، disabled reduced-motion. |

**ممنوع:** pinned sections، horizontal scroll، scroll-jacking.
**sticky storytelling:** في صفحة المنتج فقط (desktop): gallery sticky في العمود الأول بينما التفاصيل تمر — CSS `position: sticky` (ولا JS).

---

## 6. Component Interactions

### Buttons
- hover: bg shift (120ms) + primary فقط y-1px.
- loading: عرض spinner 14px + تثبيت الـ width (لا layout shift).
- success (add to cart): icon تحول إلى Check 400ms + badge pulse (scale 1→1.15→1).

### ProductCard
- hover (pointer only): card y-3px + border line-strong + cover scale 1.02 — 180ms standard.
- **لا rotate، لا scale 1.05+، لا shadow-dramatic.**
- touch: بلا hover (الضغط مباشر).

### Search overlay
- open: backdrop fade 180ms + panel scale 0.98→1 + y 8px (240ms enter).
- results: instant (بلا animation لظهور النتائج)، stagger 30ms فقط إن كانت <8.

### Cart drawer
- open: spring (token spring) + backdrop fade.
- add item: row enters من y 12px fade 200ms + total count-up (200ms).
- remove: height collapse 200ms + fade.

### Dialog (reviews, etc.)
- open: backdrop fade + panel y 12px scale 0.985 → (240ms).
- close: 180ms exit.

### Toast
- enter: y -12px fade 200ms؛ exit: fade 180ms.

### Skeleton
- pulse 1.6s ease-in-out infinite (opacity 0.6→1) — CSS فقط.

### Forms
- error: border danger + رسالة fade-in 150ms (لا shake، لا اهتزاز الصفحة).

---

## 7. Reduced Motion (إلزامي)

`useMotionPrefs()` مركزي:
```ts
const reduced = useReducedMotion() // framer-motion
```
- CSS: `@media (prefers-reduced-motion: reduce)` →
  `* { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }`
  + تعطيل parallax و infinite animations (لا توجد أصلًا).
- View Transitions: `startViewTransition` → render مباشر (بدون transition).
- النتيجة: **نفس المحتوى والوظيفة، حركة ≈ 0**.

---

## 8. Mobile Rules
- durations أقصر 10-20% (micro 100ms).
- بلا parallax، بلا hover (بداهة)، drawer full-width.
- `content-visibility: auto` على الأقسام البعيدة (performance).
- CPU budget: لا أكثر من transition واحد نشط في الـ viewport في كل لحظة (reveals by row).

---

## 9. Performance Guardrails
- framer-motion فقط في client components صغيرة (لا في layouts الثقيلة).
- `will-change` ممنوع إطلاقًا إلا في hero parallax layer (ثم يُزال بعد أول scroll).
- لا `transform` على عنصر يحوي `backdrop-filter` (paint stacking).
- كل scroll listener: `passive: true` + rAF throttle + cleanup on unmount.
- لا animation يحرك `width/height/top/left` — transform/opacity فقط (عدا height-collapse في lists وهو مقبول 200ms).
- قياس: بعد كل phase — LCP < 2.5s (dev)، no CLS على skeleton swap، JS ≤ 180KB gzip على homepage (goal).

---

## 10. Checklist قبل أي PR بصري
- [ ] الحركة لها وظيفة مسمّاة
- [ ] تعمل مع reduced-motion
- [ ] تعمل بلا JS (static layout سليم)
- [ ] لا infinite animation
- [ ] duration/easing من tokens
- [ ] تم الاختبار على 390px
- [ ] لا layout shift أثناء الحركة
