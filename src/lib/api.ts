import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { ApiError } from "./errors";
import { requireApiUser } from "./auth";
import type { SafeUser } from "./auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: { message, details } }, { status });
}

export function assertSameOrigin(request: NextRequest) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return;
  const origin = request.headers.get("origin");
  if (!origin) return; // Clientes sem header Origin (ex.: curl) são validados por sessão.
  const host = request.headers.get("host");
  if (!host) return;
  try {
    if (new URL(origin).host !== host) throw new ApiError("Origem da requisição inválida.", 403);
  } catch {
    throw new ApiError("Origem da requisição inválida.", 403);
  }
}

export async function parseBody<T>(request: NextRequest, schema: ZodType<T>): Promise<T> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    throw new ApiError("Corpo da requisição inválido.", 400);
  }
  const result = schema.safeParse(payload);
  if (!result.success) throw new ApiError("Dados inválidos.", 400, result.error.flatten());
  return result.data;
}

type Handler<T> = (context: { request: NextRequest; user: SafeUser; params: T }) => Promise<Response>;

/** Wrapper para rotas autenticadas: valida sessão, origem e normaliza erros. */
export function authHandler<T = Record<string, string>>(handler: Handler<T>) {
  return async (request: NextRequest, context: { params: Promise<T> }) => {
    try {
      assertSameOrigin(request);
      const user = await requireApiUser();
      const params = await context.params;
      return await handler({ request, user, params });
    } catch (error) {
      return handleError(error);
    }
  };
}

/** Wrapper para rotas públicas (login/cadastro/recuperação). */
export function publicHandler(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    try {
      assertSameOrigin(request);
      return await handler(request);
    } catch (error) {
      return handleError(error);
    }
  };
}

export function handleError(error: unknown) {
  if (error instanceof ApiError) return fail(error.message, error.status, error.details);
  if (error instanceof ZodError) return fail("Dados inválidos.", 400, error.flatten());
  console.error("[api] erro não tratado:", error);
  return fail("Não foi possível concluir a operação. Tente novamente.", 500);
}

export function requestMeta(request: NextRequest) {
  return {
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local",
    userAgent: request.headers.get("user-agent") ?? "unknown",
  };
}
