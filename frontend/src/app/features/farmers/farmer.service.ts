import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Farmer, FarmerPayload, VerificationStatus } from './farmer.model';

@Injectable({ providedIn: 'root' })
export class FarmerService {
  private readonly endpoint = `${environment.apiUrl}/farmers`;

  constructor(private readonly http: HttpClient) {}

  registerFarmer(payload: FarmerPayload): Observable<Farmer> {
    return this.http
      .post<ApiResponse<Farmer>>(`${this.endpoint}/register`, payload)
      .pipe(map((response) => response.data));
  }

  getFarmers(search = ''): Observable<Farmer[]> {
    const params = search.trim() ? new HttpParams().set('search', search.trim()) : undefined;
    return this.http
      .get<ApiResponse<Farmer[]>>(this.endpoint, { params })
      .pipe(map((response) => response.data));
  }

  getFarmerById(id: string): Observable<Farmer> {
    return this.http
      .get<ApiResponse<Farmer>>(`${this.endpoint}/${id}`)
      .pipe(map((response) => response.data));
  }

  updateFarmer(id: string, payload: Partial<FarmerPayload>): Observable<Farmer> {
    return this.http
      .put<ApiResponse<Farmer>>(`${this.endpoint}/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  verifyFarmer(id: string, verificationStatus: VerificationStatus): Observable<Farmer> {
    return this.http
      .patch<ApiResponse<Farmer>>(`${this.endpoint}/${id}/verify`, { verificationStatus })
      .pipe(map((response) => response.data));
  }
}

