import { useState, useMemo } from 'react';
import { Database, Sun, Moon, ChevronRight, ChevronDown, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { parseSchema } from '../utils/schemaParser';

export default function Sidebar({
  dbName,
  dbType,
  schema,
  onDisconnect,
  theme,
  onToggleTheme,
}) {
  const tables = useMemo(() => parseSchema(schema), [schema]);
  const [expandedTables, setExpandedTables] = useState(() => {
    // Expand first table by default if available
    return tables.length > 0 ? { [tables[0].name]: true } : {};
  });

  const toggleTable = (tableName) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  return (
    <aside className="sidebar-panel">
      {/* Top Header: Logo + Connected DB Indicator */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <Database size={20} color="var(--primary)" strokeWidth={2.2} />
          <span className="logo-text" style={{ fontSize: '20px' }}>
            QueryMind
          </span>
        </div>

        {/* Connected DB Indicator: green pulse dot + database name */}
        <div className="db-status-badge" title={`${dbName} (${dbType || 'Database'})`}>
          <div className="pulse-dot" />
          <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{dbName}</span>
          {dbType && (
            <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>
              [{dbType}]
            </span>
          )}
        </div>
      </div>

      {/* Schema Tree Section */}
      <div
        style={{
          padding: '12px 20px 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span className="section-label">Schema</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-3)',
          }}
        >
          {tables.length} {tables.length === 1 ? 'table' : 'tables'}
        </span>
      </div>

      <div className="sidebar-schema-tree">
        {tables.length === 0 ? (
          <div
            style={{
              padding: '16px 8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--text-3)',
              fontStyle: 'italic',
            }}
          >
            No tables found in schema
          </div>
        ) : (
          tables.map((table) => {
            const isExpanded = Boolean(expandedTables[table.name]);
            return (
              <div
                key={table.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderLeft: isExpanded
                    ? '2px solid var(--accent)'
                    : '2px solid transparent',
                  transition: 'border-color 150ms ease',
                }}
              >
                {/* Table row */}
                <button
                  type="button"
                  onClick={() => toggleTable(table.name)}
                  style={{
                    background: isExpanded ? 'var(--surface-2)' : 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    color: isExpanded ? 'var(--text-1)' : 'var(--text-2)',
                    transition: 'background-color 150ms ease, color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--surface-2)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {isExpanded ? (
                      <ChevronDown size={14} color="var(--accent)" />
                    ) : (
                      <ChevronRight size={14} color="var(--text-3)" />
                    )}
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        fontWeight: isExpanded ? 600 : 500,
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
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--text-3)',
                    }}
                  >
                    {table.columns.length}
                  </span>
                </button>

                {/* Columns list */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '4px 8px 8px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      backgroundColor: 'var(--surface-2)',
                    }}
                  >
                    {table.columns.map((col) => (
                      <div
                        key={col.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '3px 0',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                        }}
                      >
                        <span style={{ color: 'var(--text-1)' }}>{col.name}</span>
                        <span
                          style={{
                            color: 'var(--text-3)',
                            fontSize: '10px',
                            marginLeft: '8px',
                          }}
                        >
                          {col.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom of sidebar: disconnect, dark/light toggle, version "v1.0" */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Disconnect button */}
          <button
            type="button"
            className="ghost-action-btn"
            onClick={onDisconnect}
            title="Disconnect database session"
            style={{ padding: '4px' }}
          >
            <LogOut size={15} color="var(--text-2)" />
            <span style={{ fontSize: '12px' }}>Disconnect</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            type="button"
            className="ghost-action-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ padding: '4px' }}
          >
            <motion.div
              key={theme}
              initial={{ rotate: -180 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {theme === 'dark' ? (
                <Sun size={15} color="var(--text-2)" />
              ) : (
                <Moon size={15} color="var(--text-2)" />
              )}
            </motion.div>
          </button>
        </div>

        {/* Version tag: "v1.0" */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-3)',
          }}
        >
          v1.0
        </span>
      </div>
    </aside>
  );
}
