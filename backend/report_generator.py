"""
PDF Report Generator for Model Risk Management Audits.
Converts the structured JSON analysis into a printable executive dossier.
"""

from fpdf import FPDF
import datetime

def clean_text(text: str) -> str:
    """
    Replaces common unicode characters (smart quotes, em-dashes) from AI 
    generation with standard ASCII equivalents to prevent PDF font crashes.
    """
    if not text:
        return ""
    text = str(text)
    replacements = {
        '\u2018': "'", '\u2019': "'", # Smart single quotes
        '\u201c': '"', '\u201d': '"', # Smart double quotes
        '\u2013': '-', '\u2014': '-', # En and Em dashes
        '\u2026': '...',              # Ellipsis
        '\u00A0': ' ',                # Non-breaking space
    }
    for search, replace in replacements.items():
        text = text.replace(search, replace)
        
    # Final safety net: forces standard encoding, replacing any other weird chars with '?'
    return text.encode('latin-1', 'replace').decode('latin-1')


class PDFReport(FPDF):
    def header(self):
        # Corporate Header
        self.set_font("helvetica", "B", 15)
        self.set_text_color(15, 23, 42) # Dark Slate
        self.cell(0, 10, clean_text("Model Risk Data Quality Assessment"), border=False, align="L")
        
        self.set_font("helvetica", "I", 10)
        self.set_text_color(100, 116, 139) # Slate Grey
        self.cell(0, 10, clean_text(f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}"), border=False, align="R")
        self.ln(15)

    def footer(self):
        # Page Footer
        self.set_y(-15)
        self.set_font("helvetica", "I", 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, clean_text(f"Page {self.page_no()}"), align="C")

def generate_executive_pdf(analysis_results: dict) -> str:
    """
    Takes the full analysis dictionary (including AI insights) and generates a PDF file.
    Returns the filepath to the generated PDF.
    """
    pdf = PDFReport()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # ── SECTION 1: AI Executive Summary ──
    pdf.set_font("helvetica", "B", 12)
    pdf.set_text_color(37, 99, 235) # Blue
    pdf.cell(0, 10, clean_text("1. AI Materiality Assessment"), ln=True)
    
    pdf.set_font("helvetica", "", 11)
    pdf.set_text_color(51, 65, 85)
    ai_data = analysis_results.get("ai_assessment", {})
    summary = ai_data.get("executive_summary", "No AI summary available.")
    pdf.multi_cell(0, 6, clean_text(summary))
    pdf.ln(5)

    # ── SECTION 2: Dataset Profile ──
    pdf.set_font("helvetica", "B", 12)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 10, clean_text("2. Dataset Structural Profile"), ln=True)
    
    profile = analysis_results.get("dataset_profile", {})
    pdf.set_font("helvetica", "", 10)
    pdf.cell(0, 6, clean_text(f"Total Rows: {profile.get('total_rows', 0):,}"), ln=True)
    pdf.cell(0, 6, clean_text(f"Total Columns: {profile.get('total_columns', 0):,}"), ln=True)
    pdf.cell(0, 6, clean_text(f"Numeric Columns: {profile.get('numeric_columns', 0)}"), ln=True)
    pdf.ln(5)

    # ── SECTION 3: Context-Aware Remediation Strategies (The Delta) ──
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(0, 10, clean_text("3. Recommended AI Override Strategies"), ln=True)
    
    recs = ai_data.get("ai_recommendations", [])
    if not recs:
        pdf.set_font("helvetica", "I", 10)
        pdf.cell(0, 6, clean_text("No specific AI overrides suggested."), ln=True)
    else:
        for rec in recs:
            # Feature Name
            pdf.set_font("helvetica", "B", 10)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(0, 6, clean_text(f"Target Feature: {rec.get('column', 'Unknown')}"), ln=True)
            
            # Strategy
            pdf.set_font("helvetica", "B", 9)
            pdf.set_text_color(37, 99, 235) # Blue
            pdf.cell(0, 6, clean_text(f"Strategy: {rec.get('strategy', '')}"), ln=True)
            
            # Justification
            pdf.set_font("helvetica", "", 9)
            pdf.set_text_color(71, 85, 105)
            pdf.multi_cell(0, 5, clean_text(f"Justification: {rec.get('justification', '')}"))
            pdf.ln(4)

    # Save to a temporary file
    output_filename = "Executive_Audit_Report.pdf"
    pdf.output(output_filename)
    
    return output_filename