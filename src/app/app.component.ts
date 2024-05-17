import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MapComponent } from './components/map/map.component';
import { AngularSplitModule } from 'angular-split';
import { VisitComponent } from './components/visit/visit.component';
import { RouteComponent } from './components/route/route.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,
    MapComponent,
    AngularSplitModule,
    RouteComponent,
    VisitComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Route';
}
