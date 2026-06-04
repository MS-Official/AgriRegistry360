import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Eligibility, EligibilityPayload } from './eligibility.model';

@Injectable({ providedIn: 'root' })
export class EligibilityService {
  private readonly endpoint = `${environment.apiUrl}/eligibility`;
  private readonly farmerEndpoint = `${environment.apiUrl}/farmers`;
  private readonly farmEndpoint = `${environment.apiUrl}/farms`;
  private readonly cropEndpoint = `${environment.apiUrl}/crops`;

  constructor(private readonly http: HttpClient) {}

  checkEligibility(payload: EligibilityPayload): Observable<Eligibility> {
    return this.http
      .post<ApiResponse<Eligibility>>(`${this.endpoint}/check`, payload)
      .pipe(map((response) => response.data));
  }

  getEligibilityChecks(search = ''): Observable<Eligibility[]> {
    const params = search.trim() ? new HttpParams().set('search', search.trim()) : undefined;
    return this.http
      .get<ApiResponse<Eligibility[]>>(this.endpoint, { params })
      .pipe(map((response) => response.data));
  }

  getEligibilityById(id: string): Observable<Eligibility> {
    return this.http
      .get<ApiResponse<Eligibility>>(`${this.endpoint}/${id}`)
      .pipe(map((response) => response.data));
  }

  getEligibilityByFarmerId(farmerId: string): Observable<Eligibility[]> {
    return this.http
      .get<ApiResponse<Eligibility[]>>(`${this.farmerEndpoint}/${farmerId}/eligibility`)
      .pipe(map((response) => response.data));
  }

  getEligibilityByFarmId(farmId: string): Observable<Eligibility[]> {
    return this.http
      .get<ApiResponse<Eligibility[]>>(`${this.farmEndpoint}/${farmId}/eligibility`)
      .pipe(map((response) => response.data));
  }

  getEligibilityByCropId(cropId: string): Observable<Eligibility[]> {
    return this.http
      .get<ApiResponse<Eligibility[]>>(`${this.cropEndpoint}/${cropId}/eligibility`)
      .pipe(map((response) => response.data));
  }
}

