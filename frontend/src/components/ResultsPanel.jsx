import SqlBlock from './SqlBlock';
import ResultsTable from './ResultsTable';
import Pagination from './Pagination';

export default function ResultsPanel({
  sqlResult,
  executionTime,
  dbType,
  limit,
  onPageChange,
  onLimitChange,
}) {
  if (!sqlResult) return null;

  const {
    sql = '',
    results = [],
    row_count = 0,
    total_count = 0,
    total_pages = 1,
    current_page = 1,
  } = sqlResult;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
        marginTop: '8px',
      }}
    >
      {/* SQL display block with copy button and stats */}
      <SqlBlock
        sql={sql}
        rowCount={row_count}
        executionTime={executionTime}
        dbType={dbType}
      />

      {/* Results Table (No card border around it — exists directly in space) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ResultsTable results={results} />

        {/* Pagination */}
        {total_count > 0 && (
          <Pagination
            currentPage={current_page}
            totalPages={total_pages}
            totalCount={total_count}
            limit={limit || sqlResult.limit || 20}
            currentRowsCount={results.length}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        )}
      </div>
    </div>
  );
}
