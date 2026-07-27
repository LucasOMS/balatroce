import {Injectable, Signal, signal} from "@angular/core";
import {toSignal} from "@angular/core/rxjs-interop";
import {from, merge, Observable} from "rxjs";
import {filter} from "rxjs/operators";
import {io, Socket} from "socket.io-client";
import {TWITCH_VOTE_UPDATE_EVENT, TwitchVoteInfo} from "@shared/twitch-vote-info";
import {CLOCK_SYNC_EVENT, ClockSyncResponse} from "@shared/clock-sync";

const SERVER_URL = "http://localhost:3000";

/** Nombre d'aller-retours effectués à chaque (re)synchronisation d'horloge. */
const CLOCK_SYNC_SAMPLES = 5;
/** Intervalle (ms) entre deux (re)synchronisations, pour corriger la dérive au fil du temps. */
const CLOCK_RESYNC_INTERVAL_MS = 30_000;

@Injectable({providedIn: "root"})
export class TwitchVoteSocket {
  private readonly socket: Socket;

  /** Signal mis à jour à chaque événement WebSocket de vote Twitch Plays */
  readonly voteInfo: Signal<TwitchVoteInfo | null>;

  /**
   * Décalage estimé (ms) entre l'horloge serveur et l'horloge cliente
   * (`serverTime - clientTime`), déterminé façon NTP via `CLOCK_SYNC_EVENT`.
   * On garde, parmi plusieurs échantillons, celui avec le round-trip le plus
   * court (donc la mesure la plus fiable).
   */
  private readonly clockOffsetMs = signal(0);

  constructor() {
    this.socket = io(SERVER_URL, {transports: ["websocket"]});

    const ws$ = new Observable<TwitchVoteInfo>((observer) => {
      this.socket.on(TWITCH_VOTE_UPDATE_EVENT, (data: TwitchVoteInfo) =>
        observer.next(data),
      );
      return () => this.socket.off(TWITCH_VOTE_UPDATE_EVENT);
    });

    const initial$ = from(
      fetch(`${SERVER_URL}/overlay/twitch-vote-state`).then((r) => r.json() as Promise<TwitchVoteInfo | null>)
    ).pipe(filter((info): info is TwitchVoteInfo => info !== null));

    this.voteInfo = toSignal(merge(initial$, ws$), {initialValue: null});

    this.socket.on("connect", () => void this.syncClock());
    void this.syncClock();
    setInterval(() => void this.syncClock(), CLOCK_RESYNC_INTERVAL_MS);
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  /**
   * Horloge serveur estimée "maintenant" (compense le décalage éventuel
   * entre l'horloge de ce client et celle du serveur). À utiliser pour
   * interpréter tout timestamp absolu envoyé par le serveur (ex:
   * `endTimestamp`) au lieu de `Date.now()` directement.
   */
  serverNow(): number {
    return Date.now() + this.clockOffsetMs();
  }

  /** Effectue plusieurs aller-retours et ne garde que le décalage le plus fiable (round-trip le plus court). */
  private async syncClock(): Promise<void> {
    let best: {offset: number; rtt: number} | null = null;

    for (let i = 0; i < CLOCK_SYNC_SAMPLES; i++) {
      const sample = await this.measureClockOffset();
      if (sample && (best === null || sample.rtt < best.rtt)) {
        best = sample;
      }
    }

    if (best !== null) {
      this.clockOffsetMs.set(best.offset);
    }
  }

  private measureClockOffset(): Promise<{offset: number; rtt: number} | null> {
    return new Promise((resolve) => {
      const clientSentAt = Date.now();

      this.socket.timeout(2000).emit(
        CLOCK_SYNC_EVENT,
        {clientSentAt},
        (err: Error | null, response?: ClockSyncResponse) => {
          if (err || !response) {
            resolve(null);
            return;
          }

          const clientReceivedAt = Date.now();
          const rtt = clientReceivedAt - clientSentAt;
          // NTP-like offset estimate, assuming symmetric network latency.
          const offset = response.serverTime - (clientSentAt + clientReceivedAt) / 2;

          resolve({offset, rtt});
        },
      );
    });
  }
}



