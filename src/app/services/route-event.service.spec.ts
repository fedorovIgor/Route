import { TestBed } from '@angular/core/testing';

import { RouteEventService } from './route-event.service';

describe('RouteEventService', () => {
  let service: RouteEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RouteEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
