import React from 'react';
import { ArrowRight, Sparkles, Check, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldMapping } from '@/lib/aiFieldMapper';
import { getAvailableTargetFields } from '@/lib/aiFieldMapper';
import type { ContactFields } from '@/lib/importUtils';

interface FieldMappingPanelProps {
  mappings: FieldMapping[];
  onMappingChange: (sourceColumn: string, targetField: keyof ContactFields | null) => void;
}

export default function FieldMappingPanel({
  mappings,
  onMappingChange,
}: FieldMappingPanelProps) {
  const targetFields = getAvailableTargetFields();
  const usedFields = new Set(
    mappings.filter((m) => m.targetField).map((m) => m.targetField!)
  );

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px]">
          <Check className="w-3 h-3" />
          High
        </span>
      );
    }
    if (confidence >= 0.7) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px]">
          <Sparkles className="w-3 h-3" />
          AI Suggested
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
          Field Mapping
        </p>
        <p className="text-[10px] text-white/30">
          {mappings.filter((m) => m.targetField).length} of {mappings.length} mapped
        </p>
      </div>

      <div className="space-y-2">
        {mappings.map((mapping) => (
          <div
            key={mapping.sourceColumn}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5"
          >
            {/* Source column */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80 truncate">{mapping.sourceColumn}</p>
              {mapping.sampleValues.length > 0 && (
                <p className="text-[10px] text-white/30 truncate mt-0.5">
                  e.g. {mapping.sampleValues.slice(0, 2).join(', ')}
                </p>
              )}
            </div>

            {/* Arrow */}
            <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0" />

            {/* Target field select */}
            <div className="flex items-center gap-2">
              <Select
                value={mapping.targetField || 'none'}
                onValueChange={(value) =>
                  onMappingChange(
                    mapping.sourceColumn,
                    value === 'none' ? null : (value as keyof ContactFields)
                  )
                }
              >
                <SelectTrigger className="w-[140px] bg-[#0a0a0c] border-white/10 text-sm">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent className="bg-[#12121a] border-white/10">
                  <SelectItem value="none" className="text-white/40">
                    <div className="flex items-center gap-2">
                      <X className="w-3 h-3" />
                      Skip
                    </div>
                  </SelectItem>
                  {targetFields.map((field) => {
                    const isUsed =
                      usedFields.has(field.value) &&
                      mapping.targetField !== field.value;
                    return (
                      <SelectItem
                        key={field.value}
                        value={field.value}
                        disabled={isUsed}
                        className={isUsed ? 'text-white/20' : 'text-white'}
                      >
                        {field.label}
                        {isUsed && ' (used)'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Confidence badge */}
              <div className="w-20 flex-shrink-0">
                {mapping.targetField && getConfidenceBadge(mapping.confidence)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
