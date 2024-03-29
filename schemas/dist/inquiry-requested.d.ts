/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface InquiryRequested {
  id: string;
  connectionType: string;
  connectionUserId: string;
  queryType: string;
  query: string;
  persona?: {
    id: string;
    name: string;
    description: string;
    /**
     * JSON string format config
     */
    config: string;
    specificationHash: string;
    /**
     * gzipped then base64 encoded prompt
     */
    prompt: string;
  };
  status: 'REQUESTED';
  [k: string]: unknown;
}
