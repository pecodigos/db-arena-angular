import { Injectable } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private stompClient: Client | null = null;
  private matchSubscription: StompSubscription | null = null;
  private matchCallBack: ((message: any) => void) | null = null;
  private searchSubscription: StompSubscription | null = null;
  private connected: boolean = false;

  connect(): void {
    const socketUrl = 'http://localhost:8080/ws';
    const socket = new SockJS(socketUrl);

    this.stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
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
    };

    this.stompClient.onDisconnect = () => {
      console.log('Disconnected from WebSocket');
      this.connected = false;
    };

    this.stompClient.activate();
  }

  searchForMatch(playerId: string): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/search',
        body: playerId
      });
    } else {
      console.error('WebSocket connection not established.');
    }
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
  }
}
