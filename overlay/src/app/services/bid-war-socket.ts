import {Injectable, Signal} from "@angular/core";
import {toSignal} from "@angular/core/rxjs-interop";
import {from, merge, Observable} from "rxjs";
import {filter} from "rxjs/operators";
import {io, Socket} from "socket.io-client";
import {BID_WAR_UPDATE_EVENT, BidWarInfo} from "@shared/bid-war-info";

const SERVER_URL = "http://localhost:3000";

@Injectable({providedIn: "root"})
export class BidWarSocket {
  private readonly socket: Socket;

  /** Signal mis à jour à chaque événement WebSocket de bid war */
  readonly bidWarInfo: Signal<BidWarInfo | null>;

  constructor() {
    this.socket = io(SERVER_URL, {transports: ["websocket"]});

    const ws$ = new Observable<BidWarInfo>((observer) => {
      this.socket.on(BID_WAR_UPDATE_EVENT, (data: BidWarInfo) =>
        observer.next(data),
      );
      return () => this.socket.off(BID_WAR_UPDATE_EVENT);
    });

    const initial$ = from(
      fetch(`${SERVER_URL}/overlay/bid-war-state`).then((r) => r.json() as Promise<BidWarInfo | null>)
    ).pipe(filter((info): info is BidWarInfo => info !== null));

    this.bidWarInfo = toSignal(merge(initial$, ws$), {initialValue: null});
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}

