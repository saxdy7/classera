# Communities Page - Visual Reference Guide

## 📸 New UI Layout Screenshots (ASCII Mockup)

### **Full Layout View**

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                                    HEADER                                      ║
║  Classera      Dashboard      Messages      Settings                    👤      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                                 ║
║ ┌─────────────────────┬──────────────────────────────────────┬──────────────┐ ║
║ │                     │                                      │              │ ║
║ │  LEFT SIDEBAR       │    MAIN CONTENT AREA                 │  RIGHT PANEL │ ║
║ │  (Dark Theme)       │    (White Background)                │  (Light)     │ ║
║ │                     │                                      │              │ ║
║ │ Classera            │  ┌──────────────────────────────┐    │ Search       │ ║
║ │ [+ New Comm.]       │  │ K   K24LL                    │    │ [🔍 Search]  │ ║
║ │                     │  │     Full stack community     │    │              │ ║
║ │ Your Communities    │  │     Community of learners    │    │ Team Members │ ║
║ │                     │  │ [View Full] [Settings ⚙]    │    │              │ ║
║ │ ▼ K24LL             │  └──────────────────────────────┘    │ 👤 Name      │ ║
║ │   👥 3 members      │                                      │    Student   │ ║
║ │                     │  ┌──────────┬──────────┬──────────┐   │    🟢        │ ║
║ │ ▶ General           │  │ Members  │ Status   │Messaging │   │              │ ║
║ │ ▶ Announcements     │  │    3     │  Active  │   On     │   │ 👤 Name      │ ║
║ │ ▶ Resources         │  │          │    ✓     │    ✓     │   │    Student   │ ║
║ │ ▶ Discussions       │  └──────────┴──────────┴──────────┘   │    🟢        │ ║
║ │                     │                                      │              │ ║
║ │ ──────────────────  │  ┌────────────────────────────────┐  │ 👤 Name      │ ║
║ │                     │  │ Quick Actions                  │  │    Student   │ ║
║ │ 👤 Mentor Name      │  │ ├─ View Feed                  │  │    🟢        │ ║
║ │    Mentor           │  │ ├─ Manage Members             │  │              │ ║
║ │                     │  │ ├─ Analytics                  │  │ Community    │ ║
║ │                     │  │ └─ Moderation                 │  │ Info         │ ║
║ │                     │  └────────────────────────────────┘  │              │ ║
║ │                     │                                      │ Created: ...  │ ║
║ │                     │                                      │ Status: Active│ ║
║ │                     │                                      │              │ ║
║ └─────────────────────┴──────────────────────────────────────┴──────────────┘ ║
║                                                                                 ║
╚════════════════════════════════════════════════════════════════════════════════╝

Widths:
- Left Sidebar: 288px (w-72)
- Main Content: Flexible (flex-1)
- Right Panel: 320px (w-80)
```

---

## 🎨 Component Sections

### **1️⃣ LEFT SIDEBAR** - Dark Navigation (Slate-900)

```
┌─────────────────────┐
│ Classera Logo       │
│ [+ New Community]   │
├─────────────────────┤
│ Your Communities    │
│                     │
│ ▼ K24LL             │
│   ↳ 3 members       │
│   (Selected State)   │
│                     │
│ • General           │ 🟡 Channels
│ • Announcements     │    Only visible
│ • Resources         │    when expanded
│ • Discussions       │
│                     │
│ ┌─────────────────┐ │
│ │👤 Mentor        │ │ User Profile
│ │   Mentor Role   │ │ Section
│ └─────────────────┘ │
│                     │
└─────────────────────┘

Sidebar Colors:
- Background: Slate-900 (#0f172a)
- Text: White
- Active: Indigo-600 (#4f46e5)
- Hover: Slate-800 (#1e293b)
```

### **2️⃣ MAIN CONTENT** - Dashboard (White)

```
┌──────────────────────────────────────────┐
│ Header Section                           │
│ ┌────────────────────────────────────┐  │
│ │ K  K24LL - Full stack              │  │
│ │    Community of learners           │  │
│ │ [View Full]              [Settings]│  │
│ └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│ Quick Stats - 3 Column Grid              │
│ ┌──────────┬──────────┬──────────────┐  │
│ │ Members  │ Status   │ Messaging    │  │
│ │    3     │ Active   │  Enabled     │  │
│ │ 👥       │   ✓      │   ✓          │  │
│ │ Indigo   │ Green    │ Purple       │  │
│ └──────────┴──────────┴──────────────┘  │
├──────────────────────────────────────────┤
│ Quick Actions - 2x2 Grid                 │
│ ┌──────────────────┬──────────────────┐ │
│ │ 💬 View Feed     │ 👥 Manage Mbrs   │ │
│ ├──────────────────┼──────────────────┤ │
│ │ 👁 Analytics     │ ⚠️ Moderation    │ │
│ └──────────────────┴──────────────────┘ │
└──────────────────────────────────────────┘

Card Colors:
- Members: Indigo-50 bg, Indigo-900 text
- Status: Green-50 bg, Green-900 text  
- Messaging: Purple-50 bg, Purple-900 text
```

### **3️⃣ RIGHT PANEL** - Team Members (Light Gray)

```
┌──────────────────┐
│ 🔍 Search        │
│ [Search members] │
├──────────────────┤
│ Team Members (3) │
│                  │
│ 👤 Member 1      │
│    Student   🟢  │
│                  │
│ 👤 Member 2      │
│    Student   🟢  │
│                  │
│ 👤 Member 3      │
│    Student   🟢  │
│                  │
├──────────────────┤
│ Community Info   │
│                  │
│ Created:  ...    │
│ Status: Active   │
│                  │
└──────────────────┘

Panel Colors:
- Background: Slate-50 (#f8fafc)
- Avatar: Gradient (Indigo-400 to Purple-500)
- Border: Slate-200 (#e2e8f0)
```

---

## 🎨 Color System

### **Stat Cards Color Map**

```
┌─────────────────────────────────────────────┐
│ STATS CARDS - 3 Different Color Themes      │
├─────────────────────────────────────────────┤
│                                             │
│  INDIGO Theme (Members)                     │
│  ┌────────────────────────────────────┐    │
│  │ 📊 3                               │    │
│  │ Members  [👥 icon in bg-indigo-200]│    │
│  │ bg-indigo-50  text-indigo-900      │    │
│  │ border-indigo-200                  │    │
│  └────────────────────────────────────┘    │
│                                             │
│  GREEN Theme (Status)                       │
│  ┌────────────────────────────────────┐    │
│  │ ✓ Active                           │    │
│  │ Status  [✓ icon in bg-green-200]   │    │
│  │ bg-green-50   text-green-900       │    │
│  │ border-green-200                   │    │
│  └────────────────────────────────────┘    │
│                                             │
│  PURPLE Theme (Messaging)                   │
│  ┌────────────────────────────────────┐    │
│  │ ✓ On                               │    │
│  │ Messaging [💬 icon in bg-purple]   │    │
│  │ bg-purple-50  text-purple-900      │    │
│  │ border-purple-200                  │    │
│  └────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘

Gradient Palette:
from-indigo-500 to-purple-600  ← Primary gradient
```

### **Action Buttons Color Coding**

```
Quick Actions Buttons:

1. View Feed
   bg-indigo-50 hover:bg-indigo-100
   text-indigo-700 (MessageCircle icon)

2. Manage Members
   bg-purple-50 hover:bg-purple-100
   text-purple-700 (Users icon)

3. Analytics
   bg-green-50 hover:bg-green-100
   text-green-700 (Eye icon)

4. Moderation
   bg-amber-50 hover:bg-amber-100
   text-amber-700 (AlertCircle icon)
```

---

## 📊 Typography Hierarchy

```
┌─────────────────────────────────────────┐
│ Typography Scale                        │
├─────────────────────────────────────────┤
│                                         │
│ H1: Community Name                      │
│ text-2xl font-bold text-slate-900      │
│                                         │
│ H2: Quick Stats / Quick Actions         │
│ font-bold text-slate-900               │
│                                         │
│ H3: Section Headers                     │
│ text-xs font-semibold uppercase         │
│                                         │
│ Body: Description, Labels               │
│ text-sm text-slate-600                 │
│                                         │
│ Small: Secondary Info                   │
│ text-xs text-slate-500                 │
│                                         │
│ Numbers: Stat Values                    │
│ text-3xl font-bold text-{color}-900    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🖱️ Interactive States

### **Community Selection in Sidebar**

```
BEFORE CLICK:
┌──────────────────────┐
│ ▼ K24LL              │ ← Hover: bg-slate-800
│   ↳ 3 members        │    text-white transition
│                      │
│ ▼ Community 2        │
│                      │
└──────────────────────┘

AFTER CLICK (SELECTED):
┌──────────────────────┐
│ ▼ K24LL              │ ← Selected
│   ↳ 3 members        │    bg-indigo-600
│ [CHANNELS APPEAR]    │    text-white
│ • General            │
│ • Announcements      │
│ • Resources          │
│ • Discussions        │
│                      │
│ ▼ Community 2        │
│   (not selected)     │
│                      │
└──────────────────────┘
```

### **Button Hover States**

```
Normal State:
┌─────────────────────┐
│ 💬 View Feed        │
│ bg-indigo-50        │
│ text-indigo-700     │
└─────────────────────┘
         ⬇️ (on hover)
Hover State:
┌─────────────────────┐
│ 💬 View Feed        │
│ bg-indigo-100       │  ← Darker background
│ text-indigo-700     │    (smooth transition)
└─────────────────────┘
```

---

## 📱 Layout Dimensions

```
┌──────────────────────────────────────────────────────────────┐
│ Sidebar          │ Main Content         │ Right Panel        │
│ w-72             │ flex-1               │ w-80               │
│ 288px            │ (grows to fill)      │ 320px              │
│                  │                      │                    │
│ Fixed Left       │ Flexible Center      │ Fixed Right        │
│                  │                      │                    │
│ Scrolls          │ Scrolls              │ Scrolls            │
│ internally       │ internally           │ internally         │
│ (max-height)     │ (flex-1)             │ (max-height)       │
│                  │                      │                    │
└──────────────────────────────────────────────────────────────┘

Total viewport height: calc(100vh - 64px)
  (100% viewport minus header height)
```

---

## 🔄 State Flow

```
User Interaction → State Change → UI Update

1. User clicks community
   ⬇️
   setSelectedCommunity(community)
   ⬇️
   Main area shows community details
   Right panel shows members

2. User clicks chevron
   ⬇️
   setExpandedCommunity(id)
   ⬇️
   Channels appear below community
   Chevron rotates

3. User clicks action button
   ⬇️
   Navigate to route
   ⬇️
   Different page loads
```

---

## 📋 Component Breakdown

```
MentorCommunitiesLayout
│
├─ Left Sidebar
│  ├─ Branding Section
│  │  ├─ Logo + "Classera"
│  │  └─ [+ New Community] button
│  │
│  ├─ Communities List
│  │  └─ For each community:
│  │     ├─ Avatar
│  │     ├─ Name + member count
│  │     ├─ Chevron icon
│  │     └─ [Expandable Channels]
│  │
│  └─ Profile Section
│     ├─ Avatar
│     ├─ Name
│     └─ Role badge
│
├─ Main Content
│  ├─ Header
│  │  ├─ Avatar + Name
│  │  ├─ Description
│  │  └─ [View Full] [Settings]
│  │
│  └─ Content Area
│     ├─ Stat Cards (3-column)
│     │  ├─ Members
│     │  ├─ Status
│     │  └─ Messaging
│     │
│     └─ Action Buttons (2x2)
│        ├─ View Feed
│        ├─ Manage Members
│        ├─ Analytics
│        └─ Moderation
│
└─ Right Sidebar
   ├─ Search Bar
   ├─ Members List
   │  └─ For each member:
   │     ├─ Avatar
   │     ├─ Name + role
   │     └─ Online indicator
   │
   └─ Info Section
      ├─ Created date
      ├─ Status
      └─ Messaging status
```

---

## 🎯 Key Visual Features

### **Gradient Backgrounds**

```
Left Sidebar
├─ Text: Pure white (#ffffff)
└─ Icons: Light slate colors

Stat Cards  
├─ Indigo: from-indigo-50 to-indigo-100
├─ Green: from-green-50 to-green-100
└─ Purple: from-purple-50 to-purple-100

Community Avatar (Main)
└─ from-indigo-500 to-purple-600

Member Avatars
└─ from-indigo-400 to-purple-500
```

### **Icons Used (from lucide-react)**

```
Navigation:
├─ ChevronDown - Expandable sections
├─ Home - Dashboard link
└─ Menu - Mobile menu (future)

Features:
├─ Users - Members
├─ Settings - Community settings
├─ MessageCircle - Feed/discussions
├─ Plus - Create new
└─ Bell - Notifications (future)

Actions:
├─ Eye - Analytics
├─ AlertCircle - Moderation
├─ Zap - Resources
└─ Hash - General channel
```

---

## ✅ Implementation Checklist

- [x] Three-column layout structure
- [x] Dark sidebar with navigation
- [x] Main dashboard with stats
- [x] Right panel with members
- [x] Interactive community selection
- [x] Expandable channels
- [x] Color-coded stat cards
- [x] Action buttons with navigation
- [x] Responsive typography
- [x] Hover states
- [x] Icon integration
- [x] User profile display
- [x] Search ready
- [x] Mobile-friendly structure (basics)

