# apps/reports/renderers.py
from rest_framework.renderers import BaseRenderer

class PDFRenderer(BaseRenderer):
    """Custom renderer for PDF files"""
    media_type = 'application/pdf'
    format = 'pdf'
    charset = None
    render_style = 'binary'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data

class DOCXRenderer(BaseRenderer):
    """Custom renderer for Microsoft Word DOCX files"""
    media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    format = 'docx'
    charset = None
    render_style = 'binary'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data
