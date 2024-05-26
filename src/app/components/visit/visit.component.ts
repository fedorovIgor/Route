import { Component, OnInit } from '@angular/core';
import { VisitComponentInterface } from './VisitComponentInterface';
import { DayRoute } from '../../models/DayRoutes';
import { RouteEventService } from '../../services/route-event.service';
import { CommonModule } from '@angular/common';
import { Visit } from '../../models/Visit';
import {MatTableModule} from '@angular/material/table';

@Component({
  selector: 'app-visit',
  standalone: true,
  imports: [CommonModule,
    MatTableModule
  ],
  templateUrl: './visit.component.html',
  styleUrl: './visit.component.css'
})
export class VisitComponent implements OnInit, VisitComponentInterface{

  days: DayRoute[] = [];

  columnsToDisplay = ['id', 'position', 'distanceToNext'];

  constructor(private routeEventService: RouteEventService) {}

  ngOnInit(): void {
    this.eventSubscribe()
  }

  private eventSubscribe() {
    this.routeEventService.printDay().subscribe(day => {
      this.addDay(day);
    })

    this.routeEventService.removeDay().subscribe(dayId => {
      this.removeDay(dayId);
    })

    this.routeEventService.selectedVisit().subscribe(visit => {
      this.onVisit(visit);
    })

    this.routeEventService.cleanMapEvent.subscribe(() => {
      this.days = [];
    })
  }

  addDay(day: DayRoute) {
    let dayExist = this.days.filter(d => d.id == day.id)[0];
    if (dayExist)
      return;

    day.visits.sort((a, b) => a.position - b.position);

    this.days.push(day);
  }
 
  removeDay(dayId: number) {
    let index = this.days.findIndex(d => d.id == dayId)
    if (index == -1)
      return;

    this.days.splice(index, 1);
  }

  onVisit(visit: Visit) {
    this.days.forEach(d => d.visits.forEach(v => v.highlighted = false))
    this.routeEventService.sendVisit(visit);
    visit.highlighted = true;
  }

}
