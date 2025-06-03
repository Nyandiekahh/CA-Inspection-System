# apps/reports/renderers.py - DOCX ONLY
from rest_framework.renderers import BaseRenderer

# REMOVED: PDFRenderer - no longer needed

class DOCXRenderer(BaseRenderer):
    """Custom renderer for Microsoft Word DOCX files"""
    media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    format = 'docx'
    charset = None
    render_style = 'binary'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data