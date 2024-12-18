import { Injectable } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from '../auth/auth.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private stompClient: Client | null = null;
  private matchSubscription: StompSubscription | null = null;
  private searchSubscription: StompSubscription | null = null;

  private connected: boolean = false;
  private connectionState = new Subject<boolean>();

  private matchCallback: ((message: any) => void) | null = null;
  private searchStatusCallback: ((status: string) => void) | null = null;

  constructor(private authService: AuthService) {}

  getConnectionState() {
    return this.connectionState.asObservable();
  }

  connect(): void {
    const token = this.authService.getToken();

    if (!token) {
      console.error('Token not found. Cannot connect to WebSocket.');
      return;
    }

    console.log('Retrieved token:', token);

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
      this.connected = true;
      this.connectionState.next(true);

      this.subscribeToMatch();
      this.subscribeToSearchStatus();

      if (this.onConnectionEstablishedCallback) {
        this.onConnectionEstablishedCallback();
      }
    };

    this.stompClient.onDisconnect = () => {
      console.log('Disconnected from WebSocket');
      this.connected = false;
      this.connectionState.next(false);
    };

    this.stompClient.onStompError = (error) => {
      console.error('STOMP error:', error.headers, error.body);
    };

    this.stompClient.activate();
  }


  private subscribeToMatch(): void {
    if (this.matchSubscription) {
      this.matchSubscription.unsubscribe();
    }

    const token = this.authService.getToken();

    if (!token) {
      console.error('Token not found. Cannot subscribe to WebSocket.');
      return;
    }

    this.matchSubscription = this.stompClient?.subscribe(
      '/user/queue/match',
      (message) => {
        console.log('Received match message:', message.body);
        if (this.matchCallback) {
          this.matchCallback(JSON.parse(message.body));
        }
      },
      { Authorization: `Bearer ${token}`}
    ) || null;
  }


  private subscribeToSearchStatus(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    this.searchSubscription = this.stompClient?.subscribe(
      '/user/queue/search-status',
      (message) => {
        console.log('Received search status:', message.body);
        if (this.searchStatusCallback) {
          this.searchStatusCallback(message.body);
        }
      }
    ) || null;
  }


  searchForMatch(): void {
    console.log('Sending search for match command...');

    if (!this.stompClient || !this.stompClient.connected) {
      console.error('WebSocket is not connected.');
      return;
    }

    this.stompClient.publish({
      destination: '/app/battle/search',
      body: JSON.stringify({}),
    });
  }

  getMatchDetails(): void {
    console.log('Requesting match details...');

    if (!this.stompClient || !this.stompClient.connected) {
      console.error('WebSocket is not connected.');
      return;
    }

    this.stompClient.publish({
      destination: '/app/battle/get-match',
      body: JSON.stringify({}),
    });
  }


  endTurn(): void {
    console.log('Ending turn...');

    if (!this.stompClient || !this.stompClient.connected) {
      console.error('WebSocket is not connected.');
      return;
    }

    this.stompClient.publish({
      destination: '/app/battle/end-turn',
      body: JSON.stringify({}),
    });
  }


  onMatch(callback: (message: any) => void): void {
    this.matchCallback = callback;
  }


  onSearchStatus(callback: (status: string) => void): void {
    this.searchStatusCallback = callback;
  }


  disconnect(): void {
    if (this.matchSubscription) {
      this.matchSubscription.unsubscribe();
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    if (this.stompClient) {
      this.stompClient.deactivate();
      console.log('WebSocket client deactivated');
    }
    this.connected = false;
    this.connectionState.next(false);
  }

  private onConnectionEstablishedCallback: (() => void) | null = null;

  onConnectionEstablished(callback: () => void): void {
    this.onConnectionEstablishedCallback = callback;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
