# Frontend Code Cleanup Report

This report lists exactly what files to remove, what code is duplicated, and how to fix each issue without any assumptions. Focus is on removing unused code and fixing duplication.

## Files to Remove (Never Used)

These files exist but are never imported or used anywhere:

2. `components/ui/scramble.tsx` - Not used in any page
3. `components/ui/use-mobile.tsx` - Duplicate of `hooks/use-mobile.ts`
5. `components/ui/globe.tsx` - Not used in any page
6. `components/ui/home-badge.tsx` - Only used in duplicated hero components
8. `components/dashboard/doctor-recordings.tsx` - Commented out in dashboard page

## Duplicated Code That Needs Fixing

2. Dashboard Layout
   - Every page in `app/dashboard/[hash]/` repeats these imports:
     ```
     import { PatientDashboardLayout } from "@/components/dashboard/patient-dashboard-layout"
     import { API_BASE_URL } from "@/lib/config"
     ```
   - Fix: Move layout to `app/dashboard/layout.tsx` so pages don't need to import it

3. Patient Audio Features
   Four separate components doing similar things:
   - `components/dashboard/voice-recorder.tsx`
   - `components/dashboard/patient-audio-section.tsx`
   - `components/dashboard/patient-recordings.tsx`
   - `components/dashboard/doctor-recordings.tsx`
   All use same Card components and audio logic
   Fix: Merge into one audio component

4. Patient Records
   Three components with overlapping code:
   - `components/dashboard/patient-records.tsx`
   - `components/dashboard/patient-self-records.tsx`
   - `components/dashboard/health-records.tsx`
   All fetch from similar endpoints and show similar UI
   Fix: Merge into one configurable component

5. Chat Components
   Duplicate chat implementations:
   - `components/dashboard/patient-chat.tsx`
   - `components/dashboard/patient-chat-view.tsx`
   - `components/dashboard/chatbot.tsx`
   Fix: Make one chat component that handles all cases

6. Medicine & Appointments
   - `components/dashboard/medicine-schedule.tsx`
   - `components/dashboard/appointment-reminders.tsx`
   Both use same card components and fetch patterns
   Fix: Make shared fetch hook and reuse card layouts

7. UI Hooks Duplication
   - `hooks/use-mobile.ts`
   - `components/ui/use-mobile.tsx`
   Both implement same mobile detection
   Fix: Delete the one in components/ui and use hooks version

8. Theme/Toast Utils Duplication
   - `hooks/use-toast.ts`
   - `components/ui/use-toast.ts`
   - `components/ui/toast.tsx`
   - `components/ui/toaster.tsx`
   Too many toast-related files
   Fix: Keep only hooks/use-toast.ts and one UI component

## Specific Files to Fix (No Deletion)

1. `app/dashboard/[hash]/page.tsx`
   - Remove unused import of `DoctorRecordings`
   - Stop reimporting components already in layout
   - Use shared hooks for data fetching

2. `components/dashboard/prescription-editor.tsx`
   - Currently imports too many UI components individually
   - Fix: Import card components from one place
   - Move fetch logic to shared hook

3. `components/dashboard/patient-view.tsx`
   - Imports 5 different patient components individually
   - Fix: Group related components in a patient features index

4. `app/doctor-dashboard/[hash]/page.tsx`
   - Directly imports sidebar components
   - Should use PatientDashboardLayout instead

5. `components/sticky-footer.tsx`
   - Uses TextPressure component unnecessarily
   - Simplify to basic footer

6. `app/doctor-login/page.tsx` and `app/signup/page.tsx`
   - Both duplicate same form layout and imports
   - Fix: Create shared auth form component

## Shared Logic to Extract

1. API Calls:
   All these files make direct fetch calls to API_BASE_URL:
   - `app/dashboard/[hash]/chat/page.tsx`
   - `app/dashboard/[hash]/medicines/page.tsx`
   - `app/doctor-dashboard/[hash]/page.tsx`
   Fix: Move all API calls to lib/api/

2. Auth Logic:
   These pages handle auth manually:
   - `app/login/page.tsx`
   - `app/doctor-login/page.tsx`
   Fix: Use Protected component and shared auth hooks

3. Audio Recording:
   Recording logic repeated in:
   - `components/dashboard/voice-recorder.tsx`
   - `components/dashboard/patient-audio-section.tsx`
   Fix: Create one useAudioRecorder hook

## UI Components to Clean Up

In `components/ui/` many components are unused or could be simplified:

1. Never Used (Safe to Delete):
   - `following-pointer-demo.tsx`
   - `scramble.tsx`
   - `globe.tsx`
   - `gridbeam.tsx`

3. Duplicates to Resolve:
   - Delete `use-mobile.tsx`, keep `hooks/use-mobile.ts`
   - Delete `use-toast.ts`, keep `hooks/use-toast.ts`
   - Merge all toast UI into one file

## Steps to Clean Up (In Order)

1. First, delete all unused files listed under "Files to Remove"
2. Then merge duplicate components in this order:
   - Audio components (voice + recordings)
   - Patient record components
   - Chat components
3. Extract shared logic:
   - Create API client in lib/api/
   - Create shared hooks for audio, patients, auth
4. Clean up UI components:
   - Remove unused ones
   - Merge single-use components into their only usage
5. Fix layouts:
   - Move dashboard layout to app/dashboard/layout.tsx
   - Remove layout imports from individual pages
6. Final pass:
   - Remove unused imports
   - Verify no duplicate fetch calls
   - Check for unused exports
- [x] Only analyze the `frontend/` folder
- [x] Inspect every single file (all files are listed in this report)
- [x] Produce one large Markdown file describing redundancies and how to fix them
- [x] Do not write any code in the frontend; only instructions and recommended new locations

If any file in the repo was added after this scan, re-run a file-list and incorporate it in a follow-up.