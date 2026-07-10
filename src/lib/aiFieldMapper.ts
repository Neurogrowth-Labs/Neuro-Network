import { base44 } from '@/pages/api/base44Client';
import type { ContactFields } from './importUtils';

export interface FieldMapping {
  sourceColumn: string;
  targetField: keyof ContactFields | null;
  confidence: number;
  sampleValues: string[];
}

// Known field patterns for matching
const FIELD_PATTERNS: Record<keyof ContactFields, RegExp[]> = {
  first_name: [/first[_\s]?name/i, /fname/i, /given[_\s]?name/i, /^first$/i, /prénom/i, /tên/i],
  last_name: [/last[_\s]?name/i, /lname/i, /surname/i, /family[_\s]?name/i, /^last$/i, /họ/i],
  full_name: [/full[_\s]?name/i, /name/i, /contact[_\s]?name/i, /họ tên/i, /tên đầy đủ/i],
  email: [/e[_\-]?mail/i, /email[_\s]?address/i, /^mail$/i],
  phone: [/phone/i, /tel/i, /mobile/i, /cell/i, /số điện thoại/i, /điện thoại/i],
  company: [/company/i, /organization/i, /org/i, /employer/i, /business/i, /công ty/i],
  job_title: [/title/i, /job[_\s]?title/i, /position/i, /role/i, /chức vụ/i, /vị trí/i],
  notes: [/notes?/i, /comments?/i, /description/i, /ghi chú/i],
  met_at: [/met[_\s]?at/i, /location/i, /where[_\s]?met/i, /event/i, /gặp tại/i],
  linkedin: [/linkedin/i, /li[_\s]?url/i],
  twitter: [/twitter/i, /x[_\s]?handle/i, /^x$/i],
  website: [/website/i, /url/i, /web/i, /site/i],
};

// Detect field type from column name using patterns
function detectFieldFromColumnName(columnName: string): { field: keyof ContactFields | null; confidence: number } {
  const normalizedColumn = columnName.toLowerCase().trim();

  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedColumn)) {
        // Exact match gets higher confidence
        const isExactMatch = normalizedColumn === field.replace(/_/g, ' ') ||
                            normalizedColumn === field.replace(/_/g, '');
        return {
          field: field as keyof ContactFields,
          confidence: isExactMatch ? 0.95 : 0.8,
        };
      }
    }
  }

  return { field: null, confidence: 0 };
}

// Detect field type from sample values
function detectFieldFromValues(sampleValues: string[]): { field: keyof ContactFields | null; confidence: number } {
  if (sampleValues.length === 0) {
    return { field: null, confidence: 0 };
  }

  // Check for email pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (sampleValues.some((v) => emailPattern.test(v))) {
    return { field: 'email', confidence: 0.9 };
  }

  // Check for phone pattern
  const phonePattern = /^[\d\s\-\(\)\+\.]{7,}$/;
  if (sampleValues.every((v) => phonePattern.test(v.replace(/\s/g, '')))) {
    return { field: 'phone', confidence: 0.85 };
  }

  // Check for LinkedIn URL
  if (sampleValues.some((v) => v.includes('linkedin.com'))) {
    return { field: 'linkedin', confidence: 0.95 };
  }

  // Check for Twitter/X URL or handle
  if (sampleValues.some((v) => v.includes('twitter.com') || v.includes('x.com') || v.startsWith('@'))) {
    return { field: 'twitter', confidence: 0.9 };
  }

  // Check for website URL
  if (sampleValues.some((v) => v.startsWith('http') || v.includes('www.'))) {
    return { field: 'website', confidence: 0.8 };
  }

  return { field: null, confidence: 0 };
}

// Local field mapping (without AI)
export function suggestFieldMappingsLocal(
  columns: string[],
  sampleData: Record<string, string[]>
): FieldMapping[] {
  const mappings: FieldMapping[] = [];
  const usedFields = new Set<keyof ContactFields>();

  for (const column of columns) {
    const samples = sampleData[column] || [];

    // Try to detect from column name first
    let detection = detectFieldFromColumnName(column);

    // If no match from column name, try sample values
    if (!detection.field || detection.confidence < 0.7) {
      const valueDetection = detectFieldFromValues(samples);
      if (valueDetection.confidence > detection.confidence) {
        detection = valueDetection;
      }
    }

    // Avoid duplicate mappings
    if (detection.field && usedFields.has(detection.field)) {
      detection = { field: null, confidence: 0 };
    }

    if (detection.field) {
      usedFields.add(detection.field);
    }

    mappings.push({
      sourceColumn: column,
      targetField: detection.field,
      confidence: detection.confidence,
      sampleValues: samples.slice(0, 3),
    });
  }

  return mappings;
}

// AI-powered field mapping
export async function suggestFieldMappingsAI(
  columns: string[],
  sampleData: Record<string, string[]>
): Promise<FieldMapping[]> {
  // Start with local detection
  const localMappings = suggestFieldMappingsLocal(columns, sampleData);

  // Find columns with low confidence that need AI help
  const lowConfidenceColumns = localMappings.filter(
    (m) => !m.targetField || m.confidence < 0.7
  );

  if (lowConfidenceColumns.length === 0) {
    return localMappings;
  }

  try {
    // Prepare data for AI
    const columnsForAI = lowConfidenceColumns.map((m) => ({
      column: m.sourceColumn,
      samples: m.sampleValues,
    }));

    const prompt = `Analyze these CSV column headers and sample data. Map each column to the most appropriate contact field.

Available target fields: first_name, last_name, full_name, email, phone, company, job_title, notes, met_at, linkedin, twitter, website

Columns to analyze:
${JSON.stringify(columnsForAI, null, 2)}

Respond with a JSON object mapping column names to target fields. Use null for columns that don't match any field.
Example: {"Column A": "email", "Column B": "phone", "Column C": null}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        additionalProperties: {
          type: ['string', 'null'],
        },
      },
    });

    // Merge AI suggestions with local mappings
    const aiMappings = typeof response === 'object' ? response : {};
    const usedFields = new Set(
      localMappings
        .filter((m) => m.confidence >= 0.7 && m.targetField)
        .map((m) => m.targetField!)
    );

    return localMappings.map((mapping) => {
      if (mapping.confidence >= 0.7) {
        return mapping;
      }

      const aiSuggestion = aiMappings[mapping.sourceColumn];
      if (aiSuggestion && !usedFields.has(aiSuggestion as keyof ContactFields)) {
        usedFields.add(aiSuggestion as keyof ContactFields);
        return {
          ...mapping,
          targetField: aiSuggestion as keyof ContactFields,
          confidence: 0.75,
        };
      }

      return mapping;
    });
  } catch (error) {
    console.warn('AI field mapping failed, using local detection:', error);
    return localMappings;
  }
}

// Get all available target fields
export function getAvailableTargetFields(): { value: keyof ContactFields; label: string }[] {
  return [
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'full_name', label: 'Full Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'company', label: 'Company' },
    { value: 'job_title', label: 'Job Title' },
    { value: 'notes', label: 'Notes' },
    { value: 'met_at', label: 'Met At' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'twitter', label: 'Twitter/X' },
    { value: 'website', label: 'Website' },
  ];
}
