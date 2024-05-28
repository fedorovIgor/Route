import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { RouteComponentInterface } from './RouteComponentInterface';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { RouteColorInterface } from './RouteColorInterface';
import { RoutHttpService } from '../../services/routHttp.service';
import { RouteEventService } from '../../services/route-event.service';
import { Route } from '../../models/Route';
import { Visit } from '../../models/Visit';
import { CustomerWarehouse } from '../../models/CustomerWarehouse';

@Component({
  selector: 'app-route',
  standalone: true,
  imports: [MatListModule,
    CommonModule,
    MatCheckboxModule,
    MatExpansionModule,
    FormsModule,
    MatFormFieldModule,
    MatButtonModule ],
  templateUrl: './route.component.html',
  styleUrls: ['./route.component.css']
})
export class RouteComponent implements OnInit, RouteComponentInterface, RouteColorInterface {

  routes!: Route[];

  constructor (private routeHttpService: RoutHttpService,
    private routeEventService: RouteEventService
  ) {}

  ngOnInit(): void {
    this.fillRoutes();
  }

  
  fillRoutes() {
    this.routeHttpService.getRoutes()
        .subscribe(resp => {
          this.routes = resp;
          this.convertColorToNormal();
          this.getCustomersForVisits();
          this.routeEventService.cleanMap();
          console.log(this.routes);
        })
  }

  // выбираются id точек и запрашиваются с сервера
  // затем сопоставляются с текущими Route[] 
  private getCustomersForVisits() {

    let visits: Visit[] = [];

    this.routes.forEach(r => {
      r.dayRoutes.forEach(d => {
        d.visits.forEach(v => {
          visits.push(v);
        })
      })
    })

    this.routeHttpService.getVisitCustomers(visits).subscribe(resp => {
      const map = resp.reduce((acc, current) => {
        acc.set(current.id, current);
        return acc;
      }, new Map<number, CustomerWarehouse>());

      this.routes.forEach(r => {
        r.dayRoutes.forEach(d => {
          d.visits.forEach(v => {
            if (v.warehouseId && v.warehouseId !== 0) {
              let warehouse = map.get(v.warehouseId);
              if (warehouse) {
                v.customerWarehouse = warehouse;
              }
            }
            else {
              let costumer = map.get(v.customerId);
              if (costumer) {
                v.customerWarehouse = costumer;
              }
            }
          })
        })
      })

    })
  }

  colorHexToAbgr(hex: string, alpha: number): string {
    // Удаление символа '#' из начала строки HEX, если он есть
    hex = hex.replace('#', '');
  
    // Разбивка HEX на отдельные составляющие (красный, зеленый, синий)
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
  
    // Проверка допустимости значения альфа-канала (0-1)
    alpha = Math.min(Math.max(0, alpha), 1);
  
    // Формирование строки в формате RGBA и возврат результата
    return `rgba($${1 - alpha}${b}${g}${r})`;
  }

  convertColorToNormal() {
    this.routes.forEach(r => {
      r.dayRoutes.forEach(d => {
        let colorARGB: string = d.color;
        let opacity: number = parseInt(colorARGB.slice(1, 3), 16);
        let blue: number = parseInt(colorARGB.slice(3, 5), 16);
        let green: number = parseInt(colorARGB.slice(5, 7), 16);
        let red: number = parseInt(colorARGB.slice(7, 9), 16);
    
        let rgba: string = `rgba(${red},${green},${blue},${1-opacity})`;

        d.color = this.convertRgbaToHex(rgba);
      })
    })
  }

  private convertRgbaToHex(rgba: string): string {
    // Разбить строку RGBA на составляющие значения
    const rgbaValues = rgba.match(/(\d+(\.\d+)?)/g);
  
    if (!rgbaValues)
      return "";
    // Преобразовать значения RGBA в шестнадцатеричный формат и объединить их в одну строку
    const hex = "#" + rgbaValues.slice(0, 3).map(value => {
      const intValue = parseInt(value);
      const hexValue = intValue.toString(16);
      return hexValue.length === 1 ? "0" + hexValue : hexValue;
    }).join("");
  
    // Вернуть строку в формате HEX
    return hex;
  }

  onDayCheckboxChange(event: any, routeId:number, routeDayId: number) {
    const isChecked = event.checked;

    let route = this.routes.filter(d => d.id == routeId)[0];
    let dayRoute = route.dayRoutes.filter(d => d.id == routeDayId)[0];
    
    dayRoute.isChecked = isChecked;
    
    if (isChecked) {
      this.routeEventService.sendDayRouteForPrint(dayRoute);
    }
    else {
      this.routeEventService.sendDayRouteIdForRemove(routeDayId);
    }

    route.isChecked = this.isAllDaysInRouteChecked(route);
    
  }

  private isAllDaysInRouteChecked(route: Route): boolean {

      let result = true;

      route.dayRoutes.forEach(dr => {
        if (!dr.isChecked)
          result = false;
      })

      return result;
  }
  
  onRouteCheckboxChange(event: any, routeId:number) {
    const isChecked = event.checked;
    let route = this.routes.filter(d => d.id == routeId)[0]
    let dayRoutes = route.dayRoutes

    if (isChecked) {
      dayRoutes.forEach(d => {
        d.isChecked = true;
        this.routeEventService.sendDayRouteForPrint(d);
      })
      route.isChecked = true;
    }
    else {
      dayRoutes.forEach(d => {
        d.isChecked = false;
        this.routeEventService.sendDayRouteIdForRemove(d.id);
      })

      route.isChecked = false;
    }
  }

  onDistribute() {

    let routeId: number = 0;

    this.routes.forEach(r => {
      if (r.isChecked)
        routeId = r.id;
    });

    this.routeHttpService.postDistributeVisitsByRoute(routeId).subscribe(resp => {});
  }
  
  onCalculatePathBtn(): void {
    let dayIds: number[] = [];

    this.routes.forEach(r => {
      r.dayRoutes.forEach(d => {
        
        if (d.isChecked) {
          console.log(d.id);
          dayIds.push(d.id);
        }      
      })
    })

    console.log(dayIds);

    this.routeHttpService.postCalculateForDays(dayIds).subscribe(resp => {
      this.routes = [];
      this.fillRoutes(); 
    });
  }
  
  onCalculateVRPBtn() {
    let visitPoints: number[] = [];

    this.routes.forEach(r => {
      r.dayRoutes.forEach(d => {     
        if (d.isChecked) {  
          visitPoints.push(d.id)
        }      
      })
    })

    this.routeHttpService.postCalculateVRPByDayIds(visitPoints).subscribe(resp => console.log(resp));
  }

  isAllDayRoutesChecked(route: Route): boolean {

    if (!route)
      return false;

    let result = true;

    route.dayRoutes.forEach(d => {
      if(!d.routeDescription)
        result = false;  
      });

      return result;
  }

  isIndeterminate(route: Route): boolean {

    let result = false;
    route.dayRoutes.forEach(dr => {
      if (dr.isChecked)
        result = true;
    })

    let isAllDaysChecked = this.isAllDaysInRouteChecked(route);

    if (!isAllDaysChecked)
      return result;

    route.isChecked = true;

    return false;
  }

}
