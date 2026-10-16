# Master Defect Tracking Register (PTW-024 to PTW-071)

| Defect ID | Module | Issue Summary | Expected Result | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PTW-024** | Notifications | Opening a notification record results in a 404 error | The selected notification record should open successfully without a 404 error | P1 | Open |
| **PTW-025** | Notifications | Opening a notification automatically marks it as Read | Notification should be marked as read only according to defined read/unread behavior | P2 | Open |
| **PTW-026** | Platform Admin – Permit Creation | Platform Admin has Create Permit option, but clicking Next shows Access Denied | If option is displayed, Admin should be able to proceed or option should be hidden | P1 | Open |
| **PTW-027** | Employee Management | Back button is missing in form/details view | A Back button should be available for clean navigation | P2 | Open |
| **PTW-028** | Employee Management – Email | Email field accepts numerical-only values & allows invalid email | Strict RFC 5322 email regex validation must be enforced before submission | P1 | Open |
| **PTW-029** | Employee Management – Phone | Phone field accepts alphabetic characters and allows creation | Phone field must accept valid phone digits only and reject alphabetic characters | P1 | Open |
| **PTW-030** | Employee Management – Validation | Missing Department error displays raw SQL: invalid input syntax for type uuid | User-friendly message (“Please select a Department”) must display instead of SQL error | P1 | Open |
| **PTW-031** | Contractor Management | Contractor can be created without Email ID, Agency, and Department | Mandatory field validation must block submission until all required fields are filled | P1 | Open |
| **PTW-032** | Contractor Management – Email | Email field accepts numerical-only values and allows invalid email | Strict email format validation must be enforced | P1 | Open |
| **PTW-033** | Contractor Management – Name | Contractor Name field has no restriction on valid name input | Name field should enforce alphabetic/string character validation rules | P2 | Open |
| **PTW-034** | Notifications | No notification count badge showing number of new/unread notifications | Top navigation and bell icon should display a live count/badge of unread items | P2 | Open |
| **PTW-035** | Employee/Contractor/Agency – Phone | Phone number lacks predefined country code & 10-digit format restriction | Provide country code selector and enforce standard 10-digit phone format | P2 | Open |
| **PTW-036** | Workforce Directory | Delete option is not available for workforce directory records | Authorized administrators should have a Delete/Soft-Delete option | P1/P2 | Open |
| **PTW-037** | Certificate Management | Created certificate cannot be opened/viewed | Authorized users should be able to preview and view certificate documents | P1 | Open |
| **PTW-038** | User Role Management | No notification sent after assigning a User Role | System should dispatch an email/app notification to the user upon role assignment | P1/P2 | Open |
| **PTW-039** | User Role Management | Purpose and permissions of assigned role are not clearly communicated | Role details modal/tooltip should explain role capabilities and security scope | P2 | Open |
| **PTW-040** | Workforce Directory | Phone number is not displayed in the Workforce Directory list | Workforce Directory table should include a contact phone column | P2 | Open |
| **PTW-041** | Employee Management | Employee details cannot be edited after initial creation | Authorized users should be able to edit and update employee details | P1/P2 | Open |
| **PTW-042** | Location Management | Location can be created without filling all required details | Form must validate and require all mandatory location fields prior to submission | P1 | Open |
| **PTW-043** | Competencies – Workforce Member | Workforce Member dropdown does not display available members | Dropdown must populate active workforce members for competency linkage | P1 | Open |
| **PTW-044** | Competencies – Certificate | Certificate is not displayed when selecting/opening a competency | Associated certificate details and attachment must be rendered correctly | P1/P2 | Open |
| **PTW-045** | Certificate Management – Start Date | Certificate has Expiry Date but no Start / Issue Date field | Certificate model and form should capture both Start Date and Expiry Date | P2 | Open |
| **PTW-046** | Certificate List | Certificate list table lacks Workforce Member and Expiry Date columns | Certificate table must display assigned Workforce Member name and Expiry Date | P2 | Open |
| **PTW-047** | Certification | Back button is missing in certification workflow views | A standard Back/Cancel navigation button should be present | P2 | Open |
| **PTW-048** | Competencies – Name/Description | Name and Description accept numerical-only input without validation | Name/Description should enforce valid character length and text formatting | P2 | Open |
| **PTW-049** | Competencies – Validation | Incorrect/vague warning displayed when Workforce Member is not selected | Clear validation error: “Workforce Member selection is required” | P1/P2 | Open |
| **PTW-050** | Workforce Management | Competency records do not have a Delete option; only Archive is available | Provide an explicit Delete option for competency records where permitted | P2 | Open |
| **PTW-051** | Workforce Management | No clear Delete option available for complete workforce management records | Provide authorized users with Delete/Decommission capability | P2 | Open |
| **PTW-052** | Billing | Quantity field allows record saving without entering a value | Quantity must be mandatory, positive integer, and validated before save | P1/P2 | Open |
| **PTW-053** | Billing – Permit Metrics | Duplicate “Active Permit” metrics displayed with unclear meaning | Ensure each dashboard metric has a distinct KPI definition and label | P2 | Open |
| **PTW-054** | Billing / Subscription | Usage information is displayed even though there is no active subscription | Usage counters should reflect actual subscription state and not show dummy stats | P2 | Open |
| **PTW-055** | Subscription Management | Displays “Choose Plan”, but underneath shows “No active plans available” | Available plans must load correctly, or an empty state CTA should guide the admin | P1/P2 | Open |
| **PTW-056** | Contractor/Agency Management | Edit option unavailable for Employee, Contractor, and Agency records | Authorized users must be able to update phone, email, and metadata | P1/P2 | Open |
| **PTW-057** | Incident Management | Back button is missing in the Incident module forms | A Back button should be present across all incident creation/view pages | P2 | Open |
| **PTW-058** | Incident Management | Submitting incident shows error: Validation failed – UUID is expired | Incident must generate valid RFC-compliant UUIDs without unhandled expiration | P1 | Open |
| **PTW-059** | Incident Management – Reporting | Clicking Report Incident without input lacks field-level validation | Display inline red validation errors for all required incident report fields | P1 | Open |
| **PTW-060** | Permit Creation | Permit can be submitted without selecting Department and PPE items | Department and PPE selection must be strictly mandatory before permit submission | P1 | Open |
| **PTW-061** | Permit Approval – HOD Notification | HOD does not receive notification when permit requires HOD approval | Backend must dispatch email/in-app alert to Department HOD upon permit submit | P1 | Open |
| **PTW-062** | Permit Approval – Comments | In Dark Mode, typed text in approval comment field is invisible (black on dark) | Comment textarea text color must adhere to theme styling with high contrast | P2 | Open |
| **PTW-063** | Platform Admin – Notifications | Platform Admin receives no notifications for permit creation or HOD approvals | System should dispatch configured event alerts to Platform Administrators | P1/P2 | Open |
| **PTW-064** | Incident Approval – HOD Notification | HOD receives no notification when created incident requires approval | Backend trigger must notify designated HOD immediately upon incident filing | P1 | Open |
| **PTW-065** | Incident – Root Cause | Clicking Root Cause does not open expected Create/Add modal | Open modal/drawer to allow investigators to record Root Cause analysis | P1/P2 | Open |
| **PTW-066** | Incident – Corrective Action | After adding Corrective Action, no toast/confirmation is displayed | Provide success feedback and update table state immediately | P2 | Open |
| **PTW-067** | Incident – Preventive Action | Preventive Action section lacks Add/Manage action button | Provide Add/Edit/Manage controls for Preventive Actions | P1/P2 | Open |
| **PTW-068** | Incident – Action History | No Delete option available for Root Cause, Corrective, or Preventive items | Allow authorized investigators to delete/retract incorrectly entered items | P2 | Open |
| **PTW-069** | Incident – Reminder | Reminder function lacks clear instructions and displays ambiguous context | Provide contextual labels, trigger frequency settings, and clear tooltips | P2 | Open |
| **PTW-070** | Incident – HOD Decision | Incident shows “Pending HOD Decision” but HOD has no decision interface | Provide Approve / Reject / Request Info action bar for the authorized HOD | P1 | Open |
| **PTW-071** | Incident Investigation | Root Cause, Corrective, & Preventive fields accept numerical-only input | Apply validation requiring meaningful textual descriptions (min length / format) | P2 | Open |
