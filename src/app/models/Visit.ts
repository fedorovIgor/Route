import { CustomerWarehouse } from "./CustomerWarehouse";

    
 export interface Visit {   
    id: number;
    dayInWeek: number;
    position: number;
    customerId: number;
    customerStrId: number;
    warehouseId: number;
    distanceToNext: number;
    timeToNext: number;
    timeArr: number;

    customerWarehouse: CustomerWarehouse;
    routeId: number;
}