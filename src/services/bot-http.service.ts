import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {BotMethod, BotRequest} from "src/interfaces/bot-request";
import {isJsonRpcError, JsonRpcRequest, JsonRpcResponse,} from "src/interfaces/jsonrpc";
import {BehaviorSubject, filter, firstValueFrom, map} from "rxjs";

@Injectable()
export class BotHttpService implements OnModuleInit {
    private readonly ready$ = new BehaviorSubject<boolean>(false);

    private readonly logger = new Logger(BotHttpService.name);
    private readonly baseUrl = "http://127.0.0.1:12346";
    private requestId = 1;

    async onModuleInit() {
        this.logger.log(`Connecting to BalatroBot API at ${this.baseUrl}...`);
        while (true) {
            try {
                const health = await this.sendRequest({method: BotMethod.HEALTH});
                this.logger.log(`Connected to BalatroBot API: ${JSON.stringify(health)}`);
                this.ready$.next(true);
                break;
            } catch {
                this.logger.warn(
                    `Could not reach BalatroBot API at ${this.baseUrl}. Retrying in 2s...`,
                );
                await new Promise<void>((resolve) => setTimeout(resolve, 2000));
            }
        }
    }

    /**
     * Sends a bot request as a JSON-RPC 2.0 HTTP POST and returns the result.
     */
    async sendRequest<T = unknown>(request: BotRequest): Promise<T> {
        const rpcRequest: JsonRpcRequest = {
            jsonrpc: "2.0",
            method: request.method,
            id: ++this.requestId,
            ...(request.params !== undefined && {params: request.params}),
        };

        if (rpcRequest.params) {
            this.logger.debug(`→ ${rpcRequest.method}`, rpcRequest.params);
        } else {
            this.logger.debug(`→ ${rpcRequest.method}`);
        }

        const response = await fetch(this.baseUrl, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(rpcRequest),
        });

        if (!response.ok) {
            throw new Error(
                `HTTP error ${response.status}: ${response.statusText}`,
            );
        }

        const body = (await response.json()) as JsonRpcResponse<T>;

        if (isJsonRpcError(body)) {
            const {code, message, data} = body.error;
            throw new Error(
                `JSON-RPC error ${code} (${data?.name ?? "UNKNOWN"}): ${message}`,
            );
        }

        this.logger.debug(`← ${rpcRequest.method} OK`);
        return body.result;
    }


    public awaitInit(): Promise<void> {
        return firstValueFrom(
            this.ready$.asObservable().pipe(
                filter((v) => v),
                map(() => void 0),
            ),
        );
    }
}
