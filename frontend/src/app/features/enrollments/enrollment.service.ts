import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApprovalStatus, Enrollment, EnrollmentPayload } from './enrollment.model';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private readonly endpoint = `${environment.apiUrl}/enrollments`;
  private readonly farmerEndpoint = `${environment.apiUrl}/farmers`;
  private readonly farmEndpoint = `${environment.apiUrl}/farms`;
  private readonly cropEndpoint = `${environment.apiUrl}/crops`;
  private readonly eligibilityEndpoint = `${environment.apiUrl}/eligibility`;

  constructor(private readonly http: HttpClient) {}

  createEnrollment(payload: EnrollmentPayload): Observable<Enrollment> {
    return this.http
      .post<ApiResponse<Enrollment>>(this.endpoint, payload)
      .pipe(map((response) => response.data));
  }

  getEnrollments(search = ''): Observable<Enrollment[]> {
    const params = search.trim() ? new HttpParams().set('search', search.trim()) : undefined;
    return this.http
      .get<ApiResponse<Enrollment[]>>(this.endpoint, { params })
      .pipe(map((response) => response.data));
  }

  getEnrollmentById(id: string): Observable<Enrollment> {
    return this.http
      .get<ApiResponse<Enrollment>>(`${this.endpoint}/${id}`)
      .pipe(map((response) => response.data));
  }

  getEnrollmentsByFarmerId(farmerId: string): Observable<Enrollment[]> {
    return this.http
      .get<ApiResponse<Enrollment[]>>(`${this.farmerEndpoint}/${farmerId}/enrollments`)
      .pipe(map((response) => response.data));
  }

  getEnrollmentsByFarmId(farmId: string): Observable<Enrollment[]> {
    return this.http
      .get<ApiResponse<Enrollment[]>>(`${this.farmEndpoint}/${farmId}/enrollments`)
      .pipe(map((response) => response.data));
  }

  getEnrollmentsByCropId(cropId: string): Observable<Enrollment[]> {
    return this.http
      .get<ApiResponse<Enrollment[]>>(`${this.cropEndpoint}/${cropId}/enrollments`)
      .pipe(map((response) => response.data));
  }

  getEnrollmentsByEligibilityId(eligibilityId: string): Observable<Enrollment[]> {
    return this.http
      .get<ApiResponse<Enrollment[]>>(`${this.eligibilityEndpoint}/${eligibilityId}/enrollments`)
      .pipe(map((response) => response.data));
  }

  updateEnrollmentApproval(
    id: string,
    approvalStatus: ApprovalStatus,
    notes = ''
  ): Observable<Enrollment> {
    return this.http
      .patch<ApiResponse<Enrollment>>(`${this.endpoint}/${id}/approval`, { approvalStatus, notes })
      .pipe(map((response) => response.data));
  }

  cancelEnrollment(id: string, notes = ''): Observable<Enrollment> {
    return this.http
      .patch<ApiResponse<Enrollment>>(`${this.endpoint}/${id}/cancel`, { notes })
      .pipe(map((response) => response.data));
  }
}

