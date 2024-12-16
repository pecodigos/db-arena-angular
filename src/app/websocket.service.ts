import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth/auth.service';
import { Injectable } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private stompClient: Client | null = null;
  private matchSubscription: StompSubscription | null = null;
  private searchSubscription: StompSubscription | null = null;
  private connected: boolean = false;

  private matchCallBack: ((message: any) => void) | null = null;

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  connect(): void {
    const jwtToken = this.authService.getToken();

    if (!jwtToken) {
      console.error('Token not found. Cannot connect to WebSocket.');
      return;
    }

    const socketUrl = 'http://localhost:8080/ws';
    const socket = new SockJS(socketUrl);

    this.stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        Authorization: `Bearer ${jwtToken}`
      }
    });

    this.stompClient.onConnect = (frame) => {
      console.log('Connected to WebSocket:', frame);
      this.connected = true;

      this.matchSubscription = this.stompClient?.subscribe('/user/queue/match', (message) => {
        if (this.matchCallBack) {
          this.matchCallBack(JSON.parse(message.body));
        }
      }) || null;

      this.searchSubscription = this.stompClient?.subscribe('/user/queue/search-status', (message) => {
        console.log('Search status message:', message.body);
      }) || null;
      if (this.onConnectionEstablishedCallback) {
        this.onConnectionEstablishedCallback();
      }
    };

    this.stompClient.onDisconnect = () => {
      console.log('Disconnected from WebSocket');
      this.connected = false;
    };

    this.stompClient.activate();
  }

  private onConnectionEstablishedCallback: (() => void) | null = null;

  onConnectionEstablished(callback: () => void): void {
    this.onConnectionEstablishedCallback = callback;
  }

  searchForMatch(): void {
    console.log('Starting match search...');

    this.http.post('http://localhost:8080/api/battle/search', {}).subscribe({
      next: () => {
        console.log('Match search started.');
      },
      error: (err) => {
        console.error('Error starting match search:', err);
      }
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  onMatch(callback: (message: any) => void): void {
    this.matchCallBack = callback;
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
  }
}
