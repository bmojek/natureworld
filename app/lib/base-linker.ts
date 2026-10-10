import "server-only";
import { logBaseLinkerProductsList } from "@/app/lib/base-linker-diagnostics";

const BASELINKER_API_URL = "https://api.baselinker.com/connector.php";

type BaseLinkerResponse = {
  status: "SUCCESS" | "ERROR";
  error_code?: string;
  error_message?: string;
  [key: string]: unknown;
};

export class BaseLinkerError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "BaseLinkerError";
  }
}

export async function callBaseLinker<T extends BaseLinkerResponse = BaseLinkerResponse>(
  method: string,
  parameters: Record<string, unknown> = {},
): Promise<T> {
  const token = process.env.BASELINKER_API_TOKEN;

  if (!token) {
    throw new BaseLinkerError("BaseLinker API token is not configured.", "NOT_CONFIGURED");
  }

  const isProductsList = method === "getInventoryProductsList";
  let httpStatus: number | undefined;
  try {
    const response = await fetch(BASELINKER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-BLToken": token,
      },
      body: new URLSearchParams({
        method,
        parameters: JSON.stringify(parameters),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    httpStatus = response.status;

    if (!response.ok) {
      throw new BaseLinkerError(
        `BaseLinker returned HTTP ${response.status}.`,
        response.status === 429 ? "RATE_LIMITED" : `HTTP_${response.status}`,
      );
    }

    const data = (await response.json()) as T;

    if (data.status !== "SUCCESS") {
      throw new BaseLinkerError(
        data.error_message ?? "BaseLinker API request failed.",
        data.error_code,
      );
    }

    if (isProductsList) logBaseLinkerProductsList(parameters, "success", { httpStatus });
    return data;
  } catch (error) {
    if (isProductsList) {
      const code = error instanceof BaseLinkerError ? error.code : undefined;
      const limited = httpStatus === 429 || /RATE|LIMIT|THROTTL/i.test(code ?? "");
      logBaseLinkerProductsList(parameters, limited ? "rate_limited" : "error", {
        errorCode: code ?? (error instanceof Error && error.name === "TimeoutError" ? "TIMEOUT" : "NETWORK_OR_RESPONSE_ERROR"),
        httpStatus,
      });
    }
    throw error;
  }
}
