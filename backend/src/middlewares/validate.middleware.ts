import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";
import { ApiError } from "../lib/http";

function validateSegment(schema: ZodTypeAny, input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", parsed.error.issues.map((issue) => issue.message));
  }

  return parsed.data;
}

export function validateBody(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    try {
      req.body = validateSegment(schema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    try {
      Object.assign(req.query, validateSegment(schema, req.query));
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParams(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    try {
      req.params = validateSegment(schema, req.params) as typeof req.params;
      next();
    } catch (error) {
      next(error);
    }
  };
}