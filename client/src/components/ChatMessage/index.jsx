// ============================================
// ChatMessage.jsx - Single Chat Message Bubble
// ============================================
// Displays user or assistant message with proper
// alignment and optional "Apply to resume" button.
// Supports markdown: **bold**, *italic*, # headers,
// - bullet lists, numbered lists, `code`, > blockquote
// ============================================

import { HiSparkles, HiCheckCircle } from 'react-icons/hi2';

// ---- Lightweight inline markdown renderer ----
// Converts **bold**, *italic*, `code`, and [link](url)
const renderInline = (text) => {
  const parts = [];
  // Combined regex: **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Push plain text before this match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2] !== undefined) {
      // **bold**
      parts.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      // *italic*
      parts.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4] !== undefined) {
      // `code`
      parts.push(
        <code key={key++} style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '1px 5px', borderRadius: '4px', fontSize: '0.85em', fontFamily: 'monospace' }}>
          {match[4]}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
};

// ---- Block-level markdown renderer ----
const MarkdownContent = ({ text, textColor }) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  let listItems = [];
  let listType = null; // 'ul' or 'ol'
  let keyCounter = 0;
  const k = () => keyCounter++;

  const flushList = () => {
    if (listItems.length === 0) return;
    if (listType === 'ol') {
      elements.push(
        <ol key={k()} style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '0.875rem', lineHeight: 1.6, color: textColor }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ marginBottom: '2px' }}>{renderInline(item)}</li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={k()} style={{ margin: '4px 0', paddingLeft: '18px', fontSize: '0.875rem', lineHeight: 1.6, color: textColor }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ marginBottom: '2px' }}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    }
    listItems = [];
    listType = null;
  };

  while (i < lines.length) {
    const line = lines[i];

    // ### Heading 3
    if (/^###\s+/.test(line)) {
      flushList();
      elements.push(
        <h4 key={k()} style={{ fontSize: '0.875rem', fontWeight: 700, color: textColor, margin: '8px 0 2px 0' }}>
          {renderInline(line.replace(/^###\s+/, ''))}
        </h4>
      );
      i++;
      continue;
    }

    // ## Heading 2
    if (/^##\s+/.test(line)) {
      flushList();
      elements.push(
        <h3 key={k()} style={{ fontSize: '0.9375rem', fontWeight: 700, color: textColor, margin: '10px 0 2px 0' }}>
          {renderInline(line.replace(/^##\s+/, ''))}
        </h3>
      );
      i++;
      continue;
    }

    // # Heading 1
    if (/^#\s+/.test(line)) {
      flushList();
      elements.push(
        <h2 key={k()} style={{ fontSize: '1rem', fontWeight: 800, color: textColor, margin: '10px 0 2px 0' }}>
          {renderInline(line.replace(/^#\s+/, ''))}
        </h2>
      );
      i++;
      continue;
    }

    // > Blockquote
    if (/^>\s+/.test(line)) {
      flushList();
      elements.push(
        <blockquote key={k()} style={{ borderLeft: '3px solid #818cf8', paddingLeft: '10px', margin: '4px 0', color: '#6366f1', fontSize: '0.875rem', fontStyle: 'italic' }}>
          {renderInline(line.replace(/^>\s+/, ''))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Numbered list: 1. 2. 3.
    const olMatch = line.match(/^\d+\.\s+(.*)/);
    if (olMatch) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(olMatch[1]);
      i++;
      continue;
    }

    // Unordered list: -, *, •
    const ulMatch = line.match(/^[-*•]\s+(.*)/);
    if (ulMatch) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(ulMatch[1]);
      i++;
      continue;
    }

    // Empty line — separator
    if (line.trim() === '') {
      flushList();
      elements.push(<div key={k()} style={{ height: '6px' }} />);
      i++;
      continue;
    }

    // Regular paragraph line
    flushList();
    elements.push(
      <p key={k()} style={{ margin: '1px 0', fontSize: '0.875rem', lineHeight: 1.6, color: textColor }}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  flushList();
  return <div>{elements}</div>;
};

// ---- Main ChatMessage component ----
function ChatMessage({ role, content, timestamp, extractedData, onApply }) {
  const isUser = role === 'user';

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
    });
  };

  const textColor = isUser ? '#ffffff' : '#1e1b4b';

  return (
    <div className={`flex-row ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
        {!isUser && (
          <div className="flex-row items-center gap-xs mb-sm">
            <HiSparkles className="text-xs text-purple" />
            <span className="text-xs font-semibold text-purple">AI Assistant</span>
          </div>
        )}

        {/* Render markdown for assistant, plain text for user */}
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap" style={{ color: textColor, margin: 0 }}>
            {content}
          </p>
        ) : (
          <MarkdownContent text={content} textColor={textColor} />
        )}

        <div className={`flex-row items-center gap-sm mt-sm ${isUser ? 'justify-end' : 'flex-between'}`}>
          <span className="chat-timestamp">
            {formatTime(timestamp)}
          </span>

          {extractedData && !isUser && (
            <button
              onClick={() => onApply(extractedData)}
              className="btn btn-outline btn-xs flex-row items-center gap-xs"
            >
              <HiCheckCircle className="text-xs" />
              Apply to resume
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
