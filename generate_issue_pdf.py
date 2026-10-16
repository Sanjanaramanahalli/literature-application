import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#718096"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, 11 * inch - 36, "QA & Safety Bug Triage Report | Priority Matrix (P0, P1, P2)")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(36, 11 * inch - 42, 8.5 * inch - 36, 11 * inch - 42)
        
        # Footer
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(36, 42, 8.5 * inch - 36, 42)
        
        self.drawString(36, 28, "CONFIDENTIAL & PROPRIETARY — QUALITY ASSURANCE & INCIDENT MGMT")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 36, 28, page_text)
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1A202C")
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#4A5568")
    )

    sec_title = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#1A365D"),
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#2D3748")
    )

    cell_hdr = ParagraphStyle(
        'CellHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1A202C")
    )

    cell_text = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#2D3748")
    )

    p0_badge = ParagraphStyle(
        'P0Badge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#9B2C2C"),
        alignment=1
    )

    p1_badge = ParagraphStyle(
        'P1Badge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#C05621"),
        alignment=1
    )

    p2_badge = ParagraphStyle(
        'P2Badge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#2B6CB0"),
        alignment=1
    )

    story = []

    # Title & Header
    story.append(Paragraph("Software Defect Triage & Severity Classification Report", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("System Safety, EHS, Permit to Work (PTW) & Incident Management Module | Evaluated: 20 Defect Items", subtitle_style))
    story.append(Spacer(1, 10))

    # Executive Summary Card
    exec_summary_data = [
        [
            Paragraph("<b>P0 — Critical Blocker (6 Issues)</b><br/><font color='#742A2A'>Breaks regulatory compliance, core safety LOTO, onboarding access, or incident creation.</font>", body_style),
            Paragraph("<b>P1 — Major Functional Defect (8 Issues)</b><br/><font color='#7B341E'>Workflow stalls, broken approval routing, evidence view failures, and missing navigation controls.</font>", body_style),
            Paragraph("<b>P2 — Minor & UI Friction (6 Issues)</b><br/><font color='#2A4365'>Dropdown refresh delay, double-click glitches, profile photos, copy button, and download clarification.</font>", body_style)
        ]
    ]
    summary_table = Table(exec_summary_data, colWidths=[180, 180, 180])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#FFF5F5")),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor("#FFFAF0")),
        ('BACKGROUND', (2,0), (2,0), colors.HexColor("#EBF8FF")),
        ('BOX', (0,0), (0,0), 1, colors.HexColor("#FEB2B2")),
        ('BOX', (1,0), (1,0), 1, colors.HexColor("#FEEBC8")),
        ('BOX', (2,0), (2,0), 1, colors.HexColor("#BEE3F8")),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 14))

    # Define Data
    p0_items = [
        (1, "Request Access", "Request Access cannot be submitted. Warning shows: 'We couldn't reach the server. Check your connection and send the form again.'",
         "Network/Backend unreachable or API failure block all new user registration and onboarding.",
         "High (All new users)"),
        (2, "LOTO", "File/evidence cannot be uploaded in the Lockout/Tagout field.",
         "Critical OSHA/EHS Safety hazard: Isolations cannot be documented before hazardous work begins.",
         "Critical (Zero safety audit trail)"),
        (5, "Incident Management", "Chat Admin cannot report an incident. Warning shows: 'Validation failed, UUID expired.'",
         "Critical failure: Direct prevention of incident and near-miss reporting due to token/session expiry.",
         "High (Incident reporting blocked)"),
        (6, "Permit Permissions", "Org Admin can perform multiple permit actions—fill permit details, submit, approve, and start work.",
         "Segregation of Duties (SoD) violation: Single actor bypasses review, audit, and safety oversight.",
         "Critical Compliance & Audit Breach"),
        (8, "Permit Creation – LOTO", "Add Lockout/Tagout is not working while creating a permit.",
         "Safety failure: Cannot attach required LOTO isolation certificates during permit preparation.",
         "Critical (Cannot issue hazardous permits)"),
        (9, "Permit Closure – Evidence", "After adding evidence during permit closure, 'Authentication required' is displayed.",
         "Session error prevents permit sign-off and closure, leaving work active or uncertified.",
         "High (Permits stuck in open state)")
    ]

    p1_items = [
        (3, "Permit Templates", "Add Section is not working when creating/editing a permit template.",
         "Prevents Safety Administrators from customizing and releasing compliant new permit forms."),
        (7, "Notifications", "Permit approval notification appears in Messages, but clicking it does not open the specific permit; it opens/shows all permits.",
         "Deep-linking route broken; delays urgent review times when multiple permits exist in inbox."),
        (11, "Evidence", "Uploaded evidence cannot be opened/viewed.",
         "Approvers cannot verify site photos, isolation locks, or safety evidence before authorizing work."),
        (12, "HOD Notification", "HOD does not receive a notification when the Job Issuer submits a permit and HOD approval is the next step.",
         "Communication breakdown stalls approval chain; operational downtime on plant floor."),
        (15, "Incident – Root Cause", "Clicking Record Root Cause for an unsafe incident does not open the expected popup/form.",
         "EHS investigation workflow blocked; incidents cannot progress to root cause analysis phase."),
        (16, "Incident – Corrective Action", "Clicking Corrective Action does not open the expected popup/form.",
         "Remediation lifecycle blocked; corrective actions (CAPA) cannot be logged or assigned."),
        (17, "Incident – Assign", "In Manager Incidents, clicking Assign results in 'Unable to load page.'",
         "Route 404 or unhandled crash when allocating incident investigations to responsible managers."),
        (18, "Permit Creation – Back", "There is no Back button while creating a permit.",
         "Multi-step wizard lacks backward navigation; users risk losing unsaved form data or abandoning flow.")
    ]

    p2_items = [
        (4, "Permit Creation", "Machinery does not appear in the dropdown initially. It appears only after refreshing the application.",
         "Workaround exists via page refresh; caused by asynchronous cache/fetch lifecycle hook."),
        (10, "Profile", "Profile picture cannot be removed, and the selected profile picture does not display.",
         "Cosmetic profile preference defect with no direct impact on plant safety operations."),
        (13, "User & Roles", "Temporary Password – Copy button is not working.",
         "Minor friction: Admins can manually select and copy text via keyboard shortcuts."),
        (14, "Download", "A Download option is required/available for downloading the details, but its expected behavior should be verified.",
         "Requirement clarification / UX enhancement for standardizing export formats (PDF/Excel)."),
        (19, "Permit Page – Back", "The Permit page does not have a Back button.",
         "Browser back button serves as fallback; dedicated in-app breadcrumb navigation recommended."),
        (20, "Permit Creation – Next", "After entering Basic Information, the Next button does not respond on the first click. The user has to click it again.",
         "Debounce or asynchronous form-state validation lag causes double-click requirement.")
    ]

    # Helper table generator
    def generate_table(items, badge_text, badge_style, header_bg):
        table_data = [
            [
                Paragraph("<b>#</b>", cell_hdr),
                Paragraph("<b>Module</b>", cell_hdr),
                Paragraph("<b>Defect Description</b>", cell_hdr),
                Paragraph("<b>Severity & Impact Rationale</b>", cell_hdr),
                Paragraph("<b>Pri</b>", cell_hdr)
            ]
        ]
        for it in items:
            table_data.append([
                Paragraph(str(it[0]), cell_bold),
                Paragraph(it[1], cell_bold),
                Paragraph(it[2], cell_text),
                Paragraph(it[3], cell_text),
                Paragraph(badge_text, badge_style)
            ])
        
        t = Table(table_data, colWidths=[24, 96, 190, 196, 34])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), header_bg),
            ('ALIGN', (0,0), (0,-1), 'CENTER'),
            ('ALIGN', (4,0), (4,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E0")),
            ('PADDING', (0,0), (-1,-1), 4.5),
        ]))
        return t

    # SECTION 1: P0
    story.append(Paragraph("<b>1. Priority 0 (P0) — Critical Blockers & Safety / Compliance Violations</b>", sec_title))
    story.append(Paragraph("<i>Definition: System-critical failures that halt essential business operations, block core safety isolations (LOTO), prevent incident logging, or directly breach Segregation of Duties. Requires immediate emergency hotfix.</i>", body_style))
    story.append(Spacer(1, 6))
    story.append(generate_table(p0_items, "P0", p0_badge, colors.HexColor("#9B2C2C")))
    story.append(Spacer(1, 14))

    # SECTION 2: P1
    story.append(Paragraph("<b>2. Priority 1 (P1) — Major Functional Deficiencies & Blocked Workflows</b>", sec_title))
    story.append(Paragraph("<i>Definition: High-impact functional defects where key features fail (evidence viewing, CAPA assignment, template authoring, approval notifications) without an intuitive workaround. Must be addressed in current release cycle.</i>", body_style))
    story.append(Spacer(1, 6))
    story.append(generate_table(p1_items, "P1", p1_badge, colors.HexColor("#C05621")))
    story.append(Spacer(1, 14))

    # SECTION 3: P2
    story.append(Paragraph("<b>3. Priority 2 (P2) — Minor Bugs, UI Inconsistencies & UX Friction</b>", sec_title))
    story.append(Paragraph("<i>Definition: Low severity defects with available workarounds, cosmetic discrepancies, click timing delays, or requirement clarifications. Scheduled for subsequent sprint cycles.</i>", body_style))
    story.append(Spacer(1, 6))
    story.append(generate_table(p2_items, "P2", p2_badge, colors.HexColor("#2B6CB0")))
    story.append(Spacer(1, 14))

    # Recommended Action Plan Table
    rec_title = ParagraphStyle(
        'RecTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#1A365D"),
        spaceBefore=6,
        spaceAfter=4
    )
    story.append(KeepTogether([
        Paragraph("<b>Recommended Remediation Timeline & SLA</b>", rec_title),
        Table([
            [Paragraph("<b>Level</b>", cell_hdr), Paragraph("<b>SLA Target</b>", cell_hdr), Paragraph("<b>Action Items</b>", cell_hdr)],
            [Paragraph("<b>P0 Critical</b>", p0_badge), Paragraph("&lt; 24 Hours", cell_text), Paragraph("Investigate API gateway/auth tokens, enforce RBAC Permit Approval matrix, unblock LOTO file upload & attachment endpoints.", cell_text)],
            [Paragraph("<b>P1 Major</b>", p1_badge), Paragraph("2 - 3 Days", cell_text), Paragraph("Fix modal triggers for Root Cause/CAPA, restore incident routing, repair deep-links in notifications, add step navigation.", cell_text)],
            [Paragraph("<b>P2 Minor</b>", p2_badge), Paragraph("Sprint Backlog", cell_text), Paragraph("Resolve machinery dropdown initial fetch timing, fix clipboard API handler, optimize Next button event listeners.", cell_text)]
        ], colWidths=[80, 80, 380], style=[
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2D3748")),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E0")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('PADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ])
    ]))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated: {filename}")

if __name__ == "__main__":
    target = os.path.abspath("Issue_Prioritization_P0_P1_P2.pdf")
    build_pdf(target)
