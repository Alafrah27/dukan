Dukan Design System

Purpose

This document is the single source of truth for the Dukan mobile UI.

The UI must follow this design system consistently. Do not copy visual
styles, layouts, themes, or component designs from external apps or UI
libraries.

Use: - React Native / Expo - NativeWind - React Icons - JavaScript -
Existing project components when available

Do not introduce another styling system unless explicitly requested.

1. Brand Colors

Use these colors as the foundation of the entire application.

const colors = {
  primary: "#A84F35",

  background: "#F8F0F0",
  surface: "#F8E8E0",
  surfaceSelected: "#F8E0D8",

  text: "#302522",
  textSecondary: "#756A66",

  white: "#FFFFFF",

  success: "#34A853",
  accent: "#F4C20D",
};

Color roles

Primary

#A84F35

Main Dukan brand color.

Use for: - Primary buttons - Important actions - Active navigation -
Selected controls - Main links - Important icons - Brand elements

Do not use primary on every element. Preserve visual hierarchy.

Background

#F8F0F0

Main application background.

Use for: - Screen backgrounds - Main page areas

Surface

#F8E8E0

Secondary surface color.

Use for: - Cards - Input backgrounds - Secondary sections - Product
option areas

Surface Selected

#F8E0D8

Selected/active surface.

Use for: - Selected product options - Selected categories - Active
cards - Selected measurement/customization options

Text

#302522

Primary text.

Use for: - Headings - Product names - Important information - Body text
when strong contrast is needed

Text Secondary

#756A66

Secondary text.

Use for: - Descriptions - Metadata - Hints - Supporting information -
Disabled/less-important text

White

#FFFFFF

Use for: - Primary button text when appropriate - Clean content
surfaces - Icons on dark/primary backgrounds

Success

#34A853

Use only for positive states: - Payment successful - Order delivered -
Available - Completed - Success messages

Accent

#F4C20D

Use as a supporting highlight color.

Use for: - Small highlights - Important badges - Special offers -
Decorative brand details - Selected visual accents

Do not use accent as the main application color.

2. Visual Direction

Dukan should feel:

Warm

Modern

Friendly

Premium but accessible

Clean

East-African-inspired without becoming overly decorative

Avoid: - Generic SaaS blue/purple themes - Excessive gradients -
Excessive shadows - Glassmorphism - 3D effects - Neon colors - Overly
rounded cartoon-like interfaces - Copying the visual language of
Shopify, Amazon, Temu, or other marketplaces

The identity should come primarily from the Dukan color palette,
spacing, typography, cards, product presentation, and interaction
patterns.

3. Typography

Use a clean modern sans-serif font.

The UI must support: - English - Arabic - RTL

Typography hierarchy:

Display

Large page titles.

Suggested size: 28-32px

Weight: 700

H1

Main screen title.

24px / 700

H2

Section title.

20px / 700

H3

Card/product section title.

17-18px / 600

Body

Normal content.

15-16px / 400

Small

Supporting information.

13-14px / 400

Caption

Small metadata.

12px / 400

Do not use too many font sizes.

4. Spacing

Use an 8px-based spacing system.

4   = micro spacing
8   = small
12  = compact
16  = default
20  = medium
24  = section
32  = large
40  = major section
48  = screen-level spacing

Default screen horizontal padding:

16px

Large sections may use:

20-24px

Do not randomly choose spacing values.

5. Border Radius

Use moderate rounding.

Small controls: 8px
Inputs: 10-12px
Cards: 14-16px
Large containers: 18-20px
Buttons: 12-14px

Avoid making every component a pill.

Pill shapes should mainly be used for: - Tags - Filters - Status
badges - Compact chips

6. Shadows

Keep shadows subtle.

Cards should generally rely on: - Surface color - Border - Spacing

rather than heavy shadows.

Avoid large floating shadows.

If a shadow is required, use a soft, low-opacity shadow appropriate for
React Native.

7. Borders

Use subtle borders when separation is needed.

Prefer low-contrast borders rather than dark outlines.

Example:

borderColor: rgba(48, 37, 34, 0.08)

Do not add borders to every component.

8. Buttons

Primary Button

Background: primary
Text: white
Radius: 12-14px
Height: approximately 48-52px

Example:

[       Add to Cart       ]

Primary buttons should represent the main action.

Secondary Button

Use: - Surface - Primary text - Optional primary border

Destructive Button

Use a clear destructive treatment only when necessary.

Do not introduce arbitrary red into the brand system for normal actions.

9. Inputs

Inputs should feel simple and comfortable.

Default:

Background: surface
Text: text
Placeholder: textSecondary
Border: subtle
Radius: 10-12px
Height: 48-52px

Focused input:

Border: primary

Error state:

Use a clear error treatment without changing the overall design
language.

10. Product Cards

Product cards are one of the most important Dukan components.

Structure:

┌──────────────────────┐
│                      │
│      Product Image   │
│                      │
├──────────────────────┤
│ Product Name         │
│ Short metadata       │
│                      │
│ 350 SAR        +     │
└──────────────────────┘

Rules: - Product image is the visual focus. - Product name uses primary
text. - Price should be visually clear. - Avoid excessive information. -
Use accent only for meaningful highlights. - Cards should use the Dukan
surface palette.

11. Product Details

Recommended hierarchy:

Image Gallery

Product Name
Rating / metadata if available

Price

Description

Variants

Customization

Measurements

Quantity

Add to Cart

For products requiring measurements, show the measurement form only when
necessary.

Do not show customer measurement inputs while creating the Product.

The Product defines measurement requirements.

The customer provides measurements when configuring the cart item.

12. Measurement UI

Measurement fields must be generated dynamically from the product
configuration.

Example:

Measurements

Body Length
[ 175 ] cm

Shoulder Width
[ 45 ] cm

Sleeve Length
[ 62 ] cm

Use consistent input styling.

Do not create a separate visual design for each type of measurement.

13. Customization UI

For example:

Tailoring

○ Ready Made
  300 SAR

● Tailored
  350 SAR

Selected options should use:

surfaceSelected
+
primary

The selected state must be visually obvious without relying only on
color.

Use an icon/check indicator where appropriate.

14. Cart

Cart should clearly show:

Product image

Product name

Variant

Quantity

Selected customization

Customer measurements

Customer note

Unit price

Total price

Example:

┌─────────────────────────────┐
│ Product                     │
│                             │
│ Tailored                    │
│ 175 × 45 × 62 cm            │
│ Note: Loose sleeve          │
│                             │
│ Qty [-  1  +]      350 SAR  │
└─────────────────────────────┘

Customer-entered measurements and notes belong to the cart item, not the
product.

15. Order UI

When the cart becomes an order, preserve a snapshot of:

Product name

Variant

Quantity

Unit price

Customization

Measurements

Customer note

Do not depend on the current Product record to reconstruct historical
orders.

16. Navigation

Keep navigation simple.

Recommended customer navigation:

Home
Categories
Orders
Profile

Cart should be globally accessible.

Active navigation should use the Dukan primary color.

Avoid excessive navigation items.

17. Icons

Use React Icons consistently.

Do not mix many icon families.

Rules: - Prefer simple outline icons. - Use consistent icon sizes. -
Icons should support the text, not replace important text. - Do not use
decorative icons everywhere.

Suggested sizes:

Small: 16px
Default: 20px
Large: 24px
Hero/action: 28-32px

Use primary, text, textSecondary, or accent according to
semantic importance.

Do not invent random icon colors.

18. NativeWind

Use NativeWind utility classes for layout and styling.

The implementation should expose the Dukan design tokens through the
project's theme/configuration rather than repeatedly hardcoding colors.

Example conceptual usage:

<View className="flex-1 bg-background">
  <Text className="text-text text-2xl font-bold">
    Products
  </Text>
</View>

Use the configured Dukan tokens.

Do not scatter raw hex values throughout components.

Bad:

<View className="bg-[#A84F35]" />

Prefer:

<View className="bg-primary" />

19. Component Architecture

Build reusable components instead of duplicating UI.

Recommended components:

Button
Input
Card
ProductCard
ProductImage
Price
Badge
Chip
RadioOption
Checkbox
QuantitySelector
MeasurementInput
ProductVariantSelector
CustomizationSelector
CartItem
OrderStatus
SectionHeader
EmptyState
LoadingState

Components must follow the same tokens and spacing rules.

20. Loading and Empty States

Loading states should use the same surface/background palette.

Avoid introducing arbitrary skeleton colors.

Empty states should be friendly and simple.

Example:

Your cart is empty

Discover products from Sudan and Eritrea.

[ Start Shopping ]

21. Status Colors

Use semantic colors carefully.

Success:

#34A853

Primary/in-progress:

#A84F35

Highlight:

#F4C20D

Do not introduce additional colors unless a real UI requirement cannot
be represented with the existing palette.

22. Arabic and RTL

The application must support RTL correctly.

Do not simply reverse text manually.

Use React Native RTL support and layout direction.

Components must work correctly in both:

LTR
RTL

Examples: - Icons should move appropriately. - Back buttons should
respect direction. - Product grids should remain visually balanced. -
Padding/margins should use direction-aware logic where appropriate.

Arabic typography must remain readable and comfortable.

23. Accessibility

All interactive elements should have: - Appropriate touch target -
Accessible label when needed - Clear selected state - Clear disabled
state - Sufficient contrast

Do not rely only on color to communicate state.

24. Design Rules for AI Coding Agents

When modifying or creating UI:

Read this file before implementing UI.

Follow the existing Dukan design tokens.

Never copy a design from an external application.

Do not introduce a new color without a clear reason.

Do not introduce another UI library.

Use NativeWind for styling.

Use React Icons consistently.

Reuse existing components.

Keep spacing consistent with the 8px system.

Keep the UI warm, clean, modern, and premium.

Support Arabic and RTL.

Do not change the brand palette without explicit approval.

Do not replace the design system with a generic template.

If a component does not have an established design, create it using
these tokens instead of copying a third-party component's visual
style.

Before finishing a UI task, check the screen for consistency with
this document.

25. Non-Negotiable Brand Tokens

const colors = {
  primary: "#A84F35",

  background: "#F8F0F0",
  surface: "#F8E8E0",
  surfaceSelected: "#F8E0D8",

  text: "#302522",
  textSecondary: "#756A66",

  white: "#FFFFFF",

  success: "#34A853",
  accent: "#F4C20D",
};

These are the official Dukan prototype colors.

Do not replace them with a generic Tailwind palette.

Final Principle

Dukan should look like one coherent product.

Every screen must feel like it belongs to the same application.

The goal is not to make every screen visually complex.

The goal is:

Simple + Warm + Modern + Consistent + Dukan
