# 📋 BUTTON VISIBILITY GUIDE - DocumentsPage

## Quick Reference: What Each Role Can See

### 🟢 ADMIN - Full Access
```
┌─────────────────────────────────────┐
│ + Add Document       [VISIBLE ✅]    │
├─────────────────────────────────────┤
│ Master Document                      │
├─────────────────────────────────────┤
│ [✏️ Edit] [👁️ View] [⬇️ Download]  │
│ [🗑️ Delete]                          │
├─────────────────────────────────────┤
│ Sub-Documents                        │
├─────────────────────────────────────┤
│ [✏️] [👁️] [⬇️] [🗑️]               │
└─────────────────────────────────────┘
```

### 🟡 LEVEL1 (Manager) - Full Document Management
```
┌─────────────────────────────────────┐
│ + Add Document       [VISIBLE ✅]    │
├─────────────────────────────────────┤
│ Master Document                      │
├─────────────────────────────────────┤
│ [✏️ Edit] [👁️ View] [⬇️ Download]  │
│ [🗑️ Delete]                          │
├─────────────────────────────────────┤
│ Sub-Documents                        │
├─────────────────────────────────────┤
│ [✏️] [👁️] [⬇️] [🗑️]               │
└─────────────────────────────────────┘
```

### 🟠 LEVEL2 (Staff) - Create & View Only
```
┌─────────────────────────────────────┐
│ + Add Document       [VISIBLE ✅]    │
├─────────────────────────────────────┤
│ Master Document                      │
├─────────────────────────────────────┤
│ [✏️ Edit] [👁️ View] [⬇️ Download]  │
│ [🗑️ Delete]  [HIDDEN ❌]            │
├─────────────────────────────────────┤
│ Sub-Documents                        │
├─────────────────────────────────────┤
│ [✏️] [👁️] [⬇️] [🗑️ HIDDEN]        │
└─────────────────────────────────────┘
```

### 🔵 LEVEL3 (Viewer) - Read-Only Access
```
┌─────────────────────────────────────┐
│ + Add Document    [HIDDEN ❌]        │
├─────────────────────────────────────┤
│ Master Document                      │
├─────────────────────────────────────┤
│ [✏️ Edit] [HIDDEN ❌]                │
│ [👁️ View]  [VISIBLE ✅]            │
│ [⬇️ Download] [HIDDEN ❌]            │
│ [🗑️ Delete] [HIDDEN ❌]             │
├─────────────────────────────────────┤
│ Sub-Documents (Expanded)             │
├─────────────────────────────────────┤
│ [✏️] [HIDDEN ❌]                     │
│ [👁️] [VISIBLE ✅]                  │
│ [⬇️] [HIDDEN ❌]                     │
│ [🗑️] [HIDDEN ❌]                    │
└─────────────────────────────────────┘
```

---

## 📊 Permission Matrix

| Button | Admin | Level1 | Level2 | Level3 |
|--------|-------|--------|--------|--------|
| **+ Add Document** | ✅ | ✅ | ✅ | ❌ HIDDEN |
| **Master: Edit** | ✅ | ✅ | ✅ | ❌ HIDDEN |
| **Master: View** | ✅ | ✅ | ✅ | ✅ |
| **Master: Download** | ✅ | ✅ | ✅ | ❌ HIDDEN |
| **Master: Delete** | ✅ | ✅ | ❌ HIDDEN | ❌ HIDDEN |
| **Sub-Doc: Edit** | ✅ | ✅ | ✅ | ❌ HIDDEN |
| **Sub-Doc: View** | ✅ | ✅ | ✅ | ✅ |
| **Sub-Doc: Download** | ✅ | ✅ | ✅ | ❌ HIDDEN |
| **Sub-Doc: Delete** | ✅ | ✅ | ❌ HIDDEN | ❌ HIDDEN |

---

## 🔍 Implementation Details

### Frontend Logic (DocumentsPage.tsx)

```typescript
// For Edit/Download buttons
{(user?.userLevel === 'admin' || user?.userLevel === 'level1' || user?.userLevel === 'level2') && (
  <button>{action}</button>
)}

// For Delete button only
{(user?.userLevel === 'admin' || user?.userLevel === 'level1') && (
  <button>{delete}</button>
)}

// For Add Document button
{(user?.userLevel === 'admin' || user?.userLevel === 'level1' || user?.userLevel === 'level2') && (
  <button>+ Add Document</button>
)}
```

### Backend Validation (Still Applies!)
Even if frontend is bypassed, backend will reject:
- ❌ DELETE requests from Level2, Level3 → 403 Forbidden
- ❌ PUT/PATCH requests from Level3 → 403 Forbidden
- ❌ POST requests from Level3 → 403 Forbidden

---

## 🧪 Testing Each Role

### Admin Test:
1. Login as admin
2. Verify all buttons visible
3. All actions should work

### Level1 Test:
1. Login as Level1 user
2. Verify all buttons visible
3. All actions should work

### Level2 Test:
1. Login as Level2 user
2. ✅ Should see: Add, Edit, Download
3. ❌ Should NOT see: Delete button
4. Try to create, edit document → Success
5. If accidentally calling delete API → 403 error

### Level3 Test:
1. Login as Level3 user
2. ✅ Should see: View button only
3. ❌ Should NOT see: Add, Edit, Download, Delete buttons
4. Document list is visible (read-only)
5. If accidentally calling API → 403 error

---

## ✨ User Experience Improvement

### Before This Change:
- Level3 users see all buttons
- Clicking "Edit" or "Delete" → API error
- Confusing for users

### After This Change:
- Level3 users DON'T see "Edit", "Delete", "Add Document" buttons
- Only see "View" button (which they can use)
- Clear visual indication of their capabilities
- Better overall UX

---

## 🔒 Security Note

**This is a UI-level change ONLY:**
- ✅ Buttons hidden/shown based on user.userLevel
- ✅ Backend still validates all requests
- ✅ If user bypasses UI, API will reject with 403
- ✅ No security vulnerability introduced

This is purely an **UX enhancement**, not a security feature.

---

## 📋 Code Locations

| Element | File | Lines |
|---------|------|-------|
| User object added | DocumentsPage.tsx | 10 |
| Add Document button | DocumentsPage.tsx | 606-620 |
| Master actions | DocumentsPage.tsx | 970-1000 |
| Sub-doc actions | DocumentsPage.tsx | 1063-1092 |

---

## ✅ Status

✅ **IMPLEMENTED** - All conditional rendering in place
✅ **TESTED** - Vite compilation successful
✅ **DEPLOYED** - Frontend running at http://localhost:5174
✅ **READY** - For manual QA testing with different user roles
