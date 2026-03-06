

# EduTrack Pro — Attendance Management System
## Gayatri Vidya Parishad

### Overview
A royal-themed attendance management system with dark navy/gold glassmorphism design, Supabase backend for auth and data persistence, and role-based access for faculty and students.

---

### Backend (Supabase)

**Database Tables:**
- `users` — id, username, role (faculty/student), created via Supabase Auth
- `students` — id, suffix, reg_number, name, user_id (FK)
- `attendance_records` — id, date, subject, section, period, submitted_by, with unique constraint on (date, subject, section, period)
- `attendance_entries` — id, record_id (FK), student_suffix, status (present/absent)
- `user_roles` — id, user_id, role (for RLS security)

**Seed Data:** 56 students pre-loaded. Faculty account (admin/admin123) and student accounts (suffix/student123).

**RLS Policies:** Faculty can read/write all. Students can only read their own attendance data.

---

### Design Theme
- **Colors:** Dark royal backgrounds (#0a0a1a, #0d1b3e, #152250), gold accents (#f0b429, #c8960c, #ffd97d)
- **Fonts:** Cinzel (headings), Cormorant Garamond (body), DM Mono (numbers) via Google Fonts
- **Effects:** Animated floating blur orbs (blue, gold, crimson), subtle gold grid overlay, glassmorphism cards with backdrop-filter blur and gold borders
- **Custom cursor:** Gold outer ring + inner dot + delayed trail
- **Animations:** fadeInUp on page transitions, pulsing logo emblem
- **Splash screen:** "⚜ EduTrack Pro" with gold progress bar (1.6s)
- **GVP logo** embedded in login screen and header navbar

---

### Pages & Features

**1. Login Page**
- GVP logo with pulsing gold glow + rotating outer ring
- Role tabs: Faculty | Student
- Username + password fields with gold-bordered glassmorphism card
- "Enter the System" gold gradient button
- Credential hints displayed below
- Error toast on bad credentials

**2. Header (post-login)**
- GVP logo (40×40 circle) + "EduTrack Pro" title + "ATTENDANCE MANAGEMENT SYSTEM" subtitle
- Live clock updating every second (e.g. "Monday, 06 March 2026 · 10:45:32 AM")
- User badge with initials avatar, name, role
- Gold logout button

**3. Navigation Tabs**
- Faculty sees: Dashboard, Mark Attendance, Students, History, Weekly View
- Student sees: Dashboard, Students (own row only), History, Weekly View

**4. Dashboard**
- 4 glassmorphism stat cards: Total Students, Classes Held, Avg Attendance %, Below 75% count
- Recent 5 attendance records with subject, section, period, present/absent counts
- All data fetched live from Supabase

**5. Mark Attendance (Faculty only)**
- Subject input, Section dropdown (A/B/CSE/MCA), Date picker (today default), Period pills P1–P7
- Textarea for absent suffixes (comma/space separated)
- Live preview: gold chips showing resolved absent student names as you type
- Summary line: "X absent · Y present out of 56"
- Duplicate guard: checks unique constraint before submit
- Success toast + redirect to Dashboard

**6. Students Page**
- Search/filter bar by name, reg number, or suffix
- Table with columns: #, Reg Number, Name, Classes Held, Present, Attendance % (color-coded progress bar), Status badge
- Green ≥75%, Yellow ≥60%, Red <60%
- Status: "✓ Good" or "⚠ Low"
- Students only see their own row

**7. History Page**
- All attendance records, newest first
- Each card shows: date, subject, section+period chips, present/total count, absent student names listed

**8. Weekly View**
- Monday–Friday grid with 7 period columns each
- Green dot = attendance recorded, today's column highlighted in gold
- Subject abbreviation shown in filled slots

---

### Auth Flow
- Supabase Auth with email/password (username mapped to email internally)
- Faculty: admin/admin123 → full CRUD access
- Students: suffix/student123 → read-only, own data only
- Role-based route protection on frontend
- RLS policies enforce server-side security

---

### Additional
- Fully responsive (mobile + desktop)
- Loading skeletons while fetching data
- Toast notifications (success green, error red, info blue) auto-dismiss 3.5s
- Form validation before all API calls
- Error boundaries with user-friendly messages

