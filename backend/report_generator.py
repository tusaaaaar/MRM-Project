"""
PDF Report Generator for Model Risk Management Audits.
Converts the structured JSON analysis into a printable executive dossier.
"""

from fpdf import FPDF
import datetime

def clean_text(text: str) -> str:
    """Removes unicode characters that crash basic PDF fonts."""
    if not text:
        return ""
    text = str(text)
    replacements = {
        '\u2018': "'", '\u2019': "'", '\u201c': '"', '\u201d': '"',
        '\u2013': '-', '\u2014': '-', '\u2026': '...', '\u00A0': ' ',
    }
    for search, replace in replacements.items():
        text = text.replace(search, replace)
    return text.encode('latin-1', 'replace').decode('latin-1')

class PDFReport(FPDF):
    def header(self):
        self.set_font("helvetica", "B", 16)
        self.set_text_color(15, 23, 42)
        self.cell(0, 10, clean_text("Executive Model Risk & Data Quality Audit"), border=False, align="L")
        self.ln(8) 
        
        self.set_font("helvetica", "I", 10)
        self.set_text_color(100, 116, 139)
        self.cell(0, 10, clean_text(f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d')}"), border=False, align="L")
        self.ln(12) 
        
        self.set_draw_color(226, 232, 240)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("helvetica", "I", 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, clean_text(f"Page {self.page_no()} | Confidential & Proprietary"), align="C")

def generate_executive_pdf(analysis_results: dict) -> str:
    pdf = PDFReport()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    ai_data = analysis_results.get("ai_assessment") or {}
    profile = analysis_results.get("dataset_profile") or {}
    missing_data = analysis_results.get("missing_value_analysis", [])
    outlier_data = analysis_results.get("outlier_analysis", [])

    total_rows = int(profile.get('total_rows') or 0)
    total_cols = int(profile.get('total_columns') or 0)

    # ── SECTION 1: Dataset Profile ──
    pdf.set_font("helvetica", "B", 10)
    pdf.set_text_color(71, 85, 105)
    pdf.cell(0, 6, clean_text(f"DATASET PROFILE: {total_rows:,} Rows | {total_cols:,} Columns"))
    pdf.ln(10)

    # ── SECTION 2: AI Executive Narrative ──
    sections = [
        ("Executive Summary", ai_data.get("executive_summary", "N/A")),
        ("Business Impact", ai_data.get("business_impact", "N/A")),
        ("Risk Implications (SR 11-7)", ai_data.get("risk_implications", "N/A")),
        ("Prioritized Action Plan", ai_data.get("prioritized_action_plan", "N/A"))
    ]

    for title, content in sections:
        pdf.set_font("helvetica", "B", 12)
        pdf.set_text_color(37, 99, 235) 
        pdf.cell(0, 8, clean_text(title))
        pdf.ln(8)
        
        pdf.set_font("helvetica", "", 10)
        pdf.set_text_color(51, 65, 85)
        pdf.multi_cell(0, 5, clean_text(content))
        pdf.ln(6)

    # ── SECTION 3: Intelligent Remediation Strategies ──
    pdf.set_font("helvetica", "B", 14)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 10, clean_text("Targeted Remediation Strategies"))
    pdf.ln(12)
    
    pdf.set_draw_color(226, 232, 240)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(5)
    
    # ── FIX 2: Dynamic Anomaly Context ──
    def get_anomaly_context(col_name):
        if "ID" in col_name.upper() or "DUPLICATE" in col_name.upper():
            return "(Entity Duplication)"
        for m in missing_data:
            if m.get("column") == col_name:
                return f"(Missing Data - {m.get('missing_percentage', 0):.1f}%)"
        for o in outlier_data:
            if o.get("column") == col_name:
                return f"(Statistical Outlier - {o.get('outlier_percentage', 0):.1f}%)"
        return ""

    recs = ai_data.get("ai_recommendations", [])
    if not recs:
        pdf.set_font("helvetica", "I", 10)
        pdf.cell(0, 6, clean_text("No specific AI overrides generated."))
        pdf.ln(6)
    else:
        for rec in recs:
            col_name = rec.get('column', 'Unknown')
            context_tag = get_anomaly_context(col_name)
            
            # This injects the context directly into the header
            header_text = f" Feature: {col_name} {context_tag}".strip()
            
            pdf.set_font("helvetica", "B", 11)
            pdf.set_text_color(15, 23, 42)
            pdf.set_fill_color(241, 245, 249) 
            pdf.cell(0, 8, clean_text(header_text), fill=True)
            pdf.ln(8)
            
            pdf.set_font("helvetica", "B", 9)
            pdf.set_text_color(220, 38, 38) 
            pdf.cell(40, 6, clean_text(f"Risk: {rec.get('risk_impact', 'Unknown')}"))
            
            pdf.set_text_color(16, 185, 129) 
            pdf.cell(60, 6, clean_text(f"AI Confidence: {rec.get('confidence_level', 'Unknown')}"))
            pdf.ln(6)
            
            pdf.set_font("helvetica", "B", 10)
            pdf.set_text_color(37, 99, 235)
            pdf.cell(0, 6, clean_text(f"Strategy: {rec.get('strategy', '')}"))
            pdf.ln(6)
            
            pdf.set_font("helvetica", "", 9)
            pdf.set_text_color(71, 85, 105)
            pdf.multi_cell(0, 5, clean_text(f"Justification:\n{rec.get('justification', '')}"))
            pdf.ln(2)
            
            pdf.set_font("helvetica", "B", 9)
            pdf.multi_cell(0, 5, clean_text(f"Expected Outcome: {rec.get('expected_outcome', '')}"))
            pdf.ln(8)

    # ── SECTION 4: APPENDIX - RAW STATISTICAL EVIDENCE ──
    pdf.add_page()
    pdf.set_font("helvetica", "B", 16)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 10, clean_text("Appendix: Statistical Evidence & Issue Log"))
    pdf.ln(12)

    # 4A. Missing Data Breakdown
    actionable_missing = [m for m in missing_data if m.get("missing_percentage", 0) > 0]
    if actionable_missing:
        pdf.set_font("helvetica", "B", 12)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 8, clean_text("A. Missing Data Breakdown"))
        pdf.ln(8)
        
        pdf.set_font("helvetica", "B", 9)
        pdf.set_text_color(71, 85, 105)
        pdf.cell(80, 6, clean_text("Feature Name"), border=1)
        pdf.cell(50, 6, clean_text("Missing Count"), border=1, align="C")
        pdf.cell(50, 6, clean_text("Missing Percentage"), border=1, align="C")
        pdf.ln(6)
        
        pdf.set_font("helvetica", "", 9)
        for row in actionable_missing:
            pdf.cell(80, 6, clean_text(row.get('column', '')), border=1)
            pdf.cell(50, 6, clean_text(f"{row.get('missing_count', 0):,}"), border=1, align="C")
            pdf.cell(50, 6, clean_text(f"{row.get('missing_percentage', 0):.2f}%"), border=1, align="C")
            pdf.ln(6)
        pdf.ln(10)

    # 4B. Outlier Analysis
    if outlier_data:
        pdf.set_font("helvetica", "B", 12)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 8, clean_text("B. Statistical Outliers (Z-Score > 3.0)"))
        pdf.ln(8)
        
        pdf.set_font("helvetica", "B", 9)
        pdf.set_text_color(71, 85, 105)
        pdf.cell(80, 6, clean_text("Feature Name"), border=1)
        pdf.cell(50, 6, clean_text("Outlier Count"), border=1, align="C")
        pdf.cell(50, 6, clean_text("Impact Percentage"), border=1, align="C")
        pdf.ln(6)
        
        pdf.set_font("helvetica", "", 9)
        for row in outlier_data:
            pdf.cell(80, 6, clean_text(row.get('column', '')), border=1)
            pdf.cell(50, 6, clean_text(f"{row.get('outlier_count', 0):,}"), border=1, align="C")
            pdf.cell(50, 6, clean_text(f"{row.get('outlier_percentage', 0):.2f}%"), border=1, align="C")
            pdf.ln(6)
        pdf.ln(10)

    # 4C. SMART AGGREGATED Issue Log
    issue_log = analysis_results.get("issue_log", [])
    if issue_log:
        pdf.set_font("helvetica", "B", 12)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 8, clean_text("C. System Issue Log"))
        pdf.ln(8)

        grouped_issues = []
        duplicate_details = []

        for issue in issue_log:
            issue_text = str(issue.get("issue", ""))
            
            # ── FIX 1: Redundancy Filter ──
            # Silently skip missing values and outliers since they are in tables A and B
            if "Missing" in issue_text or "Outlier" in issue_text:
                continue

            if "Duplicate" in issue_text:
                duplicate_details.append(issue.get("detail", ""))
            else:
                grouped_issues.append(issue)

        if duplicate_details:
            total_dupes = len(duplicate_details)
            top_3 = "\n- ".join(duplicate_details[:3])
            
            if total_dupes > 3:
                suppressed_text = f"\n\n(Remaining {total_dupes - 3:,} cases have been suppressed for executive brevity.)"
            else:
                suppressed_text = ""

            summary_detail = (
                f"{total_dupes:,} duplicate record instances detected across the portfolio.\n\n"
                f"Top recurring entities:\n- {top_3}{suppressed_text}"
            )

            grouped_issues.append({
                "issue": "Widespread Entity Duplication",
                "severity": "High",
                "detail": summary_detail
            })

        # If the log is empty after filtering out the redundancy, print a clean message
        if not grouped_issues:
            pdf.set_font("helvetica", "I", 10)
            pdf.set_text_color(71, 85, 105)
            pdf.cell(0, 6, clean_text("No additional system issues detected outside of Missing Data and Outliers."))
            pdf.ln(6)
        else:
            for issue in grouped_issues:
                sev = issue.get("severity", "Medium")
                pdf.set_font("helvetica", "B", 10)
                
                if sev == "Critical" or sev == "High":
                    pdf.set_text_color(220, 38, 38)
                else:
                    pdf.set_text_color(217, 119, 6)
                    
                pdf.cell(30, 6, clean_text(f"[{sev}]"))
                pdf.set_text_color(15, 23, 42)
                pdf.cell(0, 6, clean_text(issue.get("issue", "Anomaly")))
                pdf.ln(6)
                
                pdf.set_font("helvetica", "", 9)
                pdf.set_text_color(71, 85, 105)
                pdf.multi_cell(0, 5, clean_text(f"Details:\n{issue.get('detail', '')}"))
                pdf.ln(6)

    output_filename = "Executive_Audit_Report.pdf"
    pdf.output(output_filename)
    return output_filename