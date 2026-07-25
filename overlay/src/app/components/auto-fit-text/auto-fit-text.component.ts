import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  NgZone,
  numberAttribute,
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
  readonly minFontSize = input(14, {transform: numberAttribute});
  readonly baseFontSize = input(24, {transform: numberAttribute});

  private readonly container =
    viewChild.required<ElementRef<HTMLDivElement>>('container');

  private readonly content =
    viewChild.required<ElementRef<HTMLDivElement>>('content');

  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly zone: NgZone,
  ) {
    effect(() => {
      this.baseFontSize();
      this.minFontSize();

      this.scheduleFit();
    });

    // Note: afterRenderEffect() only re-runs when a tracked signal changes.
    // Since this callback reads no signal, it would only ever fire once and
    // would never catch layout changes caused by siblings being added or
    // removed (e.g. a new joker being added to the list). The actual
    // re-fitting on such changes is handled by the ResizeObserver/
    // MutationObserver below instead.
    afterRenderEffect(() => {
      this.scheduleFit();
    });
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const host = this.host.nativeElement;
      const parent = host.parentElement;
      const content = this.content().nativeElement;

      this.resizeObserver = new ResizeObserver(() => {
        this.scheduleFit();
      });

      // Observe both the host (in case it is resized directly) and its
      // parent (the actual box whose available space we measure), since
      // the host's own size doesn't always update synchronously with its
      // parent's size when siblings are added/removed from a flex/grid
      // layout.
      this.resizeObserver.observe(host);

      if (parent) {
        this.resizeObserver.observe(parent);
      }

      // Catch content changes (e.g. the projected text itself changing)
      // that don't necessarily trigger a size change detectable by the
      // ResizeObserver above.
      this.mutationObserver = new MutationObserver(() => {
        this.scheduleFit();
      });

      this.mutationObserver.observe(content, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
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

    let low = this.minFontSize();
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
      `${this.minFontSize()}px`;

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
