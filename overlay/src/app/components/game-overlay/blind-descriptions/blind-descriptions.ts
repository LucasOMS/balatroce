import {Component, input} from '@angular/core';
import {Blind} from '@shared/game-state';
import {AutoFitTextComponent} from '../../auto-fit-text/auto-fit-text.component';

@Component({
  selector: 'app-blind-descriptions',
  imports: [
    AutoFitTextComponent
  ],
  host: {class: "block"},
  template: `

    @let smallBlind = blinds().small;
    @let bigBlind = blinds().big;
    @let bossBlind = blinds().boss;

    <div class="small-blind" [class.active]="smallBlind.status === 'SELECT'">
      <app-auto-fit-text>
        {{ smallBlind.tag_effect }}
      </app-auto-fit-text>
    </div>
    <div class="big-blind" [class.active]="bigBlind.status === 'SELECT'">
      <app-auto-fit-text>
        {{ bigBlind.tag_effect }}
      </app-auto-fit-text>
    </div>
    <div class="boss-blind" [class.active]="bossBlind.status === 'SELECT'">
      <app-auto-fit-text>
        {{ bossBlind.tag_effect }}
      </app-auto-fit-text>
    </div>
  `,
  styles: `

    .small-blind, .big-blind, .boss-blind {
      position: absolute;
      bottom: 0;
      color: white;
      padding: 4px;
    }


    .small-blind {
      width: 298px;
      height: 115px;
      left: 541px;

      &.active {
        height: 176px;
      }
    }

    .big-blind {
      width: 298px;
      height: 115px;
      left: 895px;

      &.active {
        height: 176px;
      }
    }

    .boss-blind {
      width: 298px;
      height: 115px;
      left: 1242px;

      &.active {
        height: 176px;
      }
    }
  `
})
export class BlindDescriptions {
  public readonly blinds = input.required<{
    small: Blind,
    big: Blind,
    boss: Blind,
  }>()
}
