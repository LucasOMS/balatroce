import {Component, computed, DestroyRef, inject, signal} from "@angular/core";
import {DecimalPipe} from "@angular/common";
import {ModeTimerSocket} from "../../../services/mode-timer-socket";
import {ActionMode} from "@shared/action-mode";
import {CardComponent} from '../../card.component';

/** Formate une durée (ms) en `mm:ss`, jamais négative. */
function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString()}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Affiche le mode actuel (démocratie/anarchie), le temps restant avant le
 * prochain changement automatique de mode, et le montant de dons récolté
 * depuis le dernier changement (avec une barre de progression vers le seuil
 * qui déclenche un changement immédiat).
 */
@Component({
  selector: "app-mode-timer",
  host: {class: "block"},
  imports: [DecimalPipe, CardComponent],
  template: `

    <app-card title="MODE {{ modeLabel() }}" class="flex flex-col gap-1 text-white [--icon-size:36px]">
      <span class="-mt-1 text-center text-[28px]">Changement de mode dans</span>

      <div class="flex gap-2 w-full items-center">
        <div class="flex-1 flex gap-1 items-center">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="var(--icon-size)"
              width="var(--icon-size)"
              viewBox="0 -960 960 960"
              fill="var(--color-zevent-500)">
              <path d="M600-120q-118 0-210-67T260-360H120v-80h122q-2-11-2-20v-40q0-9 2-20H120v-80h140q38-106 130-173t210-67q69 0 130.5 24T840-748l-70 70q-35-29-78.5-45.5T600-740q-75 0-136.5 38.5T370-600h230v80H344q-2 11-3 20t-1 20q0 11 1 20t3 20h256v80H370q32 63 93.5 101.5T600-220q48 0 92.5-16.5T770-282l70 70q-48 44-109.5 68T600-120Z" />
            </svg>
          </div>

          <div class="relative w-full h-[48px] bg-black/50 border-2 border-white rounded-[16px] overflow-hidden flex items-center">
            <div
              class="h-full bg-zevent-500 flex items-center justify-end pr-2 transition-[width] duration-500 ease-out"
              [style.width.%]="donationPercent()"
            >
            </div>
            <span class="text-[32px] text-white whitespace-nowrap pl-2 absolute left-1/2 -translate-x-1/2">
            {{ donationAmount() | number: "1.0-2" }}&nbsp;<span class="text-[28px]">€</span>
          </span>
          </div>
        </div>

        <div class="text-[28px]">OU</div>

        <div class="flex gap-1 items-center">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="var(--icon-size)"
              width="var(--icon-size)"
              viewBox="0 -960 960 960"
              fill="var(--color-zevent-500)">
              <path d="M360-840v-80h240v80H360Zm80 440h80v-240h-80v240Zm-99.5 291.5Q275-137 226-186t-77.5-114.5Q120-366 120-440t28.5-139.5Q177-645 226-694t114.5-77.5Q406-800 480-800q62 0 119 20t107 58l56-56 56 56-56 56q38 50 58 107t20 119q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80q-74 0-139.5-28.5ZM678-242q82-82 82-198t-82-198q-82-82-198-82t-198 82q-82 82-82 198t82 198q82 82 198 82t198-82ZM480-440Z" />
            </svg>
          </div>
          <span class="text-[32px]">{{ remainingLabel() }}</span>
        </div>
      </div>
    </app-card>
  `,
})
export class ModeTimerComponent {
  private readonly modeTimerSocket = inject(ModeTimerSocket);

  /** Recalculé régulièrement pour faire avancer le chrono, basé sur l'horloge serveur synchronisée */
  private readonly now = signal(this.modeTimerSocket.serverNow());

  protected readonly mode = computed(() => this.modeTimerSocket.modeTimerInfo()?.mode ?? ActionMode.Democracy);
  protected readonly modeLabel = computed(() => (this.mode() === ActionMode.Democracy ? 'Démocratie' : 'Anarchie').toLocaleUpperCase());

  protected readonly phaseEndTimestamp = computed(() => this.modeTimerSocket.modeTimerInfo()?.phaseEndTimestamp ?? null);
  protected readonly phaseDurationMs = computed(() => this.modeTimerSocket.modeTimerInfo()?.phaseDurationMs ?? 0);
  protected readonly donationAmount = computed(() => this.modeTimerSocket.modeTimerInfo()?.donationAmount ?? 0);
  protected readonly donationThreshold = computed(() => this.modeTimerSocket.modeTimerInfo()?.donationThreshold ?? 0);
  protected readonly totalDonationAmount = computed(() => this.modeTimerSocket.modeTimerInfo()?.totalDonationAmount ?? 0);

  protected readonly remainingMs = computed(() => {
    const end = this.phaseEndTimestamp();
    return end === null ? 0 : Math.max(0, end - this.now());
  });

  protected readonly remainingLabel = computed(() => formatDuration(this.remainingMs()));

  /** Progression du chrono, de 0 (début de phase) à 100 (changement automatique imminent) */
  protected readonly timeProgressPercent = computed(() => {
    const end = this.phaseEndTimestamp();
    const duration = this.phaseDurationMs();
    if (end === null || duration <= 0) {
      return 0;
    }
    return Math.min(100, Math.max(0, 100 - (this.remainingMs() / duration) * 100));
  });

  protected readonly donationPercent = computed(() => {
    const threshold = this.donationThreshold();
    return threshold > 0 ? Math.min(100, (this.donationAmount() / threshold) * 100) : 0;
  });

  constructor() {
    let rafId: number;
    const tick = (): void => {
      this.now.set(this.modeTimerSocket.serverNow());
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(rafId));
  }
}




