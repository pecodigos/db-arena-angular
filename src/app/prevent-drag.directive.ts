import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'img',
  standalone: true
})
export class PreventDragDirective {
  @Input() appPreventDrag: boolean | undefined;

  @HostListener('dragstart', ['$event'])
  onDragStart(event: DragEvent): void {
    if (this.appPreventDrag === undefined || this.appPreventDrag) {
      event.preventDefault();
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (this.appPreventDrag === undefined || this.appPreventDrag) {
      event.preventDefault();
    }
  }
}
