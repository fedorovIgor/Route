import { Route } from "../../models/Route";


export interface RouteComponentInterface {

    // запрашивает пути с сервера и подготавливает к корректному отображению
    fillRoutes(): void;
    
    // изменяет флаг у модели DayRoutes, проверяет не надо ли изменить чекбокс у Route
    // создает эвент на отрисовку
    onDayCheckboxChange(event: any, routeId:number, routeDayId: number): void;

    // изменяет флаг у вложенных моделей DayRoutes и у Route
    // создает эвент на отрисовку
    onRouteCheckboxChange(event: any, routeId:number): void;

    // отправляет на сервер запрос для расчета нераспределенных визитов
    // TODO: вызывает сообщение о завершении
    onDistribute(): void;

    // выбирает DayRoutes с isChecked == true и запрашивает у сервера расчет  
    // пути обхода для них.
    // создает эвент на очистку карты
    onCalculatePathBtn(): void;

    // запрашивает сервер на расчет порядка обхода выбранных маршрутов.
    // по завершению вызывается запрос для обнавления всех route[]
    onCalculateVRPBtn(): void;

    // показавает у всех ли DayRoutes в выбранном Route стоит description == true
    isAllDayRoutesHasDescription(route: Route): boolean

    // TODO: убирает все отметки как у Route так и у DayRoute
    
}