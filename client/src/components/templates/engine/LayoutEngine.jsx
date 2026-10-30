import React from 'react';
import {
  HiEnvelope,
  HiPhone,
  HiMapPin,
  HiGlobeAlt,
  HiCalendarDays,
  HiArrowTopRightOnSquare,
} from 'react-icons/hi2';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { resumeTypography, RESUME_FONT_SCALE } from '../../../config/resumeTypography.js';

// Single source of truth for the rendered A4 page. Both the viewport and the
// HTML-to-PDF exporter capture this exact CSS-pixel canvas (96 DPI).
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;

// Usable body height inside one A4 page after the natural bottom margin.
export const A4_BODY_HEIGHT = A4_HEIGHT - 16;

export const ExportModeContext = React.createContext(false);

// Scales only components explicitly opting in with `fontScale`; default 1
// preserves existing templates exactly.
const scaledFont = (value, scale = 1) =>
  typeof value === 'number' ? Math.round(value * scale * 10) / 10 : value;

// ─────────────────────────────────────────────────────────────────────────────
// PageBlock — atomic content wrapper used by MultiPageA4Canvas
// ─────────────────────────────────────────────────────────────────────────────
export function PageBlock({ children, id, style = {} }) {
  return (
    <div
      data-page-block={id || 'block'}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MultiPageA4Canvas — content-aware, DOM-measured paginator
//
// Usage:
//   <MultiPageA4Canvas header={<HeaderJSX />} fontFamily="...">
//     <PageBlock id="summary">…</PageBlock>
//     <PageBlock id="exp-0">…</PageBlock>
//   </MultiPageA4Canvas>
//
// Pagination rules:
//   • Every <PageBlock> is atomic — never split across pages.
//   • The header JSX is rendered identically on every page.
//   • Short content stays on one page; detailed content auto-expands.
//   • Preview and PDF export use IDENTICAL page DOM — no separate rebuild.
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// PageRunningHeader — subtle running header for Page 2 continuation
// ─────────────────────────────────────────────────────────────────────────────
export function PageRunningHeader({
  fullName,
  targetRole,
  primaryColor = '#0f172a',
  pageNum = 2,
  fontFamily = 'inherit',
  fontScale = 1,
  style = {},
}) {
  if (!fullName) return null;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '4px',
        marginBottom: '12px',
        fontSize: scaledFont(resumeTypography.runningHeader, fontScale),
        color: '#64748b',
        fontFamily,
        boxSizing: 'border-box',
        width: '100%',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontWeight: 700, color: primaryColor, letterSpacing: '0.2px' }}>
          {fullName}
        </span>
        {targetRole && (
          <>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ color: '#64748b' }}>{targetRole}</span>
          </>
        )}
      </div>
      <span
        style={{
          fontSize: scaledFont(resumeTypography.pageNumber, fontScale),
          fontWeight: 600,
          color: '#94a3b8',
          letterSpacing: '0.6px',
          textTransform: 'uppercase',
        }}
      >
        Page {pageNum}
      </span>
    </div>
  );
}

function parsePadding(pad) {
  if (typeof pad === 'number') {
    return { top: pad, right: pad, bottom: pad, left: pad };
  }
  if (!pad || typeof pad !== 'string') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  const parts = pad.trim().split(/\s+/).map((p) => parseFloat(p) || 0);
  if (parts.length === 1) {
    return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  }
  if (parts.length === 2) {
    return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  }
  if (parts.length === 3) {
    return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  }
  return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
}

// ─────────────────────────────────────────────────────────────────────────────
// TwoPageResumeCanvas / MultiPageA4Canvas
//
// The resume behaves as ONE UNIFIED DOCUMENT divided into natural pages.
// Page 1: Full Header + (optional) Sidebar + Main Content (Summary, Exp, Projects)
// Page 2: (Optional subtle running header) + Full-width continuation of remaining
//         projects, education, certifications, and languages.
//
// Crucial: Header and Sidebar NEVER repeat on Page 2!
// No duplicate skills, strengths, education, or languages.
// Target: exactly 2 A4 pages for detailed resumes.
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// TwoPageResumeCanvas / MultiPageA4Canvas
//
// The resume behaves as ONE UNIFIED DOCUMENT divided into natural pages.
// Page 1: Full Header + (optional) Sidebar + Main Content (Summary, Exp, Projects)
// Page 2: Running Header + Full-width continuation of remaining content.
//
// Every populated resume renders as a clean, balanced TWO-PAGE A4 document.
// ─────────────────────────────────────────────────────────────────────────────
export function TwoPageResumeCanvas({
  header,
  sidebar = null,
  sidebarSections = null,
  page2Header = null,
  blocks = null,
  children = null,
  fontFamily = "'Inter', system-ui, sans-serif",
  pageGap = 24,
  sidebarWidth = '238px',
  lockSidebarWidth = true,
  sidebarBackground = '#f8fafc',
  sidebarBorder = '1px solid #e2e8f0',
  sidebarPadding = '12px 10px',
  page2Sidebar = null,
  mainPadding = '12px 16px',
  page2Padding = '16px 22px',
  twoColumnGap = '10px',
  blockGap = 8,
  className = '',
  forceTwoPages = true,
  disablePage2Sidebar = false,
}) {
  const isExportMode = React.useContext(ExportModeContext);
  const twoColumnGapCss = typeof twoColumnGap === 'number' ? `${twoColumnGap}px` : twoColumnGap;

  const [pagination, setPagination] = React.useState(null);

  const headerProbeRef = React.useRef(null);
  const page2HeaderProbeRef = React.useRef(null);
  const mainProbeRef = React.useRef(null);
  const sidebarProbeRef = React.useRef(null);

  // Normalize blocks: support either `blocks` array of objects OR `children`
  const normalizedBlocks = React.useMemo(() => {
    if (Array.isArray(blocks) && blocks.length > 0) {
      return blocks;
    }
    const childArray = React.Children.toArray(children);
    return childArray.map((child, idx) => ({
      id: child.props?.id || `block-${idx}`,
      type: child.props?.id || 'block',
      render: () => child,
    }));
  }, [blocks, children]);

  const normalizedSidebarSections = React.useMemo(() => {
    if (Array.isArray(sidebarSections) && sidebarSections.length > 0) {
      return sidebarSections;
    }
    return null;
  }, [sidebarSections]);

  // Compute initial balanced partition so pages are immediately rendered in SSR & first paint
  const initialPagination = React.useMemo(() => {
    const explicitPage2Index = normalizedBlocks.findIndex(
      (b) => b.pageBreakBefore || b.forcePage === 2
    );

    let p1 = [];
    let p2 = [];

    if (explicitPage2Index !== -1 && explicitPage2Index > 0) {
      normalizedBlocks.forEach((_, i) => {
        if (i < explicitPage2Index) p1.push(i);
        else p2.push(i);
      });
    } else {
      const half = normalizedBlocks.length >= 2 ? Math.max(1, Math.ceil(normalizedBlocks.length * 0.55)) : normalizedBlocks.length;
      normalizedBlocks.forEach((_, i) => {
        if (i < half) p1.push(i);
        else p2.push(i);
      });
    }

    return {
      page1: p1,
      page2: p2,
      effectiveBlocks: normalizedBlocks,
      sidebarPage1Sections: normalizedSidebarSections || [],
      sidebarOverflowBlocks: [],
      usablePage1: A4_HEIGHT - 120,
      usablePage2: A4_HEIGHT - 70,
    };
  }, [normalizedBlocks, normalizedSidebarSections]);

  const measureKey = `${normalizedBlocks.map((b) => b.id).join('|')}|${normalizedBlocks.length}|${normalizedSidebarSections ? normalizedSidebarSections.map((s) => `${s.id}:${s.items?.length || 0}`).join('|') : ''}|${Boolean(page2Sidebar)}|${RESUME_FONT_SCALE}|${sidebarWidth}|${twoColumnGapCss}|${lockSidebarWidth}|${disablePage2Sidebar}`;

  React.useLayoutEffect(() => {
    const probeEl = mainProbeRef.current;
    const headerEl = headerProbeRef.current;
    if (!probeEl) return;

    // 1. Measure header height (Page 1 only)
    const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
    const page2HeaderH = page2HeaderProbeRef.current
      ? page2HeaderProbeRef.current.getBoundingClientRect().height
      : 0;

    // 2. Usable heights
    const parsedPad = parsePadding(mainPadding);
    const parsedSidebarPad = parsePadding(sidebarPadding);
    // Sectioned sidebars may overflow only after this measurement pass. Reserve
    // the Page 2 two-column chrome up front so that pass cannot overfill Page 2.
    const page2UsesTwoColumns = !disablePage2Sidebar && Boolean(page2Sidebar || normalizedSidebarSections);
    const parsedPage2Pad = parsePadding(page2UsesTwoColumns ? mainPadding : page2Padding);

    const usablePage1 = Math.max(100, A4_HEIGHT - headerH - parsedPad.top - parsedPad.bottom - 10);
    const usableSidebar1 = Math.max(100, A4_HEIGHT - headerH - parsedSidebarPad.top - parsedSidebarPad.bottom - 10);
    // A supplied Page 2 sidebar places the running header in a wrapper with
    // 12px top padding. Account for that real rendered space as well as the
    // main column padding; otherwise the last Page 2 block can be clipped by
    // the fixed-height A4 canvas.
    const page2HeaderTopOffset = page2UsesTwoColumns ? 12 : 0;
    const usablePage2 = Math.max(
      100,
      A4_HEIGHT - page2HeaderH - page2HeaderTopOffset - parsedPage2Pad.top - parsedPage2Pad.bottom - 10
    );

    // 3. Partition sidebar sections (if provided)
    let sidebarPage1Sections = [];
    let sidebarOverflowBlocks = [];

    if (normalizedSidebarSections && sidebarProbeRef.current) {
      const sideEls = sidebarProbeRef.current.querySelectorAll('[data-sidebar-section]');
      let sideH = 0;

      sideEls.forEach((el, sIdx) => {
        const sSection = normalizedSidebarSections[sIdx];
        if (!sSection) return;
        const sh = Math.ceil(el.getBoundingClientRect().height);
        const gap = sidebarPage1Sections.length > 0 ? 12 : 0;

        // A skill section opts into item-level continuation. Its individual
        // chips are measured in the real sidebar width, so wrapping, headings,
        // padding, and preceding sections determine the split—not a guessed
        // count or fixed height.
        if (Array.isArray(sSection.items) && sSection.items.length > 0) {
          const itemEls = [...el.querySelectorAll('[data-sidebar-skill]')];
          const available = usableSidebar1 - sideH - gap;
          const sectionTop = el.getBoundingClientRect().top;
          let fitCount = 0;
          for (let i = 0; i < itemEls.length; i++) {
            const itemBottom = itemEls[i].getBoundingClientRect().bottom;
            if (itemBottom - sectionTop <= available) {
              fitCount = i + 1;
            } else {
              break;
            }
          }

          if (fitCount === sSection.items.length) {
            sidebarPage1Sections.push(sSection);
            sideH += gap + sh;
          } else {
            if (fitCount > 0) {
              sidebarPage1Sections.push({
                ...sSection,
                id: `${sSection.id}-page-1`,
                items: sSection.items.slice(0, fitCount),
              });
            }
            sidebarOverflowBlocks.push({
              ...sSection,
              id: `${sSection.id}-page-2`,
              items: sSection.items.slice(fitCount),
              isContinued: true,
            });
            // Preserve sidebar order: once a section continues, every later
            // section belongs to Page 2 rather than jumping ahead on Page 1.
            sideH = usableSidebar1;
          }
          return;
        }

        if (sideH < usableSidebar1 && sideH + gap + sh <= usableSidebar1) {
          sidebarPage1Sections.push(sSection);
          sideH += gap + sh;
        } else {
          // Keep sidebar overflow in Page 2's sidebar. Appending it after the
          // main blocks made its height unmeasured and allowed it to fall below
          // the fixed, clipped Page 2 canvas.
          sidebarOverflowBlocks.push({
            ...sSection,
            isContinued: false,
          });
          sideH = usableSidebar1;
        }
      });
    }

    // 4. Sidebar overflow is intentionally not part of the main-column flow.
    const effectiveBlocks = normalizedBlocks;

    // Measure block heights inside probe
    const blockEls = probeEl.querySelectorAll('[data-page-block]');
    const blockHeights = [];
    blockEls.forEach((el) => {
      blockHeights.push(Math.ceil(el.getBoundingClientRect().height));
    });

    // 5. Place blocks onto Page 1 and Page 2
    let page1 = [];
    let page2 = [];
    let currentH = 0;

    for (let i = 0; i < blockHeights.length; i++) {
      const block = effectiveBlocks[i];
      const h = blockHeights[i];
      const gap = page1.length > 0 ? blockGap : 0;

      if (page1.length > 0 && (block?.pageBreakBefore || block?.forcePage === 2)) {
        for (let j = i; j < blockHeights.length; j++) {
          page2.push(j);
        }
        break;
      }

      if (block?.forcePage === 1 || currentH + gap + h <= usablePage1) {
        page1.push(i);
        currentH += gap + h;
      } else {
        // Remaining blocks move to Page 2
        for (let j = i; j < blockHeights.length; j++) {
          page2.push(j);
        }
        break;
      }
    }

    // 6. Two-Page Guarantee & Balance
    const usedHeight = (indexes) =>
      indexes.reduce(
        (total, index, position) => total + (blockHeights[index] || 0) + (position ? blockGap : 0),
        0
      );

    const totalContentHeight = blockHeights.reduce((sum, h) => sum + h + blockGap, 0);

    // If all blocks fit on Page 1, but we require a 2-page resume:
    if (page2.length === 0 && effectiveBlocks.length >= 2 && forceTwoPages) {
      const targetPage1Height = Math.max(
        usablePage1 * 0.45,
        Math.min(usablePage1 * 0.8, totalContentHeight * 0.58)
      );

      while (page1.length > 1 && usedHeight(page1) > targetPage1Height) {
        const movingIndex = page1.pop();
        page2.unshift(movingIndex);
      }

      // Ensure at least 1 block moves to page 2 if page 1 still has >= 2 blocks
      if (page2.length === 0 && page1.length > 1) {
        const movingIndex = page1.pop();
        page2.unshift(movingIndex);
      }
    } else if (page2.length > 0) {
      // Natural overflow: balance trailing blocks so Page 2 looks intentional
      let adjustedUsablePage2 = usablePage2;
      if (disablePage2Sidebar && sidebarOverflowBlocks.length > 0 && sidebarProbeRef.current) {
        let sideOvfH = 0;
        sidebarOverflowBlocks.forEach((sec) => {
          const sideEl = sidebarProbeRef.current.querySelector(`[data-sidebar-section="${sec.id.replace(/-page-\d+$/, '')}"]`);
          if (sideEl) sideOvfH += Math.ceil(sideEl.getBoundingClientRect().height) + blockGap;
        });
        adjustedUsablePage2 = Math.max(100, usablePage2 - sideOvfH);
      }

      let page1Height = usedHeight(page1);
      let page2Height = usedHeight(page2);
      const targetPage2 = Math.min(adjustedUsablePage2 * 0.88, (page1Height + page2Height) * 0.46);

      while (page1.length > 1 && page2Height < targetPage2) {
        const movingIndex = page1[page1.length - 1];
        const movingHeight = blockHeights[movingIndex] || 0;
        const projectedPage2 = page2Height + movingHeight + (page2.length ? blockGap : 0);

        if (projectedPage2 > adjustedUsablePage2) break;

        page1.pop();
        page2.unshift(movingIndex);
        page1Height = usedHeight(page1);
        page2Height = usedHeight(page2);
      }
    }

    setPagination({
      page1,
      page2,
      effectiveBlocks,
      sidebarPage1Sections,
      sidebarOverflowBlocks,
      usablePage1,
      usablePage2,
    });
  }, [
    measureKey,
    normalizedBlocks,
    normalizedSidebarSections,
    blockGap,
    mainPadding,
    sidebarPadding,
    page2Padding,
    RESUME_FONT_SCALE,
    sidebarWidth,
    twoColumnGapCss,
    lockSidebarWidth,
    forceTwoPages,
    disablePage2Sidebar,
  ]);

  const activePagination = pagination || initialPagination;

  const pageShell = {
    width: `${A4_WIDTH}px`,
    height: `${A4_HEIGHT}px`,
    minHeight: `${A4_HEIGHT}px`,
    maxHeight: `${A4_HEIGHT}px`,
    overflow: 'hidden',
    background: '#ffffff',
    fontFamily,
    color: '#1e293b',
    boxSizing: 'border-box',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    flexShrink: 0,
  };

  const hasAnyContent = normalizedBlocks.length > 0 || (normalizedSidebarSections && normalizedSidebarSections.length > 0) || Boolean(sidebar);

  const {
    page1,
    page2,
    effectiveBlocks,
    sidebarPage1Sections,
    sidebarOverflowBlocks,
  } = activePagination;
  const hasPage2 = forceTwoPages ? hasAnyContent : page2.length > 0;

  const renderedSidebar = normalizedSidebarSections ? (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {(sidebarPage1Sections || []).map((s) => (
        <div key={s.id} data-sidebar-block={s.id} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          {typeof s.render === 'function'
            ? s.render({ page: 1, isSidebar: true, items: s.items, hasPage2 })
            : s.content || s.render}
        </div>
      ))}
    </div>
  ) : (
    sidebar
  );

  const renderedPage2Sidebar = (!disablePage2Sidebar && (page2Sidebar || sidebarOverflowBlocks?.length > 0)) ? (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {page2Sidebar}
      {(sidebarOverflowBlocks || []).map((section) => (
        <div key={`side-ovf-${section.id}`} data-sidebar-block={`side-ovf-${section.id}`}>
          {typeof section.render === 'function'
            ? section.render({
                page: 2,
                isSidebar: true,
                isOverflow: Boolean(section.isContinued),
                items: section.items,
                hasPage2,
              })
            : section.content || section.render}
        </div>
      ))}
    </div>
  ) : null;

  const wrapperStyle = isExportMode
    ? { display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'flex-start' }
    : { display: 'flex', flexDirection: 'column', gap: `${pageGap}px`, alignItems: 'flex-start' };

  const probeMainWidth = sidebar || normalizedSidebarSections || page2Sidebar
    ? `${A4_WIDTH - parseFloat(sidebarWidth) - parseFloat(twoColumnGapCss) - 30}px`
    : '100%';

  return (
    <>
      {/* ── Invisible Probe Container (Always mounted offscreen for reliable DOM measurement) ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: '-99999px',
          width: `${A4_WIDTH}px`,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
          fontFamily,
          color: '#1e293b',
          boxSizing: 'border-box',
        }}
      >
        <div ref={headerProbeRef}>{header}</div>
        {page2Header && <div ref={page2HeaderProbeRef}>{page2Header}</div>}

        {/* Sidebar Probe (if using sectioned sidebar) */}
        {normalizedSidebarSections && (
          <div
            ref={sidebarProbeRef}
            style={{
              width: sidebarWidth,
              padding: sidebarPadding,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {normalizedSidebarSections.map((s) => (
              <div key={s.id} data-sidebar-section={s.id} style={{ width: '100%', boxSizing: 'border-box' }}>
                {typeof s.render === 'function'
                  ? s.render({ page: 1, isProbe: true, items: s.items, hasPage2: forceTwoPages ? hasAnyContent : false })
                  : s.content || s.render}
              </div>
            ))}
          </div>
        )}

        {/* Main Column Probe */}
        <div
          ref={mainProbeRef}
          style={{
            width: probeMainWidth,
            padding: mainPadding,
            display: 'flex',
            flexDirection: 'column',
            gap: `${blockGap}px`,
            boxSizing: 'border-box',
          }}
        >
          {normalizedBlocks.map((b) => (
            <div
              key={b.id}
              data-page-block={b.id}
              style={{
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {typeof b.render === 'function'
                ? b.render({
                    page: 1,
                    isProbe: true,
                    isFirstOnPage: false,
                    sectionStartedOnPrevPage: false,
                    hasPage2: forceTwoPages ? hasAnyContent : false,
                  })
                : b.content || b.render}
            </div>
          ))}
        </div>
      </div>

      {/* ── Active Pages (Guaranteed 2 A4 Pages) ─────────────────────────── */}
      <div className={`multi-page-resume ${className}`} style={wrapperStyle}>
        {/* ── PAGE 1 ────────────────────────────────────────────────────────── */}
      <div
        className="a4-resume-canvas"
        data-page-index={0}
        data-resume-page="1"
        style={{
          ...pageShell,
          boxShadow: isExportMode ? 'none' : '0 2px 16px rgba(15,23,42,0.13)',
          borderRadius: isExportMode ? 0 : '2px',
        }}
      >
        {/* Document Header (Page 1 ONLY) */}
        {header}

        {/* Page 1 Body */}
        {renderedSidebar ? (
          <TwoColumnLayout
            sidebar={renderedSidebar}
            main={
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: `${blockGap}px`,
                  padding: mainPadding,
                  boxSizing: 'border-box',
                  width: '100%',
                  minWidth: 0,
                }}
              >
                {page1.map((idx) => {
                  const b = effectiveBlocks[idx];
                  if (!b) return null;
                  return (
                    <div
                      key={b.id}
                      data-block-id={b.id}
                      style={{
                        breakInside: 'avoid',
                        pageBreakInside: 'avoid',
                        width: '100%',
                        minWidth: 0,
                        boxSizing: 'border-box',
                      }}
                    >
                      {typeof b.render === 'function'
                        ? b.render({
                            page: 1,
                            isFirstOnPage: idx === page1[0],
                            sectionStartedOnPrevPage: false,
                            hasPage2,
                          })
                        : b.content || b.render}
                    </div>
                  );
                })}
              </div>
            }
            sidebarBackground={sidebarBackground}
            sidebarBorder={sidebarBorder}
            sidebarWidth={sidebarWidth}
            lockSidebarWidth={lockSidebarWidth}
            sidebarPadding={sidebarPadding}
            mainPadding="0px"
            gap={twoColumnGapCss}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: `${blockGap}px`,
              padding: mainPadding,
              boxSizing: 'border-box',
              flex: 1,
              width: '100%',
              minWidth: 0,
            }}
          >
            {page1.map((idx) => {
              const b = effectiveBlocks[idx];
              if (!b) return null;
              return (
                <div
                  key={b.id}
                  data-block-id={b.id}
                  style={{
                    breakInside: 'avoid',
                    pageBreakInside: 'avoid',
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  {typeof b.render === 'function'
                    ? b.render({
                        page: 1,
                        isFirstOnPage: idx === page1[0],
                        sectionStartedOnPrevPage: false,
                      })
                    : b.content || b.render}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── PAGE 2 (Continuation Header + Remaining Content) ──────────────── */}
      {hasPage2 && (
        <div
          className="a4-resume-canvas"
          data-page-index={1}
          data-resume-page="2"
          style={{
            ...pageShell,
            boxShadow: isExportMode ? 'none' : '0 2px 16px rgba(15,23,42,0.13)',
            borderRadius: isExportMode ? 0 : '2px',
          }}
        >
          {renderedPage2Sidebar ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                flex: 1,
                width: '100%',
                minWidth: 0,
              }}
            >
              {/* Page 2 Running Header (full width at top) */}
              {page2Header && (
                <div style={{ padding: '12px 20px 0 20px', boxSizing: 'border-box', width: '100%' }}>
                  {page2Header}
                </div>
              )}

              {/* Page 2 Two-Column Body */}
              <TwoColumnLayout
                sidebar={renderedPage2Sidebar}
                main={
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: `${blockGap}px`,
                      padding: mainPadding,
                      boxSizing: 'border-box',
                      width: '100%',
                      minWidth: 0,
                    }}
                  >
                    {page2.map((idx, posInPage2) => {
                      const b = effectiveBlocks[idx];
                      if (!b) return null;
                      const sectionStartedOnPrevPage =
                        b.type && page1.some((p1Idx) => effectiveBlocks[p1Idx]?.type === b.type);
                      const isFirstOfThisSectionOnPage = !page2
                        .slice(0, posInPage2)
                        .some((p2PrevIdx) => effectiveBlocks[p2PrevIdx]?.type === b.type);

                      return (
                        <div
                          key={b.id}
                          data-block-id={b.id}
                          style={{
                            breakInside: 'avoid',
                            pageBreakInside: 'avoid',
                            width: '100%',
                            minWidth: 0,
                            boxSizing: 'border-box',
                          }}
                        >
                          {typeof b.render === 'function'
                            ? b.render({
                                page: 2,
                                isFirstOnPage: posInPage2 === 0,
                                sectionStartedOnPrevPage,
                                isFirstOfThisSectionOnPage,
                                hasPage2,
                              })
                            : b.content || b.render}
                        </div>
                      );
                    })}
                  </div>
                }
                sidebarBackground={sidebarBackground}
                sidebarBorder={sidebarBorder}
                sidebarWidth={sidebarWidth}
                lockSidebarWidth={lockSidebarWidth}
                sidebarPadding={sidebarPadding}
                mainPadding="0px"
                gap={twoColumnGapCss}
              />
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: page2Padding,
                boxSizing: 'border-box',
                flex: 1,
                width: '100%',
                minWidth: 0,
              }}
            >
              {/* Page 2 Running Header */}
              {page2Header}

              {/* Page 2 Full-Width Continuation Body */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: `${blockGap}px`,
                  boxSizing: 'border-box',
                  flex: 1,
                  width: '100%',
                  minWidth: 0,
                }}
              >
                {page2.map((idx, posInPage2) => {
                  const b = effectiveBlocks[idx];
                  if (!b) return null;
                  const sectionStartedOnPrevPage =
                    b.type && page1.some((p1Idx) => effectiveBlocks[p1Idx]?.type === b.type);
                  const isFirstOfThisSectionOnPage = !page2
                    .slice(0, posInPage2)
                    .some((p2PrevIdx) => effectiveBlocks[p2PrevIdx]?.type === b.type);

                  return (
                    <div
                      key={b.id}
                      data-block-id={b.id}
                      style={{
                        breakInside: 'avoid',
                        pageBreakInside: 'avoid',
                        width: '100%',
                        minWidth: 0,
                        boxSizing: 'border-box',
                      }}
                    >
                      {typeof b.render === 'function'
                        ? b.render({
                            page: 2,
                            isFirstOnPage: posInPage2 === 0,
                            sectionStartedOnPrevPage,
                            isFirstOfThisSectionOnPage,
                            hasPage2,
                          })
                        : b.content || b.render}
                    </div>
                  );
                })}
                {disablePage2Sidebar && (sidebarOverflowBlocks || []).map((section) => (
                  <div
                    key={`side-ovf-${section.id}`}
                    data-block-id={section.id}
                    data-sidebar-block={`side-ovf-${section.id}`}
                    style={{
                      breakInside: 'avoid',
                      pageBreakInside: 'avoid',
                      width: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box',
                    }}
                  >
                    {typeof section.render === 'function'
                      ? section.render({
                          page: 2,
                          isSidebar: false,
                          isOverflow: Boolean(section.isContinued),
                          items: section.items,
                          hasPage2,
                        })
                      : section.content || section.render}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </>
);
}

// MultiPageA4Canvas is an alias to TwoPageResumeCanvas
export const MultiPageA4Canvas = TwoPageResumeCanvas;

export function A4Canvas({
  children,
  style = {},
  fontFamily = "'Inter', system-ui, sans-serif",
  className = '',
  isExport = false,
}) {
  const isContextExport = React.useContext(ExportModeContext);
  const isExportMode = isExport || isContextExport;

  return (
    <div
      className={`a4-resume-canvas ${className}`}
      style={{
        width: `${A4_WIDTH}px`,
        height: `${A4_HEIGHT}px`,
        minHeight: `${A4_HEIGHT}px`,
        overflow: isExportMode ? 'visible' : 'visible',
        padding: '0',
        boxSizing: 'border-box',
        background: '#ffffff',
        fontFamily,
        color: '#1e293b',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        ...style,
      }}
    >
      <div
        className="a4-resume-inner"
        style={{
          width: '100%',
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Two-column layout with locked, fixed sidebar width
export function TwoColumnLayout({
  sidebar,
  main,
  sidebarBackground = '#f8fafc',
  sidebarBorder = '1px solid #e2e8f0',
  sidebarWidth = '238px',
  lockSidebarWidth = true,
  sidebarPadding = '14px 12px',
  mainPadding = '14px 18px',
  justifyContent = 'flex-start',
  gap = '10px',
}) {
  const columnGap = typeof gap === 'number' ? `${gap}px` : gap;
  const layoutStyle = {
    display: 'grid',
    gridTemplateColumns: `${sidebarWidth} minmax(0, 1fr)`,
    columnGap,
    alignItems: 'stretch',
    width: '100%',
    minWidth: 0,
    flex: 1,
    boxSizing: 'border-box',
  };

  return (
    <div style={layoutStyle}>
      {/* Sidebar Column */}
      <div
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          maxWidth: sidebarWidth,
          background: sidebarBackground,
          borderRight: sidebarBorder,
          padding: sidebarPadding,
          boxSizing: 'border-box',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
        }}
      >
        {sidebar}
      </div>

      {/* Main Content Column */}
      <div
        style={{
          minWidth: 0,
          padding: mainPadding,
          boxSizing: 'border-box',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
        }}
      >
        {main}
      </div>
    </div>
  );
}

// Single-Column Printable Layout (Full 100% Width)
export function OneColumnLayout({
  children,
  padding = '16px 24px',
  gap = '9px',
  justifyContent = 'flex-start',
}) {
  return (
    <div
      style={{
        width: '100%',
        flex: 1,
        minHeight: 0,
        padding,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap,
        justifyContent,
      }}
    >
      {children}
    </div>
  );
}

// Section Title with Icon and Underline Divider
export function SectionTitle({
  title,
  icon: Icon,
  primaryColor = '#0f172a',
  accentColor = '#2563eb',
  borderBottom = true,
  borderColor = null,
  fontFamily = null,
  style = {},
}) {
  return (
    <h2
      className="section-title"
      style={{
        fontSize: resumeTypography.sectionTitleDefault,
        fontWeight: 800,
        color: primaryColor,
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        borderBottom: borderBottom
          ? `1.5px solid ${borderColor || accentColor}`
          : 'none',
        paddingBottom: borderBottom ? '3px' : '0',
        margin: '0 0 5px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        lineHeight: 1.2,
        fontFamily: fontFamily || 'inherit',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
        breakAfter: 'avoid',
        pageBreakAfter: 'avoid',
        ...style,
      }}
    >
      {Icon && (
        <Icon
          style={{
            color: accentColor,
            fontSize: style.fontSize || resumeTypography.sectionTitleDefault,
            flexShrink: 0,
          }}
        />
      )}

      <span>{title}</span>
    </h2>
  );
}

// Summary Callout Card
export function SummaryCard({
  text,
  borderColor = '#2563eb',
  backgroundColor = '#f8fafc',
  textColor = '#334155',
  style = {},
}) {
  if (!text || !text.trim()) return null;

  return (
    <div
      style={{
        background: backgroundColor,
        border: '1px solid #e2e8f0',
        borderLeft: `3.5px solid ${borderColor}`,
        padding: '7px 12px',
        borderRadius: '4px',
        boxSizing: 'border-box',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
        ...style,
      }}
    >
      <p
        style={{
          fontSize: style?.fontSize || resumeTypography.summaryDefault,
          color: textColor,
          lineHeight: 1.5,
          margin: 0,
          fontWeight: 400,
        }}
      >
        {text}
      </p>
    </div>
  );
}

// Compact Contact List Row / Column
export function ContactList({
  personalInfo = {},
  align = 'right',
  textColor = '#475569',
  accentColor = '#2563eb',
  layout = 'column',
  fontScale = 1,
  style = {},
}) {
  const {
    email,
    phone,
    location,
    linkedIn,
    portfolio,
  } = personalInfo;

  if (
    !email &&
    !phone &&
    !location &&
    !linkedIn &&
    !portfolio
  ) {
    return null;
  }

  const items = [
    email && {
      icon: HiEnvelope,
      text: email,
      href: `mailto:${email}`,
    },

    phone && {
      icon: HiPhone,
      text: phone,
      href: `tel:${phone}`,
    },

    location && {
      icon: HiMapPin,
      text: location,
    },

    linkedIn && {
      icon: FaLinkedin,
      text: linkedIn.replace(
        /^https?:\/\/(www\.)?linkedin\.com\/in\//i,
        'linkedin.com/in/'
      ),
      href: linkedIn.startsWith('http')
        ? linkedIn
        : `https://${linkedIn}`,
    },

    portfolio && {
      icon: portfolio.includes('github')
        ? FaGithub
        : HiGlobeAlt,
      text: portfolio.replace(
        /^https?:\/\/(www\.)?/i,
        ''
      ),
      href: portfolio.startsWith('http')
        ? portfolio
        : `https://${portfolio}`,
    },
  ].filter(Boolean);

  if (layout === 'inline') {
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 14px',
          alignItems: 'center',
          justifyContent:
            align === 'center'
              ? 'center'
              : align === 'right'
                ? 'flex-end'
                : 'flex-start',
          fontSize: resumeTypography.contactDefault,
          color: textColor,
          ...style,
        }}
      >
        {items.map((item, idx) => {
          const Icon = item.icon;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Icon
                style={{
                  color: accentColor,
                  fontSize: scaledFont(resumeTypography.contactIcon, fontScale),
                  flexShrink: 0,
                }}
              />

              <span>{item.text}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        textAlign: align,
        fontSize: resumeTypography.contactDefault,
        color: textColor,
        ...style,
      }}
    >
      {items.map((item, idx) => {
        const Icon = item.icon;

        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                align === 'right'
                  ? 'flex-end'
                  : 'flex-start',
              gap: '5px',
            }}
          >
            {align === 'left' && (
              <Icon
                style={{
                  color: accentColor,
                  fontSize: scaledFont(resumeTypography.contactIcon, fontScale),
                  flexShrink: 0,
                }}
              />
            )}

            <span
              style={{
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                lineHeight: 1.3,
              }}
            >
              {item.text}
            </span>

            {align === 'right' && (
              <Icon
                style={{
                  color: accentColor,
                  fontSize: scaledFont(resumeTypography.contactIcon, fontScale),
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// High-Density Project Card (Matching Reference Design)
export function ProjectCard({
  name,
  description,
  technologies = [],
  link,
  startDate,
  endDate,
  date,
  bullets = [],
  accentColor = '#2563eb',
  cardBg = '#f8fafc',
  borderColor = '#e2e8f0',
  fontScale = 1,
  style = {},
}) {
  const validBullets = Array.isArray(bullets)
    ? bullets.filter(
      (b) =>
        b &&
        typeof b === 'string' &&
        b.trim().length > 0 &&
        (!description || b.trim().toLowerCase() !== description.trim().toLowerCase())
    )
    : [];

  const cleanLink = link
    ? link
      .replace(/^https?:\/\//i, '')
      .replace(/\/$/, '')
    : '';

  const dateStr =
    date ||
    (startDate
      ? `${startDate}${endDate ? ` – ${endDate}` : ''
      }`
      : '');

  return (
    <div
      className="project-card"
      style={{
        background: cardBg,
        border: `1px solid ${borderColor}`,
        padding: '6px 10px',
        borderRadius: '5px',
        boxSizing: 'border-box',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '8px',
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: scaledFont(resumeTypography.projectTitle, fontScale),
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.25,
            }}
          >
            {name}

            {description && (
              <span
                style={{
                  fontWeight: 400,
                  color: '#475569',
                  marginLeft: '6px',
                  fontSize: scaledFont(resumeTypography.projectDescription, fontScale),
                }}
              >
                – {description}
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '1px',
            flexShrink: 0,
            fontSize: scaledFont(resumeTypography.projectMeta, fontScale),
          }}
        >
          {cleanLink && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                color: accentColor,
                fontWeight: 600,
              }}
            >
              {cleanLink.includes('github') ? (
                <FaGithub
                  style={{
                    fontSize: scaledFont(resumeTypography.projectMeta, fontScale),
                  }}
                />
              ) : (
                <HiArrowTopRightOnSquare
                  style={{
                    fontSize: scaledFont(resumeTypography.projectMeta, fontScale),
                  }}
                />
              )}

              <span>{cleanLink}</span>
            </div>
          )}

          {dateStr && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                color: '#64748b',
              }}
            >
              <HiCalendarDays
                style={{
                  fontSize: scaledFont(resumeTypography.projectMeta, fontScale),
                }}
              />

              <span>{dateStr}</span>
            </div>
          )}
        </div>
      </div>

      {/* Technology Badges */}
      {Array.isArray(technologies) &&
        technologies.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '3px 4px',
              marginTop: '4px',
            }}
          >
            {technologies.map((t, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: scaledFont(resumeTypography.projectBadge, fontScale),
                  fontWeight: 600,
                  background: '#e2e8f0',
                  color: '#334155',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  lineHeight: 1.25,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

      {/* Bullets */}
      {validBullets.length > 0 && (
        <ul
          style={{
            margin: '3px 0 0 14px',
            padding: 0,
            fontSize: scaledFont(resumeTypography.bullet, fontScale),
            color: '#334155',
            lineHeight: 1.35,
          }}
        >
          {validBullets.map((b, i) => (
            <li
              key={i}
              style={{
                marginBottom: '1px',
              }}
            >
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Standardized Experience Item Component
export function ExperienceItem({
  role,
  company,
  startDate,
  endDate,
  current,
  bullets = [],
  accentColor = '#2563eb',
  dateBadge = true,
  fontScale = 1,
  style = {},
}) {
  const validBullets = Array.isArray(bullets)
    ? bullets.filter(
      (b) =>
        b &&
        typeof b === 'string' &&
        b.trim().length > 0
    )
    : [];

  if (
    !role &&
    !company &&
    validBullets.length === 0
  ) {
    return null;
  }

  const dateText =
    startDate || endDate || current
      ? `${startDate}${startDate && (endDate || current)
        ? ' – '
        : ''
      }${current ? 'Present' : endDate}`
      : '';

  return (
    <div
      className="experience-item"
      style={{
        marginBottom: `${6 * fontScale}px`,
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: '8px',
        }}
      >
        <div>
          <span
            style={{
              fontSize: scaledFont(resumeTypography.experienceRole, fontScale),
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            {role}

            {company && (
              <>
                <span
                  style={{
                    fontWeight: 400,
                    color: '#64748b',
                    margin: '0 4px',
                  }}
                >
                  at
                </span>

                <strong
                  style={{
                    color: accentColor,
                  }}
                >
                  {company}
                </strong>
              </>
            )}
          </span>
        </div>

        {dateText && (
          <span
            style={{
              fontSize: scaledFont(resumeTypography.experienceDate, fontScale),
              fontWeight: 600,
              color: accentColor,
              background: dateBadge
                ? '#f1f5f9'
                : 'transparent',
              padding: dateBadge
                ? '1px 6px'
                : '0',
              borderRadius: '3px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {dateText}
          </span>
        )}
      </div>

      {validBullets.length > 0 && (
        <ul
          style={{
            margin: '3px 0 0 16px',
            padding: 0,
            fontSize: scaledFont(resumeTypography.bullet, fontScale),
            color: '#334155',
            lineHeight: 1.42,
            listStyleType: 'disc',
          }}
        >
          {validBullets.map((b, i) => (
            <li
              key={i}
              style={{
                marginBottom: '2px',
                textAlign: 'left',
                overflowWrap: 'break-word',
                wordBreak: 'normal',
                lineHeight: 1.42,
              }}
            >
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Auto-wrapping skill chip list. Templates retain their distinct colour system
// while the common spacing keeps long technical stacks readable.
export function SkillBadges({
  skills = [],
  background = '#eff6ff',
  borderColor = '#bfdbfe',
  textColor = '#1e40af',
  size = 'normal',
  fontScale = 1,
  itemDataAttribute = null,
  style = {},
}) {
  const validSkills = Array.isArray(skills)
    ? skills.filter(
      (s) =>
        s &&
        typeof s === 'string' &&
        s.trim().length > 0
    )
    : [];

  if (validSkills.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: size === 'small' ? '3px 4px' : '4px 5px',
        ...style,
      }}
    >
      {validSkills.map((sk, i) => (
        <span
          key={i}
          {...(itemDataAttribute ? { [itemDataAttribute]: '' } : {})}
          style={{
            background,
            border: `1px solid ${borderColor}`,
            color: textColor,
            padding: size === 'small' ? `${2 * fontScale}px ${5 * fontScale}px` : `${2.5 * fontScale}px ${7 * fontScale}px`,
            borderRadius: '4px',
            fontSize: scaledFont(size === 'small' ? resumeTypography.technicalSkillsSmall : resumeTypography.technicalSkills, fontScale),
            fontWeight: 600,
            lineHeight: 1.25,
            display: 'inline-block',
          }}
        >
          {sk}
        </span>
      ))}
    </div>
  );
}

// Education Item
export function EducationItem({
  degree,
  field,
  institution,
  startDate,
  endDate,
  gpa,
  accentColor = '#2563eb',
  fontScale = 1,
}) {
  if (!degree && !institution) return null;

  return (
    <div
      style={{
        fontSize: scaledFont(resumeTypography.educationDegree, fontScale),
        lineHeight: 1.35,
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
      }}
    >
      <div
        style={{
          fontWeight: 700,
          color: '#0f172a',
        }}
      >
        {degree}{' '}

        {field && (
          <span
            style={{
              fontWeight: 600,
              color: '#334155',
            }}
          >
            in {field}
          </span>
        )}
      </div>

      <div
        style={{
          color: '#475569',
          fontSize: scaledFont(resumeTypography.educationInstitution, fontScale),
        }}
      >
        {institution}
      </div>

      {(startDate || endDate || gpa) && (
        <div
          style={{
            color: '#64748b',
            fontSize: scaledFont(resumeTypography.educationDate, fontScale),
            marginTop: '1px',
          }}
        >
          {startDate}

          {startDate && endDate
            ? ' – '
            : ''}

          {endDate}

          {gpa && (
            <span
              style={{
                marginLeft: '4px',
                fontWeight: 600,
                color: accentColor,
              }}
            >
              • CGPA: {gpa}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Side-by-side balanced dual section
// (e.g. Education + Certifications)
export function DualSectionRow({
  left,
  right,
  gap = '16px',
  style = {},
}) {
  if (!left && !right) return null;

  if (!left) {
    return <div style={style}>{right}</div>;
  }

  if (!right) {
    return <div style={style}>{left}</div>;
  }

  return (
    <div
      style={{
        display: 'flex',
        gap,
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
        ...style,
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        {left}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        {right}
      </div>
    </div>
  );
}

// Standardized Publication / Research Paper Item Component
export function PublicationItem({
  title,
  publisher,
  authors,
  date,
  link,
  description,
  accentColor = '#2563eb',
  fontScale = 1,
  style = {},
}) {
  const cleanLink = link
    ? link.replace(/^https?:\/\//i, '').replace(/\/$/, '')
    : '';

  return (
    <div
      className="publication-item"
      style={{
        marginBottom: '6px',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: scaledFont(resumeTypography.jobTitle || 11.5, fontScale),
              color: '#0f172a',
            }}
          >
            {title}
          </span>
          {publisher && (
            <span
              style={{
                fontStyle: 'italic',
                color: '#475569',
                marginLeft: '6px',
                fontSize: scaledFont(resumeTypography.companyName || 11, fontScale),
              }}
            >
              — {publisher}
            </span>
          )}
        </div>
        {date && (
          <span
            style={{
              fontSize: scaledFont(resumeTypography.dateBadge || 10, fontScale),
              color: '#64748b',
              flexShrink: 0,
              fontWeight: 600,
            }}
          >
            {date}
          </span>
        )}
      </div>

      {authors && (
        <div
          style={{
            fontSize: scaledFont(resumeTypography.bullet || 10.5, fontScale),
            color: '#64748b',
            marginTop: '1px',
          }}
        >
          <span style={{ fontWeight: 500 }}>Authors: </span>
          {authors}
        </div>
      )}

      {description && (
        <div
          style={{
            fontSize: scaledFont(resumeTypography.bullet || 10.5, fontScale),
            color: '#334155',
            marginTop: '2px',
            lineHeight: 1.35,
          }}
        >
          {description}
        </div>
      )}

      {cleanLink && (
        <div
          style={{
            fontSize: scaledFont(resumeTypography.contact || 10, fontScale),
            marginTop: '2px',
          }}
        >
          <a
            href={link.startsWith('http') ? link : `https://${link}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: accentColor,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            {cleanLink}
          </a>
        </div>
      )}
    </div>
  );
}
