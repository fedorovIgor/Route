import { DayRoute } from "./DayRoutes";

export interface Route {
    id: number;
    regionId: number;
    activityId: number;
    routeNumber: number;
    tsmId: number;
    agentId: number;
    groupId: number;
    routeName: string,
    startPointId: number;
    finishPointId: number;

    dayRoutes: DayRoute[];

    isChecked: boolean;
}