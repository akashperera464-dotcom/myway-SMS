# MYWAY Student Management System

## Overview
A complete React-based Student Management System for **MYWAY Educational Institute** (Sri Lankan tuition class institute). Pure frontend app using localStorage for data persistence. Firebase-ready for future integration.

## Stack
- **Framework**: React + Vite
- **Routing**: Wouter v3
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React
- **Language**: TypeScript

## Key Architecture Decisions
- **No backend** — all data via localStorage through `src/lib/storage.ts`
- **Firebase-ready** — storage layer is abstracted, easy to swap
- **Sri Lanka specific** — LKR currency (Rs. format), SL districts/provinces, WhatsApp links, SL grading system (A/B/C/S/F)
- **Wouter v3** — `Link` renders its own `<a>`, do NOT wrap children in `<a>` tags

## Project Structure
```
artifacts/myway/src/
├── App.tsx                    # Router with all routes + Layout wrapper
├── index.css                  # Navy/teal theme, Plus Jakarta Sans font
├── lib/
│   ├── types.ts               # TypeScript interfaces (Student, TuitionClass, Teacher, etc.)
│   ├── storage.ts             # localStorage data layer + seed data
│   └── utils.ts               # formatCurrency, formatDate, SL constants
├── components/
│   └── layout/
│       ├── Layout.tsx         # Main layout wrapper (sidebar + header)
│       ├── Sidebar.tsx        # Navigation sidebar (navy, collapsible)
│       └── Header.tsx         # Top header with search + date
└── pages/
    ├── Dashboard.tsx          # Overview with stats + charts
    ├── Students.tsx           # Student list with search/filter/sort
    ├── StudentNew.tsx         # Add student form
    ├── StudentProfile.tsx     # Student detail + edit + history
    ├── Classes.tsx            # Class cards with add/delete
    ├── ClassDetail.tsx        # Class detail + attendance + roster
    ├── Attendance.tsx         # Mark attendance by class + date
    ├── Payments.tsx           # Fee tracking + mark paid + print receipt
    ├── Results.tsx            # Exam results with grade calculation
    ├── Teachers.tsx           # Teacher management
    ├── Notices.tsx            # Notice board with priorities
    ├── Reports.tsx            # Charts + analytics (fees, attendance, students)
    └── Settings.tsx           # Institute settings + data reset
```

## Features
- **Dashboard**: Live stats, fee collection chart, student grade distribution, recent payments, pending fee alerts
- **Students**: Full CRUD, search by name/ID/school/phone, filter by grade/status/class, sort
- **Classes**: Card view, add/delete classes, capacity tracking
- **Class Detail**: Roster management, add/remove students, attendance history
- **Attendance**: Mark per class per date, mark-all buttons, session summary
- **Payments**: Monthly tracking, mark paid, print receipt (opens print dialog), filter by class/status/month
- **Exam Results**: Add bulk results by class, auto-grade (A/B/C/S/F), rank calculation
- **Teachers**: CRUD, subject tags, WhatsApp/phone links
- **Notice Board**: Post notices with priorities (Normal/Important/Urgent), target audience
- **Reports**: Fee collection charts, attendance by class, student distribution (Recharts)
- **Settings**: Institute info, current month, danger zone data reset

## Seed Data
- 8 students (Kandy area, real school names)
- 4 classes (Mathematics, Science, Combined Maths, English)
- 3 teachers
- Payments, attendance records, exam results, notices

## Build & Deployment
- Build output: `dist/public/` → user downloads dist for Netlify hosting
- Vite config reads `PORT` and `BASE_PATH` env vars (set by workflow)
- Run: `pnpm --filter @workspace/myway run dev`

## Sri Lanka Specifics
- Currency: LKR displayed as `Rs. X,XXX`
- 25 districts, 9 provinces
- Grades: Grade 1 to Grade 13 (A/L Year 2)
- Grading: A (≥75%), B (≥65%), C (≥55%), S (≥35%), F (<35%)
- WhatsApp: links open `wa.me/94XXXXXXXXX`
