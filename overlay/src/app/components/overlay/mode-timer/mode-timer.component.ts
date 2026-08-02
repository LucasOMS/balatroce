import {Component, computed, DestroyRef, inject, signal} from "@angular/core";
import {DecimalPipe} from "@angular/common";
import {ModeTimerSocket} from "../../../services/mode-timer-socket";
import {ActionMode} from "@shared/action-mode";

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
  imports: [DecimalPipe],
  template: `
    <div class="flex flex-col items-center gap-1">
      <div class="flex justify-between items-baseline w-full px-2 text-[22px] font-bold text-white uppercase tracking-wide">
        <span>Mode : {{ modeLabel() }}</span>
        <span class="text-[18px] font-normal normal-case">Changement dans {{ remainingLabel() }}</span>
      </div>

      <div class="relative w-full h-[16px] bg-black/80 border-2 border-white rounded-[8px] overflow-hidden">
        <div
          class="h-full bg-white/40 transition-[width] duration-500 ease-linear"
          [style.width.%]="timeProgressPercent()"
        ></div>
      </div>

      <div class="relative w-full h-[48px] bg-black/80 border-4 border-white rounded-[16px] overflow-hidden flex items-center">
        <div
          class="h-full bg-zevent-900 flex items-center justify-end pr-2 transition-[width] duration-500 ease-out"
          [style.width.%]="donationPercent()"
        >
          @if (donationPercent() > 15) {
            <span class="text-[22px] text-white whitespace-nowrap">
              {{ donationAmount() | number: "1.0-2" }} / {{ donationThreshold() | number: "1.0-2" }} €
            </span>
          }
        </div>
        @if (donationPercent() <= 15) {
          <span class="text-[22px] text-white whitespace-nowrap pl-2">
            {{ donationAmount() | number: "1.0-2" }} / {{ donationThreshold() | number: "1.0-2" }} €
          </span>
        }
      </div>

      <div class="text-[16px] text-white/80">
        {{ totalDonationAmount() | number: "1.0-2" }} € récoltés au total
      </div>
    </div>
  `,
})
export class ModeTimerComponent {
  private readonly modeTimerSocket = inject(ModeTimerSocket);

  /** Recalculé régulièrement pour faire avancer le chrono, basé sur l'horloge serveur synchronisée */
  private readonly now = signal(this.modeTimerSocket.serverNow());

  protected readonly mode = computed(() => this.modeTimerSocket.modeTimerInfo()?.mode ?? ActionMode.Democracy);
  protected readonly modeLabel = computed(() => this.mode());

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




