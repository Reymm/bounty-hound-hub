

## Fix the Confusing "New" Badge on Bounty Cards

### The Problem
The "New" badge currently appears when a **poster has no ratings** - not when the bounty is new. This is confusing because:
- A 2-week-old bounty shows "New" if the poster has never received a rating
- Users expect "New" to mean the bounty was recently posted

### The Solution

**1. Replace the misleading "New" badge with clearer text**
- When poster has ratings: Show star rating (already works)
- When poster has no ratings: Show "Unrated" or nothing at all

**2. Add "Posted X ago" to bounty cards (optional)**
- Add a small "Posted 2d ago" or "Posted 3h ago" indicator
- This uses `bounty.createdAt` with `formatDistanceToNow`

---

### Files to Modify

**`src/components/bounty/BountyCard.tsx`**

Current code (lines 158-167):
```typescript
{bounty.posterRatingCount > 0 ? (
  <>
    <Star ... />
    <span>{bounty.posterRating.toFixed(1)}</span>
    <span>({bounty.posterRatingCount})</span>
  </>
) : (
  <Badge variant="secondary" className="text-xs">New</Badge>  // ❌ Confusing
)}
```

Updated code:
```typescript
{bounty.posterRatingCount > 0 ? (
  <>
    <Star ... />
    <span>{bounty.posterRating.toFixed(1)}</span>
    <span>({bounty.posterRatingCount})</span>
  </>
) : (
  <span className="text-muted-foreground/60">Unrated</span>  // ✅ Clear
)}
```

**Add "Posted X ago" near the deadline section** (optional):
```typescript
// In the footer section, add:
<span className="text-xs text-muted-foreground">
  Posted {formatDistanceToNow(new Date(bounty.createdAt), { addSuffix: false })} ago
</span>
```

---

### Summary
| Change | Before | After |
|--------|--------|-------|
| Unrated poster | Shows "New" badge | Shows "Unrated" text |
| Posted time | Not shown on cards | Shows "Posted 2d ago" |

