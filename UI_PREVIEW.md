# 🎨 Community Feed UI Preview

## Desktop View (1920px)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🏠 Classera                                    🔔 👤 Profile                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 📚│                                                                              │
│ 📝│  ← Back to Communities                                                      │
│ 💬│                                                                              │
│ 👥│  ┌────────────────────────────────────────────────────────────────────┐    │
│ 📊│  │  🎯  Computer Science Hub                         ⚙️ Settings      │    │
│   │  │  Active community for learning and collaboration                   │    │
│   │  │  👥 245 members  ✅ Active                                         │    │
│   │  └────────────────────────────────────────────────────────────────────┘    │
│   │                                                                              │
│   │  ┌─ Feed ────┬─ Members ──┬─ Chat ──┐                                     │
│   │  │                                    │                                     │
│   │                                                                              │
│   │  ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  │  + What's on your mind? Share with the community...                 │  │
│   │  └─────────────────────────────────────────────────────────────────────┘  │
│   │                                                                              │
│   │  ┌───────────────┬────────────────────────────────────┬──────────────────┐│
│   │  │               │                                     │                  ││
│   │  │  📌 Filters   │         MAIN FEED                  │   🟢 Online      ││
│   │  │               │                                     │                  ││
│   │  │  All Posts    │  ┌──────────────────────────────┐ │  Alice (mentor)  ││
│   │  │  🔖 Saved     │  │ 📌 [PINNED]                  │ │  Bob (student)   ││
│   │  │  ❓ Questions │  │ 📢 Announcement              │ │  Charlie (stud.) ││
│   │  │  📢 Announce  │  │                              │ │                  ││
│   │  │  🔥 Trending  │  │ John Doe (mentor) • 2h ago  │ │  ────────────    ││
│   │  │               │  │                              │ │                  ││
│   │  │  ──────────   │  │ Important: Exam Schedule    │ │  🏆 Top Contrib. ││
│   │  │               │  │ The final exam will be...   │ │                  ││
│   │  │  📝 Rules:    │  │                              │ │  🥇 Alice        ││
│   │  │  • Be respect │  │ ❤️ 45  💬 12  🔖  🚩       │ │  👤 David        ││
│   │  │  • Ask clear  │  └──────────────────────────────┘ │  👤 Eve          ││
│   │  │  • No spam    │                                     │                  ││
│   │  │               │  ┌──────────────────────────────┐ │  ────────────    ││
│   │  │               │  │ ❓ Question                  │ │                  ││
│   │  │               │  │ ✅ Answered                  │ │  🔥 Trending     ││
│   │  │               │  │                              │ │                  ││
│   │  │               │  │ Sarah (student) • 4h ago    │ │  #WebDev         ││
│   │  │               │  │                              │ │  #DataStruct.    ││
│   │  │               │  │ How to implement auth?       │ │  #AI_ML          ││
│   │  │               │  │ I'm trying to add...         │ │  #CareerAdvice   ││
│   │  │               │  │                              │ │                  ││
│   │  │               │  │ ❤️ 23  💬 8  🔖  🚩        │ │  ────────────    ││
│   │  │               │  │                              │ │                  ││
│   │  │               │  │ ▼ Comments (8)               │ │  📊 Stats        ││
│   │  │               │  │                              │ │                  ││
│   │  │               │  │ 🌟 Alice (mentor) • 3h ago  │ │  Total Posts: 89 ││
│   │  │               │  │ [BEST ANSWER]                │ │  Answered: 67    ││
│   │  │               │  │ You can use NextAuth...      │ │  Active: 12      ││
│   │  │               │  │ ❤️ 15                        │ │                  ││
│   │  │               │  │                              │ │                  ││
│   │  │               │  │ Write a comment... [Send]    │ │                  ││
│   │  │               │  └──────────────────────────────┘ │                  ││
│   │  │               │                                     │                  ││
│   │  └───────────────┴────────────────────────────────┴──────────────────┘│
│   │                                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Mobile View (375px)

```
┌─────────────────────────┐
│ 🏠 Classera      🔔 👤  │
├─────────────────────────┤
│                         │
│ ← Back to Communities   │
│                         │
│ ┌─────────────────────┐│
│ │ 🎯 CS Hub          ││
│ │ 245 members        ││
│ └─────────────────────┘│
│                         │
│ Feed│Members│Chat       │
│                         │
│ ┌─────────────────────┐│
│ │ + What's on your... ││
│ └─────────────────────┘│
│                         │
│ ┌─────────────────────┐│
│ │ 📌 PINNED           ││
│ │ 📢 Announcement     ││
│ │                     ││
│ │ John Doe (mentor)   ││
│ │ 2 hours ago         ││
│ │                     ││
│ │ Important: Exam...  ││
│ │ The final exam...   ││
│ │                     ││
│ │ ❤️ 45  💬 12  🔖   ││
│ └─────────────────────┘│
│                         │
│ ┌─────────────────────┐│
│ │ ❓ ✅ Question      ││
│ │                     ││
│ │ Sarah (student)     ││
│ │ 4 hours ago         ││
│ │                     ││
│ │ How to implement... ││
│ │ I'm trying to add...││
│ │                     ││
│ │ ❤️ 23  💬 8  🔖    ││
│ └─────────────────────┘│
│                         │
│ [Load More]             │
│                         │
└─────────────────────────┘
```

## Color Scheme

### Primary Colors
- **Indigo-500**: `#6366f1` (Primary actions, focus)
- **Purple-500**: `#a855f7` (Gradients, accents)
- **White**: `#ffffff` (Backgrounds)
- **Slate-900**: `#0f172a` (Text)
- **Slate-600**: `#475569` (Secondary text)
- **Slate-200**: `#e2e8f0` (Borders)

### Post Type Colors
- **Normal Post**: Default (white card)
- **Question**: Green accent `#10b981`
- **Announcement**: Amber accent `#f59e0b`
- **Pinned**: Indigo border `#818cf8`

### Role Badges
- **Mentor**: Purple background `#e9d5ff`, Purple text `#7e22ce`
- **Student**: Blue background `#dbeafe`, Blue text `#1e40af`

### Status Indicators
- **Online**: Green `#10b981`
- **Away**: Yellow `#eab308`
- **Offline**: Gray `#6b7280`

## Typography

### Fonts
- **Headings**: System font stack, bold
- **Body**: System font stack, regular
- **Code**: Monospace (for future code blocks)

### Sizes
- **Page Title**: 2.5rem (40px)
- **Post Title**: 1.5rem (24px)
- **Body Text**: 1rem (16px)
- **Metadata**: 0.875rem (14px)
- **Badges**: 0.75rem (12px)

## Component Hierarchy

```
CommunityDetailPage (Server Component)
└── CommunityFeedClient (Client Component)
    ├── CreatePostButton
    │   └── CreatePostModal
    │       ├── PostTypeSelector
    │       ├── TitleInput
    │       ├── ContentTextarea
    │       └── SubmitButton
    │
    ├── CommunitySidebar
    │   ├── FilterButtons
    │   └── CommunityGuidelines
    │
    ├── CommunityFeed
    │   ├── FilterTabs
    │   └── PostsList
    │       └── PostCard (for each post)
    │           ├── PostHeader
    │           │   ├── Avatar
    │           │   ├── AuthorName
    │           │   ├── RoleBadge
    │           │   ├── PostTypeBadge
    │           │   └── ModeratorMenu
    │           ├── PostContent
    │           │   ├── Title
    │           │   ├── Body
    │           │   └── Images
    │           ├── PostActions
    │           │   ├── LikeButton
    │           │   ├── CommentButton
    │           │   ├── SaveButton
    │           │   └── ReportButton
    │           └── CommentsSection
    │               ├── CommentsList
    │               │   └── CommentCard (for each)
    │               │       ├── Avatar
    │               │       ├── Content
    │               │       ├── LikeButton
    │               │       └── BestAnswerBadge
    │               └── CommentInput
    │
    └── CommunityRightSidebar
        ├── OnlineMembers
        │   └── MemberCard (for each)
        ├── TopContributors
        │   └── ContributorCard (for each)
        ├── TrendingTopics
        │   └── TopicTag (for each)
        └── CommunityStats
```

## Interaction States

### Button States
```
Normal:       bg-white border-slate-200
Hover:        bg-slate-50 border-slate-300
Active:       bg-slate-100
Disabled:     opacity-50 cursor-not-allowed
Loading:      Spinner + text
```

### Like Button States
```
Unliked:      ❤️ text-slate-600
Liked:        ❤️ text-red-600 fill-current
Hover:        Scale 1.1 transform
```

### Post Card States
```
Normal:       border-slate-200 bg-white
Hover:        border-slate-300 shadow-sm
Pinned:       border-indigo-200 bg-indigo-50/30
Locked:       Greyed overlay
```

## Animations

### Transitions
- **All buttons**: 200ms ease-in-out
- **Cards hover**: 200ms ease-in-out
- **Modal open**: 300ms ease-out (scale + fade)
- **Toast notifications**: 300ms ease-out (slide-in)

### Loading States
- **Spinner**: Rotate animation
- **Skeleton**: Pulse animation
- **Infinite scroll**: Fade-in for new posts

## Accessibility

### ARIA Labels
- All buttons have descriptive labels
- Images have alt text
- Forms have proper labels
- Icons have sr-only text

### Keyboard Navigation
- Tab through all interactive elements
- Enter to submit forms
- Escape to close modals
- Arrow keys for navigation

### Color Contrast
- All text meets WCAG AA standards
- Interactive elements have 3:1 contrast
- Focus indicators visible

## Real-Time Indicators

### Visual Feedback
```
New Post:     Gentle fade-in from top
New Comment:  Smooth append to list
Like Update:  Number increments with scale animation
Online:       Green pulse dot
Typing:       "..." animation
```

## Empty States

### No Posts
```
┌─────────────────────────┐
│                         │
│     💬                  │
│                         │
│   No Posts Yet          │
│   Be the first to       │
│   start a discussion!   │
│                         │
└─────────────────────────┘
```

### No Comments
```
┌─────────────────────────┐
│ No comments yet.        │
│ Be the first to comment!│
└─────────────────────────┘
```

### No Online Members
```
┌─────────────────────────┐
│ 🟢 Online Now           │
│                         │
│ No one is online        │
│ right now               │
└─────────────────────────┘
```

## Best Practices Implemented

✅ **Mobile-First**: Responsive design starting from 320px
✅ **Accessibility**: WCAG 2.1 AA compliant
✅ **Performance**: Lazy loading, optimized images
✅ **Real-Time**: Instant updates via Supabase
✅ **Error Handling**: Graceful degradation
✅ **Loading States**: Clear feedback for all actions
✅ **Empty States**: Helpful messages when no data
✅ **Keyboard Nav**: Full keyboard accessibility
✅ **Screen Readers**: Proper ARIA labels
✅ **Dark Mode Ready**: Structure for future dark theme

---

**The UI is modern, clean, and follows the latest design trends while being fully functional and accessible!** 🎨
