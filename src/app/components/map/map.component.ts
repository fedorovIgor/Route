import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Feature, MapBrowserEvent, Overlay } from 'ol';
import {Map as OlMap} from 'ol';
import View from 'ol/View';
import { Circle, Geometry, LineString, MultiLineString, Point, Polygon } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat, transform } from 'ol/proj';
import OSM from 'ol/source/OSM';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Vector from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { RoutHttpService } from '../../services/routHttp.service';
import { asArray } from 'ol/color';
import { AngularSplitModule } from 'angular-split';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { DayRoute } from '../../models/DayRoutes';
import { Route } from '../../models/Route';
import {MatExpansionModule} from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import { Visit } from '../../models/Visit';
import { CustomerWarehouse } from '../../models/CustomerWarehouse';
import Fill from 'ol/style/Fill';
import CircleStyle from 'ol/style/Circle';
import Text from 'ol/style/Text';
import { last } from 'rxjs';
import Layer from 'ol/layer/Layer';
import { XYZ } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import { MapComponentInterface } from './MapComponentInterface';
import { RouteEventService } from '../../services/route-event.service';


@Component({
  selector: 'app-map',
  standalone: true,
  imports: [ MatListModule,
            CommonModule, MatCheckboxModule,
            MatExpansionModule, FormsModule,MatFormFieldModule,
            MatButtonModule ],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit, MapComponentInterface {
  
  private map!: OlMap;
  private vectorSource: VectorSource = new VectorSource();
  private circleSource: VectorSource = new VectorSource();
  private textLayer: VectorSource = new VectorSource();


  private featureMap: Map<number, Feature> = new Map<number, Feature<MultiLineString>>();
  private circleMap: Map<number, Feature[]> = new Map<number, Feature[]>;

  constructor (
    private routeEventService: RouteEventService
  ) {}

  ngAfterViewInit(): void {
    this.map = new OlMap({
      target: 'map',
    
      layers : [
        new TileLayer({source: new OSM()}),
        // new TileLayer({
        //   source: new XYZ({
        //       url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
        //   })
        // }),
        new VectorLayer({source: this.vectorSource}),
        new VectorLayer({source: this.circleSource}),
        new VectorLayer({source: this.textLayer}),
      ],

      view: new View({
        center: transform([39.2682586474503, 51.6698044614822],'EPSG:4326', 'EPSG:3857'),
        zoom: 14,
      })
    });

    this.addMapListeners();
    this.eventSubscriber();
  }


  private eventSubscriber() {
    this.routeEventService.printDay().subscribe(dayRoute => {
      this.printLine(dayRoute);
    })

    this.routeEventService.removeDay().subscribe(dayRouteId => {
      this.removeLine(dayRouteId);
    })

    this.routeEventService.cleanMapEvent.subscribe(() => {
        console.log('hi!');
        this.clearMap();
    });
  }


  addMapListeners() {

    this.map.on("click", (e) => {
      e.map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
          if (feature && layer.getSource() == this.circleSource){
            let visit = feature.get('visit') as Visit;
            this.routeEventService.sendVisitFromMap(visit);
          } 
          else {
          }
      });
    });

    let choosenFeatureCircle: any = null;

    this.map.on("pointermove", (e) => {
      const pixel = this.map.getEventPixel(e.originalEvent);
      const hit = this.map.hasFeatureAtPixel(pixel); // Проверяем, есть ли объекты на данном пикселе

      if (!hit) {
        choosenFeatureCircle = null;
        this.textLayer.clear();
      }
        

      e.map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {

        if (choosenFeatureCircle != feature && layer.getSource() == this.circleSource) {
          choosenFeatureCircle = feature;
          let olFeature = feature as Feature<Point>;
            let coordinates = olFeature.getGeometry()?.getCoordinates();

            if (!coordinates)
              return;

            let visit = olFeature.get('visit') as Visit;

            let info = visit.customerWarehouse.customerId + ' \n'
             + ' адрес: ' + visit.customerWarehouse.address + ' \n' 
             + ' маршрут: ' + visit.routeId

            const textFeature = new Feature ({
              geometry: new Point(coordinates),
              name: 'Clicked on feature' // Ваш текстовый контент
            });

            const textStyle = new Text({
              font: '20px Calibri,sans-serif',
              fill: new Fill({ color: '#000' }),
              stroke: new Stroke({ color: '#fff', width: 2 }),
              offsetY: -35, 
              text: info,
              backgroundFill: new Fill({ color: 'yellow' }),
              textAlign: 'left'
            });
      
            
            textFeature.setStyle(new Style({
              text: textStyle,
              stroke: new Stroke({
                color: 'red', 
                width: 2
              })
            }));

            this.textLayer.addFeature(textFeature);
        }
      })
    })
  }

  printLine(dayRoute: DayRoute) {

    if (this.featureMap.has(dayRoute.id))
      return;

    let pairs: string[] = dayRoute.routeDescription.split(',');

    let points: number[][] = pairs.map(pair => {
        let nums: string[] = pair.split(' ');
        return nums.map(num => parseFloat(num));
    });

    points.pop();
  
    for (var i = 0; i < points.length; i++) {
        points[i] = transform(points[i], 'EPSG:4326', 'EPSG:3857');
    }

    var thing = new MultiLineString([points]);

    var featurething = new Feature({
      name: dayRoute.id,
      geometry: thing
    });
    

    featurething.setStyle(new Style({
      stroke : new Stroke({
        width: 7,
        color: dayRoute.color
      })
    }));
    
    this.vectorSource.addFeature( featurething );

    this.featureMap.set(dayRoute.id, featurething);

    this.printPoints(dayRoute);
  }

  removeLine(dayId: number) {

    let featurething = this.featureMap.get(dayId);

    if (featurething) {
      this.vectorSource.removeFeature(featurething);
      this.featureMap.delete(dayId);
    }

    let fetureArray = this.circleMap.get(dayId);
    
    if (fetureArray) {
      fetureArray.forEach(f => {
        this.circleSource.removeFeature(f);
      });

      this.circleMap.delete(dayId);
    }
      
  }

  printPoints(day: DayRoute) {

    let fetureArray: Feature[] = [];

    day.visits.forEach(v => {
        let feature = this.addCircleToMap(v,[v.customerWarehouse.lonX,v.customerWarehouse.latY], v.position, day.color) 

        fetureArray.push(feature);
    })

    this.circleMap.set(day.id, fetureArray);
  }

  private addCircleToMap(visit:Visit, coordinates: [number, number], count: number, color: string): Feature {
    const pointGeometry = new Point(fromLonLat(coordinates)); 

    const pointFeature = new Feature({
      geometry: pointGeometry
    });

    const textStyle = new Text({
      text: `${count}`,
      font: '16px Arial', 
      fill: new Fill({ color: 'black' }), 
      offsetY: 0
    });

    const pointStyle = new Style({
      image: new CircleStyle({
        radius: 12,
        fill: new Fill({ color: color }), // Цвет заливки
        stroke: new Stroke({ color: 'black', width: 2 }) // Цвет и толщина обводки
      }),
      text: textStyle // Добавляем текстовый стиль к точке
    });

    pointFeature.setStyle(pointStyle); // Устанавливаем стиль для точки

    pointFeature.setProperties({'visit': visit});

    this.circleSource.addFeature(pointFeature);

    return pointFeature;
  }
  
  clearMap() {
    this.featureMap.forEach((value, key) => {
      this.removeLine(key);
    })
  }


}
