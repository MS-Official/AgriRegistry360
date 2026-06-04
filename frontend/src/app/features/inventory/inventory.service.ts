import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  InventoryItem,
  InventoryReservation,
  InventoryReservationPayload,
} from './inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly endpoint = `${environment.apiUrl}/odoo/inventory`;
  private readonly enrollmentEndpoint = `${environment.apiUrl}/enrollments`;
  private readonly farmerEndpoint = `${environment.apiUrl}/farmers`;
  private readonly farmEndpoint = `${environment.apiUrl}/farms`;
  private readonly cropEndpoint = `${environment.apiUrl}/crops`;

  constructor(private readonly http: HttpClient) {}

  getInventoryItems(): Observable<InventoryItem[]> {
    return this.http
      .get<ApiResponse<InventoryItem[]>>(`${this.endpoint}/items`)
      .pipe(map((response) => response.data));
  }

  getInventoryItemById(id: string): Observable<InventoryItem> {
    return this.http
      .get<ApiResponse<InventoryItem>>(`${this.endpoint}/items/${id}`)
      .pipe(map((response) => response.data));
  }

  reserveInventory(payload: InventoryReservationPayload): Observable<InventoryReservation> {
    return this.http
      .post<ApiResponse<InventoryReservation>>(`${this.endpoint}/reserve`, payload)
      .pipe(map((response) => response.data));
  }

  getReservations(search = ''): Observable<InventoryReservation[]> {
    const params = search.trim() ? new HttpParams().set('search', search.trim()) : undefined;
    return this.http
      .get<ApiResponse<InventoryReservation[]>>(`${this.endpoint}/reservations`, { params })
      .pipe(map((response) => response.data));
  }

  getReservationById(id: string): Observable<InventoryReservation> {
    return this.http
      .get<ApiResponse<InventoryReservation>>(`${this.endpoint}/reservations/${id}`)
      .pipe(map((response) => response.data));
  }

  getReservationsByEnrollmentId(enrollmentId: string): Observable<InventoryReservation[]> {
    return this.http
      .get<ApiResponse<InventoryReservation[]>>(`${this.enrollmentEndpoint}/${enrollmentId}/reservations`)
      .pipe(map((response) => response.data));
  }

  getReservationsByFarmerId(farmerId: string): Observable<InventoryReservation[]> {
    return this.http
      .get<ApiResponse<InventoryReservation[]>>(`${this.farmerEndpoint}/${farmerId}/reservations`)
      .pipe(map((response) => response.data));
  }

  getReservationsByFarmId(farmId: string): Observable<InventoryReservation[]> {
    return this.http
      .get<ApiResponse<InventoryReservation[]>>(`${this.farmEndpoint}/${farmId}/reservations`)
      .pipe(map((response) => response.data));
  }

  getReservationsByCropId(cropId: string): Observable<InventoryReservation[]> {
    return this.http
      .get<ApiResponse<InventoryReservation[]>>(`${this.cropEndpoint}/${cropId}/reservations`)
      .pipe(map((response) => response.data));
  }

  cancelReservation(id: string, notes = ''): Observable<InventoryReservation> {
    return this.http
      .patch<ApiResponse<InventoryReservation>>(`${this.endpoint}/reservations/${id}/cancel`, { notes })
      .pipe(map((response) => response.data));
  }

  issueReservation(id: string, notes = ''): Observable<InventoryReservation> {
    return this.http
      .patch<ApiResponse<InventoryReservation>>(`${this.endpoint}/reservations/${id}/issue`, { notes })
      .pipe(map((response) => response.data));
  }
}

