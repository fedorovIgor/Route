import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
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
import {Draw, Modify} from 'ol/interaction';
import { SelectEvent } from 'ol/interaction/Select';
import Collection from 'ol/Collection';
import { unByKey } from 'ol/Observable';
import { getLength } from 'ol/sphere';


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
  private measureLayer: VectorSource = new VectorSource() ;
  private draw: Draw = new Draw({
    source: this.measureLayer,
    type: 'LineString',
  });

  private mesuareEvent: any;
  private measureOverlay!: Overlay;
  private measureElement: any;
  private drawnLine!: LineString;

  private currantPoint!: Feature<Geometry>;


  private featureMap: Map<number, Feature> = new Map<number, Feature<MultiLineString>>();
  private circleMap: Map<number, Feature[]> = new Map<number, Feature[]>;

  constructor (
    private routeEventService: RouteEventService,
    private renderer: Renderer2, private el: ElementRef
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
        new VectorLayer({
          source: this.measureLayer,
          style: new Style({
            stroke: new Stroke({
              color: 'rgba(255, 0, 0, 1.0)',
              width: 2
            })
          }),
          
        })
      ],

      view: new View({
        center: transform([39.2682586474503, 51.6698044614822],'EPSG:4326', 'EPSG:3857'),
        zoom: 14,
      })
    });

    this.addMapListeners();
    this.eventSubscriber();

    // Позволяет изменять нарисованную линию
    // this.map.addInteraction(new Modify({source: this.measureLayer}));

    this.map.addInteraction(this.draw);

    this.toggleMeasure();

    this.configDraw();

  }


  private eventSubscriber() {
    this.routeEventService.printDay().subscribe(dayRoute => {
      this.printLine(dayRoute);
    })

    this.routeEventService.removeDay().subscribe(dayRouteId => {
      this.removeLine(dayRouteId);
    })

    this.routeEventService.cleanMapEvent.subscribe(() => {
        this.clearMap();
    })

    this.routeEventService.selectedVisit().subscribe(visit => {
      this.changePointFormToSelected(visit.id);
    })

    this.routeEventService.redrowRoute().subscribe(dayRoute => {
      this.redrowRouetDay(dayRoute);
    })
  }


  addMapListeners() {
    
    // При нажатии на точку вызывается эвент 
    // Также меняется отображение точки на карте - меняется ее размер и контур
    this.map.on("click", (e) => {
      e.map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
        if (feature && layer && layer.getSource() == this.circleSource){
          let visit = feature.get('visit') as Visit;
          this.changePointFormToSelected(visit.id);

          this.routeEventService.sendVisit(visit);
        } 
        else {
        }
      });
    });

    let choosenFeatureCircle: any = null;
    const textFeature = new Feature ({
      name: 'Clicked on feature' 
    });

    // Отображает информацию о точке при наведении на нее
    // с помощью добавления текстовой feature 
    // должен отображаться толко один текстовый блок единовременно
    // TODO: исправить мерцания при наведении на несколько точек (возможно использовать кластеризацию точек)
    this.map.on("pointermove", (e) => {
      const pixel = this.map.getEventPixel(e.originalEvent);
      const hit = this.map.hasFeatureAtPixel(pixel); // Проверяем, есть ли объекты на данном пикселе

      if (!hit) {
        choosenFeatureCircle = null;
        this.textLayer.clear();
      }
        

      e.map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {

        if (choosenFeatureCircle != feature && layer && layer.getSource() == this.circleSource) {
          choosenFeatureCircle = feature;
          let olFeature = feature as Feature<Point>;
            let coordinates = olFeature.getGeometry()?.getCoordinates();

            if (!coordinates)
              return;

            let visit = olFeature.get('visit') as Visit;

            let info = visit.customerWarehouse.customerId + ' \n'
             + ' адрес: ' + visit.customerWarehouse.address + ' \n' 
             + ' маршрут: ' + visit.routeId

            textFeature.setGeometry(new Point(coordinates));

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

  createOverlay(): void {

    let element = document.createElement('div');
    this.measureElement = element
    this.measureElement.className = 'ol-tooltip ol-tooltip-measure';
    this.measureElement.style.backgroundColor = 'yellow';

    // Создаем Overlay
    this.measureOverlay = new Overlay({
      element: this.measureElement,
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [0, -15],
    });

    // Добавляем Overlay на карту
    this.map.addOverlay(this.measureOverlay);

    // Устанавливаем позицию Overlay по клику на карту
    this.mesuareEvent = this.map.on('click', (evt) => {
      
      if (!this.drawnLine)
        return;

      const length = getLength(this.drawnLine);
      const roundedNum = Math.round(length); 
      this.measureElement.innerHTML = roundedNum + ' м';

      this.measureOverlay.setPosition(evt.coordinate);
    });
  }

  configDraw() {

  
    this.draw.on('drawstart', (evt) => {
      this.drawnLine = evt.feature.getGeometry() as LineString;
      
      this.createOverlay();
    });

    

    this.draw.on('drawend', (evt) => {
      const line = evt.feature.getGeometry() as LineString;
      const length = getLength(line);
      const roundedNum = Math.round(length); 
      this.measureElement.innerHTML = roundedNum + ' м';
      // Отписываемся от эвента
      if (this.mesuareEvent) {
        unByKey(this.mesuareEvent);
        this.mesuareEvent = null;
      }
    });
  }

  redrowRouetDay(dayRoute: DayRoute) {
    if (!this.featureMap.has(dayRoute.id))
      return;

    let line = this.featureMap.get(dayRoute.id)
    if (!line)
      return;

    let lineStile = line.getStyle() as Style;
    if (!lineStile)
      return;

    lineStile.getStroke()?.setColor(dayRoute.color);
    line.setStyle(lineStile);

    let circles = this.circleMap.get(dayRoute.id);
    if (!circles)
      return;

    circles.forEach(c => {
      let circleStyle = c.getStyle() as Style;
      if (!circleStyle)
        return;
  
      let currentImage = circleStyle.getImage() as CircleStyle;
      if (!currentImage) 
        return;
      
      let fill = currentImage.getFill();
      fill?.setColor(dayRoute.color);
  
      currentImage.setFill(fill);
      c.setStyle(circleStyle);
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

  private changePointFormToDefault() {

    let style = this.currantPoint.getStyle() as Style;
    
    if (!style)
      return;

    let currentImage = style.getImage() as CircleStyle;

    if (!currentImage) 
      return;

    let radius = currentImage.getRadius();

    
    currentImage.setRadius(12);
    currentImage.setStroke(new Stroke({ color: 'black', width: 2 }));
    
  }

  changePointFormToSelected(visitId: number) {
    let circle = this.circleSource.getFeatureById(visitId);

    if (!circle)
      return;

    if (this.currantPoint)
      this.changePointFormToDefault();
    
    this.currantPoint =  circle;

    let style = circle.getStyle() as Style;
    
    if (!style)
      return;

    let currentImage = style.getImage() as CircleStyle;

    if (!currentImage) 
      return;
    
    currentImage.setRadius(20);
    currentImage.setStroke(new Stroke({ color: 'white', width: 8 }));

    // Без явного присвоения не работает
    circle.setStyle(style);
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
        fill: new Fill({ color: color }),
        stroke: new Stroke({ color: 'black', width: 2 }) 
      }),
      text: textStyle,
    });

    pointFeature.setStyle(pointStyle); 

    pointFeature.setProperties({'visit': visit});
    pointFeature.setId(visit.id);

    this.circleSource.addFeature(pointFeature);

    return pointFeature;
  }
  
  clearMap() {
    this.featureMap.forEach((value, key) => {
      this.removeLine(key);
    })

    // удаление линеек
    this.measureLayer.clear()

    // очистка HTML элементов(расстояний) с карты
    const tooltips = this.el.nativeElement.querySelectorAll('.ol-tooltip.ol-tooltip-measure');
    tooltips.forEach((tooltip: HTMLElement) => {
      this.renderer.removeChild(tooltip.parentNode, tooltip);
    });
  }

  toggleMeasure() {
    
    const interactions = this.map.getInteractions().getArray();
    const drawInteraction = interactions.find(interaction => interaction === this.draw);
    
    drawInteraction?.setActive(!drawInteraction?.getActive());
  }

}
