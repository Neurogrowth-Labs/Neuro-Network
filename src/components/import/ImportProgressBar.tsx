import React from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ImportProgressBarProps {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  isComplete: boolean;
}

export default function ImportProgressBar({
  total,
  processed,
  successful,
  failed,
  isComplete,
}: ImportProgressBarProps) {
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          )}
          <span className="text-sm text-white/80">
            {isComplete ? 'Import Complete' : 'Importing contacts...'}
          </span>
        </div>
        <span className="text-sm text-white/40">{percentage}%</span>
      </div>

      <Progress value={percentage} className="h-2 bg-white/5" />

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <span className="text-white/40">Total:</span>
          <span className="text-white/80">{total}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-white/40">Processed:</span>
          <span className="text-white/80">{processed}</span>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3 text-green-400" />
          <span className="text-white/40">Success:</span>
          <span className="text-green-400">{successful}</span>
        </div>

        {failed > 0 && (
          <div className="flex items-center gap-2">
            <XCircle className="w-3 h-3 text-red-400" />
            <span className="text-white/40">Failed:</span>
            <span className="text-red-400">{failed}</span>
          </div>
        )}
      </div>
    </div>
  );
}
