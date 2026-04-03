import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

import { WebsocketService } from './websocket.service';

describe('WebsocketService', () => {
  let service: WebsocketService;

  const newSubscription = (id: string): StompSubscription => ({
    id,
    unsubscribe: jasmine.createSpy(`unsubscribe-${id}`),
  }) as unknown as StompSubscription;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(WebsocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should replace stale subscription references on reconnect', () => {
    const staleMatchSubscription = newSubscription('stale-match');
    const staleMatchEndSubscription = newSubscription('stale-match-end');
    const staleMatchErrorSubscription = newSubscription('stale-match-error');
    const staleSearchSubscription = newSubscription('stale-search');

    (service as any).matchSubscription = staleMatchSubscription;
    (service as any).matchEndSubscription = staleMatchEndSubscription;
    (service as any).matchErrorSubscription = staleMatchErrorSubscription;
    (service as any).searchSubscription = staleSearchSubscription;

    (service as any).searchStatusCallbacks = [() => undefined];

    const subscribeSpy = jasmine.createSpy('subscribe').and.callFake((destination: string) => {
      return newSubscription(`new-${destination}`);
    });

    (service as any).stompClient = {
      connected: true,
      subscribe: subscribeSpy,
    } as unknown as Client;

    let latestConnectionStatus = false;
    const connectionStatusSub = service.connectionStatus$.subscribe((status) => {
      latestConnectionStatus = status;
    });

    (service as any).handleConnected({});

    expect(subscribeSpy).toHaveBeenCalledWith('/user/queue/match', jasmine.any(Function));
    expect(subscribeSpy).toHaveBeenCalledWith('/user/queue/match-end', jasmine.any(Function));
    expect(subscribeSpy).toHaveBeenCalledWith('/user/queue/match-error', jasmine.any(Function));
    expect(subscribeSpy).toHaveBeenCalledWith('/user/queue/search-status', jasmine.any(Function));
    expect((service as any).matchSubscription).not.toBe(staleMatchSubscription);
    expect((service as any).matchEndSubscription).not.toBe(staleMatchEndSubscription);
    expect((service as any).matchErrorSubscription).not.toBe(staleMatchErrorSubscription);
    expect((service as any).searchSubscription).not.toBe(staleSearchSubscription);
    expect(latestConnectionStatus).toBeTrue();

    connectionStatusSub.unsubscribe();
  });

  it('should clear subscription references when disconnected', () => {
    (service as any).matchSubscription = newSubscription('match');
    (service as any).matchEndSubscription = newSubscription('match-end');
    (service as any).matchErrorSubscription = newSubscription('match-error');
    (service as any).searchSubscription = newSubscription('search');
    (service as any).connectionStatusSubject.next(true);

    let latestConnectionStatus = true;
    const connectionStatusSub = service.connectionStatus$.subscribe((status) => {
      latestConnectionStatus = status;
    });

    (service as any).handleDisconnected('Disconnected from WebSocket');

    expect((service as any).matchSubscription).toBeNull();
    expect((service as any).matchEndSubscription).toBeNull();
    expect((service as any).matchErrorSubscription).toBeNull();
    expect((service as any).searchSubscription).toBeNull();
    expect(latestConnectionStatus).toBeFalse();

    connectionStatusSub.unsubscribe();
  });

  it('should clear the cached match when the server reports no active match', () => {
    let handler: ((message: IMessage) => void) | undefined;

    (service as any).stompClient = {
      connected: true,
      subscribe: jasmine.createSpy('subscribe').and.callFake((_: string, callback: (message: IMessage) => void) => {
        handler = callback;
        return newSubscription('match');
      }),
    } as unknown as Client;

    const callback = jasmine.createSpy('matchCallback');
    (service as any).lastMatchData = {
      match: {
        playerOne: {} as never,
        playerTwo: {} as never,
        currentPlayer: {} as never,
        turnNumber: 3,
        battleState: 'IN_BATTLE',
        battleQueueType: 'QUICK',
      },
      opponentData: {} as never,
    };

    service.onMatch(callback);
    (service as any).subscribeToMatch();

    handler?.({ body: 'null' } as IMessage);

    expect((service as any).lastMatchData).toBeNull();
    expect(callback).toHaveBeenCalledWith(null);
  });
});
