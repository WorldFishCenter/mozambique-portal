import React, { useMemo, useState } from 'react';
import Map from '../charts/Map';
import sitesStatsData from '../../data/sites-stats.json';
import InfoButton from '../common/InfoButton';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  getPaginationRowModel
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

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
        className="rounded text-center p-1"
        style={{
          backgroundColor: `rgba(${color}, ${intensity * 0.3})`,
        }}
      >
        {typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
      </div>
    );
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('district', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="w-full justify-center"
            >
              District
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: info => <div className="text-center">{String(info.getValue())}</div>
      }),
      columnHelper.accessor('landing_site', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="w-full justify-center"
            >
              Landing Site
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: info => <div className="text-center">{String(info.getValue())}</div>
      }),
      columnHelper.accessor('trip_duration_hrs', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="w-full justify-center"
            >
              Trip Duration (hrs)
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: info => createColoredCell(info.getValue(), 'trip_duration_hrs', '133, 146, 163')
      }),
      columnHelper.accessor('cpue_kg_fisher_hr', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="w-full justify-center"
            >
              CPUE (kg/fisher/hr)
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: info => createColoredCell(info.getValue(), 'cpue_kg_fisher_hr', '25, 135, 84')
      }),
      columnHelper.accessor('price_per_kg_mzn', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="w-full justify-center"
            >
              Price per kg (MZN)
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: info => createColoredCell(info.getValue(), 'price_per_kg_mzn', '13, 110, 253')
      }),
      columnHelper.accessor('mean_catch_kg', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="w-full justify-center"
            >
              Mean Catch (kg)
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: info => createColoredCell(info.getValue(), 'mean_catch_kg', '214, 51, 132')
      }),
      columnHelper.accessor('mean_catch_price_mzn', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="w-full justify-center"
            >
              Mean Catch Price (MZN)
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
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
    <div className="space-y-6">
      {/* Map row */}
      <Card>
        <CardContent className="p-0">
          <div className="h-[500px] w-full relative overflow-hidden rounded-md">
            <Map theme={theme} />
          </div>
        </CardContent>
      </Card>

      {/* Sites Statistics Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle>Landing Sites Statistics</CardTitle>
            <InfoButton
              title="Landing Sites Statistics"
              content="This table displays key metrics for each landing site including median trip duration, median catch per unit effort (CPUE), median price per kilogram, median catch, and median catch price. Click column headers to sort. Color intensity indicates relative values, with darker colors representing higher values within each metric."
              placement="bottom"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id} className="text-center">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Table Controls */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              {!isExpanded && (
                <>
                  <Select
                    value={String(table.getState().pagination.pageSize)}
                    onValueChange={(value) => table.setPageSize(Number(value))}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder={`Show ${pageSize}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 20, 25, 50].map(size => (
                        <SelectItem key={size} value={String(size)}>
                          Show {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} of{' '}
                    {table.getPageCount()}
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Collapse View' : 'Expand All'}
              </Button>
              {!isExpanded && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
