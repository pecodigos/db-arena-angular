import { Injectable } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private stompClient: Client | null = null;
  private matchSubscription: StompSubscription | null = null;
  private searchSubscription: StompSubscription | null = null;

  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  connectionStatus$ = this.connectionStatusSubject.asObservable();

  private lastMatchData: any = null;
  private matchCallbacks: ((message: any) => void)[] = [];
  private searchStatusCallback: ((status: string) => void) | null = null;

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.stompClient?.connected) {
      console.log('WebSocket is already connected');
      this.connectionStatusSubject.next(true);
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.error('Token not found. Cannot connect to WebSocket.');
      this.connectionStatusSubject.next(false);
      return;
    }

    const socketUrl = 'http://localhost:8080/ws';
    const socket = new SockJS(socketUrl);

    this.stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => console.log('STOMP Debug:', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => {
      console.log('Connected to WebSocket:', frame);
      this.connectionStatusSubject.next(true);
      console.log('WebSocket connected');

      this.subscribeToMatch();

      if (this.searchStatusCallback) {
        this.subscribeToSearchStatus();
      }

      if (this.lastMatchData && this.matchCallbacks.length > 0) {
        this.matchCallbacks.forEach(callback => callback(this.lastMatchData));
      }
    };

    this.stompClient.onDisconnect = () => {
      console.log('Disconnected from WebSocket');
      this.connectionStatusSubject.next(false);
    };

    this.stompClient.onStompError = (error) => {
      console.error('STOMP error:', error.headers, error.body);
      this.connectionStatusSubject.next(false);
    };

    this.stompClient.activate();
  }

  private subscribeToMatch(): void {
    if (!this.stompClient?.connected) {
      console.warn('Cannot subscribe to match: WebSocket not connected');
      return;
    }

    if (this.matchSubscription) {
      console.log('Match subscription already exists');
      return;
    }

    console.log('Creating new match subscription');
    this.matchSubscription = this.stompClient.subscribe('/user/queue/match', (message) => {
      const matchData = JSON.parse(message.body);
      console.log('Received match data: ', matchData);
      this.lastMatchData = matchData;

      this.matchCallbacks.forEach(callback => {
        try {
          callback(matchData);
        } catch (error) {
          console.error('Error in match callback:', error);
        }
      });
    });
  }

  private subscribeToSearchStatus(): void {
    if (!this.stompClient?.connected) {
      console.warn('Cannot subscribe to search status: WebSocket not connected');
      return;
    }

    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    this.searchSubscription = this.stompClient.subscribe('/user/queue/search-status', (message) => {
      const status = message.body;
      console.log('Received search status: ', status);
      if (this.searchStatusCallback) {
        this.searchStatusCallback(status);
      }
    });
  }

  onMatch(callback: (message: any) => void): void {
    console.log('Registering new match callback');
    if (!this.matchCallbacks.includes(callback)) {
      this.matchCallbacks.push(callback);
    }

    if (this.lastMatchData && this.stompClient?.connected) {
      callback(this.lastMatchData);
    }

    if (this.stompClient?.connected && !this.matchSubscription) {
      this.subscribeToMatch();
    }
  }

  onSearchStatus(callback: (status: string) => void): void {
    this.searchStatusCallback = callback;
    if (this.stompClient?.connected) {
      this.subscribeToSearchStatus();
    }
  }

  removeMatchCallback(callback: (message: any) => void): void {
    const index = this.matchCallbacks.indexOf(callback);
    if (index > -1) {
      this.matchCallbacks.splice(index, 1);
    }
  }

  searchForMatch(): void {
    if (!this.stompClient?.connected) {
      console.error('WebSocket is not connected.');
      return;
    }

    console.log('Publishing search for match message...');
    this.stompClient.publish({
      destination: '/app/battle/search',
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

  endTurn(): void {
    if (!this.stompClient?.connected) {
      console.error('WebSocket is not connected.');
      return;
    }

    this.stompClient.publish({
      destination: '/app/battle/end-turn',
      body: JSON.stringify({}),
    });
  }

  disconnect(): void {
    if (this.matchSubscription) {
      this.matchSubscription.unsubscribe();
      this.matchSubscription = null;
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
      this.searchSubscription = null;
    }
    if (this.stompClient) {
      this.stompClient.deactivate();
      console.log('WebSocket client deactivated');
    }
    this.connectionStatusSubject.next(false);
    this.matchCallbacks = [];
    this.searchStatusCallback = null;
    this.lastMatchData = null;
  }

  isConnected(): boolean {
    return this.stompClient?.connected || false;
  }
}
