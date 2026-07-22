import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  NgZone,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-auto-fit-text',
  standalone: true,
  template: `
    <div #container class="container">
      <div #content class="content">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .container {
      width: 100%;
      height: 100%;
      overflow: hidden;

      display: flex;
      /*align-items: center;*/
      justify-content: center;
    }

    .content {
      display: inline-block;

      text-align: center;
      line-height: 1.1;

      white-space: normal;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoFitTextComponent {
  static readonly MIN_FONT_SIZE = 10;

  readonly baseFontSize = input(24);

  private readonly container =
    viewChild.required<ElementRef<HTMLDivElement>>('container');

  private readonly content =
    viewChild.required<ElementRef<HTMLDivElement>>('content');

  private resizeObserver?: ResizeObserver;

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly zone: NgZone,
  ) {
    effect(() => {
      this.baseFontSize();

      this.scheduleFit();
    });

    afterRenderEffect(() => {
      this.scheduleFit();
    });
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => {
        this.scheduleFit();
      });

      this.resizeObserver.observe(this.host.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private scheduleFit(): void {
    queueMicrotask(() => this.fit());
  }

  private fit(): void {
    const container = this.container().nativeElement;
    const content = this.content().nativeElement;

    const parent = this.host.nativeElement.parentElement;

    if (!parent) {
      return;
    }

    const parentStyle = getComputedStyle(parent);

    const availableWidth =
      parent.clientWidth -
      Number.parseFloat(parentStyle.paddingLeft) -
      Number.parseFloat(parentStyle.paddingRight);

    const availableHeight =
      parent.clientHeight -
      Number.parseFloat(parentStyle.paddingTop) -
      Number.parseFloat(parentStyle.paddingBottom);

    container.style.width = `${Math.max(0, availableWidth)}px`;
    container.style.height = `${Math.max(0, availableHeight)}px`;

    content.style.whiteSpace = 'normal';
    content.style.wordBreak = 'normal';
    content.style.overflowWrap = 'normal';

    let low = AutoFitTextComponent.MIN_FONT_SIZE;
    let high = this.baseFontSize();
    let best = low;

    while (high - low > 0.5) {
      const size = (low + high) / 2;

      content.style.fontSize = `${size}px`;

      if (this.overflows(container, content)) {
        high = size;
      } else {
        best = size;
        low = size;
      }
    }

    content.style.fontSize = `${best}px`;

    if (!this.overflows(container, content)) {
      return;
    }

    content.style.fontSize =
      `${AutoFitTextComponent.MIN_FONT_SIZE}px`;

    content.style.overflowWrap = 'break-word';

    if (this.overflows(container, content)) {
      content.style.wordBreak = 'break-all';
    }
  }

  private overflows(
    container: HTMLElement,
    content: HTMLElement,
  ): boolean {
    return (
      content.scrollWidth > container.clientWidth ||
      content.scrollHeight > container.clientHeight
    );
  }
}
