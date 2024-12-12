import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MatPaginatorModule,
    MatCardModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
