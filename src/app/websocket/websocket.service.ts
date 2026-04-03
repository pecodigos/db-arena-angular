import { Injectable } from '@angular/core';
import { Client, IFrame, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject } from 'rxjs';
import { SearchMatchRequest } from '../in-game/interfaces/search-match-request.interface';
import { BattleQueueType } from '../in-game/enums/battle-queue-type.enum';
import { environment } from '../../environments/environment';
import { MatchEndResponse, MatchResponse } from '../in-game/interfaces/match-response.interface';

type MatchCallback = (message: MatchResponse | null) => void;

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private stompClient: Client | null = null;
  private matchSubscription: StompSubscription | null = null;
  private searchSubscription: StompSubscription | null = null;
  private matchEndSubscription: StompSubscription | null = null;
  private matchErrorSubscription: StompSubscription | null = null;

  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  connectionStatus$ = this.connectionStatusSubject.asObservable();

  private lastMatchData: MatchResponse | null = null;
  private matchCallbacks: MatchCallback[] = [];
  private matchEndCallbacks: ((payload: MatchEndResponse) => void)[] = [];
  private matchErrorCallbacks: ((message: string) => void)[] = [];
  private searchStatusCallbacks: ((status: string) => void)[] = [];
  private pendingSearchRequest: SearchMatchRequest | null = null;

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.stompClient?.connected) {
      console.log('WebSocket is already connected');
      this.connectionStatusSubject.next(true);
      return;
    }

    if (this.stompClient?.active) {
      console.log('WebSocket connection already in progress');
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.error('Token not found. Cannot connect to WebSocket.');
      this.connectionStatusSubject.next(false);
      return;
    }

    const socketUrl = `${environment.wsBaseUrl}/ws`;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => console.log('STOMP Debug:', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => this.handleConnected(frame);

    this.stompClient.onDisconnect = () => {
      this.handleDisconnected('Disconnected from WebSocket');
    };

    this.stompClient.onWebSocketClose = () => {
      this.handleDisconnected('Disconnected from WebSocket');
    };

    this.stompClient.onStompError = (error) => {
      console.error('STOMP error:', error.headers, error.body);
      this.handleDisconnected('Disconnected from WebSocket due to STOMP error');
    };

    this.stompClient.activate();
  }

  private handleConnected(_: IFrame): void {
    // Reconnects create a new STOMP session, so force fresh queue subscriptions.
    this.clearSubscriptionReferences();

    this.subscribeToMatch();
    this.subscribeToMatchEnd();
    this.subscribeToMatchError();

    if (this.searchStatusCallbacks.length > 0) {
      this.subscribeToSearchStatus();
    }

    this.connectionStatusSubject.next(true);

    if (this.pendingSearchRequest) {
      this.publishSearchRequest(this.pendingSearchRequest);
      this.pendingSearchRequest = null;
    }

    const cachedMatchData = this.lastMatchData;
    if (cachedMatchData && this.matchCallbacks.length > 0) {
      this.matchCallbacks.forEach(callback => callback(cachedMatchData));
    }
  }

  private handleDisconnected(message: string): void {
    console.warn(message);
    this.clearSubscriptionReferences();
    this.connectionStatusSubject.next(false);
  }

  private clearSubscriptionReferences(): void {
    this.matchSubscription = null;
    this.searchSubscription = null;
    this.matchEndSubscription = null;
    this.matchErrorSubscription = null;
  }

  private unsubscribeFromAllQueues(): void {
    this.matchSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
    this.matchEndSubscription?.unsubscribe();
    this.matchErrorSubscription?.unsubscribe();
    this.clearSubscriptionReferences();
  }

  private subscribeToMatch(): void {
    if (!this.stompClient?.connected) {
      console.warn('Cannot subscribe to match: WebSocket not connected');
      return;
    }

    if (this.matchSubscription) {
      return;
    }

    this.matchSubscription = this.stompClient.subscribe('/user/queue/match', (message) => {
      const matchData = this.parseMatchPayload(message.body);
      if (matchData === undefined) {
        return;
      }

      if (!matchData?.match) {
        this.lastMatchData = null;
        this.notifyMatchCallbacks(null);
        return;
      }

      this.lastMatchData = matchData;
      this.notifyMatchCallbacks(matchData);
    });
  }

  private subscribeToSearchStatus(): void {
    if (!this.stompClient?.connected) {
      console.warn('Cannot subscribe to search status: WebSocket not connected');
      return;
    }

    if (this.searchSubscription) {
      return;
    }

    this.searchSubscription = this.stompClient.subscribe('/user/queue/search-status', (message) => {
      const status = message.body;

      this.searchStatusCallbacks.forEach(callback => {
        try {
          callback(status);
        } catch (error) {
          console.error('Error in search-status callback:', error);
        }
      });
    });
  }

  private subscribeToMatchEnd(): void {
    if (!this.stompClient?.connected || this.matchEndSubscription) {
      return;
    }

    this.matchEndSubscription = this.stompClient.subscribe('/user/queue/match-end', (message) => {
      let payload: MatchEndResponse;

      try {
        payload = JSON.parse(message.body) as MatchEndResponse;
      } catch (error) {
        console.error('Failed to parse match-end payload:', error);
        return;
      }

      this.lastMatchData = null;
      this.matchEndCallbacks.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error('Error in match-end callback:', error);
        }
      });
    });
  }

  private subscribeToMatchError(): void {
    if (!this.stompClient?.connected || this.matchErrorSubscription) {
      return;
    }

    this.matchErrorSubscription = this.stompClient.subscribe('/user/queue/match-error', (message) => {
      const errorMessage = message.body;
      this.matchErrorCallbacks.forEach((callback) => {
        try {
          callback(errorMessage);
        } catch (error) {
          console.error('Error in match-error callback:', error);
        }
      });
    });
  }

  onMatch(callback: MatchCallback): void {
    if (!this.matchCallbacks.includes(callback)) {
      this.matchCallbacks.push(callback);
    }

    const cachedMatchData = this.lastMatchData;
    if (cachedMatchData && this.stompClient?.connected) {
      callback(cachedMatchData);
    }

    if (this.stompClient?.connected && !this.matchSubscription) {
      this.subscribeToMatch();
    }
  }

  onSearchStatus(callback: (status: string) => void): void {
    if (!this.searchStatusCallbacks.includes(callback)) {
      this.searchStatusCallbacks.push(callback);
    }

    if (this.stompClient?.connected && !this.searchSubscription) {
      this.subscribeToSearchStatus();
    }
  }

  removeSearchStatusCallback(callback: (status: string) => void): void {
    const index = this.searchStatusCallbacks.indexOf(callback);
    if (index > -1) {
      this.searchStatusCallbacks.splice(index, 1);
    }
  }

  onMatchEnd(callback: (payload: MatchEndResponse) => void): void {
    if (!this.matchEndCallbacks.includes(callback)) {
      this.matchEndCallbacks.push(callback);
    }

    if (this.stompClient?.connected && !this.matchEndSubscription) {
      this.subscribeToMatchEnd();
    }
  }

  onMatchError(callback: (message: string) => void): void {
    if (!this.matchErrorCallbacks.includes(callback)) {
      this.matchErrorCallbacks.push(callback);
    }

    if (this.stompClient?.connected && !this.matchErrorSubscription) {
      this.subscribeToMatchError();
    }
  }

  removeMatchCallback(callback: MatchCallback): void {
    const index = this.matchCallbacks.indexOf(callback);
    if (index > -1) {
      this.matchCallbacks.splice(index, 1);
    }
  }

  removeMatchEndCallback(callback: (payload: MatchEndResponse) => void): void {
    const index = this.matchEndCallbacks.indexOf(callback);
    if (index > -1) {
      this.matchEndCallbacks.splice(index, 1);
    }
  }

  removeMatchErrorCallback(callback: (message: string) => void): void {
    const index = this.matchErrorCallbacks.indexOf(callback);
    if (index > -1) {
      this.matchErrorCallbacks.splice(index, 1);
    }
  }

  private notifyMatchCallbacks(match: MatchResponse | null): void {
    this.matchCallbacks.forEach((callback) => {
      try {
        callback(match);
      } catch (error) {
        console.error('Error in match callback:', error);
      }
    });
  }

  private parseMatchPayload(body: string): MatchResponse | null | undefined {
    const trimmedBody = body.trim();
    if (!trimmedBody || trimmedBody === 'null') {
      return null;
    }

    try {
      return JSON.parse(trimmedBody) as MatchResponse | null;
    } catch (error) {
      console.error('Failed to parse match payload:', error);
      return undefined;
    }
  }

  searchForMatch(characterIds: number[], battleQueueType: BattleQueueType): void {
    const searchRequest: SearchMatchRequest = {
      characterIds,
      battleQueueType,
    };

    if (!this.stompClient?.connected) {
      this.pendingSearchRequest = searchRequest;
      console.warn('WebSocket not connected yet. Match search queued.');
      return;
    }

    this.publishSearchRequest(searchRequest);
  }

  private publishSearchRequest(searchRequest: SearchMatchRequest): void {
    if (!this.stompClient?.connected) {
      return;
    }

    this.stompClient.publish({
      destination: '/app/battle/search',
      body: JSON.stringify(searchRequest),
    });
  }

  cancelSearch(): void {
    this.pendingSearchRequest = null;

    if (!this.stompClient?.connected) {
      return;
    }

    this.stompClient.publish({
      destination: '/app/battle/cancel-search',
      body: JSON.stringify({}),
    });
  }

  getMatchDetails(): void {
    if (!this.stompClient?.connected) {
      console.error('WebSocket is not connected.');
      return;
    }

    this.stompClient.publish({
      destination: '/app/battle/get-match',
      body: JSON.stringify({}),
    });
  }

  endTurn(turnActions: { actions: { characterIndex: number; skillIndex: number; targetIndexes: number[]; }[] }): void {
    if (!this.stompClient?.connected) {
      console.error('WebSocket is not connected.');
      return;
    }

    this.stompClient.publish({
      destination: '/app/battle/end-turn',
      body: JSON.stringify(turnActions),
    });
  }

  forfeitMatch(): void {
    if (!this.stompClient?.connected) {
      console.error('WebSocket is not connected.');
      return;
    }

    this.stompClient.publish({
      destination: '/app/battle/forfeit',
      body: JSON.stringify({}),
    });
  }

  disconnect(): void {
    this.unsubscribeFromAllQueues();
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
    this.connectionStatusSubject.next(false);
    this.lastMatchData = null;
    this.pendingSearchRequest = null;
  }

  isConnected(): boolean {
    return this.stompClient?.connected || false;
  }
}
