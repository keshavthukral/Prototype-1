# Design

## Design Principles

1. **Calm & Credible**: Healthcare support aesthetic, not generic AI/SaaS template
2. **Accessibility First**: Every design decision prioritizes elderly users with cognitive needs
3. **One Screen = One Task**: Minimal cognitive load, single focus per screen
4. **Warm & Human**: Not clinical or futuristic, but approachable and trustworthy

## Anti-Patterns to Avoid

- Giant gradient backgrounds
- Purple-blue AI gradients
- Glassmorphism everywhere
- Excessive rounded cards
- Enormous hero sections
- Decorative blobs
- Excessive badges
- Needless animations
- Random icon grids
- Every piece of information in floating cards
- Generic "AI healthcare" imagery
- Excessive shadows
- Overly futuristic visual treatment
- Stock shadcn components without product tailoring

## Typography Scale

**Patient Interface:**
- Headings: 2rem-2.5rem (32-40px), font-weight: 600-700
- Body text: 1.25rem-1.5rem (20-24px), font-weight: 400-500
- Labels: 1rem (16px), font-weight: 500
- Minimum touch target: 48px

**Caregiver Interface:**
- Headings: 1.5rem-2rem (24-32px), font-weight: 600
- Body text: 1rem-1.125rem (16-18px), font-weight: 400
- Labels: 0.875rem (14px), font-weight: 500
- Data labels: 0.75rem (12px), font-weight: 500

**Font Stack:**
- Primary: System fonts for performance and accessibility
- Fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

## Spacing

**Patient Interface (generous spacing):**
- Base unit: 8px
- Component padding: 24px-32px
- Section spacing: 32px-48px
- Screen margins: 24px minimum

**Caregiver Interface (information-dense):**
- Base unit: 8px
- Component padding: 16px-24px
- Section spacing: 24px-32px
- Screen margins: 16px minimum

## Border Radius

- Buttons: 12px (patient), 8px (caregiver)
- Cards: 16px (patient), 12px (caregiver)
- Inputs: 8px
- Icons/Avatars: 50% (circular)

## Colors

**Patient Interface:**
- Background: Warm neutral (off-white/cream)
- Primary: Single restrained accent color (muted blue-green or warm teal)
- Text: Dark charcoal (#1a1a2e or similar)
- Secondary text: Medium gray (#6b7280)
- Success: Muted green
- Warning: Muted amber
- Error: Muted red
- Border: Light gray (#e5e7eb)

**Caregiver Interface:**
- Background: Light gray (#f9fafb)
- Primary: Same accent as patient
- Text: Dark gray (#111827)
- Secondary text: Gray (#6b7280)
- Success: Green
- Warning: Amber
- Error: Red
- Border: Gray (#e5e7eb)
- Data visualization: Consistent color palette for charts

**High Contrast Mode:**
- Support system-level high contrast settings
- Minimum 4.5:1 contrast ratio for text
- Minimum 3:1 for large text and interactive elements

## Patient vs Caregiver Density

**Patient:**
- Maximum 2-3 elements per screen
- Large touch targets (48px minimum)
- Generous whitespace
- Single focus point
- Minimal navigation complexity

**Caregiver:**
- Desktop-optimized layout
- Sidebar/navigation for multiple sections
- Data tables and lists
- Charts for trends (when useful)
- More information per screen
- Same design tokens, tighter spacing

## Component Patterns

**Buttons:**
- Large, clear labels
- Icon + text labels together
- Clear focus states with visible outline
- Active/pressed states with subtle feedback
- Disabled states clearly muted

**Cards:**
- Flat surfaces with subtle borders
- Minimal shadow (1-2px maximum)
- Clear hierarchy within cards
- Consistent padding

**Forms:**
- Large input fields
- Clear labels above inputs
- Visible focus states
- Simple validation messages
- Minimal required fields

**Navigation:**
- Bottom navigation for patient (3-4 items maximum)
- Clear icons with text labels
- Current state clearly indicated
- Simple back navigation

**Feedback:**
- Calm, positive reinforcement
- No competitive elements
- Clear success/error states
- Minimal animation (subtle transitions only)

## Accessibility Requirements

- WCAG 2.1 AA compliance minimum
- Keyboard navigation support
- Screen reader compatibility
- High contrast support
- Reduced motion support
- Clear focus indicators
- Consistent navigation
- Error identification and suggestions
- Input labels and instructions
- Timing adjustable for any time limits
- No content that flashes more than 3 times per second

## Animation Guidelines

- Minimal, purposeful animation only
- Subtle transitions (200-300ms)
- No decorative animations
- Respect prefers-reduced-motion
- Smooth state changes for feedback
- No auto-playing animations
