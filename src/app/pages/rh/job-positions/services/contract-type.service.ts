import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ContractTypeDto, CreateContractTypeDto, UpdateContractTypeDto } from '../models/job-position.model';

@Injectable({
  providedIn: 'root'
})
export class ContractTypeService {
  private apiUrl = `${environment.apiUrl}/ContractTypes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ContractTypeDto[]> {
    return this.http.get<ContractTypeDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<ContractTypeDto> {
    return this.http.get<ContractTypeDto>(`${this.apiUrl}/${id}`);
  }

  create(contractType: CreateContractTypeDto): Observable<ContractTypeDto> {
    return this.http.post<ContractTypeDto>(this.apiUrl, contractType);
  }

  update(id: number, contractType: UpdateContractTypeDto): Observable<ContractTypeDto> {
    return this.http.put<ContractTypeDto>(`${this.apiUrl}/${id}`, contractType);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
