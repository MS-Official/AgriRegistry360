import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VerificationStatus } from '../farmers/farmer.model';
import { ApiResponse, Crop, CropPayload } from './crop.model';

@Injectable({ providedIn: 'root' })
export class CropService {
  private readonly endpoint = `${environment.apiUrl}/crops`;
  private readonly farmEndpoint = `${environment.apiUrl}/farms`;
  private readonly farmerEndpoint = `${environment.apiUrl}/farmers`;

  constructor(private readonly http: HttpClient) {}

  registerCrop(payload: CropPayload): Observable<Crop> {
    return this.http
      .post<ApiResponse<Crop>>(`${this.endpoint}/register`, payload)
      .pipe(map((response) => response.data));
  }

  getCrops(search = ''): Observable<Crop[]> {
    const params = search.trim() ? new HttpParams().set('search', search.trim()) : undefined;
    return this.http
      .get<ApiResponse<Crop[]>>(this.endpoint, { params })
      .pipe(map((response) => response.data));
  }

  getCropById(id: string): Observable<Crop> {
    return this.http
      .get<ApiResponse<Crop>>(`${this.endpoint}/${id}`)
      .pipe(map((response) => response.data));
  }

  getCropsByFarmId(farmId: string): Observable<Crop[]> {
    return this.http
      .get<ApiResponse<Crop[]>>(`${this.farmEndpoint}/${farmId}/crops`)
      .pipe(map((response) => response.data));
  }

  getCropsByFarmerId(farmerId: string): Observable<Crop[]> {
    return this.http
      .get<ApiResponse<Crop[]>>(`${this.farmerEndpoint}/${farmerId}/crops`)
      .pipe(map((response) => response.data));
  }

  updateCrop(id: string, payload: Partial<CropPayload>): Observable<Crop> {
    return this.http
      .put<ApiResponse<Crop>>(`${this.endpoint}/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  verifyCrop(id: string, verificationStatus: VerificationStatus): Observable<Crop> {
    return this.http
      .patch<ApiResponse<Crop>>(`${this.endpoint}/${id}/verify`, { verificationStatus })
      .pipe(map((response) => response.data));
  }
}

