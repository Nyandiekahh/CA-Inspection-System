# apps/reports/document_generator.py - COMPLETE REPLACEMENT
import os
import math
from datetime import datetime
from typing import Dict, List, Any, Optional
from io import BytesIO
from PIL import Image as PILImage, ImageDraw, ImageFont

# Document generation libraries
from docx import Document
from docx.shared import Inches, Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.shared import OxmlElement, qn
from docx.enum.dml import MSO_THEME_COLOR_INDEX

from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from django.conf import settings
from django.core.files.base import ContentFile
from django.template import Template, Context

from .models import InspectionReport, ReportImage, ERPCalculation

class ProfessionalDocumentGenerator:
    """Professional document generator matching CA inspection report templates"""
    
    def __init__(self, report: InspectionReport):
        self.report = report
        self.inspection = report.inspection
        self.broadcaster = self.inspection.broadcaster
        
        # Image categories for organized layout
        self.image_categories = {
            'site_overview': 'Site Overview',
            'tower_structure': 'Tower/Mast Structure',
            'exciter': 'Exciter Equipment',
            'amplifier': 'Amplifier Equipment',
            'antenna_system': 'Antenna System',
            'filter': 'Filter Equipment',
            'studio_link': 'Studio to Transmitter Link',
            'transmitter_room': 'Transmitter Room',
            'equipment_rack': 'Equipment Rack',
            'other': 'Other Equipment'
        }
    
    def generate_documents(self, formats: List[str] = None) -> Dict[str, str]:
        """Generate professional documents in specified formats"""
        if not formats:
            formats = ['pdf']
        
        results = {}
        
        try:
            if 'pdf' in formats:
                pdf_path = self.generate_professional_pdf()
                results['pdf'] = pdf_path
                
            if 'docx' in formats:
                docx_path = self.generate_professional_docx()
                results['docx'] = docx_path
                
            # Update report status
            self.report.status = 'completed'
            self.report.date_completed = datetime.now()
            self.report.save()
            
            return results
            
        except Exception as e:
            print(f"Document generation failed: {str(e)}")
            self.report.status = 'draft'
            self.report.save()
            raise
    
    def generate_professional_docx(self) -> str:
        """Generate professional Word document matching CA templates"""
        doc = Document()
        
        # Set document properties
        doc.core_properties.title = self.report.title
        doc.core_properties.author = self.inspection.inspector.get_full_name()
        doc.core_properties.created = self.report.created_at
        
        # Build document content
        self._build_docx_header(doc)
        self._build_docx_findings_section(doc)
        self._build_docx_conclusions_section(doc)
        self._build_docx_signature(doc)
        
        # Save document
        buffer = BytesIO()
        doc.save(buffer)
        
        filename = f"{self.report.reference_number.replace('/', '_')}.docx"
        self.report.generated_docx.save(
            filename,
            ContentFile(buffer.getvalue()),
            save=True
        )
        
        return self.report.generated_docx.path
    
    def _build_docx_header(self, doc: Document):
        """Build document header matching CA format"""
        # Reference number - bold, left aligned
        ref_para = doc.add_paragraph()
        ref_run = ref_para.add_run(self.report.reference_number)
        ref_run.bold = True
        ref_run.font.size = Pt(12)
        
        # Date
        date_str = self._format_date_with_suffix(self.inspection.inspection_date)
        doc.add_paragraph(date_str)
        doc.add_paragraph()  # Empty line
        
        # Addressee - bold
        to_para = doc.add_paragraph()
        to_run = to_para.add_run("TO: D/MIRC")
        to_run.bold = True
        
        thru_para = doc.add_paragraph()
        thru_run = thru_para.add_run("THRO': PO/NR/MIRC")
        thru_run.bold = True
        
        doc.add_paragraph()  # Empty line
        
        # Subject line - bold and centered
        title_para = doc.add_paragraph()
        title_run = title_para.add_run(f"RE: {self.report.title}")
        title_run.bold = True
        title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        doc.add_paragraph()  # Empty line
        
        # Reference text
        ref_text = "The above subject matter refers.\n\nReference is made to the above subject."
        doc.add_paragraph(ref_text)
        
        # Inspection details
        inspector_name = self.inspection.inspector.get_full_name()
        inspection_date = self._format_date_with_suffix(self.inspection.inspection_date)
        contact_name = self.inspection.contact_name or 'their representative'
        
        inspection_para = doc.add_paragraph()
        inspection_text = f"The transmit station was inspected by MIRC officer {inspector_name} on {inspection_date} in the presence of their representative {contact_name}."
        inspection_para.add_run(inspection_text)
        
        doc.add_paragraph()  # Empty line
        
        # FINDINGS header - bold
        findings_para = doc.add_paragraph()
        findings_run = findings_para.add_run("FINDINGS")
        findings_run.bold = True
        findings_run.font.size = Pt(14)
    
    def _build_docx_findings_section(self, doc: Document):
        """Build findings section with all technical details"""
        
        # A. SITE
        self._add_section_header(doc, "A. SITE")
        self._build_site_table(doc)
        doc.add_paragraph()
        
        # B. MAST/TOWER
        self._add_section_header(doc, "B. MAST")
        self._build_tower_table(doc)
        self._add_section_images(doc, 'tower_structure')
        doc.add_paragraph()
        
        # C. TRANSMITTER
        self._add_section_header(doc, "C. TRANSMITTER")
        if self.inspection.station_type == 'TV':
            self._build_tv_transmitter_table(doc)
        else:
            self._build_fm_transmitter_table(doc)
        self._add_section_images(doc, ['exciter', 'amplifier'])
        doc.add_paragraph()
        
        # D. ANTENNA SYSTEM
        self._add_section_header(doc, "D. ANTENNA SYSTEM")
        self._build_antenna_table(doc)
        self._add_section_images(doc, 'antenna_system')
        doc.add_paragraph()
        
        # E. FILTER (if applicable)
        if self.inspection.filter_manufacturer or self._has_images('filter'):
            self._add_section_header(doc, "E. FILTER")
            self._build_filter_table(doc)
            self._add_section_images(doc, 'filter')
            doc.add_paragraph()
        
        # F. STUDIO TO TRANSMITTER LINK (if applicable)
        if self.inspection.studio_manufacturer or self._has_images('studio_link'):
            self._add_section_header(doc, "F. STUDIO TO TRANSMITTER LINK")
            self._build_stl_table(doc)
            self._add_section_images(doc, 'studio_link')
            doc.add_paragraph()
        
        # G. ERP CALCULATION
        self._add_section_header(doc, "G. ERP CALCULATION")
        self._build_erp_section(doc)
        doc.add_paragraph()
    
    def _build_site_table(self, doc: Document):
        """Build site information table"""
        table = doc.add_table(rows=3, cols=2)
        table.style = 'Table Grid'
        table.autofit = False
        
        # Set column widths
        table.columns[0].width = Inches(2.5)
        table.columns[1].width = Inches(4.0)
        
        # Site data
        site_data = [
            ("Name:", self.inspection.transmitting_site_name or 'Not specified'),
            ("Coordinates:", f"{self.inspection.longitude or ''}\n{self.inspection.latitude or ''}"),
            ("Elevation:", f"{self.inspection.altitude or 'Not specified'} M")
        ]
        
        for i, (label, value) in enumerate(site_data):
            # Label cell - bold
            label_cell = table.cell(i, 0)
            label_para = label_cell.paragraphs[0]
            label_run = label_para.add_run(label)
            label_run.bold = True
            
            # Value cell
            value_cell = table.cell(i, 1)
            value_cell.text = value
    
    def _build_tower_table(self, doc: Document):
        """Build tower/mast information table"""
        table = doc.add_table(rows=2, cols=2)
        table.style = 'Table Grid'
        
        # Tower data
        tower_type = self.inspection.get_tower_type_display() if self.inspection.tower_type else 'Not specified'
        height = f"{self.inspection.height_above_ground or 'Not specified'}M"
        
        tower_data = [
            ("Type:", tower_type),
            ("Height:", height)
        ]
        
        for i, (label, value) in enumerate(tower_data):
            # Label cell - bold
            label_cell = table.cell(i, 0)
            label_para = label_cell.paragraphs[0]
            label_run = label_para.add_run(label)
            label_run.bold = True
            
            # Value cell
            value_cell = table.cell(i, 1)
            value_cell.text = value
    
    def _build_fm_transmitter_table(self, doc: Document):
        """Build FM transmitter table with equipment images"""
        # Create a table structure similar to the template
        
        # Exciter section
        exciter_para = doc.add_paragraph()
        exciter_run = exciter_para.add_run("EXCITER")
        exciter_run.bold = True
        
        exciter_table = doc.add_table(rows=5, cols=2)
        exciter_table.style = 'Table Grid'
        
        exciter_data = [
            ("Make:", self.inspection.exciter_manufacturer or 'Not Seen'),
            ("Model:", self.inspection.exciter_model_number or 'Not Seen'),
            ("Serial:", self.inspection.exciter_serial_number or 'Not Seen'),
            ("Nominal Power:", f"{self.inspection.exciter_nominal_power or 'Not Seen'} W"),
            ("Power Output:", f"{self.inspection.exciter_actual_reading or 'Not Seen'} W")
        ]
        
        for i, (label, value) in enumerate(exciter_data):
            # Label cell - bold
            label_cell = exciter_table.cell(i, 0)
            label_para = label_cell.paragraphs[0]
            label_run = label_para.add_run(label)
            label_run.bold = True
            
            # Value cell
            value_cell = exciter_table.cell(i, 1)
            value_cell.text = value
        
        doc.add_paragraph()
        
        # Amplifier section
        amp_para = doc.add_paragraph()
        amp_run = amp_para.add_run("AMPLIFIER")
        amp_run.bold = True
        
        amp_table = doc.add_table(rows=5, cols=2)
        amp_table.style = 'Table Grid'
        
        amp_data = [
            ("Make:", self.inspection.amplifier_manufacturer or 'Not Seen'),
            ("Model:", self.inspection.amplifier_model_number or 'Not Seen'),
            ("Serial:", self.inspection.amplifier_serial_number or 'Not Seen'),
            ("Nominal Power:", f"{self.inspection.amplifier_nominal_power or 'Not Seen'} W"),
            ("Power Output:", f"{self.inspection.amplifier_actual_reading or 'Not Seen'} W")
        ]
        
        for i, (label, value) in enumerate(amp_data):
            # Label cell - bold
            label_cell = amp_table.cell(i, 0)
            label_para = label_cell.paragraphs[0]
            label_run = label_para.add_run(label)
            label_run.bold = True
            
            # Value cell
            value_cell = amp_table.cell(i, 1)
            value_cell.text = value
        
        # Frequency
        doc.add_paragraph()
        freq_para = doc.add_paragraph()
        freq_run = freq_para.add_run(f"Frequency: {self.inspection.transmit_frequency or 'Not Specified'}")
        freq_run.bold = True
    
    def _build_tv_transmitter_table(self, doc: Document):
        """Build TV transmitter table for multiple channels"""
        # For TV stations, we need a more complex table structure
        # This would be customized based on the number of channels
        
        # Create channel table headers
        channels = self._get_tv_channels()
        
        if channels:
            table = doc.add_table(rows=len(channels) + 1, cols=6)
            table.style = 'Table Grid'
            
            # Headers
            headers = ["Channel Freq. (MHz)", "Make", "Model", "S/No.", "Power (W)", "Gain (dBd)"]
            for i, header in enumerate(headers):
                cell = table.cell(0, i)
                para = cell.paragraphs[0]
                run = para.add_run(header)
                run.bold = True
            
            # Data rows
            for row_idx, channel in enumerate(channels, 1):
                row_data = [
                    channel.get('frequency', 'Unknown'),
                    channel.get('manufacturer', 'Not Seen'),
                    channel.get('model', 'Not Seen'),
                    channel.get('serial', 'Not Seen'),
                    f"{channel.get('power', 'Unknown')} W",
                    f"{channel.get('gain', '11.0')} dBd"
                ]
                
                for col_idx, data in enumerate(row_data):
                    table.cell(row_idx, col_idx).text = data
        else:
            # Fallback to single channel format
            self._build_fm_transmitter_table(doc)
    
    def _build_antenna_table(self, doc: Document):
        """Build antenna system table"""
        table = doc.add_table(rows=6, cols=2)
        table.style = 'Table Grid'
        
        antenna_data = [
            ("Manufacturer:", self.inspection.antenna_manufacturer or 'Not specified'),
            ("Model No.:", self.inspection.antenna_model_number or 'Not specified'),
            ("Type:", self.inspection.antenna_type or 'Not specified'),
            ("Polarization:", self.inspection.get_polarization_display() if self.inspection.polarization else 'Not specified'),
            ("Gain:", f"{self.inspection.antenna_gain or 'Not specified'} dBd"),
            ("Height on the Tower:", f"{self.inspection.height_on_tower or 'Not specified'}M")
        ]
        
        for i, (label, value) in enumerate(antenna_data):
            # Label cell - bold
            label_cell = table.cell(i, 0)
            label_para = label_cell.paragraphs[0]
            label_run = label_para.add_run(label)
            label_run.bold = True
            
            # Value cell
            value_cell = table.cell(i, 1)
            value_cell.text = value
    
    def _build_filter_table(self, doc: Document):
        """Build filter equipment table"""
        table = doc.add_table(rows=4, cols=2)
        table.style = 'Table Grid'
        
        filter_data = [
            ("Manufacturer:", self.inspection.filter_manufacturer or 'Not specified'),
            ("Model:", self.inspection.filter_model_number or 'Not Seen'),
            ("S/No.:", self.inspection.filter_serial_number or 'Not Seen'),
            ("Frequency:", self.inspection.filter_frequency or 'Not specified')
        ]
        
        for i, (label, value) in enumerate(filter_data):
            # Label cell - bold
            label_cell = table.cell(i, 0)
            label_para = label_cell.paragraphs[0]
            label_run = label_para.add_run(label)
            label_run.bold = True
            
            # Value cell
            value_cell = table.cell(i, 1)
            value_cell.text = value
    
    def _build_stl_table(self, doc: Document):
        """Build Studio to Transmitter Link table"""
        table = doc.add_table(rows=5, cols=2)
        table.style = 'Table Grid'
        
        stl_data = [
            ("Manufacturer:", self.inspection.studio_manufacturer or 'Not specified'),
            ("Model:", self.inspection.studio_model_number or 'Not Seen'),
            ("S/No.:", self.inspection.studio_serial_number or 'Not Seen'),
            ("Frequency:", self.inspection.studio_frequency or 'Not specified'),
            ("Description of Signal Reception:", self.inspection.signal_description or 'Not specified')
        ]
        
        for i, (label, value) in enumerate(stl_data):
            # Label cell - bold
            label_cell = table.cell(i, 0)
            label_para = label_cell.paragraphs[0]
            label_run = label_para.add_run(label)
            label_run.bold = True
            
            # Value cell
            value_cell = table.cell(i, 1)
            value_cell.text = value
    
    def _build_erp_section(self, doc: Document):
        """Build ERP calculation section"""
        # Get ERP calculations
        erp_calculations = self.report.erp_details.all()
        
        if not erp_calculations.exists():
            # Create default calculation
            erp_calc = self._create_default_erp_calculation()
            if erp_calc:
                erp_calculations = [erp_calc]
        
        if erp_calculations:
            for calc in erp_calculations:
                # Channel header
                channel_para = doc.add_paragraph()
                channel_run = channel_para.add_run(f"{calc.channel_number} ({calc.frequency_mhz} MHz)")
                channel_run.bold = True
                
                # ERP calculation table
                erp_table = doc.add_table(rows=5, cols=2)
                erp_table.style = 'Table Grid'
                
                erp_data = [
                    ("Forward Power:", f"{calc.forward_power_w} W"),
                    ("Antenna Gain:", f"{calc.antenna_gain_dbd} dBd"),
                    ("Losses:", f"{calc.losses_db} dB"),
                    ("ERP Calculation", "ERP=10log P(W) + G (dBd) – L (dB)"),
                    ("Result:", f"ERP=10log {calc.forward_power_w}(W) + {calc.antenna_gain_dbd} dBd - {calc.losses_db} dB = {calc.erp_dbw} dBW ({calc.erp_kw} kW)")
                ]
                
                for i, (label, value) in enumerate(erp_data):
                    # Label cell - bold
                    label_cell = erp_table.cell(i, 0)
                    label_para = label_cell.paragraphs[0]
                    label_run = label_para.add_run(label)
                    label_run.bold = True
                    
                    # Value cell
                    value_cell = erp_table.cell(i, 1)
                    value_cell.text = value
                
                doc.add_paragraph()
        
        # Authorized ERP
        auth_para = doc.add_paragraph()
        auth_run = auth_para.add_run("Authorized ERP: 10000 W (10 kW)")
        auth_run.bold = True
    
    def _build_docx_conclusions_section(self, doc: Document):
        """Build conclusions section"""
        
        # H. OBSERVATION (if any)
        if self.report.observations or self.inspection.other_observations:
            self._add_section_header(doc, "H. OBSERVATION")
            observations = self.report.observations or self.inspection.other_observations or ''
            if observations:
                # Split observations into bullet points
                obs_lines = [line.strip() for line in observations.split('\n') if line.strip()]
                for obs in obs_lines:
                    if obs:
                        obs_para = doc.add_paragraph(style='List Bullet')
                        obs_para.add_run(obs)
            doc.add_paragraph()
        
        # I. CONCLUSION
        self._add_section_header(doc, "I. CONCLUSION")
        conclusions = self.report.conclusions or self._generate_auto_conclusions()
        if conclusions:
            # Split conclusions into bullet points
            conc_lines = [line.strip() for line in conclusions.split('\n') if line.strip()]
            for conc in conc_lines:
                if conc:
                    conc_para = doc.add_paragraph(style='List Bullet')
                    conc_para.add_run(conc)
        doc.add_paragraph()
        
        # J. RECOMMENDATION
        self._add_section_header(doc, "J. RECOMMENDATION")
        recommendations = self.report.recommendations or self._generate_auto_recommendations()
        if recommendations:
            # Split recommendations into bullet points
            rec_lines = [line.strip() for line in recommendations.split('\n') if line.strip()]
            for rec in rec_lines:
                if rec:
                    rec_para = doc.add_paragraph(style='List Bullet')
                    rec_para.add_run(rec)
    
    def _build_docx_signature(self, doc: Document):
        """Build signature section"""
        doc.add_paragraph()
        doc.add_paragraph()
        
        # Inspector name - bold
        inspector_name = self.inspection.inspector.get_full_name()
        name_para = doc.add_paragraph()
        name_run = name_para.add_run(inspector_name)
        name_run.bold = True
        
        # Title - bold
        title_para = doc.add_paragraph()
        title_run = title_para.add_run("AO/MIRC/NR")
        title_run.bold = True
    
    def _add_section_header(self, doc: Document, header_text: str):
        """Add a section header"""
        header_para = doc.add_paragraph()
        header_run = header_para.add_run(header_text)
        header_run.bold = True
        header_run.font.size = Pt(12)
    
    def _add_section_images(self, doc: Document, image_types):
        """Add images for specific sections"""
        if isinstance(image_types, str):
            image_types = [image_types]
        
        for image_type in image_types:
            images = self.report.images.filter(image_type=image_type)
            
            for img in images:
                try:
                    doc.add_paragraph()
                    paragraph = doc.add_paragraph()
                    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    
                    # Add image with appropriate size
                    run = paragraph.add_run()
                    run.add_picture(img.image.path, width=Inches(4))
                    
                    # Add caption if available
                    if img.caption:
                        caption_para = doc.add_paragraph(img.caption)
                        caption_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
                        caption_run = caption_para.runs[0]
                        caption_run.italic = True
                        caption_run.font.size = Pt(9)
                    
                except Exception as e:
                    print(f"Error adding image {img.id}: {e}")
                    continue
    
    def _has_images(self, image_type: str) -> bool:
        """Check if report has images of specific type"""
        return self.report.images.filter(image_type=image_type).exists()
    
    def _get_tv_channels(self) -> List[Dict]:
        """Get TV channel data for multi-channel stations"""
        # For TV stations, this would extract multiple channel data
        # For now, return single channel data
        return [{
            'frequency': self.inspection.transmit_frequency or 'Unknown',
            'manufacturer': self.inspection.exciter_manufacturer or 'Not Seen',
            'model': self.inspection.exciter_model_number or 'Not Seen',
            'serial': self.inspection.exciter_serial_number or 'Not Seen',
            'power': self.inspection.amplifier_actual_reading or 'Unknown',
            'gain': self.inspection.antenna_gain or '11.0'
        }]
    
    def _create_default_erp_calculation(self) -> Optional[ERPCalculation]:
        """Create default ERP calculation from inspection data"""
        try:
            forward_power = float(self.inspection.amplifier_actual_reading or 3000)
            antenna_gain = float(self.inspection.antenna_gain or 11.0)
            frequency = self.inspection.transmit_frequency or "Unknown"
            
            calc = ERPCalculation.objects.create(
                report=self.report,
                channel_number="CH.1",
                frequency_mhz=frequency,
                forward_power_w=forward_power,
                antenna_gain_dbd=antenna_gain,
                losses_db=1.5
            )
            
            return calc
            
        except (ValueError, TypeError):
            return None
    
    def _generate_auto_conclusions(self) -> str:
        """Generate automatic conclusions based on violations"""
        violations = self.report.violations_found or []
        
        if not violations:
            return "The station is operating in compliance with the authorized parameters."
        
        conclusions = []
        
        # Check for ERP violations
        erp_violations = [v for v in violations if 'ERP' in v.get('type', '')]
        if erp_violations:
            conclusions.append("The licensee is operating above the maximum authorized ERP limit.")
        
        # Check for type approval violations
        type_approval_violations = [v for v in violations if 'type approval' in v.get('type', '')]
        if type_approval_violations:
            conclusions.append("The licensee is operating non-type approved transmitters.")
        
        return "\n".join(f"• {conclusion}" for conclusion in conclusions)
    
    def _generate_auto_recommendations(self) -> str:
        """Generate automatic recommendations based on violations"""
        violations = self.report.violations_found or []
        
        if not violations:
            return "Continue operating within authorized parameters and maintain equipment in good condition."
        
        recommendations = []
        
        # Check for ERP violations
        erp_violations = [v for v in violations if 'ERP' in v.get('type', '')]
        if erp_violations:
            recommendations.append("The licensee to be issued with a notice of violation for exceeding authorized ERP limit.")
        
        # Check for type approval violations
        type_approval_violations = [v for v in violations if 'type approval' in v.get('type', '')]
        if type_approval_violations:
            recommendations.append("The licensee to be issued with a notice of violation for operating non-type approved transmitters.")
        
        return "\n".join(f"• {recommendation}" for recommendation in recommendations)
    
    def _format_date_with_suffix(self, date) -> str:
        """Format date with ordinal suffix (1st, 2nd, 3rd, etc.)"""
        day = date.day
        if 11 <= day <= 13:
            suffix = 'th'
        else:
            suffix = {1: 'st', 2: 'nd', 3: 'rd'}.get(day % 10, 'th')
        
        return date.strftime(f"%-d{suffix} %B %Y")
    
    def generate_professional_pdf(self) -> str:
        """Generate professional PDF matching Word document format"""
        # PDF implementation would follow similar structure
        # For brevity, using simplified version - can be expanded
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        
        # Build PDF content using similar structure as Word document
        story = []
        styles = getSampleStyleSheet()
        
        # Add content sections
        story.extend(self._build_pdf_content(styles))
        
        # Build PDF
        doc.build(story)
        
        # Save to file
        pdf_content = buffer.getvalue()
        buffer.close()
        
        filename = f"{self.report.reference_number.replace('/', '_')}.pdf"
        self.report.generated_pdf.save(
            filename,
            ContentFile(pdf_content),
            save=True
        )
        
        return self.report.generated_pdf.path
    
    def _build_pdf_content(self, styles) -> List:
        """Build PDF content similar to Word document"""
        story = []
        
        # Header
        story.append(Paragraph(f"<b>{self.report.reference_number}</b>", styles['Normal']))
        story.append(Spacer(1, 12))
        
        # Date
        date_str = self._format_date_with_suffix(self.inspection.inspection_date)
        story.append(Paragraph(date_str, styles['Normal']))
        story.append(Spacer(1, 12))
        
        # Title
        story.append(Paragraph(f"<b>RE: {self.report.title}</b>", styles['Title']))
        story.append(Spacer(1, 20))
        
        # Opening paragraph
        inspector_name = self.inspection.inspector.get_full_name()
        inspection_date = self._format_date_with_suffix(self.inspection.inspection_date)
        contact_name = self.inspection.contact_name or 'their representative'
        
        opening = f"""The above subject matter refers.

Reference is made to the above subject.

The transmit station was inspected by MIRC officer {inspector_name} on {inspection_date} in the presence of their representative {contact_name}."""
        
        story.append(Paragraph(opening, styles['Normal']))
        story.append(Spacer(1, 20))
        
        # FINDINGS header
        story.append(Paragraph("<b>FINDINGS</b>", styles['Heading1']))
        story.append(Spacer(1, 12))
        
        return story