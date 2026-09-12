import { useMemo } from 'react';
import { motion } from 'framer-motion';

function isNumericValue(val) {
  if (val === null || val === undefined || val === '') return false;
  if (typeof val === 'number') return true;
  if (typeof val === 'boolean') return false;
  return !isNaN(Number(val)) && !isNaN(parseFloat(val));
}

export default function ResultsTable({ results = [] }) {
  // Extract columns from results
  const { columns, columnIsNumeric } = useMemo(() => {
    if (!results || results.length === 0) {
      return { columns: [], columnIsNumeric: {} };
    }

    const firstRow = results[0];
    const cols = Object.keys(firstRow);

    // Determine if each column is predominantly numeric
    const isNumMap = {};
    cols.forEach((col) => {
      let numericCount = 0;
      let nonNullCount = 0;
      results.slice(0, 15).forEach((row) => {
        const val = row[col];
        if (val !== null && val !== undefined) {
          nonNullCount++;
          if (isNumericValue(val)) numericCount++;
        }
      });
      isNumMap[col] = nonNullCount > 0 && numericCount === nonNullCount;
    });

    return { columns: cols, columnIsNumeric: isNumMap };
  }, [results]);

  if (!results || results.length === 0) {
    return (
      <div
        style={{
          padding: '24px 0',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--text-3)',
          fontStyle: 'italic',
        }}
      >
        No rows returned.
      </div>
    );
  }

  return (
    <div className="results-table-container">
      <table className="precision-table">
        <thead>
          <tr>
            {columns.map((col) => {
              const isNum = columnIsNumeric[col];
              return (
                <th
                  key={col}
                  className={isNum ? 'th-num' : ''}
                >
                  {col}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {results.map((row, rowIdx) => (
            <motion.tr
              key={`r-${rowIdx}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: rowIdx * 0.03, duration: 0.15 }}
            >
              {columns.map((col) => {
                const rawVal = row[col];
                const isNum = isNumericValue(rawVal);
                let displayVal = rawVal;
                if (rawVal === null || rawVal === undefined) {
                  displayVal = <span style={{ color: 'var(--text-3)' }}>NULL</span>;
                } else if (typeof rawVal === 'boolean') {
                  displayVal = rawVal ? 'TRUE' : 'FALSE';
                }

                return (
                  <td
                    key={`${rowIdx}-${col}`}
                    className={isNum ? 'td-num' : ''}
                  >
                    {displayVal}
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
