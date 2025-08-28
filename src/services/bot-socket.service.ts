import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import * as net from "net";
import { BotRequest } from "src/interfaces/bot-request";

@Injectable()
export class BotSocketService implements OnModuleInit, OnModuleDestroy {
  private client: net.Socket;
  private readonly host = "127.0.0.1";
  private readonly port = 12346;

  onModuleInit() {
    this.client = new net.Socket();

    this.client.connect(this.port, this.host, () => {
      console.log(`Connected to bot server at ${this.host}:${this.port}`);
    });

    this.client.on("error", (err) => {
      console.error(`Socket error: ${err.message}`);
    });

    this.client.on("close", () => {
      console.log("Connection closed");
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.end();
      console.log("TCP socket closed");
    }
  }

  /**
   * Sends a BotRequest over TCP and returns the response as a Promise.
   * @param request BotRequest
   */
  async sendMessage(request: BotRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      const message = JSON.stringify(request) + "\n"; // newline for framing
      let responseData = "";

      const onData = (chunk: Buffer) => {
        responseData += chunk.toString();

        // Check if response is complete (assuming newline as delimiter)
        if (responseData.endsWith("\n")) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const parsed = JSON.parse(responseData.trim());
            resolve(parsed);
          } catch (e) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(e);
          } finally {
            this.client.off("data", onData);
          }
        }
      };

      this.client.on("data", onData);

      this.client.write(message, (err) => {
        if (err) {
          reject(err);
        }
      });
    });
  }
}
