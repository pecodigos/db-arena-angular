import { Directive, ElementRef, HostListener, OnInit } from '@angular/core';

@Directive({
  selector: '[appScaleContent]',
  standalone: true
})
export class ScaleContentDirective implements OnInit {
  private baseWidth = 1920;
  private baseHeight = 1080;

  constructor(private el: ElementRef) { }

  ngOnInit(): void {
    this.scaleContent();
  }

  scaleContent(): void {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const scaleX = screenWidth / this.baseWidth;
    const scaleY = screenHeight / this.baseHeight;

    const scale = Math.min(scaleX, scaleY);

    const element = this.el.nativeElement;
    element.style.transform = `scale(${scale})`;
    element.style.transformOrigin = 'top left';

    element.style.width = `${this.baseWidth}px`;
    element.style.height = `${this.baseHeight}px`;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.scaleContent();
  }
}
