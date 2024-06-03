import Feature from "ol/Feature";
import { DayRoute } from "../../models/DayRoutes";
import { Route } from "../../models/Route";
import { Visit } from "../../models/Visit";

export interface MapComponentInterface {
  
    // отображает векторную линию на карте по точкам хранимым в DayRout.routeDescription
    // вызов по эвенту
    printLine(dayRoute: DayRoute): void;

    // удаляет линию маршрута дня
    // вызов по эвенту
    removeLine(dayId: number): void;

    // рисует векторные точки характеризующие пункты остановок
    // каждая точка хранит в себе свойства
    printPoints(day: DayRoute): void;

    // очищает карту от векторов связаных с маршрутом и пунктами остановок
    // вызов по эвенту
    clearMap(): void;

    // TODO: добавить кнопку выбора источника тайлов (Google Map, OSM)
    
    // TODO: добавить возможность группового выделения (лоссо, элипс, прямоугольник)

    // TODO: добавить линейку - при нажатии на иконку линейки расположенной сверху карты
    // дать пользователю возможность ставить точки. при этом должен создавасться текст
    // с сумарным расстоянием. 
    toggleMeasure(): void;

    // TODO: добавить возможность поставить две точки и построить маршрут по ним
  }