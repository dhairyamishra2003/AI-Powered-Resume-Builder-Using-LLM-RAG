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
import { A4_HEIGHT, A4_HEIGHT_MM, A4_WIDTH, A4_WIDTH_MM, ExportModeContext } from '../templates/engine/LayoutEngine.jsx';
import { HiArrowDownTray, HiMagnifyingGlassPlus, HiMagnifyingGlassMinus, HiArrowPath } from 'react-icons/hi2';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function ResumePreview() {
  const { resume } = useContext(ResumeContext);
  const paperRef = useRef(null);
  const exportContainerRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoom, setZoom] = useState(1);

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

  const handleZoomIn = () => setZoom((z) => Math.min(1.5, Math.round((z + 0.1) * 10) / 10));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10));
  const handleZoomReset = () => setZoom(1);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);

    try {
      // Wait for fonts and images
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await Promise.all(Array.from(document.images).map((image) => (
        image.complete ? Promise.resolve() : new Promise((resolve) => { image.onload = image.onerror = resolve; })
      )));
      // Extra frames to let MultiPageA4Canvas finish its two-phase measure+render
      await new Promise((resolve) => requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            requestAnimationFrame(resolve)
          )
        )
      ));

      const exportElement = exportContainerRef.current || document.getElementById('resume-pdf-export');
      if (!exportElement) {
        throw new Error('Export container not found');
      }

      // ── Detect individual A4 page containers ─────────────────────────────
      // TwoPageResumeCanvas renders [data-page-index] divs for each page.
      // Wait up to 1s to ensure measurement phase has rendered the actual page canvases.
      let pageEls = exportElement.querySelectorAll('[data-resume-page]');
      let attempts = 0;
      while (pageEls.length === 0 && attempts < 20) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        pageEls = exportElement.querySelectorAll('[data-resume-page]');
        attempts++;
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      if (pageEls.length > 0) {
        // ── Multi-page path: rasterize each page container separately ────────
        for (let i = 0; i < pageEls.length; i++) {
          const pageEl = pageEls[i];

          if (i > 0) pdf.addPage('a4', 'portrait');

          const pageCanvas = await html2canvas(pageEl, {
            scale: 2.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            scrollX: -window.scrollX,
            scrollY: -window.scrollY,
            windowWidth: A4_WIDTH,
            windowHeight: A4_HEIGHT,
          });

          const imgData = pageCanvas.toDataURL('image/jpeg', 0.98);
          pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
        }
      } else {
        // ── Fallback: legacy single-canvas path (for any template not yet migrated)
        const rect = exportElement.getBoundingClientRect();
        const nativeWidth = Math.round(rect.width) || A4_WIDTH;
        const nativeHeight = Math.max(A4_HEIGHT, Math.round(exportElement.scrollHeight));

        const canvas = await html2canvas(exportElement, {
          scale: 2.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: -window.scrollX,
          scrollY: -window.scrollY,
          windowWidth: nativeWidth,
          windowHeight: nativeHeight,
        });

        const canvasAspectRatio = canvas.width / canvas.height;
        let renderWidthMm = A4_WIDTH_MM;
        let renderHeightMm = renderWidthMm / canvasAspectRatio;

        if (renderHeightMm > A4_HEIGHT_MM + 0.5) {
          // Content exceeds one page: paginate by slicing at A4_HEIGHT_MM increments
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
            ctx.drawImage(canvas, 0, currentY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
            pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, A4_WIDTH_MM, (sliceHeight / canvas.width) * A4_WIDTH_MM);
            currentY += sliceHeight;
            pageIdx++;
          }
        } else {
          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          pdf.addImage(imgData, 'JPEG', 0, 0, renderWidthMm, renderHeightMm);
        }
      }

      const cleanName = (resume.sections?.personalInfo?.fullName || resume.title || 'Resume')
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanName || 'Resume'}.pdf`;

      window.__LAST_PDF_STATS__ = {
        totalPages: pdf.internal.getNumberOfPages(),
        pageContainersFound: pageEls.length,
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
        <div className="resume-preview__zoom-controls">
          <button
            type="button"
            className="btn btn-secondary resume-preview__zoom-btn"
            onClick={handleZoomOut}
            title="Zoom Out"
            disabled={zoom <= 0.5}
          >
            <HiMagnifyingGlassMinus />
          </button>
          <span className="resume-preview__zoom-label">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="btn btn-secondary resume-preview__zoom-btn"
            onClick={handleZoomIn}
            title="Zoom In"
            disabled={zoom >= 1.5}
          >
            <HiMagnifyingGlassPlus />
          </button>
          <button
            type="button"
            className="btn btn-secondary resume-preview__zoom-btn"
            onClick={handleZoomReset}
            title="Reset Zoom to 100%"
          >
            <HiArrowPath />
          </button>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleDownloadPdf} disabled={isDownloading}>
          <HiArrowDownTray />
          {isDownloading ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </header>

      {/* Editor preview viewport — shows stacked A4 pages with gap */}
      <div className="resume-preview__viewport">
        <div className="resume-preview__stage">
          <div
            ref={paperRef}
            className="resume-preview__paper"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
          >
            {renderTemplate(false)}
          </div>
        </div>
      </div>

      {/* Dedicated export container: completely isolated from viewport */}
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
          overflow: 'visible',
          minHeight: `${A4_HEIGHT}px`,
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
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Generating Recruiter-Ready PDF...</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Building content-aware multi-page A4 layout</p>
        </div>
      )}
    </div>
  );
}

export default ResumePreview;
