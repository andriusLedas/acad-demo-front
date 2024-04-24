import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {MailRequest, MailResponse, Status} from '../types';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class MailService {
  private client = inject(HttpClient);

  updateStatus(applicationId: string | undefined ,  status: Status): Observable<any> {
    return this.client.patch<any>(`${environment.API_URL}/admin/status/update`, {
      id: applicationId,
      APPLICATIONSTATUS: status
    })
  }

  sendMail(mailRequest: MailRequest): Observable<any> {
    return this.client.post<MailResponse>(
      `${environment.API_URL}/admin/mail/create`,
      mailRequest
    );

  }
}
