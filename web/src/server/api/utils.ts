import type { ZodIssue } from "zod";
import type { ValidationIssue } from "./api-responses";

export function zodIssuesToValidationIssues(
  zodIssues: ZodIssue[]
): ValidationIssue[] {
  return zodIssues.map((issue) => {
    return {
      code: issue.code,
      path: issue.path,
      message: issue.message,
    };
  });
}
