export type SuccessRes<Data> = {
  data: Data;
};

export type BadRequestIssue = {
  code: string;
  path: (string | number)[];
  message: string;
};

export type BadRequestRes = {
  code: "BAD_REQUEST";
  message: string;
  issues?: BadRequestIssue[];
};

export type UnauthorizedRes = {
  code: "UNAUTHORIZED";
  message: string;
};

export type NotFoundRes = {
  code: "NOT_FOUND";
  message: string;
};