import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Character } from '../interfaces/character.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CharacterSelectionService {

  private apiUrl = `${environment.apiBaseUrl}/api/characters`;

  constructor(private http: HttpClient) { }

  getAllCharacters(): Observable<Character[]> {
    return this.http.get<Character[]>(`${this.apiUrl}/`);
  }

  getCharacter(id: number): Observable<Character> {
    return this.http.get<Character>(`${this.apiUrl}/${id}`);
  }
}
