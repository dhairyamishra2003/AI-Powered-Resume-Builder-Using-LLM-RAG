import React, { useRef, useState, useLayoutEffect } from 'react';
import {
  HiEnvelope,
  HiPhone,
  HiMapPin,
  HiGlobeAlt,
  HiCalendarDays,
  HiArrowTopRightOnSquare,
} from 'react-icons/hi2';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

// Standard A4 Canvas Dimensions at 96 DPI: 794px x 1122.5px (210mm x 297mm)
// We cap at 1121px for jsPDF safety so page count is strictly 1.
export const A4_WIDTH = 794;
export const A4_HEIGHT = 1121;

export const ExportModeContext = React.createContext(false);

export function A4Canvas({
  children,
  style = {},
  fontFamily = "'Inter', system-ui, sans-serif",
  className = '',
  isExport = false,
}) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const isContextExport = React.useContext(ExportModeContext);
  const isExportMode = isExport || isContextExport;
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    if (isExportMode) {
      setScale(1);
      return;
    }

    const el = innerRef.current;
    if (!el) return;

    const measureAndScale = () => {
      // In preview mode: scale smoothly to fit 1 page if content exceeds A4 height
      el.style.transform = 'none';
      el.style.width = '100%';

      const contentHeight = el.scrollHeight;

      if (contentHeight > A4_HEIGHT + 2) {
        // Compute exact scale so all content fits on 1 preview page without arbitrary clamp
        const computedScale = Math.min(
          1,
          (A4_HEIGHT - 2) / contentHeight
        );

        setScale(computedScale);
      } else {
        setScale(1);
      }
    };

    measureAndScale();

    // Re-check after document fonts have loaded to avoid font-swap clipping
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready
        .then(measureAndScale)
        .catch(() => { });
    }

    const observer = new ResizeObserver(() => {
      measureAndScale();
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, [children, isExportMode]);

  return (
    <div
      ref={outerRef}
      className={`a4-resume-canvas ${className}`}
      style={{
        width: `${A4_WIDTH}px`,
        height: isExportMode ? 'auto' : `${A4_HEIGHT}px`,
        minHeight: `${A4_HEIGHT}px`,
        maxHeight: isExportMode ? 'none' : `${A4_HEIGHT}px`,
        overflow: isExportMode ? 'visible' : 'hidden',
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
        ref={innerRef}
        className="a4-resume-inner"
        style={{
          width:
            !isExportMode && scale < 1
              ? `${Math.round(A4_WIDTH / scale)}px`
              : '100%',

          minHeight:
            !isExportMode && scale < 1
              ? `${Math.round(A4_HEIGHT / scale)}px`
              : '100%',

          transform:
            !isExportMode && scale < 1
              ? `scale(${scale})`
              : 'none',

          transformOrigin: 'top left',

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

// Two-Column Layout (Sidebar: ~29-32%, Main: ~68-71%)
export function TwoColumnLayout({
  sidebar,
  main,
  sidebarBackground = '#f8fafc',
  sidebarBorder = '1px solid #e2e8f0',
  sidebarWidth = '30%',
  sidebarPadding = '14px 12px',
  mainPadding = '14px 18px',
  justifyContent = 'flex-start',
  gap = '10px',
}) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        flex: 1,
        minHeight: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Sidebar Column */}
      <div
        style={{
          width: sidebarWidth,
          background: sidebarBackground,
          borderRight: sidebarBorder,
          padding: sidebarPadding,
          display: 'flex',
          flexDirection: 'column',
          justifyContent,
          gap,
          boxSizing: 'border-box',
          flexShrink: 0,
          minHeight: '100%',
        }}
      >
        {sidebar}
      </div>

      {/* Main Content Column */}
      <div
        style={{
          width: `calc(100% - ${sidebarWidth})`,
          flex: 1,
          padding: mainPadding,
          display: 'flex',
          flexDirection: 'column',
          justifyContent,
          gap,
          boxSizing: 'border-box',
          minHeight: 0,
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
        justifyContent: 'space-between',
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
        fontSize: '11px',
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
        ...style,
      }}
    >
      {Icon && (
        <Icon
          style={{
            color: accentColor,
            fontSize: '13px',
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
          fontSize: '10px',
          color: textColor,
          lineHeight: 1.45,
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
          fontSize: '9.5px',
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
                  fontSize: '11px',
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
        fontSize: '9.5px',
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
                  fontSize: '11px',
                  flexShrink: 0,
                }}
              />
            )}

            <span
              style={{
                whiteSpace: 'nowrap',
              }}
            >
              {item.text}
            </span>

            {align === 'right' && (
              <Icon
                style={{
                  color: accentColor,
                  fontSize: '11px',
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
              fontSize: '11px',
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
                  fontSize: '10px',
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
            fontSize: '9px',
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
                    fontSize: '10px',
                  }}
                />
              ) : (
                <HiArrowTopRightOnSquare
                  style={{
                    fontSize: '10px',
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
                  fontSize: '10px',
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
                  fontSize: '8.5px',
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
            fontSize: '9.5px',
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
        marginBottom: '6px',
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
              fontSize: '11.5px',
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
              fontSize: '9px',
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
            margin: '3px 0 0 15px',
            padding: 0,
            fontSize: '9.5px',
            color: '#334155',
            lineHeight: 1.4,
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

// Auto-wrapping Skill Badge List
export function SkillBadges({
  skills = [],
  background = '#eff6ff',
  borderColor = '#bfdbfe',
  textColor = '#1e40af',
  size = 'normal',
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

  const isSmall = size === 'small';

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: isSmall
          ? '3px 4px'
          : '4px 5px',
        ...style,
      }}
    >
      {validSkills.map((sk, i) => (
        <span
          key={i}
          style={{
            background,
            border: `1px solid ${borderColor}`,
            color: textColor,
            padding: isSmall
              ? '1.5px 5px'
              : '2px 7px',
            borderRadius: '4px',
            fontSize: isSmall
              ? '8.5px'
              : '9.5px',
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
}) {
  if (!degree && !institution) return null;

  return (
    <div
      style={{
        fontSize: '10px',
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
          fontSize: '9.5px',
        }}
      >
        {institution}
      </div>

      {(startDate || endDate || gpa) && (
        <div
          style={{
            color: '#64748b',
            fontSize: '9px',
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