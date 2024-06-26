import { EventEmitter, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { DayRoute } from '../models/DayRoutes';
import { Visit } from '../models/Visit';

@Injectable({
  providedIn: 'root'
})
export class RouteEventService {

  constructor() { }

  private dayRouteToPrind = new Subject<DayRoute>();
  private dayRouteIdToRemove = new Subject<number>();
  cleanMapEvent = new EventEmitter<void>();

  private visitSelectedOnMap = new Subject<Visit>();
  private changedColor = new Subject<DayRoute>();


  sendDayRouteForPrint(dayRoute: DayRoute) {
    this.dayRouteToPrind.next(dayRoute);
  }

  printDay() {
    return this.dayRouteToPrind.asObservable();
  }

  sendDayRouteIdForRemove(dayRoute: number) {
    this.dayRouteIdToRemove.next(dayRoute);
  }

  sendVisit(visit: Visit) {
    this.visitSelectedOnMap.next(visit);
  }

  removeDay() {
    return this.dayRouteIdToRemove.asObservable();
  }

  cleanMap() {
    this.cleanMapEvent.emit();
  }

  selectedVisit() {
    return this.visitSelectedOnMap.asObservable();
  }

  changeColor(dayRoute: DayRoute) {
    this.changedColor.next(dayRoute);
  }

  redrowRoute() {
    return this.changedColor.asObservable();
  }

}
