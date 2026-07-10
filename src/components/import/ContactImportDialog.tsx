import React, { useState, useCallback } from 'react';
import { X, Upload, ArrowLeft, ArrowRight, Check, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/lib/UserContext';
import { ensureUUID } from '@/lib/uuid';
import {
  parseFile,
  getSampleValues,
  normalizeContact,
  validateAllRows,
  formatFileSize,
  type ParsedData,
  type ContactFields,
} from '@/lib/importUtils';
import {
  suggestFieldMappingsLocal,
  suggestFieldMappingsAI,
  type FieldMapping,
} from '@/lib/aiFieldMapper';
import FileDropzone from './FileDropzone';
import ImportPreviewTable from './ImportPreviewTable';
import FieldMappingPanel from './FieldMappingPanel';
import ImportProgressBar from './ImportProgressBar';

type ImportStep = 'upload' | 'mapping' | 'importing' | 'complete';

interface ContactImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export default function ContactImportDialog({
  open,
  onClose,
  onImportComplete,
}: ContactImportDialogProps) {
  const { profile } = useUser();
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
  });

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setIsLoading(true);
    setFile(selectedFile);

    try {
      const data = await parseFile(selectedFile);
      setParsedData(data);

      // Get sample values for AI mapping
      const sampleData: Record<string, string[]> = {};
      for (const header of data.headers) {
        sampleData[header] = getSampleValues(data.rows, header, 5);
      }

      // Try AI mapping first, fallback to local
      let fieldMappings: FieldMapping[];
      try {
        fieldMappings = await suggestFieldMappingsAI(data.headers, sampleData);
        toast.success('AI analyzed your file and suggested field mappings');
      } catch {
        fieldMappings = suggestFieldMappingsLocal(data.headers, sampleData);
      }

      setMappings(fieldMappings);
      setStep('mapping');
    } catch (error) {
      toast.error(`Failed to parse file: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleMappingChange = useCallback(
    (sourceColumn: string, targetField: keyof ContactFields | null) => {
      setMappings((prev) =>
        prev.map((m) =>
          m.sourceColumn === sourceColumn
            ? { ...m, targetField, confidence: targetField ? 1 : 0 }
            : m
        )
      );
    },
    []
  );

  const handleImport = useCallback(async () => {
    if (!parsedData || !profile?.id) return;

    // Validate mappings
    const mappedFields = mappings.filter((m) => m.targetField);
    if (mappedFields.length === 0) {
      toast.error('Please map at least one field before importing');
      return;
    }

    // Check for email or name mapping (required for useful contact)
    const hasPrimaryField = mappedFields.some((m) =>
      ['email', 'full_name', 'first_name'].includes(m.targetField!)
    );
    if (!hasPrimaryField) {
      toast.error('Please map at least an email or name field');
      return;
    }

    // Create mapping object
    const mappingObj: Record<string, keyof ContactFields> = {};
    for (const m of mappedFields) {
      mappingObj[m.sourceColumn] = m.targetField!;
    }

    // Validate all rows
    const validation = validateAllRows(parsedData.rows, mappingObj);
    if (!validation.isValid) {
      toast.warning(
        `Found ${validation.errors.length} validation issues. They will be skipped.`
      );
    }

    setStep('importing');
    setImportProgress({
      total: parsedData.rows.length,
      processed: 0,
      successful: 0,
      failed: 0,
    });

    // Batch insert
    const BATCH_SIZE = 50;
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < parsedData.rows.length; i += BATCH_SIZE) {
      const batch = parsedData.rows.slice(i, i + BATCH_SIZE);
      const contacts = batch
        .map((row) => {
          const contact = normalizeContact(row, mappingObj);
          // Skip rows without email or name
          if (!contact.email && !contact.full_name && !contact.first_name) {
            return null;
          }
          return {
            id: ensureUUID(crypto.randomUUID()),
            user_id: profile.id,
            first_name: contact.first_name || '',
            last_name: contact.last_name || '',
            full_name: contact.full_name || '',
            email: contact.email || '',
            phone: contact.phone || '',
            company: contact.company || '',
            job_title: contact.job_title || '',
            notes: contact.notes || '',
            met_at: contact.met_at || '',
            created_at: new Date().toISOString(),
          };
        })
        .filter(Boolean);

      if (contacts.length > 0) {
        const { error } = await supabase.from('contacts').insert(contacts);
        if (error) {
          console.error('Batch insert error:', error);
          failed += contacts.length;
        } else {
          successful += contacts.length;
        }
      }

      const skipped = batch.length - contacts.length;
      failed += skipped;

      setImportProgress({
        total: parsedData.rows.length,
        processed: Math.min(i + BATCH_SIZE, parsedData.rows.length),
        successful,
        failed,
      });
    }

    setStep('complete');

    if (successful > 0) {
      toast.success(`Successfully imported ${successful} contacts`);
    }
    if (failed > 0) {
      toast.warning(`${failed} contacts could not be imported`);
    }
  }, [parsedData, profile?.id, mappings]);

  const handleClose = useCallback(() => {
    if (step === 'complete' && onImportComplete) {
      onImportComplete();
    }
    // Reset state
    setStep('upload');
    setFile(null);
    setParsedData(null);
    setMappings([]);
    setImportProgress({ total: 0, processed: 0, successful: 0, failed: 0 });
    onClose();
  }, [step, onImportComplete, onClose]);

  const handleBack = useCallback(() => {
    if (step === 'mapping') {
      setStep('upload');
      setFile(null);
      setParsedData(null);
      setMappings([]);
    }
  }, [step]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-lg font-medium text-white">Import Contacts</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                {step === 'upload' && 'Step 1: Upload File'}
                {step === 'mapping' && 'Step 2: Map Fields'}
                {step === 'importing' && 'Step 3: Importing'}
                {step === 'complete' && 'Import Complete'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <FileDropzone onFileSelect={handleFileSelect} isLoading={isLoading} />
          )}

          {/* Step 2: Mapping */}
          {step === 'mapping' && parsedData && (
            <>
              {/* File info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file?.name}</p>
                  <p className="text-[10px] text-white/40">
                    {formatFileSize(file?.size || 0)} • {parsedData.totalRows} rows
                  </p>
                </div>
              </div>

              {/* Preview */}
              <ImportPreviewTable data={parsedData} mappings={mappings} />

              {/* Field mappings */}
              <FieldMappingPanel
                mappings={mappings}
                onMappingChange={handleMappingChange}
              />
            </>
          )}

          {/* Step 3: Importing / Complete */}
          {(step === 'importing' || step === 'complete') && (
            <ImportProgressBar
              total={importProgress.total}
              processed={importProgress.processed}
              successful={importProgress.successful}
              failed={importProgress.failed}
              isComplete={step === 'complete'}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/5">
          <div>
            {step === 'mapping' && (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-white/60 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step === 'upload' && (
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-white/60"
              >
                Cancel
              </Button>
            )}

            {step === 'mapping' && (
              <Button
                onClick={handleImport}
                disabled={mappings.filter((m) => m.targetField).length === 0}
                className="bg-cyan-500 hover:bg-cyan-400 text-[#0a0a0c] font-bold"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import {parsedData?.totalRows} Contacts
              </Button>
            )}

            {step === 'complete' && (
              <Button
                onClick={handleClose}
                className="bg-cyan-500 hover:bg-cyan-400 text-[#0a0a0c] font-bold"
              >
                <Check className="w-4 h-4 mr-2" />
                Done
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
