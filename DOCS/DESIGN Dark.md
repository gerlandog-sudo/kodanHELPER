---
name: Luminous Intelligence
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#dbb8ff'
  on-secondary: '#3f2160'
  secondary-container: '#573878'
  on-secondary-container: '#caa6ef'
  tertiary: '#c4c1fb'
  on-tertiary: '#2d2a5b'
  tertiary-container: '#8e8bc2'
  on-tertiary-container: '#262354'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
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
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
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

The design system is built to evoke a sense of hyper-intelligence, clarity, and precision within a deep, immersive environment. Targeted at power users and tech enthusiasts, it positions the AI as a luminous guide—a living entity composed of light and organized data emerging from the void.

The visual style is a sophisticated version of **Dark Glassmorphism**. Surfaces are treated as obsidian-tinted, semi-transparent panels floating over a deep, high-dimensional background. The interface relies on kinetic energy—vibrant glowing gradients and light-refraction effects—to signal active processing and intelligence. The emotional response should be one of focus, reliability, and cutting-edge sophistication.

## Colors

This design system utilizes a "Luminous Violet" palette optimized for high-contrast dark environments.

- **Primary (Electric Purple):** `#8b5cf6`. Used for active states, primary actions, and "AI Thinking" indicators. 
- **Secondary (Soft Lavender):** `#d8b4fe`. Used for highlights, interactive accents, and text links.
- **Tertiary (Deep Indigo):** `#1e1b4b`. Used for structural depth and subtle container backgrounds.
- **Neutral (Midnight Slate):** `#0f172a`. The foundation for backgrounds and high-definition structural elements.

The color strategy relies on **Bioluminescent Contrast**. Backgrounds favor deep, dark surfaces to create infinite depth. Interaction points use a soft 15-25% opacity glow of the primary color to simulate light emission against the darkness.

## Typography

The typography strategy balances high-tech flair with extreme legibility against dark, high-contrast backgrounds. 

- **Headlines:** Sora provides a geometric, futuristic weight that feels engineered and modern. Large headlines use light, vibrant tones to ensure maximum impact against dark surfaces.
- **Body:** Inter is used for all assistant responses and user inputs to ensure maximum readability during long-form interactions in low-light settings.
- **Data/Labels:** Geist is utilized for technical metadata, timestamps, and monospaced "thought" processes of the AI, reinforcing the developer-centric, high-tech aesthetic.

## Layout & Spacing

The design system employs a **Fluid Glass Grid**. Components do not feel "locked" but rather float within a highly structured 12-column layout.

- **Desktop:** 12 columns with wide 24px gutters to allow the dark space and glowing accents to breathe.
- **Mobile:** A single-column flow with 16px side margins. 
- **Rhythm:** Use a strict 4px/8px base-unit system for padding within cards. AI response bubbles should have generous internal padding (24px) to emphasize the "expansiveness" of the crystalline panels.

## Elevation & Depth

Hierarchy is established through **Backdrop Blur** and **Inner Glows** rather than traditional drop shadows.

- **Level 1 (Base):** The deep, midnight `#0f172a` background.
- **Level 2 (Panels):** Backdrop blur of 20px, 5-10% opacity white or primary tint fill, and a 1px solid border at 20% primary color.
- **Level 3 (Active/Popups):** Backdrop blur of 40px and a soft ambient glow tinted with the primary color to make the element appear self-illuminated.
- **Glows:** Primary buttons and active AI states use a `0px 0px 20px` outer glow using the primary color at 20% opacity to maintain a high-energy feel.

## Shapes

The shape language is **Organic Geometric** with subtle rounding. All containers use a subtle `0.375rem` (6px) default radius to maintain a clean professional aesthetic. Cards and elevated panels use a slightly larger `0.625rem` (10px) radius for distinction, but never pill-like. Interactive elements like inputs use a restrained `0.5rem` (8px) radius. The goal is sophistication through restraint — rounding should be noticeable but never cartoonish.

Only utility tags/chips use `rounded-full` for functional distinction.

## Components

- **Buttons:** Primary buttons are vibrant purple-to-lavender gradients. They feature high contrast and appear to emit light, with an increased glow intensity on hover. Border-radius is subtle (`0.625rem`).
- **Glass Cards:** The signature component. Semi-transparent dark backgrounds with a subtle crystalline texture and 1px "light-leak" borders to prevent a flat appearance.
- **Input Fields:** Outlined inputs with a 1px soft border and subtle `0.5rem` rounding. Upon focus, the border pulses with a primary glow around the container with the monospaced label shifting upwards.
- **AI Orbs:** A light-based component representing the assistant. A multi-layered radial gradient with fluctuating blur levels to simulate motion against the dark background.
- **Progress Bars:** Thin, electric purple lines with a trailing neon glow effect as the bar fills.
- **Chips/Tags:** Monospaced text inside a pill-shaped container with a 1px border. Background is 10% primary color to create a "tinted glass" look.
