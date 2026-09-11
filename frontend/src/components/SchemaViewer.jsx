import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Parses raw schema text (e.g., SQLite / PostgreSQL CREATE TABLE statements)
 * into a structured tree: [{ name: string, columns: [{ name: string, type: string }] }]
 */
function parseSchema(rawSchema) {
  if (!rawSchema) return [];

  if (typeof rawSchema === 'object') {
    if (Array.isArray(rawSchema)) {
      return rawSchema.map((t) => ({
        name: t.name || t.table_name || 'table',
        columns: (t.columns || []).map((c) =>
          typeof c === 'string' ? { name: c, type: '' } : { name: c.name, type: c.type || '' }
        ),
      }));
    }
    return Object.keys(rawSchema).map((tableName) => {
      const cols = rawSchema[tableName];
      return {
        name: tableName,
        columns: Array.isArray(cols)
          ? cols.map((c) =>
              typeof c === 'string' ? { name: c, type: '' } : { name: c.name, type: c.type || '' }
            )
          : [],
      };
    });
  }

  const tables = [];
  const text = String(rawSchema);

  // Regex to match: CREATE TABLE [IF NOT EXISTS] tableName ( columns_body )
  const tableRegex =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([a-zA-Z0-9_]+)["`]?\s*\(([\s\S]*?)\)(?:;|\s*(?=CREATE\s+TABLE)|$)/gi;

  let match;
  while ((match = tableRegex.exec(text)) !== null) {
    const tableName = match[1];
    const columnsBody = match[2];

    const columns = [];

    // Split columnsBody by commas that are NOT inside parentheses
    const rawColDefs = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < columnsBody.length; i++) {
      const char = columnsBody[i];
      if (char === '(') depth++;
      else if (char === ')') depth--;

      if (char === ',' && depth === 0) {
        if (current.trim()) rawColDefs.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) rawColDefs.push(current.trim());

    for (const def of rawColDefs) {
      const trimmed = def.trim();
      const upper = trimmed.toUpperCase();

      // Skip table-level constraints
      if (
        upper.startsWith('PRIMARY KEY') ||
        upper.startsWith('FOREIGN KEY') ||
        upper.startsWith('CONSTRAINT') ||
        upper.startsWith('UNIQUE') ||
        upper.startsWith('CHECK')
      ) {
        continue;
      }

      // First token is column name, rest is type / constraints
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 1) {
        const colName = parts[0].replace(/["`]/g, '');
        const colType = parts.slice(1).join(' ') || '';
        columns.push({
          name: colName,
          type: colType,
        });
      }
    }

    tables.push({
      name: tableName,
      columns,
    });
  }

  return tables;
}

export default function SchemaViewer({ schema, isCollapsed, onToggleCollapse }) {
  const [search, setSearch] = useState('');
  const [expandedTables, setExpandedTables] = useState({});

  const tables = useMemo(() => parseSchema(schema), [schema]);

  const toggleTable = (tableName) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  const expandAll = () => {
    const all = {};
    tables.forEach((t) => (all[t.name] = true));
    setExpandedTables(all);
  };

  const collapseAll = () => {
    setExpandedTables({});
  };

  const filteredTables = useMemo(() => {
    if (!search.trim()) return tables;
    const q = search.toLowerCase();
    return tables.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.columns.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [tables, search]);

  return (
    <div
      style={{
        width: isCollapsed ? '48px' : '280px',
        minWidth: isCollapsed ? '48px' : '280px',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        maxHeight: 'calc(100vh - 120px)',
        position: 'sticky',
        top: '84px',
      }}
    >
      {/* Sidebar Header */}
      <div
        style={{
          padding: isCollapsed ? '14px 10px' : '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          backgroundColor: 'var(--surface-elevated)',
        }}
      >
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00D4FF"
              strokeWidth="2"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Database Schema
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-secondary)',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: '600',
              }}
            >
              {tables.length}
            </span>
          </div>
        )}

        {/* Collapse / Expand Toggle Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand schema tree' : 'Collapse schema tree'}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* When Collapsed: Mini View */}
      {isCollapsed ? (
        <div
          onClick={onToggleCollapse}
          style={{
            padding: '16px 8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            height: '100%',
          }}
          title="Click to expand schema"
        >
          <span
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
              fontSize: '0.78rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Schema ({tables.length})
          </span>
        </div>
      ) : (
        /* When Expanded: Search, Controls, Tree */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Search bar & quick expand/collapse actions */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter tables & columns..."
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 28px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth="2"
                style={{ position: 'absolute', left: '9px', top: '9px' }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
              }}
            >
              <button
                type="button"
                onClick={expandAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  padding: '2px 0',
                }}
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={collapseAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px 0',
                }}
              >
                Collapse all
              </button>
            </div>
          </div>

          {/* Tree View List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {filteredTables.length === 0 ? (
              <div
                style={{
                  padding: '24px 10px',
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                {tables.length === 0 ? 'No schema loaded' : 'No matching tables'}
              </div>
            ) : (
              filteredTables.map((table) => {
                const isOpen = search.trim() ? true : !!expandedTables[table.name];

                return (
                  <div
                    key={table.name}
                    style={{
                      borderRadius: '8px',
                      backgroundColor: isOpen ? 'rgba(26, 26, 36, 0.7)' : 'transparent',
                      border: isOpen
                        ? '1px solid rgba(42, 42, 58, 0.8)'
                        : '1px solid transparent',
                      overflow: 'hidden',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Table Row Node */}
                    <div
                      onClick={() => toggleTable(table.name)}
                      style={{
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isOpen) e.currentTarget.style.backgroundColor = 'rgba(26, 26, 36, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isOpen) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Chevron */}
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{
                            color: 'var(--text-muted)',
                            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.15s ease',
                            flexShrink: 0,
                          }}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>

                        {/* Table icon */}
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#6C63FF"
                          strokeWidth="2"
                          style={{ flexShrink: 0 }}
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <line x1="3" y1="9" x2="21" y2="9" />
                          <line x1="9" y1="21" x2="9" y2="9" />
                        </svg>

                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-mono)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {table.name}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        {table.columns.length}
                      </span>
                    </div>

                    {/* Columns Subtree */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          style={{
                            padding: '4px 8px 8px 24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            borderTop: '1px solid rgba(42, 42, 58, 0.5)',
                          }}
                        >
                          {table.columns.map((col, idx) => (
                            <div
                              key={`${col.name}-${idx}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.78rem',
                                padding: '3px 4px',
                                gap: '6px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  overflow: 'hidden',
                                }}
                              >
                                <span
                                  style={{
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    backgroundColor: '#00D4FF',
                                    flexShrink: 0,
                                  }}
                                />
                                <span
                                  style={{
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--font-mono)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {col.name}
                                </span>
                              </div>

                              {col.type && (
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    color: 'var(--text-secondary)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    fontFamily: 'var(--font-mono)',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '90px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {col.type}
                                </span>
                              )}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
