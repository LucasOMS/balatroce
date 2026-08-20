import {Component, input, ViewEncapsulation} from "@angular/core";

export type CardColor = 'dark' | 'red' | 'green' | 'light-gray';

@Component({
  selector: "app-card",
  host: {
    class: "block text-white flex flex-col gap-1",
    '[class.red]': 'color() === "red"',
    '[class.green]': 'color() === "green"',
    '[class.dark]': 'color() === "dark"',
    '[class.light-gray]': 'color() === "light-gray"',
  },
  template: `
    @if (title()) {
      <div>
        <div class="text-[30px] m-0.5">{{ title() }}</div>
        <hr class="border-b-2 border-(--card-shadow)" />
      </div>
    }

    @if (subtitle()) {
      <app-card color="dark" class="w-fit absolute! -top-2 left-2 text-[18px] leading-1 [--card-padding:10px]">
        {{ subtitle() }}
      </app-card>

      <div class="h-0.5"></div>
    }

    <ng-content></ng-content>

    <div class="card-background {{ color() }}">
      <svg
        class="bottom-edge"
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        viewBox="0 0 20 20"
        preserveAspectRatio="none">
        <rect fill="var(--card-bg)" y=".02" width="100%" height="14.67" />
        <rect fill="var(--card-shadow)" y="14.69" width="100%" height="5.31" />
      </svg>
      <svg
        class="bottom-left"
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        viewBox="0 0 20 20">
        <polygon
          fill="var(--card-bg)"
          points="4.61 10.08 4.61 11.87 10.28 11.87 10.28 11.88 10.28 14.67 20 14.67 20 0 0 0 0 4.39 2.8 4.39 2.8 4.41 2.8 9.72 2.8 10.06 4.61 10.06 4.61 10.08" />
        <rect fill="var(--card-shadow)" y="4.39" width="2.8" height="5.31" />
        <polygon
          fill="var(--card-shadow)"
          points="10.28 14.67 10.28 14.65 10.28 11.87 4.61 11.87 4.61 11.85 4.61 10.06 2.8 10.06 2.8 15.36 4.61 15.36 4.61 17.17 10.28 17.17 10.28 19.97 20 19.97 20 14.67 10.28 14.67" />
      </svg>
      <svg
        class="bottom-right"
        xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 20 20">
        <polygon
          fill="var(--card-bg)"
          points="15.39 10.08 15.39 11.87 9.72 11.87 9.72 11.88 9.72 14.67 0 14.67 0 0 20 0 20 4.39 17.2 4.39 17.2 4.41 17.2 9.72 17.2 10.06 15.39 10.06 15.39 10.08" />
        <rect fill="var(--card-shadow)" x="17.2" y="4.39" width="2.8" height="5.31" />
        <polygon
          fill="var(--card-shadow)"
          points="9.72 14.67 9.72 14.65 9.72 11.87 15.39 11.87 15.39 11.85 15.39 10.06 17.2 10.06 17.2 15.36 15.39 15.36 15.39 17.17 9.72 17.17 9.72 19.97 0 19.97 0 14.67 9.72 14.67" />
      </svg>

      <svg
        class="top-edge"
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        viewBox="0 0 20 1"
        preserveAspectRatio="none">
        <rect
          fill="var(--card-bg)"
          x="9.5"
          y="-9.5"
          width="100%"
          height="20"
          transform="translate(10.5 -9.5) rotate(90)" />
      </svg>

      <svg
        class="left-edge"
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        viewBox="0 0 1 20"
        preserveAspectRatio="none">
        <rect fill="var(--card-bg)" width="100%" height="100%" />
      </svg>
      <svg
        class="right-edge"
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        viewBox="0 0 1 20"
        preserveAspectRatio="none">
        <rect fill="var(--card-bg)" width="100%" height="100%" />
      </svg>

      <div class="center"></div>

      <svg class="top-left" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 20 20">
        <polygon
          fill="var(--card-bg)"
          points="20 0 10.28 0 10.28 2.8 4.61 2.8 4.61 4.61 2.8 4.61 2.8 10.28 0 10.28 0 20 20 20 20 0" />
      </svg>

      <svg class="top-right" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 20 20">
        <polygon
          fill="var(--card-bg)"
          points="0 20 20 20 20 10.28 17.2 10.28 17.2 4.61 15.39 4.61 15.39 2.8 9.72 2.8 9.72 0 0 0 0 20" />
      </svg>
    </div>
  `,
  styles: `
    @property --card-padding {
      syntax: '<length>';
      inherits: true;
      initial-value: 16px;
    }

    @layer components {
      app-card {
        position: relative;
        z-index: 1;
        padding: var(--card-padding) var(--card-padding) calc(var(--card-padding) + 4px) var(--card-padding);

        &.red {
          --card-bg: var(--color-card-red-bg);
          --card-shadow: var(--color-card-red-shadow);
        }

        &.green {
          --card-bg: var(--color-card-green-bg);
          --card-shadow: var(--color-card-green-shadow);
        }

        &.dark {
          --card-bg: var(--color-card-dark-bg);
          --card-shadow: var(--color-card-dark-shadow);
        }

        &.light-gray {
          --card-bg: var(--color-card-light-gray-bg);
          --card-shadow: var(--color-card-light-gray-shadow);
        }

        .card-background {
          --border-radius: 16px;
          z-index: -1;


          position: absolute;
          inset: 0;

          .bottom-edge {
            position: absolute;
            bottom: 0;
            left: calc(var(--border-radius) - 1px);
            right: calc(var(--border-radius) - 1px);
            height: var(--border-radius);
            width: calc(100% - var(--border-radius) * 2 + 2px);
          }

          .bottom-left {
            position: absolute;
            bottom: 0;
            left: 0;
            width: var(--border-radius);
            height: var(--border-radius);
          }

          .bottom-right {
            position: absolute;
            bottom: 0;
            right: 0;
            width: var(--border-radius);
            height: var(--border-radius);
          }

          .top-edge {
            position: absolute;
            top: 0;
            left: calc(var(--border-radius) - 1px);
            right: calc(var(--border-radius) - 1px);
            height: var(--border-radius);
            width: calc(100% - var(--border-radius) * 2 + 2px);
          }

          .left-edge {
            position: absolute;
            top: calc(var(--border-radius) - 1px);
            bottom: calc(var(--border-radius) - 1px);
            left: 0;
            width: var(--border-radius);
            height: calc(100% - var(--border-radius) * 2 + 2px);
          }

          .right-edge {
            position: absolute;
            top: calc(var(--border-radius) - 1px);
            bottom: calc(var(--border-radius) - 1px);
            right: 0;
            width: var(--border-radius);
            height: calc(100% - var(--border-radius) * 2 + 2px);
          }

          .top-left {
            position: absolute;
            top: 0;
            left: 0;
            width: var(--border-radius);
            height: var(--border-radius);
          }

          .top-right {
            position: absolute;
            top: 0;
            right: 0;
            width: var(--border-radius);
            height: var(--border-radius);
          }

          .center {
            position: absolute;
            inset: calc(var(--border-radius) - 1px);
            background: var(--card-bg);
          }
        }
      }
    }
  `,
  encapsulation: ViewEncapsulation.None
})
export class CardComponent {
  public readonly title = input<string>()
  public readonly subtitle = input<string>()

  public readonly color = input<CardColor>('dark')
}

