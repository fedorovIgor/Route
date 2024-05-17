import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DayRoute } from '../models/DayRoutes';
import { Route } from '../models/Route';
import { Visit } from '../models/Visit';
import { CustomerWarehouse } from '../models/CustomerWarehouse';

@Injectable({
  providedIn: 'root'
})
export class RoutHttpService {
  
  private url = 'http://localhost:8081/api/v1/route';
   
  constructor(private httpClient: HttpClient) { }
  
  getRoutes(): Observable<Route[]>{
    return this.httpClient.get<Route[]>(this.url);
  }

  getRouteDaysByRouteId(routeId: number): Observable<DayRoute[]> {
    return this.httpClient.get<DayRoute[]>(this.url + '/day/' + routeId);
  }

  postCalculateForDays(dayIds: number[]) {
    return this.httpClient.post<DayRoute[]>(this.url + '/calculate/days', dayIds);
  }

  getVisitCustomers(visits: Visit[]): Observable<CustomerWarehouse[]> {
    return this.httpClient.post<CustomerWarehouse[]>(this.url + '/customer', visits);
  }

  postCalculateVRPByDayIds(visits: number[]) {
    return this.httpClient.post<void[]>(this.url + '/calculate/vrp/visits', visits);
  }

  postDistributeVisitsByRoute(routeId: number) {
    return this.httpClient.post<void[]>(this.url + '/distribute/route/' + routeId, {});
  }
}
