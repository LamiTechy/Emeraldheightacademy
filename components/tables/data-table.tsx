"use client";

import * as React from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  SearchIcon,
} from "lucide-react";

export type Column<T> = {
  key: string;
  header: string;
  /** Primitive value — used for search, sorting and CSV export. */
  value: (row: T) => string | number;
  /** Custom cell renderer; defaults to the stringified value. */
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  className?: string;
  /** Keep the column out of CSV downloads (actions columns etc.). */
  excludeFromCsv?: boolean;
};

type SortState = { key: string; dir: "asc" | "desc" } | null;

export type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  getRowId: (row: T) => string;
  searchPlaceholder?: string;
  /** Provide to enable the search box. */
  searchValue?: (row: T) => string;
  /** Provide to enable CSV export. */
  exportFileName?: string;
  /** Extra controls next to search (filters etc.). */
  toolbar?: React.ReactNode;
  /** Right-aligned per-row action cell. */
  actions?: (row: T) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  isLoading?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: T) => void;
  className?: string;
};

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  searchPlaceholder = "Search…",
  searchValue,
  exportFileName,
  toolbar,
  actions,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Records will appear once they exist.",
  isLoading = false,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50],
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortState>(null);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const debouncedQuery = useDebounce(query, 250);

  // Page is keyed to the current filter context: when it changes we show page 1
  // without needing a setState-in-effect reset.
  const resetKey = `${debouncedQuery}|${pageSize}|${data.length}`;
  const [pageState, setPageState] = React.useState({ key: resetKey, page: 1 });
  const page = pageState.key === resetKey ? pageState.page : 1;
  const setPage = (p: number) => setPageState({ key: resetKey, page: p });

  const searchable = Boolean(searchValue);
  const canExport = Boolean(exportFileName);

  const filtered = React.useMemo(() => {
    if (!searchable || !debouncedQuery.trim() || !searchValue) return data;
    const q = debouncedQuery.trim().toLowerCase();
    return data.filter((row) => searchValue(row).toLowerCase().includes(q));
  }, [data, debouncedQuery, searchable, searchValue]);

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const cmp = compareValues(column.value(a), column.value(b));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sort, columns]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const rows = sorted.slice(start, start + pageSize);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  function exportCsv() {
    if (!exportFileName) return;
    const exportColumns = columns.filter((c) => !c.excludeFromCsv);
    const lines = [
      exportColumns.map((c) => csvEscape(c.header)).join(","),
      ...sorted.map((row) => exportColumns.map((c) => csvEscape(c.value(row))).join(",")),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFileName.endsWith(".csv") ? exportFileName : `${exportFileName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const alignClass = (align?: string) =>
    align === "right" ? "text-right" : align === "center" ? "text-center" : "";

  return (
    <div className={className ?? ""}>
      <div className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center">
        {searchable ? (
          <div className="relative w-full sm:max-w-xs">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-8"
              aria-label={searchPlaceholder}
            />
          </div>
        ) : null}
        {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}
        {canExport ? (
          <Button
            variant="outline"
            size="sm"
            className="sm:ml-auto"
            onClick={exportCsv}
            disabled={sorted.length === 0}
          >
            <DownloadIcon /> Export CSV
          </Button>
        ) : null}
      </div>

      <div className="w-full overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={alignClass(col.align)}
                >
                  {col.sortable !== false ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                      aria-label={`Sort by ${col.header}`}
                    >
                      {col.header}
                      {sort?.key === col.key ? (
                        sort.dir === "asc" ? (
                          <ArrowUpIcon className="size-3" />
                        ) : (
                          <ArrowDownIcon className="size-3" />
                        )
                      ) : (
                        <ArrowUpDownIcon className="size-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
              {actions ? <TableHead className="w-0 text-right">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-full min-w-12" />
                    </TableCell>
                  ))}
                  {actions ? (
                    <TableCell>
                      <Skeleton className="ml-auto h-4 w-12" />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="h-auto p-0">
                  <div className="px-4 py-10">
                    <EmptyState
                      title={debouncedQuery.trim() ? "No matches" : emptyTitle}
                      description={
                        debouncedQuery.trim()
                          ? `Nothing matches “${debouncedQuery.trim()}”. Try a different search.`
                          : emptyDescription
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  className={onRowClick ? "cursor-pointer" : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={alignClass(col.align)}>
                      {col.cell ? col.cell(row) : String(col.value(row))}
                    </TableCell>
                  ))}
                  {actions ? (
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">{actions(row)}</div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center gap-2 pt-3 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <span>
            {total === 0
              ? "0 results"
              : `Showing ${start + 1}–${Math.min(start + pageSize, total)} of ${total}`}
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger size="sm" className="h-7 w-[74px] text-xs" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={safePage <= 1}
            onClick={() => setPage(Math.max(1, safePage - 1))}
          >
            <ChevronLeftIcon />
          </Button>
          <span className="px-2 text-xs">
            Page {safePage} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={safePage >= pageCount}
            onClick={() => setPage(Math.min(pageCount, safePage + 1))}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
