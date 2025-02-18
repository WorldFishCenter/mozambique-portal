import React, { useMemo, useState } from 'react';
import Map from '../charts/Map';
import sitesStatsData from '../../data/sites-stats.json';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  getPaginationRowModel
} from '@tanstack/react-table';

const Home = ({ theme, district }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter out metadata and prepare data
  const tableData = useMemo(() => {
    return sitesStatsData.filter(item => !item.type || !item.type.includes('metadata'));
  }, []);

  // Helper function to get color intensity based on value
  const getColorIntensity = (value, min, max) => {
    const normalized = (value - min) / (max - min);
    return Math.max(0, Math.min(1, normalized));
  };

  // Get min and max values for each numeric column
  const columnRanges = useMemo(() => {
    const numericColumns = ['trip_duration_hrs', 'cpue_kg_fisher_hr', 'price_per_kg_mzn', 'mean_catch_kg', 'mean_catch_price_mzn'];
    return numericColumns.reduce((acc, col) => {
      const values = tableData.map(row => row[col]);
      acc[col] = {
        min: Math.min(...values),
        max: Math.max(...values)
      };
      return acc;
    }, {});
  }, [tableData]);

  const columnHelper = createColumnHelper();

  // Helper function to create a cell with color intensity
  const createColoredCell = (value, columnName, color) => {
    const intensity = getColorIntensity(
      value,
      columnRanges[columnName].min,
      columnRanges[columnName].max
    );
    return (
      <div
        style={{
          backgroundColor: `rgba(${color}, ${intensity * 0.3})`,
          padding: '0.25rem',
          borderRadius: '4px',
          textAlign: 'center'
        }}
      >
        {typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
      </div>
    );
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('district', {
        header: 'District',
        cell: info => <div style={{ textAlign: 'center' }}>{info.getValue()}</div>
      }),
      columnHelper.accessor('landing_site', {
        header: 'Landing Site',
        cell: info => <div style={{ textAlign: 'center' }}>{info.getValue()}</div>
      }),
      columnHelper.accessor('trip_duration_hrs', {
        header: 'Trip Duration (hrs)',
        cell: info => createColoredCell(info.getValue(), 'trip_duration_hrs', '133, 146, 163')
      }),
      columnHelper.accessor('cpue_kg_fisher_hr', {
        header: 'CPUE (kg/fisher/hr)',
        cell: info => createColoredCell(info.getValue(), 'cpue_kg_fisher_hr', '25, 135, 84')
      }),
      columnHelper.accessor('price_per_kg_mzn', {
        header: 'Price per kg (MZN)',
        cell: info => createColoredCell(info.getValue(), 'price_per_kg_mzn', '13, 110, 253')
      }),
      columnHelper.accessor('mean_catch_kg', {
        header: 'Mean Catch (kg)',
        cell: info => createColoredCell(info.getValue(), 'mean_catch_kg', '214, 51, 132')
      }),
      columnHelper.accessor('mean_catch_price_mzn', {
        header: 'Mean Catch Price (MZN)',
        cell: info => createColoredCell(info.getValue(), 'mean_catch_price_mzn', '255, 193, 7')
      })
    ],
    [columnHelper, columnRanges]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex,
        pageSize: isExpanded ? tableData.length : pageSize,
      },
    },
    onPaginationChange: updater => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex, pageSize });
        setPageIndex(newState.pageIndex);
        setPageSize(newState.pageSize);
      }
    },
  });

  return (
    <div className="row row-deck row-cards">
      {/* Map row */}
      <div className="col-12">
        <div className="card">
          <div className="card-body p-0">
            <div
              style={{
                height: '800px',
                width: '100%',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Map theme={theme} />
            </div>
          </div>
        </div>
      </div>

      {/* Sites Statistics Table */}
      <div className="col-12 mt-3">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Landing Sites Statistics</h3>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-vcenter table-hover">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          style={{ cursor: 'pointer', textAlign: 'center' }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{ asc: ' ↑', desc: ' ↓', false: ' ↕' }[header.column.getIsSorted() ?? false]}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Table Controls */}
              <div className="d-flex align-items-center justify-content-between mt-4">
                <div className="d-flex align-items-center gap-2">
                  {!isExpanded && (
                    <>
                      <select
                        value={table.getState().pagination.pageSize}
                        onChange={e => {
                          table.setPageSize(Number(e.target.value));
                        }}
                        className="form-select"
                        style={{ width: 'auto' }}
                      >
                        {[5, 10, 20, 25, 50].map(pageSize => (
                          <option key={pageSize} value={pageSize}>
                            Show {pageSize}
                          </option>
                        ))}
                      </select>
                      <span className="text-muted">
                        Page {table.getState().pagination.pageIndex + 1} of{' '}
                        {table.getPageCount()}
                      </span>
                    </>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? 'Collapse View' : 'Expand All'}
                  </button>
                  {!isExpanded && (
                    <>
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                      >
                        Previous
                      </button>
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                      >
                        Next
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
