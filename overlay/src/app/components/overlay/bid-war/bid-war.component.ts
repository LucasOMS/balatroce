import {Component, computed, inject} from "@angular/core";
import {DecimalPipe} from "@angular/common";
import {BidWarSocket} from "../../../services/bid-war-socket";
import {BidWarKeyword} from "@shared/bid-war-keyword";

/**
 * Barre d'affrontement de la bid war : démocratie à gauche, anarchie à
 * droite. Chaque camp occupe une largeur proportionnelle à son montant
 * cumulé de dons, et affiche son montant dans la barre. Les mots-clés sont
 * affichés au-dessus de la barre.
 */
@Component({
  selector: "app-bid-war",
  host: {class: "block"},
  imports: [DecimalPipe],
  template: `
    <div class="flex flex-col items-center gap-1">
      <div class="flex justify-between w-full px-2 text-[22px] font-bold text-white uppercase tracking-wide">
        <span>{{ democracyKeyword }}</span>
        <span>{{ anarchyKeyword }}</span>
      </div>

      <div class="relative w-full h-[48px] bg-black/80 border-4 border-white rounded-[16px] overflow-hidden flex">
        <div
          class="h-full bg-zevent-900 flex items-center justify-start pl-2 transition-[width] duration-500 ease-out"
          [style.width.%]="democracyPercent()"
        >
          @if (democracyPercent() > 10) {
            <span class="text-[28px] text-white whitespace-nowrap">{{ democracyAmount() | number: "1.0-2" }} €</span>
          }
        </div>
        <div
          class="h-full bg-zevent-300 flex items-center justify-end pr-2 transition-[width] duration-500 ease-out"
          [style.width.%]="anarchyPercent()"
        >
          @if (anarchyPercent() > 10) {
            <span class="text-[28px] text-white whitespace-nowrap">{{ anarchyAmount() | number: "1.0-2" }} €</span>
          }
        </div>
      </div>

      <div class="text-[16px] text-white">
        {{ donationCount() }} don(s) · {{ totalAmount() | number: "1.0-2" }} € au total
      </div>
    </div>
  `,
})
export class BidWarComponent {
  private readonly bidWarSocket = inject(BidWarSocket);

  protected readonly democracyKeyword = BidWarKeyword.Democracy;
  protected readonly anarchyKeyword = BidWarKeyword.Anarchy;

  protected readonly democracyAmount = computed(
    () => this.bidWarSocket.bidWarInfo()?.scores[BidWarKeyword.Democracy] ?? 0,
  );
  protected readonly anarchyAmount = computed(
    () => this.bidWarSocket.bidWarInfo()?.scores[BidWarKeyword.Anarchy] ?? 0,
  );
  protected readonly totalAmount = computed(() => this.bidWarSocket.bidWarInfo()?.totalAmount ?? 0);
  protected readonly donationCount = computed(() => this.bidWarSocket.bidWarInfo()?.donationCount ?? 0);

  protected readonly democracyPercent = computed(() => {
    const total = this.totalAmount();
    return total > 0 ? (this.democracyAmount() / total) * 100 : 50;
  });

  protected readonly anarchyPercent = computed(() => {
    const total = this.totalAmount();
    return total > 0 ? (this.anarchyAmount() / total) * 100 : 50;
  });
}

