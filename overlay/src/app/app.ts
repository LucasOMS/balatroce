import {Component, computed, ElementRef, inject, signal, viewChild} from "@angular/core";
import {GameOverlayComponent} from './components/game-overlay/game-overlay.component';
import {OverlaySocket} from './services/overlay-socket';
import {ModeTimerComponent} from './components/overlay/mode-timer/mode-timer.component';
import {VoteCountComponent} from './components/overlay/vote-count/vote-count.component';
import {DelayCountComponent} from './components/game-overlay/delay-count/delay-count.component';
import {AvailableActionsComponent} from './components/overlay/available-actions/available-actions.component';

@Component({
  selector: "app-root",
  imports: [
    GameOverlayComponent,
    ModeTimerComponent,
    VoteCountComponent,
    DelayCountComponent,
    AvailableActionsComponent,
  ],
  templateUrl: `./app.html`,
})
export class App {
  private readonly overlaySocket = inject(OverlaySocket);

  protected readonly captureVideoRef = viewChild<ElementRef<HTMLVideoElement>>("captureVideo");
  protected readonly captureStream = signal<MediaStream | null>(null);

  /** Relit directement le signal du service */
  protected readonly overlayInfo = this.overlaySocket.overlayInfo;

  protected readonly gameState = computed(() => this.overlayInfo()?.gameState ?? null);
  protected readonly availableActions = computed(() => this.overlayInfo()?.availableActions ?? []);
  protected readonly restarting = computed(() => this.overlayInfo()?.restarting ?? false);
  protected readonly restartMessage = computed(
    () => this.overlayInfo()?.restartMessage ?? "Petit problème technique, redémarrage du jeu en cours",
  );
}
