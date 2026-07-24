import {Injectable, Signal} from "@angular/core";
import {toSignal} from "@angular/core/rxjs-interop";
import {from, merge, Observable} from "rxjs";
import {filter} from "rxjs/operators";
import {io, Socket} from "socket.io-client";
import {TWITCH_VOTE_UPDATE_EVENT, TwitchVoteInfo} from "@shared/twitch-vote-info";

const SERVER_URL = "http://localhost:3000";

@Injectable({providedIn: "root"})
export class TwitchVoteSocket {
  private readonly socket: Socket;

  /** Signal mis à jour à chaque événement WebSocket de vote Twitch Plays */
  readonly voteInfo: Signal<TwitchVoteInfo | null>;

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
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}

