import {Injectable, Signal} from "@angular/core";
import {toSignal} from "@angular/core/rxjs-interop";
import {from, merge, Observable} from "rxjs";
import {filter} from "rxjs/operators";
import {io, Socket} from "socket.io-client";
import {OVERLAY_UPDATE_EVENT, OverlayInfo} from "@shared/overlay-info";

const SERVER_URL = "http://localhost:3000";

@Injectable({providedIn: "root"})
export class OverlaySocket {
  private readonly socket: Socket;

  /** Signal mis à jour à chaque événement WebSocket du serveur */
  readonly overlayInfo: Signal<OverlayInfo | null>;

  constructor() {
    this.socket = io(SERVER_URL, {transports: ["websocket"]});

    const ws$ = new Observable<OverlayInfo>((observer) => {
      this.socket.on(OVERLAY_UPDATE_EVENT, (data: OverlayInfo) =>
        observer.next(data),
      );
      return () => this.socket.off(OVERLAY_UPDATE_EVENT);
    });

    const initial$ = from(
      fetch(`${SERVER_URL}/overlay/state`).then((r) => r.json() as Promise<OverlayInfo | null>)
    ).pipe(filter((info): info is OverlayInfo => info !== null));

    this.overlayInfo = toSignal(merge(initial$, ws$), {initialValue: null});
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
