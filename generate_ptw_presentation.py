import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def build_perfect_presentation(output_path):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Clean executive color palette
    COLOR_BG = RGBColor(248, 250, 252)          # Light slate #f8fafc
    COLOR_WHITE = RGBColor(255, 255, 255)
    COLOR_NAVY = RGBColor(15, 23, 42)           # Slate-900 typography
    COLOR_BODY = RGBColor(51, 65, 85)           # Slate-700
    COLOR_TEAL = RGBColor(14, 116, 144)         # Deep cyan
    COLOR_TEAL_BG = RGBColor(240, 249, 255)     # #f0f9ff
    COLOR_BORDER = RGBColor(203, 213, 225)      # Slate-300
    COLOR_ALERT = RGBColor(225, 29, 72)         # Crimson
    COLOR_ALERT_BG = RGBColor(255, 241, 242)    # Soft red
    COLOR_AMBER = RGBColor(217, 119, 6)         # Amber

    def apply_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = COLOR_BG
        bg.line.fill.background()
        return bg

    def add_header(slide, number_str, title_text, key_message):
        # Title (32pt bold)
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.35), Inches(11.733), Inches(0.55))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0
        p = tf.paragraphs[0]
        p.text = f"{number_str}. {title_text}"
        p.font.name = "Arial"
        p.font.size = Pt(32)
        p.font.bold = True
        p.font.color.rgb = COLOR_NAVY

        # Subtitle Key Message (15pt bold)
        mb = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.98), Inches(11.733), Inches(0.48))
        mb.fill.solid()
        mb.fill.fore_color.rgb = COLOR_TEAL_BG
        mb.line.color.rgb = RGBColor(186, 230, 253)
        mb.line.width = Pt(1.5)
        
        mtf = mb.text_frame
        mtf.word_wrap = True
        mtf.vertical_anchor = MSO_ANCHOR.MIDDLE
        mtf.margin_left = Inches(0.2)
        mtf.margin_right = Inches(0.2)
        mtf.margin_top = mtf.margin_bottom = 0
        mp = mtf.paragraphs[0]
        mp.text = f"KEY MESSAGE:  {key_message}"
        mp.font.name = "Arial"
        mp.font.size = Pt(15)
        mp.font.bold = True
        mp.font.color.rgb = COLOR_TEAL

    def add_takeaway(slide, text):
        tb = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.65), Inches(11.733), Inches(0.48))
        tb.fill.solid()
        tb.fill.fore_color.rgb = COLOR_WHITE
        tb.line.color.rgb = COLOR_BORDER
        tb.line.width = Pt(1.5)
        
        tf = tb.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf.margin_left = Inches(0.2)
        tf.margin_right = Inches(0.2)
        tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = f"OPERATIONAL TAKEAWAY:  {text}"
        p.font.name = "Arial"
        p.font.size = Pt(14.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_NAVY

    # =========================================================================
    # SLIDE 1: WHAT IS THE APPLICATION ABOUT?
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    apply_bg(s1)
    add_header(s1, "1", "What is the Application About?", 
               "A centralized digital platform connecting work authorization, safety, and execution.")

    # 3 Large Cards: AUTHORIZE | CONTROL | MONITOR (Y: 1.62, H: 3.8)
    cols1 = [
        ("AUTHORIZE", RGBColor(2, 132, 199), [
            "Digital Permit Creation",
            "Technical Review Queue",
            "Formal Sign-Off Approval",
            "Authorized Work Execution"
        ]),
        ("CONTROL", RGBColor(14, 116, 144), [
            "LOTOTO Energy Isolation",
            "Gas Testing (LEL & O2)",
            "Toolbox Safety Talks (TBT)",
            "Verified Site Handback & Close"
        ]),
        ("MONITOR", RGBColor(79, 70, 229), [
            "SIMOPS Clash Detection",
            "Live Plant Worksite Map",
            "Incident & Near-Miss Log",
            "100% Audit-Ready Analytics"
        ])
    ]
    card_w = Inches(3.72)
    card_gap = Inches(0.28)
    card_y = Inches(1.62)
    card_h = Inches(3.85)

    for i, (col_title, col_color, col_points) in enumerate(cols1):
        cx = Inches(0.8) + i * (card_w + card_gap)
        
        # Main white card
        card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, card_y, card_w, card_h)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_WHITE
        card.line.color.rgb = col_color
        card.line.width = Pt(2)

        # Header bar on top
        hbar = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, card_y, card_w, Inches(0.65))
        hbar.fill.solid()
        hbar.fill.fore_color.rgb = col_color
        hbar.line.fill.background()
        htf = hbar.text_frame
        htf.vertical_anchor = MSO_ANCHOR.MIDDLE
        htf.margin_top = htf.margin_bottom = htf.margin_left = htf.margin_right = 0
        hp = htf.paragraphs[0]
        hp.text = col_title
        hp.font.name = "Arial"
        hp.font.size = Pt(20)
        hp.font.bold = True
        hp.font.color.rgb = COLOR_WHITE
        hp.alignment = PP_ALIGN.CENTER

        # Text box placed cleanly inside the card BELOW the header
        tb = s1.shapes.add_textbox(cx + Inches(0.2), card_y + Inches(0.75), card_w - Inches(0.4), card_h - Inches(0.85))
        ctf = tb.text_frame
        ctf.word_wrap = True
        ctf.margin_top = ctf.margin_bottom = ctf.margin_left = ctf.margin_right = 0

        for p_idx, pt_text in enumerate(col_points):
            p = ctf.paragraphs[0] if p_idx == 0 else ctf.add_paragraph()
            p.text = f"•  {pt_text}"
            p.font.name = "Arial"
            p.font.size = Pt(17)
            p.font.color.rgb = COLOR_BODY
            p.space_before = Pt(16)

    # Roles Bar (Y: 5.65, H: 0.8)
    r_box = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.65), Inches(11.733), Inches(0.82))
    r_box.fill.solid()
    r_box.fill.fore_color.rgb = COLOR_WHITE
    r_box.line.color.rgb = COLOR_BORDER
    r_box.line.width = Pt(1.5)

    rtf = r_box.text_frame
    rtf.word_wrap = True
    rtf.vertical_anchor = MSO_ANCHOR.MIDDLE
    rtf.margin_left = Inches(0.2)
    rtf.margin_right = Inches(0.2)
    rtf.margin_top = rtf.margin_bottom = 0

    rp1 = rtf.paragraphs[0]
    rp1.text = "SIX ACCOUNTABLE ROLES (NO BLIND SPOTS)"
    rp1.font.name = "Arial"
    rp1.font.size = Pt(13)
    rp1.font.bold = True
    rp1.font.color.rgb = COLOR_TEAL
    rp1.alignment = PP_ALIGN.CENTER

    rp2 = rtf.add_paragraph()
    rp2.text = "Platform Admin   |   Org Admin   |   Job Issuer   |   Safety Officer   |   Operator   |   Viewer"
    rp2.font.name = "Arial"
    rp2.font.size = Pt(17)
    rp2.font.bold = True
    rp2.font.color.rgb = COLOR_NAVY
    rp2.alignment = PP_ALIGN.CENTER
    rp2.space_before = Pt(3)

    add_takeaway(s1, "PTW acts as the central operational record connecting work authorization, safety controls, execution, and closure.")

    # =========================================================================
    # SLIDE 2: FEATURES OF THE APPLICATION
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    apply_bg(s2)
    add_header(s2, "2", "Features of the Application", 
               "Four core business functional groups delivering complete operational control.")

    card2_w = Inches(5.72)
    card2_h = Inches(2.28)
    gap2_x = Inches(0.29)
    gap2_y = Inches(0.2)
    start2_y = Inches(1.62)

    f_groups = [
        ("1. WORK AUTHORIZATION", COLOR_TEAL, [
            "Permit Creation & Draft Management",
            "Online Submission to Area Engineer Queues",
            "Approve, Defer & Resubmit Decision Flow"
        ]),
        ("2. SAFETY & OPERATIONAL CONTROL", RGBColor(185, 28, 28), [
            "LOTOTO Isolation Plans & Lock Padlock Logs",
            "SIMOPS Real-Time Conflict Screening",
            "Incident, Near-Miss & Unsafe Condition Logs"
        ]),
        ("3. WORK EXECUTION & TRACEABILITY", RGBColor(5, 150, 105), [
            "Authorized Work Execution & Shift Notes",
            "Site Photo & Document Evidence Upload",
            "Suspend Work & Final Verified Site Handback"
        ]),
        ("4. MANAGEMENT & VISIBILITY", RGBColor(79, 70, 229), [
            "Workforce Roles & Competencies Tracking",
            "Real-Time Operational KPIs & Dashboards",
            "Audit Reports, CSV Exports & Subscriptions"
        ])
    ]

    for i, (g_title, g_color, g_items) in enumerate(f_groups):
        row = i // 2
        col = i % 2
        gx = Inches(0.8) + col * (card2_w + gap2_x)
        gy = start2_y + row * (card2_h + gap2_y)

        c = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, gx, gy, card2_w, card2_h)
        c.fill.solid()
        c.fill.fore_color.rgb = COLOR_WHITE
        c.line.color.rgb = g_color
        c.line.width = Pt(2)

        # Header tag
        th = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, gx, gy, card2_w, Inches(0.55))
        th.fill.solid()
        th.fill.fore_color.rgb = g_color
        th.line.fill.background()
        th_tf = th.text_frame
        th_tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        th_tf.margin_top = th_tf.margin_bottom = th_tf.margin_left = th_tf.margin_right = 0
        tp = th_tf.paragraphs[0]
        tp.text = g_title
        tp.font.name = "Arial"
        tp.font.size = Pt(17.5)
        tp.font.bold = True
        tp.font.color.rgb = COLOR_WHITE
        tp.alignment = PP_ALIGN.CENTER

        # Body text box
        tb = s2.shapes.add_textbox(gx + Inches(0.25), gy + Inches(0.62), card2_w - Inches(0.5), card2_h - Inches(0.7))
        ctf = tb.text_frame
        ctf.word_wrap = True
        ctf.margin_top = ctf.margin_bottom = ctf.margin_left = ctf.margin_right = 0

        for p_idx, itm in enumerate(g_items):
            p = ctf.paragraphs[0] if p_idx == 0 else ctf.add_paragraph()
            p.text = f"•  {itm}"
            p.font.name = "Arial"
            p.font.size = Pt(16.5)
            p.font.color.rgb = COLOR_BODY
            p.space_before = Pt(10)

    # Bottom summary tag (Y: 6.4)
    sum_box = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.32), Inches(11.733), Inches(0.26))
    sum_box.fill.solid()
    sum_box.fill.fore_color.rgb = COLOR_BG
    sum_box.line.fill.background()

    add_takeaway(s2, "One platform → From work authorization to operational reporting.")

    # =========================================================================
    # SLIDE 3: WHY IS THIS APPLICATION REQUIRED?
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    apply_bg(s3)
    add_header(s3, "3", "Why is this Application Required?", 
               "Provides a structured digital process to support safer, accountable, and more controlled operations.")

    # Top Comparison Cards (Y: 1.62, H: 2.05)
    # Left: Without Control
    c_bad = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.62), Inches(5.72), Inches(2.05))
    c_bad.fill.solid()
    c_bad.fill.fore_color.rgb = COLOR_ALERT_BG
    c_bad.line.color.rgb = RGBColor(254, 205, 211)
    c_bad.line.width = Pt(2)

    btf = c_bad.text_frame
    btf.word_wrap = True
    btf.margin_top = Inches(0.18)
    btf.margin_left = Inches(0.3)
    btf.margin_right = Inches(0.3)

    bp1 = btf.paragraphs[0]
    bp1.text = "WITHOUT CENTRALIZED CONTROL"
    bp1.font.name = "Arial"
    bp1.font.size = Pt(19)
    bp1.font.bold = True
    bp1.font.color.rgb = COLOR_ALERT

    bp2 = btf.add_paragraph()
    bp2.text = "•  Fragmented Work Information (Paper binders & emails)\n•  Limited Plant-Wide Visibility for Area Supervisors\n•  Higher Risk of Conflicting Trades & Severe Accidents"
    bp2.font.name = "Arial"
    bp2.font.size = Pt(16)
    bp2.font.color.rgb = COLOR_NAVY
    bp2.space_before = Pt(8)

    # Right: With PTW Application
    c_good = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.81), Inches(1.62), Inches(5.72), Inches(2.05))
    c_good.fill.solid()
    c_good.fill.fore_color.rgb = COLOR_TEAL_BG
    c_good.line.color.rgb = RGBColor(186, 230, 253)
    c_good.line.width = Pt(2)

    gtf = c_good.text_frame
    gtf.word_wrap = True
    gtf.margin_top = Inches(0.18)
    gtf.margin_left = Inches(0.3)
    gtf.margin_right = Inches(0.3)

    gp1 = gtf.paragraphs[0]
    gp1.text = "WITH PTW APPLICATION"
    gp1.font.name = "Arial"
    gp1.font.size = Pt(19)
    gp1.font.bold = True
    gp1.font.color.rgb = COLOR_TEAL

    gp2 = gtf.add_paragraph()
    gp2.text = "•  Structured Authorization Enforced Before Work Starts\n•  Active Safety Controls (LOTOTO Isolation & SIMOPS)\n•  Full Live Tracking, Traceability & Corporate Audit Logs"
    gp2.font.name = "Arial"
    gp2.font.size = Pt(16)
    gp2.font.color.rgb = COLOR_NAVY
    gp2.space_before = Pt(8)

    # Bottom 6 Business Outcomes (2 rows x 3 columns) (Y: 3.82, H: 1.25)
    outcomes = [
        ("1. CONTROLLED WORK", "Structured lifecycle before & during work."),
        ("2. SAFER OPERATIONS", "Built-in LOTOTO isolation & SIMOPS screening."),
        ("3. CLEAR ACCOUNTABILITY", "Role-based ownership for all approvals & tasks."),
        ("4. OPERATIONAL VISIBILITY", "Single live dashboard for permits and hazards."),
        ("5. FULL TRACEABILITY", "Progress notes, photo evidence & closed records."),
        ("6. DATA-DRIVEN MANAGEMENT", "Live safety KPIs, trend insights & reports.")
    ]

    card3_w = Inches(3.72)
    card3_h = Inches(1.22)
    gap3_x = Inches(0.28)
    gap3_y = Inches(0.14)
    start3_y = Inches(3.85)

    for idx, (ot_title, ot_desc) in enumerate(outcomes):
        r = idx // 3
        c = idx % 3
        ox = Inches(0.8) + c * (card3_w + gap3_x)
        oy = start3_y + r * (card3_h + gap3_y)

        obox = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, ox, oy, card3_w, card3_h)
        obox.fill.solid()
        obox.fill.fore_color.rgb = COLOR_WHITE
        obox.line.color.rgb = COLOR_BORDER
        obox.line.width = Pt(1.5)

        otf = obox.text_frame
        otf.word_wrap = True
        otf.margin_top = Inches(0.14)
        otf.margin_left = Inches(0.18)
        otf.margin_right = Inches(0.18)

        op1 = otf.paragraphs[0]
        op1.text = ot_title
        op1.font.name = "Arial"
        op1.font.size = Pt(15.5)
        op1.font.bold = True
        op1.font.color.rgb = COLOR_TEAL

        op2 = otf.add_paragraph()
        op2.text = ot_desc
        op2.font.name = "Arial"
        op2.font.size = Pt(14)
        op2.font.color.rgb = COLOR_BODY
        op2.space_before = Pt(3)

    add_takeaway(s3, "Provides a structured digital process to support safer, accountable, and more controlled operations.")

    # =========================================================================
    # SLIDE 4: END-TO-END APPLICATION WORKFLOW
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    apply_bg(s4)
    add_header(s4, "4", "End-to-End Application Workflow", 
               "Clear 8-stage lifecycle from draft permit creation to final verified closure.")

    # Status Track Bar (Y: 1.6, H: 0.52)
    st_bar = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.58), Inches(11.733), Inches(0.52))
    st_bar.fill.solid()
    st_bar.fill.fore_color.rgb = COLOR_NAVY
    st_bar.line.fill.background()
    
    stf = st_bar.text_frame
    stf.word_wrap = True
    stf.vertical_anchor = MSO_ANCHOR.MIDDLE
    stf.margin_left = Inches(0.2)
    stf.margin_top = stf.margin_bottom = 0
    stp = stf.paragraphs[0]
    stp.text = "LIFECYCLE STATUSES:   DRAFT  →  PENDING APPROVAL  →  APPROVED  →  EXECUTION  →  CLOSED"
    stp.font.name = "Arial"
    stp.font.size = Pt(16)
    stp.font.bold = True
    stp.font.color.rgb = COLOR_WHITE
    stp.alignment = PP_ALIGN.CENTER

    stages_row1 = [
        ("1", "CREATE", "Permit Draft", "Select Work Type\n(Hot, Cold, Space)"),
        ("2", "PLAN", "Scope & Crew", "Location, Schedule\n& Assigned Crew"),
        ("3", "SUBMIT", "Review & Send", "Review Details &\nRoute to Queue"),
        ("4", "APPROVE", "Approval Queue", "APPROVE or DEFER\n(Clarification loop)")
    ]
    stages_row2 = [
        ("5", "CONTROL", "Safety Gates", "LOTOTO Isolation\n& SIMOPS Check"),
        ("6", "EXECUTE", "Active Work", "Field Execution &\nProgress Evidence"),
        ("7", "VERIFY", "Site Handback", "Remove Isolations\n& Verify Close"),
        ("8", "ARCHIVE", "Historical Log", "Audit Archive &\nSafety Analytics")
    ]

    s_w = Inches(2.78)
    s_h = Inches(1.7)
    s_gap = Inches(0.2)

    # Row 1 (Stages 1-4)
    for idx, (num, name, subtitle, desc) in enumerate(stages_row1):
        sx = Inches(0.8) + idx * (s_w + s_gap)
        sy = Inches(2.24)

        sbox = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, sx, sy, s_w, s_h)
        sbox.fill.solid()
        sbox.fill.fore_color.rgb = COLOR_WHITE
        sbox.line.color.rgb = COLOR_TEAL if num != "4" else COLOR_AMBER
        sbox.line.width = Pt(2)

        badge = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, sx, sy, s_w, Inches(0.48))
        badge.fill.solid()
        badge.fill.fore_color.rgb = COLOR_TEAL if num != "4" else COLOR_AMBER
        badge.line.fill.background()
        btf = badge.text_frame
        btf.vertical_anchor = MSO_ANCHOR.MIDDLE
        btf.margin_top = btf.margin_bottom = btf.margin_left = btf.margin_right = 0
        bp = btf.paragraphs[0]
        bp.text = f"STAGE {num}: {name}"
        bp.font.name = "Arial"
        bp.font.size = Pt(16)
        bp.font.bold = True
        bp.font.color.rgb = COLOR_WHITE
        bp.alignment = PP_ALIGN.CENTER

        tb = s4.shapes.add_textbox(sx + Inches(0.1), sy + Inches(0.52), s_w - Inches(0.2), s_h - Inches(0.56))
        stf = tb.text_frame
        stf.word_wrap = True
        stf.margin_top = stf.margin_bottom = stf.margin_left = stf.margin_right = 0

        p1 = stf.paragraphs[0]
        p1.text = subtitle
        p1.font.name = "Arial"
        p1.font.size = Pt(15.5)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_NAVY
        p1.alignment = PP_ALIGN.CENTER

        p2 = stf.add_paragraph()
        p2.text = desc
        p2.font.name = "Arial"
        p2.font.size = Pt(14)
        p2.font.color.rgb = COLOR_BODY
        p2.alignment = PP_ALIGN.CENTER
        p2.space_before = Pt(4)

    # Middle branching alert
    branch_note = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.06), Inches(11.733), Inches(0.44))
    branch_note.fill.solid()
    branch_note.fill.fore_color.rgb = RGBColor(254, 243, 199)
    branch_note.line.color.rgb = RGBColor(252, 211, 77)
    branch_note.line.width = Pt(1)
    bntf = branch_note.text_frame
    bntf.vertical_anchor = MSO_ANCHOR.MIDDLE
    bntf.margin_top = bntf.margin_bottom = bntf.margin_left = bntf.margin_right = 0
    bnp = bntf.paragraphs[0]
    bnp.text = "STAGE 4 APPROVAL BRANCHING:  APPROVED (Proceed to Controls)   ⇄   DEFERRED (Need Clarification → Resubmit)"
    bnp.font.name = "Arial"
    bnp.font.size = Pt(14.5)
    bnp.font.bold = True
    bnp.font.color.rgb = RGBColor(180, 83, 9)
    bnp.alignment = PP_ALIGN.CENTER

    # Row 2 (Stages 5-8)
    for idx, (num, name, subtitle, desc) in enumerate(stages_row2):
        sx = Inches(0.8) + idx * (s_w + s_gap)
        sy = Inches(4.62)

        sbox = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, sx, sy, s_w, s_h)
        sbox.fill.solid()
        sbox.fill.fore_color.rgb = COLOR_WHITE
        sbox.line.color.rgb = COLOR_TEAL
        sbox.line.width = Pt(2)

        badge = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, sx, sy, s_w, Inches(0.48))
        badge.fill.solid()
        badge.fill.fore_color.rgb = COLOR_TEAL
        badge.line.fill.background()
        btf = badge.text_frame
        btf.vertical_anchor = MSO_ANCHOR.MIDDLE
        btf.margin_top = btf.margin_bottom = btf.margin_left = btf.margin_right = 0
        bp = btf.paragraphs[0]
        bp.text = f"STAGE {num}: {name}"
        bp.font.name = "Arial"
        bp.font.size = Pt(16)
        bp.font.bold = True
        bp.font.color.rgb = COLOR_WHITE
        bp.alignment = PP_ALIGN.CENTER

        tb = s4.shapes.add_textbox(sx + Inches(0.1), sy + Inches(0.52), s_w - Inches(0.2), s_h - Inches(0.56))
        stf = tb.text_frame
        stf.word_wrap = True
        stf.margin_top = stf.margin_bottom = stf.margin_left = stf.margin_right = 0

        p1 = stf.paragraphs[0]
        p1.text = subtitle
        p1.font.name = "Arial"
        p1.font.size = Pt(15.5)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_NAVY
        p1.alignment = PP_ALIGN.CENTER

        p2 = stf.add_paragraph()
        p2.text = desc
        p2.font.name = "Arial"
        p2.font.size = Pt(14)
        p2.font.color.rgb = COLOR_BODY
        p2.alignment = PP_ALIGN.CENTER
        p2.space_before = Pt(4)

    add_takeaway(s4, "Permit is the central record connecting authorization, safety controls, execution, and closure.")

    # =========================================================================
    # SLIDE 5: SIMOPS & SAFETY INCIDENT PROTOCOL
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    apply_bg(s5)
    add_header(s5, "5", "SIMOPS & Safety Incident Protocol", 
               "Proactive conflict monitoring and rapid incident management across active work.")

    card5_w = Inches(5.72)
    card5_h = Inches(4.25)
    card5_y = Inches(1.62)

    # Left Card: SIMOPS
    s_left = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), card5_y, card5_w, card5_h)
    s_left.fill.solid()
    s_left.fill.fore_color.rgb = COLOR_WHITE
    s_left.line.color.rgb = COLOR_TEAL
    s_left.line.width = Pt(2.5)

    # Left Header Banner
    lh = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), card5_y, card5_w, Inches(0.62))
    lh.fill.solid()
    lh.fill.fore_color.rgb = COLOR_TEAL
    lh.line.fill.background()
    lhtf = lh.text_frame
    lhtf.vertical_anchor = MSO_ANCHOR.MIDDLE
    lhtf.margin_top = lhtf.margin_bottom = lhtf.margin_left = lhtf.margin_right = 0
    lhp = lhtf.paragraphs[0]
    lhp.text = "SIMOPS (SIMULTANEOUS OPERATIONS)"
    lhp.font.name = "Arial"
    lhp.font.size = Pt(18)
    lhp.font.bold = True
    lhp.font.color.rgb = COLOR_WHITE
    lhp.alignment = PP_ALIGN.CENTER

    # Left Text Body Box
    ltb = s5.shapes.add_textbox(Inches(1.05), card5_y + Inches(0.72), card5_w - Inches(0.5), card5_h - Inches(0.8))
    ltf = ltb.text_frame
    ltf.word_wrap = True
    ltf.margin_top = ltf.margin_bottom = ltf.margin_left = ltf.margin_right = 0

    lp_sub = ltf.paragraphs[0]
    lp_sub.text = "Identifies potential conflicts between simultaneous work activities."
    lp_sub.font.name = "Arial"
    lp_sub.font.size = Pt(15.5)
    lp_sub.font.bold = True
    lp_sub.font.color.rgb = COLOR_NAVY

    simops_points = [
        "Active Permits Scan: Continuously checks all active plant work",
        "4 Check Vectors: Location, Equipment, Schedule & Permit Type",
        "Clash Detection: Automatically flags overlapping jobs",
        "Severity Levels: Categorized as High, Medium, or Low risk",
        "Live Dashboard: Visual alerts for immediate operational review"
    ]
    for pt in simops_points:
        p = ltf.add_paragraph()
        p.text = f"•  {pt}"
        p.font.name = "Arial"
        p.font.size = Pt(15.5)
        p.font.color.rgb = COLOR_BODY
        p.space_before = Pt(10)

    # Right Card: Safety Incident Protocol
    s_right = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.81), card5_y, card5_w, card5_h)
    s_right.fill.solid()
    s_right.fill.fore_color.rgb = COLOR_WHITE
    s_right.line.color.rgb = COLOR_ALERT
    s_right.line.width = Pt(2.5)

    # Right Header Banner
    rh = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.81), card5_y, card5_w, Inches(0.62))
    rh.fill.solid()
    rh.fill.fore_color.rgb = COLOR_ALERT
    rh.line.fill.background()
    rhtf = rh.text_frame
    rhtf.vertical_anchor = MSO_ANCHOR.MIDDLE
    rhtf.margin_top = rhtf.margin_bottom = rhtf.margin_left = rhtf.margin_right = 0
    rhp = rhtf.paragraphs[0]
    rhp.text = "SAFETY INCIDENT PROTOCOL"
    rhp.font.name = "Arial"
    rhp.font.size = Pt(18)
    rhp.font.bold = True
    rhp.font.color.rgb = COLOR_WHITE
    rhp.alignment = PP_ALIGN.CENTER

    # Right Text Body Box
    rtb = s5.shapes.add_textbox(Inches(7.06), card5_y + Inches(0.72), card5_w - Inches(0.5), card5_h - Inches(0.8))
    rtf = rtb.text_frame
    rtf.word_wrap = True
    rtf.margin_top = rtf.margin_bottom = rtf.margin_left = rtf.margin_right = 0

    rp_sub = rtf.paragraphs[0]
    rp_sub.text = "Structured recording and tracking of all worksite safety events."
    rp_sub.font.name = "Arial"
    rp_sub.font.size = Pt(15.5)
    rp_sub.font.bold = True
    rp_sub.font.color.rgb = COLOR_NAVY

    incident_points = [
        "3 Event Types: Incidents, Near Misses & Unsafe Conditions",
        "Immediate Report: Type, Title, Location, Time & Linked Permit",
        "Field Escalation: Instant submission to plant safety register",
        "Status Lifecycle: Transparent Open → Pending → Closed flow",
        "Full Traceability: Correlates events to permits for audit review"
    ]
    for pt in incident_points:
        p = rtf.add_paragraph()
        p.text = f"•  {pt}"
        p.font.name = "Arial"
        p.font.size = Pt(15.5)
        p.font.color.rgb = COLOR_BODY
        p.space_before = Pt(10)

    # Bottom Integrated Banner (Y: 6.0, H: 0.5)
    b_integ = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.02), Inches(11.733), Inches(0.5))
    b_integ.fill.solid()
    b_integ.fill.fore_color.rgb = COLOR_WHITE
    b_integ.line.color.rgb = COLOR_BORDER
    b_integ.line.width = Pt(1.5)

    itf = b_integ.text_frame
    itf.word_wrap = True
    itf.vertical_anchor = MSO_ANCHOR.MIDDLE
    itf.margin_left = Inches(0.2)
    itf.margin_right = Inches(0.2)
    itf.margin_top = itf.margin_bottom = 0
    ip = itf.paragraphs[0]
    ip.text = "PTW PLATFORM:   SIMOPS (Conflict Monitoring)   +   INCIDENTS (Safety Event Tracking)"
    ip.font.name = "Arial"
    ip.font.size = Pt(16)
    ip.font.bold = True
    ip.font.color.rgb = COLOR_NAVY
    ip.alignment = PP_ALIGN.CENTER

    add_takeaway(s5, "Together, SIMOPS and incident management strengthen operational visibility around active work.")

    prs.save(output_path)
    print(f"Presentation saved to: {output_path}")

if __name__ == "__main__":
    out_local = os.path.abspath("PTW_Application_Meeting_Presentation.pptx")
    build_perfect_presentation(out_local)
