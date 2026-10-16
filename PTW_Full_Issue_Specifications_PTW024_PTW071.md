# Permit to Work (PTW) Application — Complete Defect & Issue Specification Dossier (PTW-024 to PTW-071)

**Document Version:** 3.0  
**Date:** September 24, 2026  
**Status:** Open / Under Active Remediation  
**Application Under Test:** Permit to Work (PTW) Enterprise Platform (Web & Mobile)  
**Total Defects Documented:** 48 Defects (PTW-024 through PTW-071)  

---

## 1. Executive Summary & Defect Metrics

This document contains the complete individual specifications for defects **PTW-024 through PTW-071**. Every defect record contains:
- **Defect Identifier & Title**
- **Module & Functional Area**
- **Severity & Business Priority**
- **Detailed Defect Description & Observed Defect Behavior**
- **Safety / Business Impact**
- **Expected Result & Acceptance Criteria**
- **Technical Root Cause & Recommended Remediation**

### Defect Count by Priority
- **Critical (P1):** 16 Defects
- **High / Medium (P2):** 20 Defects
- **Hybrid (P1/P2):** 12 Defects

---

## 2. Comprehensive Master Defect Catalog

```
PTW-024 | Notifications                           | P1    | Notification record link yields 404 error
PTW-025 | Notifications                           | P2    | Opening notification automatically marks as read
PTW-026 | Platform Admin – Permit Creation        | P1    | Access Denied displayed when clicking Next
PTW-027 | Employee Management                     | P2    | Missing Back navigation button
PTW-028 | Employee Management – Email             | P1    | Email accepts numerical-only values & bypasses RFC validation
PTW-029 | Employee Management – Phone             | P1    | Phone field accepts alphabetic characters
PTW-030 | Employee Management – Validation        | P1    | Missing Department triggers raw SQL UUID syntax crash
PTW-031 | Contractor Management                   | P1    | Contractor created without Email, Agency, and Department
PTW-032 | Contractor Management – Email           | P1    | Contractor email allows numerical-only values
PTW-033 | Contractor Management – Name            | P2    | Contractor Name has no string/character restriction
PTW-034 | Notifications                           | P2    | No badge/counter for unread notifications
PTW-035 | Employee/Contractor/Agency – Phone      | P2    | Phone number lacks country code & 10-digit validation
PTW-036 | Workforce Directory                     | P1/P2 | Delete option unavailable for workforce directory records
PTW-037 | Certificate Management                  | P1    | Created certificate cannot be opened/viewed
PTW-038 | User Role Management                    | P1/P2 | No notification dispatched after assigning a user role
PTW-039 | User Role Management                    | P2    | Purpose and permissions of assigned role not communicated
PTW-040 | Workforce Directory                     | P2    | Phone number is omitted from workforce directory table
PTW-041 | Employee Management                     | P1/P2 | Employee details cannot be edited after initial creation
PTW-042 | Location Management                     | P1    | Location can be saved without mandatory fields
PTW-043 | Competencies – Workforce Member         | P1    | Workforce Member dropdown fails to display available members
PTW-044 | Competencies – Certificate              | P1/P2 | Associated certificate cannot be viewed from competency
PTW-045 | Certificate Management – Start Date     | P2    | Certificate has Expiry Date but lacks Start Date
PTW-046 | Certificate List                        | P2    | Table omits Workforce Member name and Expiry Date
PTW-047 | Certification                           | P2    | Missing Back navigation button
PTW-048 | Competencies – Name/Description         | P2    | Name & Description fields accept numerical-only input
PTW-049 | Competencies – Validation               | P1/P2 | Incorrect error shown when Workforce Member unselected
PTW-050 | Workforce Management                    | P2    | Competency records only support Archive, not Delete
PTW-051 | Workforce Management                    | P2    | Delete option missing for full workforce records
PTW-052 | Billing                                 | P1/P2 | Quantity field saved without entering value
PTW-053 | Billing – Permit Metrics                | P2    | Duplicate Active Permit metrics displayed on dashboard
PTW-054 | Billing / Subscription                  | P2    | Usage metrics displayed when no active plan exists
PTW-055 | Subscription Management                 | P1/P2 | "Choose Plan" shown but lists "No active plans available"
PTW-056 | Contractor/Agency Management            | P1/P2 | Edit option unavailable for Employee/Contractor/Agency
PTW-057 | Incident Management                     | P2    | Missing Back button in Incident module views
PTW-058 | Incident Management                     | P1    | Submitting incident crashes with "UUID is expired"
PTW-059 | Incident Management – Reporting         | P1    | Report Incident lacks immediate mandatory validation
PTW-060 | Permit Creation                         | P1    | Permit can be submitted without Department and PPE items
PTW-061 | Permit Approval – HOD Notification      | P1    | HOD receives no notification when permit submitted
PTW-062 | Permit Approval – Comments              | P2    | Approval comments typed text is invisible in Dark Mode
PTW-063 | Platform Admin – Notifications          | P1/P2 | Platform Admin receives no notifications for permits/approvals
PTW-064 | Incident Approval – HOD Notification    | P1    | HOD receives no notification when incident filed
PTW-065 | Incident – Root Cause                   | P1/P2 | Clicking Root Cause does not open modal
PTW-066 | Incident – Corrective Action            | P2    | No feedback/toast after adding Corrective Action
PTW-067 | Incident – Preventive Action            | P1/P2 | Preventive Action lacks Add/Manage interface
PTW-068 | Incident – Action History               | P2    | No Delete option for action history entries
PTW-069 | Incident – Reminder                     | P2    | Reminder feature lacks instructions & context
PTW-070 | Incident – HOD Decision                 | P1    | Pending HOD Decision lacks HOD approval/action interface
PTW-071 | Incident Investigation                  | P2    | Root Cause/CAPA text inputs accept numerical-only values
```

---

## 3. Full Issue Specifications (PTW-024 to PTW-071)

---

### Defect PTW-024: Opening Notification Record Results in 404 Error
* **Module:** Notifications
* **Severity:** Critical | **Priority:** P1
* **Defect Description:** When a user navigates to the Notifications list or drawer and clicks on any notification card to inspect the underlying event or record, the browser redirects to a broken URL or requests an unmapped API endpoint, returning an HTTP 404 (Not Found) page.
* **Impact:** High impact on user operations. Field personnel and safety supervisors are unable to act upon system alerts, approval requests, or incident notices.
* **Actual Result:** Clicking the notification displays a blank 404 error screen or modal.
* **Expected Result:** The selected notification must parse the resource type and resource ID, cleanly redirecting the user to the relevant record (e.g., `/permits/:id` or `/incidents/:id`).
* **Remediation:** Standardize notification deep-link routing. Implement a client-side route resolver with fallback navigation and verify backend notification payload schema.

---

### Defect PTW-025: Opening a Notification Automatically Marks It as Read
* **Module:** Notifications
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** Clicking or previewing a notification instantly switches its status from "Unread" to "Read" in the database before the user can evaluate the content or take required action.
* **Impact:** Important permits requiring urgent attention may be accidentally marked as read if the user merely clicks the notification or opens the tray, leading to forgotten approvals.
* **Actual Result:** In-app notification state transitions to `read: true` on pointer down / mouse click.
* **Expected Result:** Notification read status should adhere to deliberate user actions (e.g., clicking "Mark as Read", or only updating after the target item is successfully opened and acknowledged).
* **Remediation:** Introduce separate state handlers: `previewed` vs `acknowledged/read`, or add an explicit "Mark as Read" toggle.

---

### Defect PTW-026: Platform Admin Permit Creation Shows "Access Denied" After Basic Info
* **Module:** Platform Admin – Permit Creation
* **Severity:** Critical | **Priority:** P1
* **Defect Description:** When logged in with the Platform Admin role, the "Create Permit" button is prominently visible. The user can enter Step 1 (Basic Information), but upon clicking "Next", the application throws an "Access Denied" permission error.
* **Impact:** Confuses system administrators, blocks administrative permit authoring, and indicates a disconnect between UI role visibility and API middleware authorization.
* **Actual Result:** Form inputs disabled; error dialog `Access Denied: You do not have permission to perform this action` is displayed.
* **Expected Result:** If Platform Admins are permitted to issue permits, the API authorization policy must allow progression. If Platform Admins are strictly non-operational auditors, the "Create Permit" button must be hidden.
* **Remediation:** Align RBAC permissions between client UI navigation guards and backend permit controller middleware.

---

### Defect PTW-027: Missing Back Button in Employee Management
* **Module:** Employee Management
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** In Employee Create, Edit, and Profile View screens, there is no "Back" or "Cancel" button. Users are forced to use browser back navigation or click the top-level sidebar menu, risking form state loss.
* **Impact:** Degraded user experience, accidental navigation cancellations, and loss of uncommitted profile drafts.
* **Actual Result:** Header only contains a "Save" button; no secondary navigation controls exist.
* **Expected Result:** A persistent "Back" button or breadcrumb link should be present in the upper left of the employee card view.
* **Remediation:** Add `<Button variant="secondary" @click="router.back()">Back</Button>` in the Employee view header.

---

### Defect PTW-028: Employee Email Accepts Numerical-Only Input Without RFC Validation
* **Module:** Employee Management – Email
* **Severity:** Critical | **Priority:** P1
* **Defect Description:** The Email field in the Add/Edit Employee form allows numeric-only input (such as `123456789`) and passes client-side validation, creating employee accounts with invalid email addresses.
* **Impact:** System fails to deliver critical notifications, password resets, and safety alerts to the employee. Corrupts the database workforce directory.
* **Actual Result:** Form submits successfully with numerical email; backend accepts and stores `123456789`.
* **Expected Result:** Email field must validate standard RFC 5322 formatting (`user@domain.com`) and block submission if invalid.
* **Remediation:** Add strict Zod / Yup / Joi schema validation: `.email("Please enter a valid email address")` on both frontend and backend DTOs.

---

### Defect PTW-029: Employee Phone Field Accepts Alphabetic Characters
* **Module:** Employee Management – Phone
* **Severity:** Critical | **Priority:** P1
* **Defect Description:** The Phone Number field accepts alphabetic characters (e.g., `abcdefg`) and special symbols, allowing employee creation with gibberish contact details.
* **Impact:** Emergency contact failure. During an incident or chemical release, emergency response teams cannot contact the on-site employee.
* **Actual Result:** Text inputs such as `testphone` are stored in the database.
* **Expected Result:** Phone field must reject alphabetic input and restrict values to numeric digits, with support for standard dialing conventions.
* **Remediation:** Enforce regex `^[0-9+() -]+$` or implement standard telephone input masking (`v-mask` or `react-phone-input`).

---

### Defect PTW-030: Missing Department Shows Raw SQL Error: `invalid input syntax for type uuid`
* **Module:** Employee Management – Validation
* **Severity:** Critical | **Priority:** P1
* **Defect Description:** When creating an employee without selecting a Department, submitting the form crashes with an unhandled exception displaying: `invalid input syntax for type uuid: ""` or `500 Internal Server Error`.
* **Impact:** Exposes internal database architecture (PostgreSQL syntax error) and causes severe user frustration.
* **Actual Result:** Red raw database error toast: `invalid input syntax for type uuid: ""`.
* **Expected Result:** Clear, user-friendly client-side and server-side validation error: *"Department is required. Please select a department from the list."*
* **Remediation:** Validate `departmentId` before API dispatch. On the backend, sanitize empty strings (`""`) to `null` and handle with `@IsUUID()`.

---

### Defect PTW-031: Contractor Creation Allows Missing Email, Agency, and Department
* **Module:** Contractor Management
* **Severity:** Critical | **Priority:** P1
* **Defect Description:** The Contractor creation modal allows a record to be saved with only a Name, completely skipping Email ID, Contracting Agency, and Department.
* **Impact:** High compliance and legal liability risk. Unassigned contractors operate on site with no employer agency, department oversight, or contact channel.
* **Actual Result:** Record is inserted into the database with null/empty values for key governance columns.
* **Expected Result:** Email ID, Agency, and Department must be mandatory fields marked with an asterisk (`*`) and enforced before submission.
* **Remediation:** Update `CreateContractorDto` to make `email`, `agencyId`, and `departmentId` required fields.

---

### Defect PTW-032: Contractor Email Accepts Numerical-Only Input
* **Module:** Contractor Management – Email
* **Severity:** Critical | **Priority:** P1
* **Defect Description:** The Contractor Email field accepts numerical strings without checking for `@` or domain endings.
* **Impact:** Prevents dispatch of electronic permits, safety orientations, and digital badge approvals to contractor personnel.
* **Actual Result:** Values like `987654` are accepted and stored.
* **Expected Result:** Input must be strictly validated against standard email patterns (`^[^\s@]+@[^\s@]+\.[^\s@]+$`).
* **Remediation:** Implement identical client and server-side email validation schemas as in Employee Management.

---

### Defect PTW-033: Contractor Name Field Has No String / Character Restriction
* **Module:** Contractor Management – Name
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** The Contractor Name field permits arbitrary characters, single-character names, and purely numeric input (e.g., `00000` or `$$$`).
* **Impact:** Corrupts site workforce registers and causes issues on printed safety badges and legal audit trails.
* **Actual Result:** Form accepts numerical or symbol-only names.
* **Expected Result:** Name field must require alphabetical characters (allowing spaces, hyphens, and apostrophes) with a minimum length (e.g., 2 to 100 characters).
* **Remediation:** Add validation rule: `^[a-zA-Z\s'-]{2,100}$`.

---

### Defect PTW-034: Missing Unread Notification Count Badge
* **Module:** Notifications
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** The notification bell icon on the top navigation bar displays no badge or count for unread items.
* **Impact:** Users remain unaware of pending permits, urgent isolations, or incident approvals unless they manually click into the notification drawer.
* **Actual Result:** Bell icon remains static regardless of whether there are 0 or 25 unread notifications.
* **Expected Result:** A prominent colored badge with the unread count (e.g., `5` or `9+`) should appear over the bell icon.
* **Remediation:** Connect the Navbar notification component to a live reactive store / WebSocket count subscription.

---

### Defect PTW-035: Phone Number Lacks Predefined Country Code and 10-Digit Restriction
* **Module:** Employee / Contractor / Agency Management – Phone
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** Phone fields across Employee, Contractor, and Agency forms lack a country code selector (e.g., `+91`, `+1`) and accept numbers of arbitrary lengths (e.g., 3 digits or 25 digits).
* **Impact:** Inconsistent international numbers prevent automated SMS alerting and telephony integrations.
* **Actual Result:** Free-form text input with no length masking or country prefix.
* **Expected Result:** Provide a searchable country code dropdown defaulting to local region, followed by a validated 10-digit input field.
* **Remediation:** Integrate a standard phone number library such as `libphonenumber-js`.

---

### Defect PTW-036: Delete Option Unavailable for Workforce Directory Records
* **Module:** Workforce Directory
* **Severity:** High / Critical | **Priority:** P1/P2
* **Defect Description:** In the Workforce Directory table, authorized administrators have no option or button to delete or decommission personnel records created by mistake or duplicates.
* **Impact:** Directory clutter, duplicate accounts, and potential safety risks from assigning inactive personnel to permits.
* **Actual Result:** Only "View" or "Edit" options exist; no "Delete" or "Decommission" action is present.
* **Expected Result:** Authorized administrators should have a "Delete / Deactivate" option with confirmation modal and safety dependency checks.
* **Remediation:** Implement soft-delete API (`DELETE /api/v1/workforce/:id`) with validation preventing deletion of workers attached to active permits.

---

### Defect PTW-037: Created Certificate Cannot Be Opened or Viewed
* **Module:** Certificate Management
* **Severity:** Critical | **Priority:** P1
* **Defect Description:** When a user clicks on an existing certificate record to inspect the file or view accreditation credentials, the document modal fails to open or throws a blank preview error.
* **Impact:** Safety officers cannot verify whether a worker's High Voltage or Confined Space certificate is authentic or expired before issuing a permit.
* **Actual Result:** Clicking the certificate item does nothing or triggers a broken image/PDF preview icon.
* **Expected Result:** The application should open a responsive document viewer or trigger a secure download of the certificate file.
* **Remediation:** Fix signed S3/storage URL generation and verify client-side modal state management for PDF/Image rendering.

---

### Defect PTW-038: No Notification Sent After Assigning a User Role
* **Module:** User Role Management
* **Severity:** High / Critical | **Priority:** P1/P2
* **Defect Description:** When an administrator assigns or updates a user's role (e.g., promoting an engineer to Permit Issuer or HOD), no in-app or email notification is dispatched to the user.
* **Impact:** Users are unaware of their updated responsibilities and elevated authorization duties, causing approval pipeline delays.
* **Actual Result:** Role updates quietly in the database without any user notification.
* **Expected Result:** The assigned user must receive an instant in-app notification and email stating their newly assigned role and effective permissions.
* **Remediation:** Hook into the `UserRoleService.assignRole` method to dispatch an asynchronous `ROLE_ASSIGNED` event.

---

### Defect PTW-039: Purpose and Permissions of Assigned Role Not Communicated
* **Module:** User Role Management
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** In the Role Assignment dialog and user profile views, roles are listed only by short technical codes (e.g., `ROLE_PI`, `ROLE_HOD`) without explaining their scope, responsibilities, or security permissions.
* **Impact:** Administrators assign incorrect roles, and users do not know what actions they are authorized or expected to perform.
* **Actual Result:** Dropdown displays ambiguous role names without descriptions or tooltips.
* **Expected Result:** Every role should have a clear descriptive label, a summary description, and a viewable permissions breakdown.
* **Remediation:** Add `description` and `capabilities` metadata to the Role entity and display them in role selection tooltips.

---

### Defect PTW-040: Phone Number Not Displayed in Workforce Directory List
* **Module:** Workforce Directory
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** The Workforce Directory summary list table displays columns for Name, Trade, Department, and Status, but omits the Phone Number column.
* **Impact:** Shift supervisors cannot quickly locate contact numbers without opening each profile individually.
* **Actual Result:** Contact number column is absent from the table view.
* **Expected Result:** Include a "Phone Number" column in the main directory table with click-to-call (`tel:`) support.
* **Remediation:** Add `phone` to the Workforce Table column definitions and DTO response serializer.

---

### Defect PTW-041: Employee Details Cannot Be Edited After Creation
* **Module:** Employee Management
* **Severity:** High / Critical | **Priority:** P1/P2
* **Defect Description:** Once an employee record is created, opening the profile does not provide an "Edit" button, or all form fields remain permanently disabled in read-only mode.
* **Impact:** Administrative changes (e.g., updated phone numbers, changed emergency contacts, or department transfers) cannot be saved.
* **Actual Result:** Form fields are locked; no "Edit" or "Save Changes" controls are available.
* **Expected Result:** Authorized HR/Safety Admins should be able to click "Edit", modify employee information, and save changes.
* **Remediation:** Implement `EditEmployeeModal.vue` and wire up the `PATCH /api/v1/employees/:id` endpoint.

---

### Defect PTW-042: Location Can Be Created Without Filling Required Details
* **Module:** Location Management
* **Severity:** Critical | **Priority:** P1
* **Defect Description:** The "Add Location" modal allows users to submit a new site/area record with blank fields (e.g., missing Site Name, Facility Zone, or Risk Category).
* **Impact:** Creates orphan location records in the system, leading to unassigned permits and location mapping failures.
* **Actual Result:** Clicking "Submit" adds a blank or partially populated location row to the database.
* **Expected Result:** All mandatory location fields must be validated with clear error warnings before allowing creation.
* **Remediation:** Enforce frontend validation and backend schema constraints (`@IsNotEmpty()` on `name`, `zoneId`, `riskLevel`).

---

### Defect PTW-043: Workforce Member Dropdown Does Not Display Available Members
* **Module:** Competencies – Workforce Member
* **Severity:** Critical | **Priority:** P1
* **Defect Description:** In the "Assign Competency" form, opening the "Workforce Member" dropdown renders an empty list or indefinitely spinning loader, even when hundreds of active workers exist.
* **Impact:** Complete blocker for assigning safety skills, rigging certifications, or hot work qualifications to workers.
* **Actual Result:** Dropdown remains empty: *"No options available"*.
* **Expected Result:** The dropdown should populate with active workforce members belonging to the current organization/tenant, supporting search-as-you-type.
* **Remediation:** Fix the underlying API query `GET /api/v1/workforce/active` to properly scope by tenant and return member IDs and names.

---

### Defect PTW-044: Certificate Is Not Displayed When Selecting / Opening Competency
* **Module:** Competencies – Certificate
* **Severity:** High / Critical | **Priority:** P1/P2
* **Defect Description:** When a user opens an existing Competency record that has a linked training certificate, the certificate preview area is blank or displays `undefined`.
* **Impact:** Auditors and safety officers cannot verify proof of qualification for hazardous tasks.
* **Actual Result:** Competency details render, but the attached certificate field is blank.
* **Expected Result:** Associated certificate title, number, issuer, and document download/preview link must be prominently rendered.
* **Remediation:** Ensure the ORM query includes the joined certificate relation: `include: { certificate: true }`.

---

### Defect PTW-045: Certificate Has Expiry Date but No Start Date Field
* **Module:** Certificate Management – Start Date
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** The Certificate data model and creation form only contain an "Expiry Date" field, completely omitting the "Start / Issue Date".
* **Impact:** Impossible to verify whether a certificate was valid at the time historical work was performed.
* **Actual Result:** Form only captures `expiryDate`.
* **Expected Result:** Certificate form and database entity must support both `startDate` (Issue Date) and `expiryDate`.
* **Remediation:** Add `startDate` column to `certificates` table; update forms with a start date picker and enforce `startDate < expiryDate`.

---

### Defect PTW-046: Certificate List Table Lacks Workforce Member and Expiry Date
* **Module:** Certificate List
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** The main Certificate List view displays internal Certificate IDs and Document Names, but does not display the associated Workforce Member or the Expiry Date.
* **Impact:** Supervisors cannot tell whose certificate is listed or identify expiring certificates without opening every record.
* **Actual Result:** Key operational information is missing from the list overview.
* **Expected Result:** Table should clearly display: `Certificate ID | Workforce Member | Certification Name | Issue Date | Expiry Date | Status`.
* **Remediation:** Update table header definitions and include workforce member names in the API response.

---

### Defect PTW-047: Missing Back Button in Certification Module Views
* **Module:** Certification
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** Within the Certification Creation and Detail views, there is no "Back" or "Cancel" button to navigate back to the Certificate Register.
* **Impact:** Inconsistent UI navigation requiring reliance on browser back buttons.
* **Actual Result:** No Back button visible in header or footer.
* **Expected Result:** Consistent Back button displayed in the upper toolbar across all Certification screens.
* **Remediation:** Implement standard page header component with back button functionality.

---

### Defect PTW-048: Competency Name and Description Accept Numerical-Only Input
* **Module:** Competencies – Name / Description
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** Name and Description fields in the Competency module accept purely numeric characters (e.g., Name: `111111`, Description: `222222`) without textual validation.
* **Impact:** Leads to meaningless competency records in safety registers.
* **Actual Result:** Numeric strings are accepted and persisted.
* **Expected Result:** Name and Description must require valid descriptive text containing alphabetic characters (minimum 3 characters for Name, 10 for Description).
* **Remediation:** Add regex validation requiring alphabetic characters: `^(?!\d+$).+`.

---

### Defect PTW-049: Incorrect Warning Displayed When Workforce Member Not Selected
* **Module:** Competencies – Validation
* **Severity:** High / Critical | **Priority:** P1/P2
* **Defect Description:** When submitting a competency form without selecting a workforce member, the system displays an incorrect or confusing error (e.g., *"An unexpected server error occurred"* or *"Invalid object reference"*).
* **Impact:** Misleads the user and complicates debugging.
* **Actual Result:** Ambiguous or generic error toast is shown.
* **Expected Result:** Clean, targeted field-level validation: *"Please select a Workforce Member before saving."*
* **Remediation:** Add client-side validation guard before form submission.

---

### Defect PTW-050: Competency Records Lack Delete Option (Only Archive Available)
* **Module:** Workforce Management
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** Competency records can only be set to "Archived"; there is no option to permanently delete erroneous or duplicated competency assignments.
* **Impact:** Database clutter and confusion when audit trails show archived erroneous records alongside legitimate ones.
* **Actual Result:** Context menu only shows "Archive".
* **Expected Result:** Provide a "Delete" option with appropriate administrative permissions and confirmation prompts.
* **Remediation:** Add `DELETE /api/v1/competencies/:id` endpoint and integrate a Delete action button for authorized admins.

---

### Defect PTW-051: No Clear Delete Option for Complete Workforce Management Records
* **Module:** Workforce Management
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** Across the entire Workforce Management section (trades, teams, workers), there is no clear Delete option for decommissioned entities.
* **Impact:** Unused entities accumulate indefinitely in the workspace.
* **Actual Result:** Records cannot be purged or deleted by administrators.
* **Expected Result:** Provide authorized users with a Delete / Purge option where business rules permit.
* **Remediation:** Standardize soft-delete patterns across Workforce Management sub-modules.

---

### Defect PTW-052: Billing Quantity Field Allows Record Saving Without Entering a Value
* **Module:** Billing
* **Severity:** High / Critical | **Priority:** P1/P2
* **Defect Description:** When adding custom line items, add-on licenses, or billable permit quantities, the Quantity field can be left blank or null when saving.
* **Impact:** Results in `NaN` or `0` totals in invoices, leading to corrupted accounting and billing disputes.
* **Actual Result:** Form submits with empty Quantity; invoices calculate as `NaN` or throw backend calculation errors.
* **Expected Result:** Quantity must be a mandatory integer field with a minimum value of 1 (`@Min(1)`).
* **Remediation:** Enforce `@IsInt()` and `@Min(1)` on backend DTOs and set default value to `1` in frontend forms.

---

### Defect PTW-053: Duplicate "Active Permit" Metrics Displayed on Billing Dashboard
* **Module:** Billing – Permit Metrics
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** The Billing & Subscription metrics overview displays two separate KPI cards labeled "Active Permits", showing conflicting or duplicate numbers without contextual explanation.
* **Impact:** Confusion for plant managers and procurement teams assessing software utilization.
* **Actual Result:** Two cards with identical labels: "Active Permits: 12" and "Active Permits: 34".
* **Expected Result:** Clarify metrics with distinct titles, such as "Permits Issued This Month" vs. "Currently Open/Live Permits on Site".
* **Remediation:** Update card titles, descriptions, and backend metric query keys.

---

### Defect PTW-054: Billing Usage Metrics Displayed Without Active Subscription
* **Module:** Billing / Subscription
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** When an organization has no active subscription or is in a cancelled/expired state, the dashboard continues to display active license usage graphs and permit counters.
* **Impact:** Misleading operational view; suggests active subscription coverage when services may be paused.
* **Actual Result:** Hardcoded or stale usage graphs render despite inactive subscription status.
* **Expected Result:** When no active subscription exists, display an inactive status banner with zeroed usage metrics and a prompt to renew.
* **Remediation:** Check subscription state before rendering charts; show an inactive state wrapper when `status !== 'ACTIVE'`.

---

### Defect PTW-055: "Choose Plan" Page Shows "No Active Plans Available"
* **Module:** Subscription Management
* **Severity:** High / Critical | **Priority:** P1/P2
* **Defect Description:** When an administrator attempts to purchase or upgrade a subscription, clicking "Choose Plan" loads a page that states: *"No active plans available"*.
* **Impact:** Directly blocks business monetization; prospective customers and tenants cannot subscribe.
* **Actual Result:** Empty state message prevents plan selection or checkout.
* **Expected Result:** Available tiers (Starter, Professional, Enterprise) should display with their respective feature matrices and pricing.
* **Remediation:** Verify billing API plan configuration endpoint (`GET /api/v1/billing/plans`) and ensure active plans are seeded in production.

---

### Defect PTW-056: Edit Option Unavailable for Employee, Contractor, and Agency Records
* **Module:** Contractor / Agency Management
* **Severity:** High / Critical | **Priority:** P1/P2
* **Defect Description:** The Edit action is missing or disabled across Employee, Contractor, and Agency management views.
* **Impact:** Administrators cannot update phone numbers, emails, addresses, or operational statuses when changes occur.
* **Actual Result:** Details pages are view-only with no edit triggers.
* **Expected Result:** Authorized users must have an "Edit" button that opens an editable form with pre-populated values.
* **Remediation:** Add Edit modal and update routes for Contractor and Agency entities.

---

### Defect PTW-057: Missing Back Button in Incident Module
* **Module:** Incident Management
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** Incident creation, investigation, and CAPA screens lack a "Back" button to return to the Incident Register.
* **Impact:** Users risk losing uncommitted incident investigation notes if they navigate using browser history controls.
* **Actual Result:** No navigation back control within the page layout.
* **Expected Result:** Standard Back button placed at the top of all incident views.
* **Remediation:** Incorporate standard breadcrumbs and back navigation across the Incident module.

---

### Defect PTW-058: Incident Creation Fails with Error: `Validation failed – UUID is expired`
* **Module:** Incident Management
* **Severity:** Critical | **Priority:** P1
* **Defect Description:** Submitting a newly reported incident fails with an unhandled exception dialog: `Validation failed – UUID is expired` (or timestamp token timeout).
* **Impact:** Complete failure of incident reporting; safety events and near-misses cannot be recorded.
* **Root Cause:** Frontend sends a stale client-side session identifier or token where an RFC 4122 UUID is expected, or an idempotency token has prematurely expired.
* **Actual Result:** Incident is rejected and not saved to the database.
* **Expected Result:** Incident must be created cleanly, generating a valid UUID v4 on the server side.
* **Remediation:** Generate entity UUIDs exclusively on the backend upon database insertion; remove expired client-side ID parameters.

---

### Defect PTW-059: Report Incident Button Lacks Immediate Field-Level Validation
* **Module:** Incident Management – Reporting
* **Severity:** Critical | **Priority:** P1
* **Defect Description:** Clicking "Report Incident" on a blank form does not highlight required fields in red or provide actionable error messages.
* **Impact:** Users are left wondering why form submission has stalled with no visible guidance.
* **Actual Result:** Submit button appears unresponsive or fails silently without highlighting invalid fields.
* **Expected Result:** Mandatory fields (Incident Title, Date/Time, Severity, Location, Description) must display inline error messages and focus the first invalid field.
* **Remediation:** Trigger form validation on submit using React Hook Form / Vuelidate and scroll to the first invalid field.

---

### Defect PTW-060: Permit Can Be Submitted Without Selecting Department and PPE Items
* **Module:** Permit Creation
* **Severity:** Critical | **Priority:** P1
* **Defect Description:** A user can submit a work permit for approval without selecting a Department or checking any Personal Protective Equipment (PPE) items.
* **Impact:** Severe occupational safety hazard. High-risk jobs (e.g., chemical handling, hot work) could proceed without mandatory safety gear specifications.
* **Actual Result:** Form passes validation and submits permits with empty PPE arrays and null department.
* **Expected Result:** Submission must be blocked unless a valid Department is selected and at least the mandatory base PPE items (e.g., Helmet, Safety Shoes, Glasses) are checked.
* **Remediation:** Add strict validation rules in the permit submission pipeline: `departmentId` must not be null, and `ppeList.length > 0`.

---

### Defect PTW-061: HOD Does Not Receive Notification for Permit Requiring Approval
* **Module:** Permit Approval – HOD Notification
* **Severity:** Critical | **Priority:** P1
* **Defect Description:** When a permit moves to "Pending HOD Approval", the Head of Department receives no notification (email, SMS, or in-app alert).
* **Impact:** Permits sit idle indefinitely, delaying critical maintenance and plant shutdowns.
* **Actual Result:** Permit status changes, but no notification is generated for the HOD.
* **Expected Result:** System must automatically dispatch an email and in-app notification to the relevant HOD immediately upon permit submission.
* **Remediation:** Trigger a `PERMIT_SUBMITTED_FOR_HOD_APPROVAL` event in the workflow state machine and route it to the department HOD's notification queue.

---

### Defect PTW-062: Approval Comment Text Is Invisible in Dark Mode
* **Module:** Permit Approval – Comments
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** In Dark Mode, the approval comment textarea has a dark background while the typed text color is also dark gray/black, rendering text completely unreadable while typing.
* **Impact:** Approvers cannot see their own comments, conditions, or rejection notes as they type.
* **Actual Result:** Black text typed onto dark gray input field (low contrast).
* **Expected Result:** Text color must automatically switch to high-contrast white/light gray (`#F8FAFC`) in Dark Mode.
* **Remediation:** Fix CSS styling in `ApprovalModal.vue`: use CSS custom properties `color: var(--color-text-primary); background-color: var(--color-bg-input);`.

---

### Defect PTW-063: Platform Admin Receives No Notifications for Permit Creation or HOD Approvals
* **Module:** Platform Admin – Notifications
* **Severity:** High / Critical | **Priority:** P1/P2
* **Defect Description:** Platform Administrators do not receive system notifications when high-hazard permits are created or when HOD approvals are granted or rejected.
* **Impact:** Compliance auditors and central administrators lack visibility into high-hazard operations across site tenants.
* **Actual Result:** Platform Admin notification center remains empty during site permit workflows.
* **Expected Result:** Configured admin roles should receive broadcast or summary notifications for critical safety workflow milestones.
* **Remediation:** Add tenant-wide notification subscription hooks for administrative audit roles.

---

### Defect PTW-064: HOD Receives No Notification When Created Incident Requires Approval
* **Module:** Incident Approval – HOD Notification
* **Severity:** Critical | **Priority:** P1
* **Defect Description:** When an incident report is submitted that requires HOD sign-off, no notification is sent to the Department HOD.
* **Impact:** Incidents and safety hazards go unreviewed, creating serious regulatory and site safety risks.
* **Actual Result:** Incident status shows "Pending HOD Approval", but the HOD is never alerted.
* **Expected Result:** System must immediately notify the HOD via email and in-app alert with a direct link to the incident record.
* **Remediation:** Wire the incident submission event handler to dispatch notifications to the designated Department HOD.

---

### Defect PTW-065: Clicking Root Cause Does Not Open Create / Add Modal
* **Module:** Incident – Root Cause
* **Severity:** High / Critical | **Priority:** P1/P2
* **Defect Description:** In the Incident Investigation module, clicking the "Add Root Cause" or "Root Cause Analysis" button produces no action; the modal/drawer fails to open.
* **Impact:** Investigators cannot document root causes (5-Why, Fishbone analysis), stalling safety compliance.
* **Actual Result:** Button click does nothing; browser console logs an unhandled event or null reference error.
* **Expected Result:** Clicking "Root Cause" must open the Root Cause creation dialog with category selection and text description fields.
* **Remediation:** Fix broken click handler binding in `IncidentInvestigationTab.vue` and verify reactive modal visibility state.

---

### Defect PTW-066: No Confirmation or State Change After Adding Corrective Action
* **Module:** Incident – Corrective Action
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** After filling in and submitting a Corrective Action item, the modal closes without displaying a success toast, and the Corrective Action table does not refresh until the entire page is reloaded.
* **Impact:** Investigators believe the action failed to save and repeatedly submit duplicate entries.
* **Actual Result:** No visual confirmation; table remains stale until full browser refresh.
* **Expected Result:** Display a green success toast: *"Corrective Action added successfully"*, and update the action items list immediately.
* **Remediation:** Emit refresh event from modal and show toast notification on successful API response.

---

### Defect PTW-067: Preventive Action Section Lacks Add / Manage Action Button
* **Module:** Incident – Preventive Action
* **Severity:** High / Critical | **Priority:** P1/P2
* **Defect Description:** In the CAPA investigation workspace, the "Preventive Action" section is displayed as an empty container with no "Add Preventive Action" button or interactive controls.
* **Impact:** Safety teams cannot record preventive measures to avoid recurring incidents.
* **Actual Result:** Preventive Action card is a dead UI block with no interactive buttons.
* **Expected Result:** Provide an "Add Preventive Action" button that opens the action assignment form (Assignee, Due Date, Action Description).
* **Remediation:** Implement the missing `<Button @click="openPreventiveActionModal">Add Preventive Action</Button>` component and associated form.

---

### Defect PTW-068: No Delete Option Available for Action History Entries
* **Module:** Incident – Action History
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** If an investigator enters an erroneous Root Cause, Corrective Action, or Preventive Action item, there is no option to delete or retract the entry from the history log.
* **Impact:** Incorrect notes and accidental duplicates permanently clutter the official investigation record.
* **Actual Result:** Action history entries cannot be deleted or corrected.
* **Expected Result:** Authorized investigators should have a "Delete" or "Retract" button with confirmation prompt and audit logging.
* **Remediation:** Implement `DELETE /api/v1/incidents/:id/actions/:actionId` with role-based authorization check.

---

### Defect PTW-069: Incident Reminder Functionality Lacks Clear Instructions and Context
* **Module:** Incident – Reminder
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** The Reminder widget displays a bare text box with no explanatory placeholder, instructions, recipient selection, or scheduling options.
* **Impact:** Users are unsure what the reminder does, who will receive it, or when it will be sent.
* **Actual Result:** Ambiguous input box with no help text or context.
* **Expected Result:** The Reminder tool should clearly provide:
  - Purpose description (*"Set automated email reminders for outstanding investigation tasks"*)
  - Due Date & Time picker
  - Recipient selection (Assignee, HOD, Safety Lead)
  - Reminder notes field
* **Remediation:** Redesign the Reminder component with explicit labels, date/time pickers, and recipient selectors.

---

### Defect PTW-070: Missing HOD Decisioning Interface for Incidents Pending Decision
* **Module:** Incident – HOD Decision
* **Severity:** Critical | **Priority:** P1
* **Defect Description:** When an incident displays status "Pending HOD Decision", an HOD viewing the record is provided with no buttons, actions, or input controls to approve, reject, or request revision.
* **Impact:** Complete workflow roadblock. Incidents remain stuck indefinitely in "Pending HOD Decision".
* **Actual Result:** Status badge reads "Pending HOD Decision", but the page contains no decision controls for the HOD.
* **Expected Result:** An authorized HOD must see a prominent Decision Banner with:
  - **Approve Incident & Close**
  - **Request Further Investigation / Reopen**
  - **Decision Comments / Instructions field**
* **Remediation:** Render conditional HOD Action Bar when `user.isHOD && incident.status === 'PENDING_HOD_DECISION'`.

---

### Defect PTW-071: Root Cause, Corrective & Preventive Fields Accept Numerical-Only Input
* **Module:** Incident Investigation – Closing Investigation
* **Severity:** Medium | **Priority:** P2
* **Defect Description:** In the Investigation Closure modal, the Root Cause, Corrective Action, and Preventive Action textareas accept purely numeric characters (e.g., `123456789`) without requiring actual descriptive text.
* **Impact:** Closes compliance investigations with junk data, failing legal and EHS auditing standards.
* **Actual Result:** Pure numbers are saved as valid investigation findings.
* **Expected Result:** All three fields must require meaningful descriptive text containing alphabetical characters with a minimum length (e.g., minimum 15 characters).
* **Remediation:** Apply schema validation: `z.string().min(15).regex(/[a-zA-Z]/, "Must include descriptive text")`.

---

## 4. Remediation Prioritization & Action Matrix

| Phase | Focus Areas | Defect Range | Target Timeline |
| :--- | :--- | :--- | :--- |
| **Phase 1: Critical Hotfixes** | Unhandled server exceptions, raw SQL UUID errors, missing HOD notifications, broken CAPA modals, missing HOD decision interfaces, and unvalidated safety items (PPE/Department). | PTW-024, PTW-026, PTW-030, PTW-058, PTW-060, PTW-061, PTW-064, PTW-065, PTW-067, PTW-070 | 24 – 48 Hours |
| **Phase 2: Data Integrity & Validation** | Email RFC validation, phone formatting/country codes, workforce/contractor mandatory field validation, certificate start dates and viewers. | PTW-028, PTW-029, PTW-031, PTW-032, PTW-033, PTW-035, PTW-037, PTW-042, PTW-043, PTW-044, PTW-045, PTW-048, PTW-071 | 3 – 5 Days |
| **Phase 3: Directory & Lifecycle Controls** | Edit and delete capabilities for workforce, contractors, competencies, and billing items. | PTW-036, PTW-041, PTW-050, PTW-051, PTW-052, PTW-056, PTW-068 | Next Sprint |
| **Phase 4: UX, Contrast & Navigation** | Back buttons, Dark Mode textarea contrast, notification read/badge logic, reminder redesign, billing metrics clarification. | PTW-025, PTW-027, PTW-034, PTW-039, PTW-040, PTW-046, PTW-047, PTW-049, PTW-053, PTW-054, PTW-055, PTW-057, PTW-062, PTW-063, PTW-066, PTW-069 | Ongoing Sprint |

---

## 5. QA Verification & Sign-off Criteria

1. **Safety Compliance Verification:** Confirm that no permit can be drafted or submitted without mandatory PPE selections and an assigned Department.
2. **Notification & Role Pipeline:** Test end-to-end notification delivery to HODs and Platform Admins upon permit and incident milestone triggers.
3. **Database Integrity Audit:** Verify that empty strings or invalid IDs never pass to PostgreSQL UUID columns, eliminating raw database crashes.
4. **Theme Contrast Audit:** Perform visual accessibility testing in both Light and Dark modes to ensure all input fields maintain WCAG AA contrast compliance.
5. **Regression Testing:** Run full regression suite across Employee, Contractor, Competency, and Incident lifecycle modules before release sign-off.
