import './index.css';
import React, { useContext, useRef, useState } from 'react';
import { ResumeContext } from '../../context/ResumeContext.jsx';
import TEMPLATES from '../../constants/templates.js';
import ModernProfessionalTemplate from '../templates/ModernProfessionalTemplate.jsx';
import MinimalAtsTemplate from '../templates/MinimalAtsTemplate.jsx';
import ExecutiveCorporateTemplate from '../templates/ExecutiveCorporateTemplate.jsx';
import SoftwareEngineerTemplate from '../templates/SoftwareEngineerTemplate.jsx';
import AimlEngineerTemplate from '../templates/AimlEngineerTemplate.jsx';
import CreativeCleanTemplate from '../templates/CreativeCleanTemplate.jsx';
import { ExportModeContext } from '../templates/engine/LayoutEngine.jsx';
import { HiArrowDownTray } from 'react-icons/hi2';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

function ResumePreview() {
  const { resume } = useContext(ResumeContext);
  const paperRef = useRef(null);
  const exportContainerRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const template = TEMPLATES.find((item) => item.id === resume.templateId || item.layout === resume.templateId) || TEMPLATES[0];
  const colors = template.colors;

  const renderTemplate = (isExport = false) => {
    const props = { sections: resume.sections, colors, isPreview: false, isExport };
    switch (template.layout || template.id) {
      case 'modern-professional':
        return <ModernProfessionalTemplate {...props} />;
      case 'minimal-ats':
        return <MinimalAtsTemplate {...props} />;
      case 'executive-corporate':
        return <ExecutiveCorporateTemplate {...props} />;
      case 'software-engineer':
        return <SoftwareEngineerTemplate {...props} />;
      case 'aiml-engineer':
        return <AimlEngineerTemplate {...props} />;
      case 'creative-clean':
        return <CreativeCleanTemplate {...props} />;
      default:
        return <ModernProfessionalTemplate {...props} />;
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);

    try {
      // 1. Allow React to mount/reposition the export container at (0, 0)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 2. Wait for fonts to finish loading
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // 3. Locate the dedicated export container
      const exportElement = exportContainerRef.current || document.getElementById('resume-pdf-export');
      if (!exportElement) {
        throw new Error('Export container not found');
      }

      // Measure exact native unscaled dimensions
      const nativeWidth = A4_WIDTH;
      const nativeHeight = exportElement.scrollHeight || A4_HEIGHT;

      // 4. High-resolution rasterization of the isolated export container
      const canvas = await html2canvas(exportElement, {
        scale: 2.5, // 240 DPI crisp document rendering
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: nativeWidth,
        height: nativeHeight,
        scrollX: 0,
        scrollY: 0,
      });

      // 5. Initialize native A4 PDF document in portrait
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const A4_WIDTH_MM = 210;
      const A4_HEIGHT_MM = 297;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const canvasAspectRatio = canvasWidth / canvasHeight;

      // 6. Coordinate calculation preserving native aspect ratio
      let renderWidthMm = A4_WIDTH_MM;
      let renderHeightMm = renderWidthMm / canvasAspectRatio;

      let xOffset = 0;
      let yOffset = 0;

      if (renderHeightMm > A4_HEIGHT_MM + 2) {
        if (renderHeightMm <= A4_HEIGHT_MM * 1.35) {
          renderHeightMm = A4_HEIGHT_MM;
          renderWidthMm = renderHeightMm * canvasAspectRatio;
          xOffset = Math.max(0, (A4_WIDTH_MM - renderWidthMm) / 2);
          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          pdf.addImage(imgData, 'JPEG', xOffset, yOffset, renderWidthMm, renderHeightMm);
        } else {
          // Multi-page slicing for large resumes
          const pageHeightPx = Math.round(canvas.width * (A4_HEIGHT_MM / A4_WIDTH_MM));
          let currentY = 0;
          let pageIdx = 0;

          while (currentY < canvas.height) {
            if (pageIdx > 0) pdf.addPage('a4', 'portrait');
            const sliceHeight = Math.min(pageHeightPx, canvas.height - currentY);
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = sliceHeight;
            const ctx = sliceCanvas.getContext('2d');
            ctx.drawImage(
              canvas,
              0, currentY, canvas.width, sliceHeight,
              0, 0, canvas.width, sliceHeight
            );
            const sliceImg = sliceCanvas.toDataURL('image/jpeg', 0.98);
            const sliceHeightMm = (sliceHeight / canvas.width) * A4_WIDTH_MM;
            pdf.addImage(sliceImg, 'JPEG', 0, 0, A4_WIDTH_MM, sliceHeightMm);
            currentY += sliceHeight;
            pageIdx++;
          }
        }
      } else {
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData, 'JPEG', 0, 0, renderWidthMm, renderHeightMm);
      }

      const cleanName = (resume.sections?.personalInfo?.fullName || resume.title || 'Resume')
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanName || 'Resume'}.pdf`;

      window.__LAST_PDF_STATS__ = {
        nativeWidth,
        nativeHeight,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        renderWidthMm,
        renderHeightMm,
        xOffset,
        yOffset,
        totalPages: pdf.internal.getNumberOfPages(),
        filename,
      };
      console.log('PDF_EXPORT_STATS', window.__LAST_PDF_STATS__);

      pdf.save(filename);
    } catch (error) {
      console.error('PDF export error, falling back to window.print():', error);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="resume-preview">
      <header className="resume-preview__toolbar">
        <button type="button" className="btn btn-primary" onClick={handleDownloadPdf} disabled={isDownloading}>
          <HiArrowDownTray />
          {isDownloading ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </header>

      {/* Editor preview viewport */}
      <div className="resume-preview__viewport">
        <div className="resume-preview__stage" style={{ width: A4_WIDTH }}>
          <div
            ref={paperRef}
            className="resume-preview__paper"
          >
            {renderTemplate(false)}
          </div>
        </div>
      </div>

      {/* Dedicated export container: completely isolated from viewport scrolling, padding, and editor transforms */}
      <div
        id="resume-pdf-export"
        ref={exportContainerRef}
        className="resume-pdf-export"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: isDownloading ? 0 : '-99999px',
          zIndex: isDownloading ? 99990 : -9999,
          width: `${A4_WIDTH}px`,
          minHeight: `${A4_HEIGHT}px`,
          height: 'auto',
          background: '#ffffff',
          transform: 'none',
          transformOrigin: 'top left',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
          pointerEvents: 'none',
          visibility: isDownloading ? 'visible' : 'hidden',
          opacity: isDownloading ? 1 : 0,
        }}
      >
        <ExportModeContext.Provider value={true}>
          {renderTemplate(true)}
        </ExportModeContext.Provider>
      </div>

      {/* Visual downloading overlay */}
      {isDownloading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            color: '#ffffff',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              border: '3px solid rgba(255, 255, 255, 0.2)',
              borderTopColor: '#38bdf8',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Generating Recruiter-Ready A4 PDF...</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Preserving native vector aspect ratio and single-page fit</p>
        </div>
      )}
    </div>
  );
}

export default ResumePreview;
