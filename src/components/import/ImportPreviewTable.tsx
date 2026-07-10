import React from 'react';
import type { ParsedRow, ParsedData } from '@/lib/importUtils';
import type { FieldMapping } from '@/lib/aiFieldMapper';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ImportPreviewTableProps {
  data: ParsedData;
  mappings: FieldMapping[];
  maxRows?: number;
}

export default function ImportPreviewTable({
  data,
  mappings,
  maxRows = 5,
}: ImportPreviewTableProps) {
  const previewRows = data.rows.slice(0, maxRows);

  const getMappingForColumn = (column: string) => {
    return mappings.find((m) => m.sourceColumn === column);
  };

  const getColumnLabel = (column: string) => {
    const mapping = getMappingForColumn(column);
    if (mapping?.targetField) {
      return (
        <div className="space-y-1">
          <span className="text-white/40 text-[10px] line-through">{column}</span>
          <span className="text-cyan-400 text-xs block">→ {mapping.targetField}</span>
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <span className="text-white/60 text-xs">{column}</span>
        <span className="text-white/20 text-[10px] block italic">Not mapped</span>
      </div>
    );
  };

  if (data.rows.length === 0) {
    return (
      <div className="text-center p-8 bg-white/[0.02] border border-white/5 rounded-xl">
        <p className="text-white/40 text-sm">No data found in file</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
          Preview ({data.totalRows} rows total)
        </p>
        {data.totalRows > maxRows && (
          <p className="text-[10px] text-white/30">
            Showing first {maxRows} rows
          </p>
        )}
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/30 text-[10px] font-bold w-12">#</TableHead>
                {data.headers.map((header) => (
                  <TableHead
                    key={header}
                    className="text-white/60 text-xs min-w-[120px]"
                  >
                    {getColumnLabel(header)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className="border-white/5 hover:bg-white/[0.02]"
                >
                  <TableCell className="text-white/20 text-xs">
                    {rowIndex + 1}
                  </TableCell>
                  {data.headers.map((header) => {
                    const mapping = getMappingForColumn(header);
                    const isMapped = mapping?.targetField;
                    return (
                      <TableCell
                        key={header}
                        className={`text-xs ${
                          isMapped ? 'text-white/80' : 'text-white/30'
                        }`}
                      >
                        {row[header] || (
                          <span className="text-white/10 italic">empty</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
