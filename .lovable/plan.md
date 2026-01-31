

# Plan: Fix Partner Application Dialog Cut-off Issue

## Problem

The dialog uses CSS transform centering (`top-[50%]` + `-translate-y-[50%]`), which positions the dialog's **center** at 50% of the viewport. When the dialog content is tall (like the Partner Application form with many fields), the top half extends beyond the viewport edge, causing the header to be cut off.

## Solution

Change the dialog positioning strategy from transform-based centering to flexbox centering. This ensures the dialog stays fully within the viewport regardless of its height.

## Changes Required

### File: `src/components/ui/dialog.tsx`

| Current | New |
|---------|-----|
| `top-[50%] -translate-y-[50%]` | `top-0 bottom-0 my-auto` with flex container |
| Fixed positioning with transform | Flexbox-based centering that respects viewport bounds |

**Updated DialogContent positioning:**
```tsx
// Change the DialogPrimitive.Content className from:
"fixed left-4 right-4 top-[50%] ... -translate-y-[50%] ..."

// To:
"fixed left-4 right-4 top-4 bottom-4 ... my-auto h-fit ..."
```

This approach:
1. Sets `top-4` and `bottom-4` to create minimum margins from viewport edges
2. Uses `my-auto` to center vertically within those constraints
3. Uses `h-fit` so the dialog sizes to its content
4. Removes the transform that was causing the overflow

## Why This Works

Transform-based centering (`-translate-y-[50%]`) doesn't know about viewport boundaries - it just moves the element up by 50% of its own height. If the dialog is 80% of the viewport tall, moving it up 40% (half of 80%) means 10% gets cut off at the top.

Flexbox/margin-auto centering respects the container boundaries and will never push content outside the viewport.

