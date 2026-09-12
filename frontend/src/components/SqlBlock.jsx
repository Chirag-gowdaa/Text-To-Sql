import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

/**
 * Custom precision SQL syntax highlighter using IBM Plex Mono and designated color tokens.
 * Keywords: --primary
 * Strings: --accent
 * Numbers: --warning
 * Identifiers/Text: --text-1
 */
function highlightSql(sqlText) {
  if (!sqlText) return null;

  // Regex tokens: Strings, Numbers, Keywords, Words/Other
  const tokenRegex = /('(?:''|[^'])*'|"(?:""|[^"])*")|(\b\d+(?:\.\d+)?\b)|(\b(?:SELECT|FROM|WHERE|JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|INNER\s+JOIN|OUTER\s+JOIN|CROSS\s+JOIN|ON|GROUP\s+BY|ORDER\s+BY|LIMIT|OFFSET|AND|OR|NOT|IN|IS\s+NULL|IS\s+NOT\s+NULL|AS|HAVING|COUNT|SUM|AVG|MIN|MAX|DISTINCT|BETWEEN|LIKE|ILIKE|DESC|ASC|CASE|WHEN|THEN|ELSE|END|UNION|ALL)\b)|(\n|[^\s\w'"]+|\w+)/gi;

  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(sqlText)) !== null) {
    const [fullMatch, strToken, numToken, kwToken, otherToken] = match;

    if (match.index > lastIndex) {
      elements.push(sqlText.slice(lastIndex, match.index));
    }

    const key = `tok-${match.index}`;

    if (strToken !== undefined) {
      elements.push(
        <span key={key} style={{ color: 'var(--accent)' }}>
          {strToken}
        </span>
      );
    } else if (numToken !== undefined) {
      elements.push(
        <span key={key} style={{ color: 'var(--warning)' }}>
          {numToken}
        </span>
      );
    } else if (kwToken !== undefined) {
      elements.push(
        <span key={key} style={{ color: 'var(--primary)', fontWeight: 600 }}>
          {kwToken.toUpperCase()}
        </span>
      );
    } else {
      elements.push(
        <span key={key} style={{ color: 'var(--text-1)' }}>
          {otherToken}
        </span>
      );
    }

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < sqlText.length) {
    elements.push(sqlText.slice(lastIndex));
  }

  return elements;
}

export default function SqlBlock({ sql, rowCount, executionTime, dbType }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!sql) return;
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy SQL:', e);
    }
  };

  const formattedStats = [
    `${rowCount ?? 0} ${rowCount === 1 ? 'row' : 'rows'}`,
    executionTime ? `${executionTime}` : null,
    dbType ? `via ${dbType}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      <div className="sql-block-wrapper">
        {/* Top-right copy button */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
          }}
        >
          <motion.button
            type="button"
            className="ghost-action-btn"
            onClick={handleCopy}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              padding: '3px 8px',
              borderRadius: '0px',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
            }}
          >
            {copied ? (
              <>
                <Check size={13} color="var(--accent)" />
                <span style={{ color: 'var(--accent)' }}>Copied ✓</span>
              </>
            ) : (
              <>
                <Copy size={13} color="var(--text-2)" />
                <span>Copy SQL</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Code body */}
        <pre className="sql-code-display">
          <code>{highlightSql(sql)}</code>
        </pre>
      </div>

      {/* Stats row below code block */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--text-3)',
          letterSpacing: '0.01em',
          paddingLeft: '2px',
        }}
      >
        {formattedStats}
      </div>
    </motion.div>
  );
}
