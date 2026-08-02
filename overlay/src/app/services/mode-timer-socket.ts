import {inject, Injectable, Signal} from "@angular/core";
import {toSignal} from "@angular/core/rxjs-interop";
import {from, merge, Observable} from "rxjs";
import {filter} from "rxjs/operators";
import {io, Socket} from "socket.io-client";
import {MODE_TIMER_UPDATE_EVENT, ModeTimerInfo} from "@shared/mode-timer-info";
import {TwitchVoteSocket} from "./twitch-vote-socket";

const SERVER_URL = "http://localhost:3000";

/**
 * Expose l'état du minuteur de mode (démocratie/anarchie) : mode actuel, fin
 * de la phase en cours, montant de dons de la phase et seuil, total de dons
 * récoltés. Réutilise l'horloge synchronisée de {@link TwitchVoteSocket}
 * (`serverNow()`) pour interpréter `phaseEndTimestamp` sans dérive.
 */
@Injectable({providedIn: "root"})
export class ModeTimerSocket {
  private readonly socket: Socket;
  private readonly twitchVoteSocket = inject(TwitchVoteSocket);

  /** Signal mis à jour à chaque événement WebSocket du minuteur de mode */
  readonly modeTimerInfo: Signal<ModeTimerInfo | null>;

  constructor() {
    this.socket = io(SERVER_URL, {transports: ["websocket"]});

    const ws$ = new Observable<ModeTimerInfo>((observer) => {
      this.socket.on(MODE_TIMER_UPDATE_EVENT, (data: ModeTimerInfo) =>
        observer.next(data),
      );
      return () => this.socket.off(MODE_TIMER_UPDATE_EVENT);
    });

    const initial$ = from(
      fetch(`${SERVER_URL}/overlay/mode-timer-state`).then((r) => r.json() as Promise<ModeTimerInfo | null>)
    ).pipe(filter((info): info is ModeTimerInfo => info !== null));

    this.modeTimerInfo = toSignal(merge(initial$, ws$), {initialValue: null});
  }

  /** Horloge serveur estimée "maintenant", à utiliser pour interpréter `phaseEndTimestamp` */
  serverNow(): number {
    return this.twitchVoteSocket.serverNow();
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}

