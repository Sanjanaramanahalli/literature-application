# PTW (Permit to Work) Application — Defect & Issue Tracking Report

**Document Version:** 1.0  
**Date:** September 22, 2026  
**Status:** Open / Under Review  
**Application Under Test:** Permit to Work (PTW) Web & Mobile Application  

---

## 1. Executive Summary

This document consolidates and standardizes the quality assurance (QA) and user testing defect findings identified across various modules of the **Permit to Work (PTW)** application. It provides a detailed breakdown of 16 issues across key modules including Organization Administration, Workforce Management, Permit Life Cycle, Isolations, Evidence Handling, Reporting, and Incident Management.

Each defect entry outlines:
- **Module & Feature Area**
- **Severity & Priority Assessment**
- **Issue Description & Impact**
- **Expected vs. Actual Behavior**
- **Recommended Remediation**

---

## 2. Severity & Priority Classification Matrix

| Level | Definition |
| :--- | :--- |
| **Critical (P1)** | System crashes, unhandled server exceptions, blocking key workflows (e.g., UUID errors, inability to upload evidence or apply tags). |
| **High (P2)** | Core functionality failure or broken permissions with no obvious workaround (e.g., cannot edit workforce, reports cannot be opened/deleted). |
| **Medium (P3)** | Functionality impaired or missing expected controls (e.g., missing back buttons, comment logs not persisting, missing Set buttons). |
| **Low (P4)** | Cosmetic, usability, or minor UI quirks (e.g., excessive notification popups, minor cursor positioning). |

---

## 3. Issues Summary Table

| # | Module | Issue Summary | Severity | Priority | Status |
|---|---|---|---|---|---|
| **1** | Org Admin | "Create New Organization" option is not available | High | P2 | Open |
| **2** | Org Admin | Organization can be updated, but creation option is missing | High | P2 | Open |
| **3** | Workforce Management | Workforce information cannot be edited | High | P2 | Open |
| **4** | Workforce Management | Suspension comment is not visible after submission | Medium | P3 | Open |
| **5** | Draft Permit | Missing "Back" / "Cancel" navigation button during editing | Medium | P3 | Open |
| **6** | Evidence | Evidence picture cannot be opened / previewed | High | P2 | Open |
| **7** | Reports | Generated report cannot be opened / viewed | High | P2 | Open |
| **8** | Reports | Generated report cannot be deleted | Medium | P3 | Open |
| **9** | Permit | Delete option unavailable after permit creation | Medium | P3 | Open |
| **10** | Notifications | Success/popup modal triggers redundantly on every submission | Low | P4 | Open |
| **11** | Pump Mechanical Isolation | Isolation point is unavailable for selection | Critical | P1 | Open |
| **12** | Pump Mechanical Isolation | "Apply Tag" button does not function | Critical | P1 | Open |
| **13** | Evidence Upload | File upload fails during evidence attachment | Critical | P1 | Open |
| **14** | Date / Time Pickers | Cursor/pointer misplaced in date and time inputs | Medium | P3 | Open |
| **15** | Date / Time Pickers | Missing "Set" / "Apply" button in picker dropdown | Medium | P3 | Open |
| **16** | Incidents | Validation Error: `Validation failed (uuid is expected)` | Critical | P1 | Open |

---

## 4. Detailed Defect Specifications

---

### Issue 1 & 2: Organization Creation Unavailable in Org Admin
* **Module:** Org Admin
* **Severity:** High | **Priority:** P2
* **Description:** 
  In the Organization Administration module, administrators can edit and update existing organization details; however, there is no action or button available to create a new organization.
* **Impact:** 
  Blocks onboarding of new operational entities, subsidiaries, or contractor firms unless provisioned directly via backend database seeding.
* **Actual Result:** 
  Only an "Update" flow is visible. "Create New Organization" button/link is absent.
* **Expected Result:** 
  Org Admins with sufficient privileges should have a clearly visible **"Create New Organization"** button that opens the organization registration form with mandatory fields (Name, Registration Number, Contact Info, Status).

---

### Issue 3: Inability to Edit Workforce Details
* **Module:** Workforce Management
* **Severity:** High | **Priority:** P2
* **Description:** 
  Attempting to edit existing workforce profile details (e.g., contact info, certifications, trade/discipline, assigned contractor) fails or the edit option is inactive/disabled.
* **Impact:** 
  Prevents administrators from keeping personnel records, safety certifications, and emergency contact details accurate.
* **Actual Result:** 
  Edit action is either disabled, unresponsive, or fails to persist modifications.
* **Expected Result:** 
  Authorized users should be able to click **Edit**, modify workforce information, and save changes with immediate UI feedback and database persistence.

---

### Issue 4: Workforce Suspension Comments Missing Post-Submission
* **Module:** Workforce Management
* **Severity:** Medium | **Priority:** P3
* **Description:** 
  When an administrator suspends a workforce member, a mandatory or optional "Reason / Comment" modal is presented. After entering the comment and confirming suspension, the comment is not displayed anywhere in the workforce profile or audit history.
* **Impact:** 
  Lacks regulatory and safety traceability regarding why an operative was suspended (e.g., safety violation vs. medical stand-down).
* **Actual Result:** 
  Workforce status switches to "Suspended", but the comment field returns blank or is omitted from the audit log.
* **Expected Result:** 
  The suspension reason/comment must be saved and displayed under the member's profile audit trail with the author's name and timestamp.

---

### Issue 5: Missing Back / Cancel Navigation on Draft Permit Screen
* **Module:** Draft Permit
* **Severity:** Medium | **Priority:** P3
* **Description:** 
  While editing a draft permit, there is no dedicated "Back" or "Cancel" button. 
* **Impact:** 
  Users are forced to use the browser back button or reload the page, which risks accidental loss of unsaved form data or state corruption.
* **Actual Result:** 
  Users can only proceed forward (e.g., "Next", "Save") without an explicit route to safely exit back to the Permit List.
* **Expected Result:** 
  A **"Back"** and **"Cancel / Exit Draft"** button should be present in the header/footer with confirmation prompts if unsaved changes exist.

---

### Issue 6 & 13: Evidence Image Viewing and Upload Failures
* **Module:** Evidence / Evidence Upload
* **Severity:** Critical | **Priority:** P1
* **Description:** 
  1. Uploading evidence attachments (photos, inspection checklists) fails with a network or validation error.
  2. For previously uploaded evidence, clicking on the picture thumbnail fails to open or render the full-resolution preview.
* **Impact:** 
  Permit safety compliance requires visual verification of lockouts, tagouts, and site hazard controls. Failure to upload or view evidence halts permit issuance.
* **Actual Result:** 
  Upload throws an error or hangs; clicking existing evidence leads to a broken image link or unresponsive modal.
* **Expected Result:** 
  - Valid image file types (`.jpg`, `.jpeg`, `.png`, `.pdf` up to size limit) must upload cleanly with progress indicators.
  - Clicking any thumbnail must open an accessible lightbox/modal preview with zoom and download capabilities.

---

### Issue 7 & 8: Generated Reports Cannot Be Opened or Deleted
* **Module:** Reports
* **Severity:** High | **Priority:** P2
* **Description:** 
  After generating a PDF/Excel report from the Reports center:
  1. Clicking to view/open the report fails (broken download link or 404/403 error).
  2. No delete button is present, or clicking delete produces no response.
* **Impact:** 
  Auditors and safety managers cannot access exported compliance data, and stale/erroneous reports clutter storage.
* **Actual Result:** 
  Reports remain stuck in the list with broken links and no deletion mechanism.
* **Expected Result:** 
  - Users can click **"View / Download"** to preview or download generated documents.
  - Authorized users should see a **"Delete"** button with a confirmation modal to remove obsolete reports.

---

### Issue 9: Delete Option Missing for Newly Created Permits
* **Module:** Permit
* **Severity:** Medium | **Priority:** P3
* **Description:** 
  After drafting or initiating a permit, if the creator made a mistake and needs to scrap it, no "Delete" or "Discard" option is available.
* **Impact:** 
  Accumulation of orphan or test permits in the system, polluting active permit registries.
* **Actual Result:** 
  Permits in "Draft" or "Initiated" status do not show a Delete button.
* **Expected Result:** 
  According to business rules, permits in `DRAFT` or `PENDING_SUBMISSION` state should feature a "Delete / Discard Permit" option for the permit creator or Org Admin.

---

### Issue 10: Redundant Notification Popups on Every Submission
* **Module:** Notifications / Global UX
* **Severity:** Low | **Priority:** P4
* **Description:** 
  Submitting routine forms or sub-steps triggers blocking modal popups repeatedly, disrupting user workflow.
* **Impact:** 
  Creates alert fatigue and slows down operators performing repetitive data entry.
* **Actual Result:** 
  Every micro-save or step transition triggers a full blocking popup modal.
* **Expected Result:** 
  Replace blocking popups with non-intrusive toast notifications (e.g., green bottom/top toast disappearing after 3 seconds). Reserve full modal alerts strictly for critical actions (e.g., approval signatures, cancellations, hazardous overrides).

---

### Issue 11 & 12: Mechanical Isolation Point Selection & "Apply Tag" Failure
* **Module:** Pump Mechanical Isolation
* **Severity:** Critical | **Priority:** P1
* **Description:** 
  1. Within the Pump Mechanical Isolation checklist/screen, the dropdown or selector for isolation points is blank or fails to populate.
  2. Clicking the **"Apply Tag"** button triggers no backend API call or visual status change.
* **Impact:** 
  Direct safety hazard. Isolation and Lockout/Tagout (LOTO) procedures cannot be completed in the application, blocking permit validation.
* **Actual Result:** 
  Isolation points do not load; "Apply Tag" button is inert.
* **Expected Result:** 
  - The isolation points associated with the pump/equipment tag must populate in the dropdown.
  - Clicking "Apply Tag" must record the physical tag ID, date/time, and operator ID, updating the UI badge to "Tagged / Isolated".

---

### Issue 14 & 15: Date & Time Picker Formatting and Missing "Set" Button
* **Module:** Date/Time Inputs
* **Severity:** Medium | **Priority:** P3
* **Description:** 
  1. Clicking into Date/Time input fields places the text cursor in an awkward or unexpected offset position, making manual keyboard typing difficult.
  2. In the popup calendar/time picker overlay, there is no explicit **"Set"** or **"Apply"** button; closing the modal leaves the value unselected or reverts to prior value.
* **Impact:** 
  Permit start/expiry validity windows require accurate hour/minute scheduling; erratic pickers lead to invalid or incorrect validity dates.
* **Actual Result:** 
  Cursor misaligns; users are confused about how to confirm the selected time without a "Set" trigger.
* **Expected Result:** 
  - Inputs should properly format with standard masking (e.g., `YYYY-MM-DD HH:mm`).
  - The picker dialog should feature explicit **"Clear"**, **"Cancel"**, and **"Set / Apply"** buttons.

---

### Issue 16: Incident UUID Validation Error
* **Module:** Incidents
* **Severity:** Critical | **Priority:** P1
* **Description:** 
  When opening or fetching incident details, the application encounters an unhandled API error:  
  `Validation failed (uuid is expected)`
* **Impact:** 
  Users are unable to open, investigate, or attach incidents to permits. Complete blocker for Incident Management.
* **Root Cause Analysis:** 
  The frontend is either passing an integer ID, undefined/null string, or non-UUID parameter (such as a slug or empty route param) to an API endpoint expecting a strict UUID v4 format.
* **Actual Result:** 
  500/400 Bad Request error modal displayed: `Validation failed (uuid is expected)`.
* **Expected Result:** 
  The routing and API client must ensure valid UUIDs are dispatched, and the backend should gracefully handle invalid identifiers with friendly 404 / 400 validation error responses rather than crashing.

---

## 5. Next Steps & Recommended Action Plan

1. **Sprint Triage:** Assign Critical (P1) items (Issues 11, 12, 13, 16) for immediate hotfix resolution.
2. **Backend / API Validation:**
   - Fix UUID routing in Incident Module.
   - Inspect S3 / Cloud Storage / file upload endpoint for Evidence attachments.
   - Verify isolation point relational queries for equipment/pumps.
3. **Frontend / UX Refactoring:**
   - Standardize Date/Time pickers across all forms.
   - Replace blocking submission alerts with toast notifications.
   - Add proper breadcrumbs, "Back", and "Cancel" buttons in multi-step permit creation.
4. **Permissions & Role Configuration:**
   - Review Org Admin role definitions to enable Organization Creation and Workforce editing capabilities.
