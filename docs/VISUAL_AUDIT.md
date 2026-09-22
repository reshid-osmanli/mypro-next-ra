# كُتبي — تدقيق بصري شامل (Visual Audit)

**التاريخ:** 2026-09-21
**النطاق:** الواجهة الكاملة (Home, Store, Product, Cart, Checkout, Library, Blog, Account, Admin)
**المنهجية:** قراءة كود + فحص مخرجات SSR الفعلية + مقاييس مستخرجة آليًا من كل ملفات `app/` و`components/`.

---

## 1. ما هو موجود فعليًا اليوم (الحقائق)

| البند | الحالة |
|---|---|
| إطار العمل | Next.js 15.5 (App Router) + React 19 + Tailwind 3.4 |
| الحركة | framer-motion 12 (موجود في كل المكونات تقريبًا) |
| الأيقونات | lucide-react (مكتبة واحدة — جيد) |
| الترجمة | next-intl (ar/en) عبر Cookie `NEXT_LOCALE`، الافتراضي `ar` + RTL |
| الخطوط | **لا توجد أي webfonts** — لا `next/font` ولا `<link>`. الخط: `"Dubai","Aptos","Calibri","Segoe UI",system-ui` — أي أن 90% من الزوار يرونها بخط نظام مختلف كليًا |
| الألوان | `qatar` (قرمزي #8a1538) + `teal` (#0f766e) + `gold` (#d89b32) + `pearl` (كريمي دافئ) + zinc + **أحجام hex مباشرة متناثرة** |
| CSS العام | `app/globals.css` = **1457 سطرًا**، 90% منه رسوم CSS متحركة زخرفية |
| قاعدة البيانات | Prisma + PostgreSQL؛ 3 منتجات seed، 6 صفوف، 23 مادة، 2 مقالات |
| الثيم | وضع ليلي موجود (`dark` class) مع حيل `!important` كثيرة |

---

## 2. نقاط القوة الحالية (نحافظ عليها)

1. **لوحة ألوان هوية صالحة:** القرمزي القطري + الأخضر المخضرر + الذهبي + الكريمي الدافئ تعطي إحساس "نشر/تعليم/دفء". هذه الهوية تستحق أن تبقى، فقط تحتاج ترتيبًا (token-ization).
2. **RTL حقيقي وليس معكوسًا:** `dir` ديناميكي، `lang` صحيح، النصوص العربية مكتوبة بلغة سليمة (ليست ترجمة آلية رديئة).
3. **محتوى حقيقي لا وهمي:** المنتجات، الصفوف، المواد، النصوص التسويقية — كلها محددة ومفيدة ("شرائح متحركة ومبسطة لتعليم الحروف") وليست hollow marketing.
4. **بيانات الأسعار موجودة:** `price` + `compareAt` → خصومات حقيقية يمكن عرضها.
5. **بنية بيانات غنية:** كل منتج له `grade/subject/category/format/pages/badge/level` — ممتاز لتصميم بطاقة منتج "editorial".
6. **lucide-react موحدة** — لا خلط أيقونات.
7. **Server Components هي السائد** في صفحات المحتوى، والحركة مقلّعة في client components منفصلة — البنية قابلة للتحسين دون هدم.
8. **مسار دفع متكامل** (Stripe/PayPal/voucher/wallet) — الواجهة الجديدة يجب أن تحافظ عليه 100%.

---

## 3. المشاكل البصرية (بالأدلة)

### 3.1 لا يوجد نظام خطوط إطلاقًا — أكبر مشكلة
- **صفر** خطوط محملة. `font-black` (وزن 900) مستخدمة **167 مرة**، `font-bold` 99 مرة → الموقع "يصرخ" كله بالوزن الأقصى؛ التسلسل الهرمي مبني على الحجم فقط.
- العربية تُعرض بخط Calibri/Segoe UI على Windows وSF/Helvetica على Mac — **الهوية تختلف من جهاز لجهاز**.
- لا `letter-spacing` مدروس للعربية، ولا `line-height` مخصص لخطوط عربية.
- `text-sm` مستخدمة **268 مرة** و`text-xs` **124 مرة** → نص أساسي صغير جدًا للقراءة العربية.

### 3.2 قنبلة radius المخفية (bug فعلي)
في `globals.css`:
```css
:where([class*="rounded-lg"], [class*="rounded-md"], [class*="rounded-["]) {
  border-radius: var(--panel-radius) !important; /* 18px */
}
```
→ كل `rounded-lg` (12px) و`rounded-md` (8px) و`rounded-[10px]` تتحول **قسرًا إلى 18px**. أي أن ما يكتبه المطور "zinc" و"lg" و"md" لا يعني شيئًا — كل شيء 18px. التسلسل الهرمي للأركان مكسور من الجذر، وأي محاولة إصلاح بعنصر لن تنجح بسبب `!important`.

### 3.3 فوضى الظلال (15 وصفة مختلفة)
قياس آلي من الكود:
```
shadow-[0_18px_50px_rgba(15,23,42,0.05)]   ×29
shadow-[0_12px_30px_rgba(15,23,42,0.04)]   ×12
shadow-[0_18px_50px_rgba(15,23,42,0.04)]   ×4
shadow-[0_18px_50px_rgba(60,32,18,0.06)]   ×3
shadow-[0_30px_80px_rgba(15,23,42,0.08)]   ×2
shadow-[0_20px_60px_rgba(15,23,42,0.06)]   ×2
shadow-[0_12px_28px_rgba(45,24,32,0.14)]   ×2
... (إجمالي ~15 قيمة تقريبية متباينة)
```
لا يوجد مستوى "soft/medium/elevated" واحد — كل مكوّن اختار ظله الخاص.

### 3.4 فوضى الأركان أيضًا (خارج القنبلة)
`rounded-full` ×54، `rounded-2xl` ×26، `rounded-[1.4rem]` ×11، `rounded-[1.5rem]` ×8، `rounded-[1.2rem]` ×1، `rounded-[8px]` ×1... أربع قيم مخصصة إضافية.

### 3.5 فوضى letter-spacing
`tracking-[0.18em]` ×10، `tracking-[0.16em]` ×7، `tracking-[0.22em]` ×5، `tracking-[0.2em]` ×2 — أربع قيم "عشوائية" لأمر واحد. **معظمها على نصوص عربية** (eyebrows) — tracking موجب على العربية يقطع انسيابية الحروف ويجب أن يكون 0.

### 3.6 `globals.css` تحول إلى "مشروع" بنفسه
1457 سطرًا تحتوي:
- `kutubi-logo-motion`: شعار متحرك كامل (كتاب يفتح، ملفات تطير، مدارات، glints) — **~500 سطر**.
- `motion-showcase`: رسوم توضيحية متحركة (cards تطفو، scan lines، meters) — **~400 سطر**.
- `site-motion-backdrop`: خلفية متحركة (traces + panels عائمة) تظهر **في كل صفحات الموقع**.
- `.glass` + glassmorphism، `card-glow`, `grid-fade`.
- `@media (prefers-reduced-motion)` موجود لكنه يغطي فقط جزءًا من الأنيميشن.

هذا بالضبط نمط "AI website" الذي يجب التخلص منه: عناصر متحركة بلا وظيفة (طائرات ورقية، صفحات طائرة، مدارات) في الـ hero.

### 3.7 الـ Hero مزدحم ومكرر
`components/hero.tsx` (225 سطر) يحتوي في عمود واحد:
eyebrow + H1 + وصف + **شريط بحث ضخم** + CTA ×2 + quick links ×3 + stats ×3 + MotionShowcase (شعار متحرك) + لوحة "مختارات المتجر" داخلية + trust points ×3.
→ **11 طبقة معلومات**. لا يوجد "نقطة أولى" واضحة. الصورة/المحتوى البصري (لوحة مختارات) تتنافس مع النص.

### 3.8 بطاقة المنتج مشوهة
`product-card.tsx` + `product-visual.tsx`:
- `ProductVisual` يرسم **mockup وهميًا** (شريط متحرك `sweep-line`، `meter-pulse`، بطاقات مكدسة مائلة، "موشن" label) حتى عندما يوجد غلاف حقيقي.
- البطاقة تعرض **ثلاثة سطور claims ثابتة** لكل منتج ("منظّم للصف والمادة / جاهز للطباعة أو التحميل / مصمم كملف رقمي حقيقي") — محتوى مكرر 100% في كل بطاقة.
- `whileHover={{ y: -6 }}` (رفعة 6px) + ظل ثابت كبير → hover مبالغ.
- التسلسل: tags (4) → rating pill → excerpt 3 سطور → 3 claims → price row. السعر — أهم رقم في بطاقة متجر — في الأسفل وبكثافة منخفضة.
- aspect ratio يتغير بين `1.35/1` و`1.45/1` حسب الشاشة (تسرب layout).

### 3.9 عدم اتساق الهويات الفرعية
- `#2d1820` (بني داكن) مستخدم كمستوى "surface" في الـ footer وقسم المكتبة وicons بلا تعريف في النظام.
- `emerald-700` و`amber-50` و`zinc-*` تظهر جنبًا إلى جنب مع `qatar-*` و`pearl-*` → نظامان لونيان متداخلان.
- الـ footer: عنوان قسم بـ `text-gold-300` + `tracking-[0.16em]` + `uppercase` (على نص عربي "روابط" — uppercase لا معنى له بالعربية).
- أرقام الهاتف/البريد وهمية (`+974 0000 0000`) — تبقى كما هي (بيانات إدارة) لكن يجب عدم إبرازها.

### 3.10 Header مزدحم
7 روابط + زر "تصفح" + theme toggle + language + login + cart + (على mobile: شريط ثاني كامل للروابط) + شريط علوي أحمر 1px. **لا يوجد menu drawer للهاتف** — فقط شريط روابط مضغوط تحت الـ header. على 360px هذا لا يعمل.

### 3.11 الصفحات الداخلية موحدة بشكل ممل
كل صفحة (products, cart, library, blog) تبدأ بنفس `PageHero` المركزي (eyebrow pill + H1 مركزي + وصف + **MotionShowcase**). ثم grid بطاقات. → "grid of cards, grid of cards" — لا إيقاع بصري.

### 3.12 صفحة المنتج: الفوضى داخل صندوق واحد
كل شيء (visual + معلومات + description + files + reviews) داخل `div` واحد بحدود وظل واحد — "بطاقة داخل بطاقة داخل بطاقة". السعر 4xl لكنه محشور بين tags وdescription. لا يوجد sidebar معلومات، لا "what's included" منفصل بوضوح.

### 3.13 RTL/LTR: مشاكل محتملة محسوبة
- السهم `ArrowLeft` مستخدم كسهم "متابعة" في LTR logic — في RTL الاتجاه صحيح بصريًا لكنه يُدار بـ class logic لا بـ logical properties في أماكن كثيرة.
- `tracking-[0.18em]` على eyebrows العربية.
- `text-align` غير مذكور صراحة في أماكن تعتمد على inherited direction.
- الأسعار `Intl.NumberFormat("en-US")` → دائمًا أرقام لاتينية (قرار مقبول لكنه يجب توثيق وتطبيقه في كل مكان؛ `dateLabel` يستخدم `en-GB`).

---

## 4. مشاكل UX

1. **لا بحث في الـ header** — البحث حبيس الـ hero. (الspec يطلب تجربة بحث كاملة.)
2. **لا Cart drawer** — "أضف للسلة" يربط لصفحة السلة فقط (يجب فحص `add-to-cart-button.tsx` — يوجد `cart-button` لكن لا drawer).
3. **لا سلة لاصقة على mobile في صفحة المنتج** — يوجد `sticky-add-to-cart.tsx` (يجب تحسين موقعه).
4. **لا skeleton states** — `components/skeletons/index.tsx` موجود لكن الصفحات force-dynamic بدون loading.tsx → الشاشة بيضاء حتى يجيب الـ DB.
5. **لا empty states مصممة** — `empty-states/index.tsx` موجود (يجب فحص مستوى التصميم).
6. **لا pagination/filter sheet على الموبايل** — الـ ProductExplorer يستخدم selects (يجب فحص السلوك mobile).
7. **لا focus trap / keyboard** في أي dialog — لا dialogs أساسًا (reviews inline).
8. **`overflow-hidden` على الـ SiteShell** — `div.min-h-screen.overflow-hidden` قد يكسر sticky/scroll على بعض المتصفحات.
9. **الـ announcement bar** فوق كل شيء في كل زيارات (managed من settings — جيد).
10. **لا PageTransition مفعّلة فعلًا** — `PageTransition` موجود لكن الـ layout لا يستخدمه (يحتاج `AnimatePresence` + لا يوجد).

---

## 5. مشاكل الأداء

1. **كل الصفحة تشغل CSS الزخرفة (1457 سطر)** حتى لو لم تستخدمه.
2. **`site-motion-backdrop`** = عناصر `animation: infinite` تعمل **دائمًا** في كل الصفحات (CPU/موبايل).
3. **KutubiLogoMotion في الـ header** = أنيميشن دائري + glints في أعلى كل صفحة.
4. **`force-dynamic` في كل صفحة** → لا SSR caching إطلاقًا.
5. **صور المنتجات**: لا `next/image` — `<img>` عادي في `product-visual` وblog → لا optimization/responsive sizes.
6. **framer-motion** محمّل في كل client component تقريبًا (مقبول — مكتبة واحدة) لكن usage كثير بلا حاجة (whileHover على كل card).
7. **confetti + canvas-confetti** محمّل (يجب فحص كونه lazy).
8. **`backdrop-blur-xl`** في header + glass → GPU cost ثابت.
9. لا `loading.tsx` ولا streaming → LCP = أول byte بعد الـ DB query.

---

## 6. فرص الحركة (بما تحقق القيمة)

| الفرصة | التقنية | الأولوية |
|---|---|---|
| Page transitions (View Transitions API) | CSS `::view-transition` | عالية — "continuity" بـ JS شبه صفري |
| Shared element: غلاف المنتج card→detail | View Transitions + `view-transition-name` | **تفاعل signature** — أنسب لمكتبة رقمية |
| Reveal عند scroll (sections, cards stagger) | framer-motion `whileInView` + viewport | عالية |
| Hero entrance (stagger منطقي 400-600ms) | framer-motion | عالية |
| Header scroll compaction | CSS + scroll listener خفيف (rAF) | متوسطة |
| Cart drawer spring | framer-motion | عالية |
| Skeleton shimmer هادئ | CSS | عالية |
| Parallax خفيف في hero | CSS `animation-timeline` أو motion | منخفضة |
| Sticky storytelling في صفحة المنتج (preview ثابت + تفاصيل تمر) | CSS sticky (ولا GSAP) | متوسطة — desktop فقط |

**لا حاجة لـ:** GSAP (لا يوجد timeline معقد حقيقي)، Three.js (لا مبرر)، Rive/Lottie (SVG يكفي)، particles، 3D.

---

## 7. توصية الاتجاه التصميمي

### الاسم الداخلي: **"المكتبة الرقمية" (The Digital Library)**
```
Editorial + Publishing + Warmth
```
كأنك تصفح كتالوب ناشر تعليمي راقٍ: غلاف كبير، تسلسل نصي واضح،
مساحات هوائية ذكية، لون القرمزي كحبر توقيع، الكريمي كورق.

### المبادئ
1. **Typography-led:** خط عربي محترم (قاعدة: IBM Plex Sans Arabic — مبدئيًا،
   أو Cairo/Tajawal كبديل) بخطين وزن: 400/500/700/800 فقط. H1 = 800، body = 400.
2. **Product-led:** غلاف المنتج هو البطل. نغلف كل غلاف في "frame" موحد
   (نفس ratio 4:3، نفس padding، خلفية cream، border هادئ) حتى لو كان الغلاف صور PPT أو PDF.
3. **Whitespace-rich:** sections بفاصل 96-128px، max-width 1200px للمحتوى، 1440px للعرض.
4. **Color discipline:** قرمزي = CTA + accents فقط. كريمي = خلفية. أسود حبري = نص.
   Teal + Gold = secondary signals (خصم/جديد) فقط. لا emerald/amber خارج النظام.
5. **One motion language:** fade+rise (12px) للـ reveals، spring ناعم للـ drawers/modals،
   160-260ms للـ micro. `prefers-reduced-motion` = تعطيل شبه كامل.
6. **Editorial layouts:** الـ homepage = Hero (statement + previews) → Featured (1 كبير + 2 صغير) →
   Category editorial → grid هادئ → Library strip → Footer. لا "grid grid grid".

### ما نزيله (Cleanup)
- `site-motion-backdrop` كاملًا.
- `kutubi-logo-motion` (نستبدله بـ logo ثابت هادئ أو SVG بسيط).
- `motion-showcase` كاملًا (لا "موشن" كمنتج).
- قنبلة `!important` radius.
- الـ `#2d1820` المخفي → token.
- كل `tracking-*` على النصوص العربية.

### ما نضيفه
- `next/font` (عربي + لاتيني) + type scale كامل.
- `components/ui/` (Button, Card, Input, Badge, ...), `components/store/`, `components/marketing/`, `components/motion/` (Reveal, Stagger, PageTransition, SharedElement).
- Design tokens في `tailwind.config.ts` + CSS variables.
- View Transitions للـ navigation + shared element للغلاف.
- Search overlay في الـ header.
- Cart drawer.
- `loading.tsx` + skeletons حقيقية.
- Footer مهيكل.
- `docs/VISUAL_SYSTEM.md` + `docs/ANIMATION_SYSTEM.md` (التالي).

---

## 8. خطة التنفيذ (مضغوطة من الـ 21 مرحلة)

| Phase | المخرجات |
|---|---|
| **2. Tokens** | Tailwind theme + CSS vars: colors/spacing/radius/type/shadows/motion |
| **3. UI Kit** | Button, Input, Badge, Card, Skeleton, EmptyState, Price, Breadcrumbs |
| **4. Motion Kit** | Reveal, Stagger, PageTransition, SharedElement, useReducedMotion, HoverLift |
| **5. Header/Search** | Header مدمج + Search overlay + Mobile menu |
| **6-7. Homepage** | Hero جديد + Featured editorial + Categories + grid + Library strip |
| **8-9. Product card + Store** | بطاقة منتج جديدة + Store listing + filters |
| **10. Product page** | Hero ثنائي + gallery + specs + FAQ/related |
| **11. Cart** | drawer + صفحة سلة + upsells |
| **12. Checkout** | trust-focused، أقل زخرفة |
| **16-17. Responsive/RTL** | pass كامل على 360→1440 + RTL review |
| **20-21. QA/Polish** | build + typecheck + screenshots (عبر preview) + polish pass |

**قاعدة:** لا نلمس business logic (payments/orders/auth/admin) إلا ما تطلبه الواجهة (نقل classes فقط).
