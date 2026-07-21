/**
 * JSON-RPC 2.0 protocol types.
 * The BalatroBot mod serves a JSON-RPC 2.0 HTTP API at http://127.0.0.1:12346
 */

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
  id: number;
}

export interface JsonRpcSuccessResponse<T = unknown> {
  jsonrpc: "2.0";
  result: T;
  id: number;
}

export interface JsonRpcErrorResponse {
  jsonrpc: "2.0";
  error: {
    code: number;
    message: string;
    data?: { name: string };
  };
  id: number;
}

export type JsonRpcResponse<T = unknown> =
  | JsonRpcSuccessResponse<T>
  | JsonRpcErrorResponse;

export function isJsonRpcError(
  response: JsonRpcResponse,
): response is JsonRpcErrorResponse {
  return "error" in response;
}
