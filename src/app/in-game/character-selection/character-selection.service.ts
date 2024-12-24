import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Character } from '../interfaces/character.interface';

@Injectable({
  providedIn: 'root'
})
export class CharacterSelectionService {

  private apiUrl = 'http://localhost:8080/api/characters'

  constructor(private http: HttpClient) { }

  getAllCharacters(): Observable<any> {
    return this.http.get<Character[]>(`${this.apiUrl}/`);
  }

  getCharacter(id: number): Observable<any> {
    return this.http.get<Character>(`${this.apiUrl}/${id}`);
  }
}
