declare module 'papaparse' {
  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row?: number;
  }

  export interface ParseResult<T = unknown> {
    data: T[];
    errors: ParseError[];
    meta: { fields?: string[] } & Record<string, unknown>;
  }

  export interface ParseConfig<T = unknown> {
    header?: boolean;
    skipEmptyLines?: boolean | 'greedy';
    transformHeader?: (header: string) => string;
    complete?: (results: ParseResult<T>) => void;
    error?: (error: Error) => void;
  }

  const Papa: {
    parse<T = unknown>(input: File | string, config?: ParseConfig<T>): ParseResult<T> | void;
    unparse(data: unknown, config?: Record<string, unknown>): string;
  };

  export default Papa;
}
