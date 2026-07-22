---
name: Luminous Intelligence
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#494454'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#7b7486'
  outline-variant: '#cbc3d7'
  surface-tint: '#6d3bd7'
  primary: '#6b38d4'
  on-primary: '#ffffff'
  primary-container: '#8455ef'
  on-primary-container: '#fffbff'
  inverse-primary: '#d0bcff'
  secondary: '#6f5092'
  on-secondary: '#ffffff'
  secondary-container: '#d9b5ff'
  on-secondary-container: '#614283'
  tertiary: '#59568a'
  on-tertiary: '#ffffff'
  tertiary-container: '#726fa4'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#efdbff'
  secondary-fixed-dim: '#dbb8ff'
  on-secondary-fixed: '#29074a'
  on-secondary-fixed-variant: '#573878'
  tertiary-fixed: '#e3dfff'
  tertiary-fixed-dim: '#c4c1fb'
  on-tertiary-fixed: '#181445'
  on-tertiary-fixed-variant: '#444173'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.375rem
  md: 0.5rem
  lg: 0.625rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max: 1200px
---

## Brand & Style

The design system is built to evoke a sense of hyper-intelligence, clarity, and precision. Targeted at power users and tech enthusiasts, it positions the AI as a luminous and accessible guide—a living entity composed of light and organized data.

The visual style is a refined version of **Glassmorphism** adapted for a light, airy aesthetic. Surfaces are treated as crystalline, semi-transparent panels floating over a clean, high-dimensional background. The interface relies on kinetic energy—soft glowing gradients and light-refraction effects—to signal active processing and intelligence. The emotional response should be one of clarity, reliability, and cutting-edge sophistication.

## Colors

This design system utilizes a "Luminous Violet" palette optimized for high-clarity light environments.

- **Primary (Electric Purple):** `#8b5cf6`. Used for active states, primary actions, and "AI Thinking" indicators. 
- **Secondary (Soft Lavender):** `#d8b4fe`. Used for highlights, interactive accents, and text links.
- **Tertiary (Deep Indigo):** `#1e1b4b`. Used for high-contrast accents and structural depth.
- **Neutral (Slate Navy):** `#0f172a`. The foundation for text and high-definition borders.

The color strategy relies on **Prismatic Clarity**. Backgrounds favor light surfaces with subtle radial gradients of `#fdfbff` to create depth. Interaction points use a soft 15% opacity glow of the primary color to simulate light emission.

## Typography

The typography strategy balances high-tech flair with extreme legibility against a light background. 

- **Headlines:** Sora provides a geometric, futuristic weight that feels engineered and modern. Large headlines use crisp, dark tones to ensure maximum impact against white surfaces.
- **Body:** Inter is used for all assistant responses and user inputs to ensure maximum readability during long-form interactions.
- **Data/Labels:** Geist is utilized for technical metadata, timestamps, and monospaced "thought" processes of the AI, reinforcing the developer-centric, high-tech aesthetic.

## Layout & Spacing

The design system employs a **Fluid Glass Grid**. Components do not feel "locked" but rather float within a highly structured 12-column layout.

- **Desktop:** 12 columns with wide 24px gutters to allow the white space and soft gradients to breathe.
- **Mobile:** A single-column flow with 16px side margins. 
- **Rhythm:** Use a strict 4px/8px base-unit system for padding within cards. AI response bubbles should have generous internal padding (24px) to emphasize the "airiness" of the crystalline panels.

## Elevation & Depth

Hierarchy is established through **Backdrop Blur** and **Soft Shadows** rather than deep dark layers.

- **Level 1 (Base):** The clean, luminous off-white background.
- **Level 2 (Panels):** Backdrop blur of 20px, high-transparency white fill, and a 1px solid border at 10% primary color.
- **Level 3 (Active/Popups):** Backdrop blur of 40px and a soft ambient shadow tinted with the primary color to lift the element.
- **Glows:** Primary buttons and active AI states use a `0px 0px 20px` outer glow using the primary color at 15% opacity to maintain a light feel.

## Shapes

The shape language is **Organic Geometric** with subtle rounding. All containers use a subtle `0.375rem` (6px) default radius to maintain a clean professional aesthetic. Cards and elevated panels use a slightly larger `0.625rem` (10px) radius for distinction, but never pill-like. Interactive elements like inputs use a restrained `0.5rem` (8px) radius. The goal is sophistication through restraint — rounding should be noticeable but never cartoonish.

Only utility tags/chips use `rounded-full` for functional distinction.

## Components

- **Buttons:** Primary buttons are vibrant purple-to-lavender gradients. They feature high contrast and an increased glow intensity on hover. Border-radius is subtle (`0.625rem`).
- **Glass Cards:** The signature component. Semi-transparent white backgrounds with a subtle crystalline texture to prevent a flat appearance.
- **Input Fields:** Outlined inputs with a 1px soft border and subtle `0.5rem` rounding. Upon focus, the border expands to a full glow around the container with the monospaced label shifting upwards.
- **AI Orbs:** A light-based component representing the assistant. A multi-layered radial gradient with fluctuating blur levels to simulate motion.
- **Progress Bars:** Thin, electric purple lines with a trailing glow effect as the bar fills.
- **Chips/Tags:** Monospaced text inside a pill-shaped container with a 1px border. Background is 5% primary color to create a "tinted glass" look.
