import { Visit } from "./Visit";

export interface DayRoute {
    id: number;
    routeId: number;
    week: number;
    dayInWeek: number;
    routeLength: number;
    routeDuration: number;
    startPointId: number;
    finishPointId: number;
    startTime: Date;
    routeDescription: string;
    color: string;
    
    visits: Visit[];

    isChecked: boolean;
  }