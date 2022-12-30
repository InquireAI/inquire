import type { ZodIssue } from "zod";
import type { BadRequestIssue } from "./api-responses";

export function zodIssuesToBadRequestIssues(
  zodIssues: ZodIssue[]
): BadRequestIssue[] {
  return zodIssues.map((issue) => {
    return {
      code: issue.code,
      path: issue.path,
      message: issue.message,
    };
  });
}
