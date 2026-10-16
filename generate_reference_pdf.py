import os
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

issues_data = [
    (1, "Request Access", 'Request Access cannot be submitted. Warning shows: "We couldn\'t reach the server. Check your connection and send the form again."', "Request Access form should submit successfully without connection errors", "P0", "[New]"),
    (2, "LOTO", "File/evidence cannot be uploaded in the Lockout/Tagout field.", "File/evidence should upload successfully in the LOTO field", "P0", "[Related - PTW-023]"),
    (3, "Permit Templates", "Add Section is not working when creating/editing a permit template.", "Add Section button should create a new section in the template", "P1", "[New]"),
    (4, "Permit Creation", "Machinery does not appear in the dropdown initially. It appears only after refreshing the application.", "Machinery dropdown should load immediately without requiring page refresh", "P1", "[Same - PTW-058]"),
    (5, "Incident Management", 'Chat Admin cannot report an incident. Warning shows: "Validation failed, UUID expired."', "Incidents should be reported successfully without UUID expiration error", "P0", "[New]"),
    (6, "Permit Permissions", "Org Admin can perform multiple permit actions—fill permit details, submit, approve, and start work.", "Role-based permissions should enforce Segregation of Duties", "P0", "[New]"),
    (7, "Notifications", "Permit approval notification appears in Messages, but clicking it does not open the specific permit; it opens/shows all permits.", "Clicking notification should open the specific permit directly", "P1", "[New]"),
    (8, "Permit Creation - LOTO", "Add Lockout/Tagout is not working while creating a permit.", "Add Lockout/Tagout should work and attach isolations to the permit", "P0", "[Related - PTW-021]"),
    (9, "Permit Closure - Evidence", 'After adding evidence during permit closure, "Authentication required" is displayed.', "Evidence should submit without authentication error to allow closure", "P0", "[New]"),
    (10, "Profile", "Profile picture cannot be removed, and the selected profile picture does not display.", "Selected picture should display, and remove option should be available", "P2", "[Same - PTW-036]"),
    (11, "Evidence", "Uploaded evidence cannot be opened/viewed.", "Uploaded evidence files/images should open and view properly", "P1", "[Same - PTW-063]"),
    (12, "HOD Notification", "HOD does not receive a notification when the Job Issuer submits a permit and HOD approval is the next step.", "HOD should receive notification when permit requires approval", "P1", "[Same - PTW-059]"),
    (13, "User & Roles", "Temporary Password - Copy button is not working.", "Temporary password should be copied to clipboard successfully", "P1", "[Same - PTW-005]"),
    (14, "Download", "A Download option is required/available for downloading the details, but its expected behavior should be verified.", "Download option should export permit/incident details properly", "P2", "[New]"),
    (15, "Incident - Root Cause", "Clicking Record Root Cause for an unsafe incident does not open the expected popup/form.", "Record Root Cause button should open the investigation form", "P1", "[New]"),
    (16, "Incident - Corrective Action", "Clicking Corrective Action does not open the expected popup/form.", "Corrective Action button should open the CAPA action form", "P1", "[New]"),
    (17, "Incident - Assign", 'In Manager Incidents, clicking Assign results in "Unable to load page."', "Assign button should open assignment screen/modal without error", "P1", "[New]"),
    (18, "Permit Creation - Back", "There is no Back button while creating a permit.", "Back button should be available on each permit creation step", "P2", "[Same - PTW-027]"),
    (19, "Permit Page - Back", "The Permit page does not have a Back button.", "Back button should be available on the Permit page", "P2", "[Same - PTW-002]"),
    (20, "Permit Creation - Next", "After entering Basic Information, the Next button does not respond on the first click. The user has to click it again.", "Next button should respond and navigate immediately on first click", "P2", "[New]")
]

def generate_compact_one_page_pdf(filename):
    # Landscape Letter: 792 x 612 pt
    # Top/Bottom margins = 16 pt, Left/Right = 20 pt
    # Available height = 612 - 32 = 580 pt
    # 21 rows (1 header + 20 items) -> avg ~26 pt per row fits comfortably in 1 single page!
    doc = SimpleDocTemplate(
        filename,
        pagesize=landscape(letter),
        leftMargin=20,
        rightMargin=20,
        topMargin=16,
        bottomMargin=16
    )

    styles = getSampleStyleSheet()

    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.black,
        alignment=1
    )

    cell_no = ParagraphStyle(
        'CellNo',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.black,
        alignment=1
    )

    cell_module = ParagraphStyle(
        'CellModule',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.black
    )

    cell_body = ParagraphStyle(
        'CellBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.black
    )

    cell_priority = ParagraphStyle(
        'CellPriority',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.black,
        alignment=1
    )

    cell_status = ParagraphStyle(
        'CellStatus',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.black
    )

    table_data = [
        [
            Paragraph("<b>No.</b>", header_style),
            Paragraph("<b>Module</b>", header_style),
            Paragraph("<b>Bug / Issue</b>", header_style),
            Paragraph("<b>Expected Result</b>", header_style),
            Paragraph("<b>Priority</b>", header_style),
            Paragraph("<b>Status</b>", header_style),
        ]
    ]

    for item in issues_data:
        no_val, module_val, issue_val, expected_val, priority_val, status_val = item
        table_data.append([
            Paragraph(str(no_val), cell_no),
            Paragraph(module_val, cell_module),
            Paragraph(issue_val, cell_body),
            Paragraph(expected_val, cell_body),
            Paragraph(priority_val, cell_priority),
            Paragraph(status_val, cell_status)
        ])

    # Printable width: 792 - 40 = 752 pt
    col_widths = [28, 114, 250, 230, 42, 88]

    t = Table(table_data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#EAEAEA")),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#888888")),
        ('PADDING', (0, 0), (-1, -1), 2.2), # very compact, clean padding
        ('TOPPADDING', (0, 0), (-1, 0), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 3.5),
    ]))

    doc.build([t])
    print(f"Generated clean 1-page PDF: {filename}")

if __name__ == "__main__":
    generate_compact_one_page_pdf(os.path.abspath("Issue_Prioritization_Table.pdf"))
