import "server-only";

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

  if (!response.ok) {
    throw new BaseLinkerError(`BaseLinker returned HTTP ${response.status}.`);
  }

  const data = (await response.json()) as T;

  if (data.status !== "SUCCESS") {
    throw new BaseLinkerError(
      data.error_message ?? "BaseLinker API request failed.",
      data.error_code,
    );
  }

  return data;
}