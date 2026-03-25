export class ValidationError extends Error {
  readonly path: string;
  override readonly cause?: unknown;

  constructor(message: string, path: string, cause?: unknown) {
    super(message);
    this.name = "ValidationError";
    this.path = path;
    this.cause = cause;
  }
}

export interface ValidationIssue {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface CatalogValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ModuleValidationResult {
  valid: boolean;
  moduleId: string;
  errors: ValidationIssue[];
}
