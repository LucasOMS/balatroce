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

    <div class="flex gap-1">
      <app-card color="red" class="w-[170px] items-center justify-center text-center text-[32px]/[32px]">
        Mode<br>{{ modeLabel() }}
      </app-card>

      <app-card class="flex-1 flex flex-row gap-3">
        <app-card color="green" subtitle="Changement de mode dans" class="flex-1 [--card-padding:12px]">

          <div class="relative bg-primary-900 border-2 border-white rounded-lg flex-1 h-4 overflow-hidden">
            <span class="flex items-baseline gap-[0.5ch] text-[32px]/[32px] text-white whitespace-nowrap absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <span>{{ donationAmount() | number: "1.0-2" }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 42.3 42.3" class="size-2.5">
                <polygon
                  fill="white"
                  points="17.7 42.2 17.7 40.2 13.5 40.2 13.5 38.1 11.4 38.1 11.4 36 9.4 36 9.4 28.8 3.1 28.8 3.1 24.2 7.3 24.2 7.3 21.3 3.1 21.3 3.1 16.9 7.3 16.9 7.3 12.5 9.4 12.5 9.4 6.2 11.4 6.2 11.4 4.2 13.5 4.2 13.5 2.1 17.7 2.1 17.7 0 30.8 0 30.8 2.1 35 2.1 35 4.2 37.1 4.2 37.1 6.2 39.1 6.2 39.1 15.2 32.2 15.2 32.2 11.1 30.2 11.1 30.2 9 28.1 9 28.1 6.9 20.4 6.9 20.4 9 18.3 9 18.3 11.1 16.3 11.1 16.3 16.9 30.8 16.9 30.8 19.2 28.7 19.2 28.7 21.3 14.2 21.3 14.2 24.2 28.7 24.2 28.7 26.8 26.7 26.8 26.7 28.8 16.3 28.8 16.3 31.2 18.3 31.2 18.3 33.3 20.4 33.3 20.4 35.4 28.1 35.4 28.1 33.3 30.2 33.3 30.2 31.2 32.2 31.2 32.2 27 39.1 27 39.1 36 37.1 36 37.1 38.1 35 38.1 35 40.2 30.8 40.2 30.8 42.2 17.7 42.2" />
              </svg>
            </span>
            <div
              class="h-full bg-primary-500 flex items-center justify-end pr-2 transition-[width] duration-500 ease-out rounded-r-lg"
              [style.width.%]="donationPercent()"
            ></div>
          </div>
        </app-card>

        <div class="text-[40px] my-auto">OU</div>

        <app-card color="light-gray" class="flex flex-row items-center [--card-padding:12px] gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 42.26 42.26" class="size-5">
            <path
              fill="white"
              d="M28.74,3.54v2.72h5.5v1.75h1.75v5.5h2.72v15.22h-2.72v5.5h-1.75v1.75h-5.5v2.72h-15.22v-2.72h-5.5v-1.75h-1.75v-5.5h-2.72v-15.22h2.72v-5.5h1.75v-1.75h5.5v-2.72h15.22M32.28,0H9.98v2.72h-5.5v1.75h-1.75v5.5H0v22.3h2.72v5.5h1.75v1.75h5.5v2.72h22.3v-2.72h5.5v-1.75h1.75v-5.5h2.72V9.98h-2.72v-5.5h-1.75v-1.75h-5.5V0h0Z" />
            <rect
              fill="white"
              x="13.63"
              y="13.7"
              width="14.91"
              height="3.48"
              transform="translate(36.53 -5.64) rotate(90)" />
            <rect fill="white" x="19.35" y="19.42" width="11.28" height="3.48" />
          </svg>
          <span class="text-[60px]/[60px] font-thin">{{ remainingLabel() }}</span>
        </app-card>

      </app-card>
    </div>
  `,
})
export class ModeTimerComponent {
  private readonly modeTimerSocket = inject(ModeTimerSocket);

  /** Recalculé régulièrement pour faire avancer le chrono, basé sur l'horloge serveur synchronisée */
  private readonly now = signal(this.modeTimerSocket.serverNow());

  protected readonly mode = computed(() => this.modeTimerSocket.modeTimerInfo()?.mode ?? ActionMode.Democracy);
  protected readonly modeLabel = computed(() => (this.mode() === ActionMode.Democracy ? 'Démocratie' : 'Anarchie'));

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




