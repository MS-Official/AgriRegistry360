import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VerificationStatus } from '../farmers/farmer.model';
import { ApiResponse, Farm, FarmPayload } from './farm.model';

@Injectable({ providedIn: 'root' })
export class FarmService {
  private readonly endpoint = `${environment.apiUrl}/farms`;
  private readonly farmerEndpoint = `${environment.apiUrl}/farmers`;

  constructor(private readonly http: HttpClient) {}

  registerFarm(payload: FarmPayload): Observable<Farm> {
    return this.http
      .post<ApiResponse<Farm>>(`${this.endpoint}/register`, payload)
      .pipe(map((response) => response.data));
  }

  getFarms(search = ''): Observable<Farm[]> {
    const params = search.trim() ? new HttpParams().set('search', search.trim()) : undefined;
    return this.http
      .get<ApiResponse<Farm[]>>(this.endpoint, { params })
      .pipe(map((response) => response.data));
  }

  getFarmById(id: string): Observable<Farm> {
    return this.http
      .get<ApiResponse<Farm>>(`${this.endpoint}/${id}`)
      .pipe(map((response) => response.data));
  }

  getFarmsByFarmerId(farmerId: string): Observable<Farm[]> {
    return this.http
      .get<ApiResponse<Farm[]>>(`${this.farmerEndpoint}/${farmerId}/farms`)
      .pipe(map((response) => response.data));
  }

  updateFarm(id: string, payload: Partial<FarmPayload>): Observable<Farm> {
    return this.http
      .put<ApiResponse<Farm>>(`${this.endpoint}/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  verifyFarm(id: string, verificationStatus: VerificationStatus): Observable<Farm> {
    return this.http
      .patch<ApiResponse<Farm>>(`${this.endpoint}/${id}/verify`, { verificationStatus })
      .pipe(map((response) => response.data));
  }
}

