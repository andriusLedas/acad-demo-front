import { AsyncPipe } from '@angular/common';
import { Component, OnInit, inject, output } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { BehaviorSubject, debounceTime, first } from 'rxjs';
import { ApplicationListService } from '../../../services/application-list.service';
import { Application, Status, sortAndFilterRequest } from '../../../types';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatFormField,
    MatInput,
    AsyncPipe,
    MatSelectModule,
    ScrollingModule,
  ],
  templateUrl: './application-list.component.html',
  styleUrl: './application-list.component.scss',
})
export class ApplicationListComponent implements OnInit {
  private service = inject(ApplicationListService);
  listResponse$: BehaviorSubject<Application[]> = new BehaviorSubject<Application[]>([]);
  numAppsLoaded = 30;
  canLoadMoreApps = true;
  loadingMoreApplications = false;
  filteringCriteriaAltered = false;
  lastRequest!: sortAndFilterRequest;
  OnSelectedId = output<string>();

  sortAndFilterSubject = new BehaviorSubject<sortAndFilterRequest>({
    page: '1',
    STATUS: null,
    searchQuery: null,
  });

  sortForm = new FormGroup({
    searchQuery: new FormControl<string | null>(null),
    selectedStatus: new FormControl<Status[] | null>(null),
  });

  ngOnInit(): void {
    this.getApplications(this.sortAndFilterSubject.value);
  }

  getApplications(request: sortAndFilterRequest) {
    if (
      this.lastRequest &&
      this.lastRequest.page === request.page &&
      this.lastRequest.STATUS === request.STATUS &&
      this.lastRequest.searchQuery === request.searchQuery
    ) {
      return;
    }

    this.lastRequest = request;

    console.log(request);
    this.service
      .getApplicationsByStatusAndQuery(request)
      .subscribe((applications) => {
        const currentApps = this.listResponse$.getValue();
        this.listResponse$.next([...currentApps, ...applications]);
        this.numAppsLoaded = this.listResponse$.getValue().length;
        console.log(`num apps loaded: ${this.numAppsLoaded}`);

        // If less than 30 applications are returned, stop fetching new applications
        if (applications.length < 30) {
          this.canLoadMoreApps = false;
          console.log('final batch, no more apps to load');
        }
        this.loadingMoreApplications = false;
      });
  }

  openSelected(id: number, res: Application) {
    if (id) {
      this.OnSelectedId.emit(id.toString());
    }

    if (id && res.isOpened === false) {
      res.isOpened = true;
      this.service.updateIsOpened(id).subscribe(
        {
          next: data => console.log(data),
          error: error => console.error('Error:', error)
        }
      );
    }
  }

  submitSortAndSearch(): void {
    // Reset the listResponse$, numAppsLoaded and canLoadMoreApps when filtering is enabled

    this.sortAndFilterSubject
      .pipe(first())
      .subscribe(() => console.log(this.sortAndFilterSubject.value));

    this.listResponse$.next([]);
    this.numAppsLoaded = 0;
    this.canLoadMoreApps = true;
    this.filteringCriteriaAltered = true;

    let newRequest: sortAndFilterRequest = {
      page: '1',
      STATUS: this.sortForm.getRawValue().selectedStatus,
      searchQuery: this.sortForm.getRawValue().searchQuery,
    };

    // If no filter is selected, reset sortAndFilterSubject
    if (
      !this.sortForm.getRawValue().searchQuery &&
      this.sortForm.getRawValue().selectedStatus?.length === 0
    ) {
      this.sortAndFilterSubject.next({
        page: '1',
        STATUS: null,
        searchQuery: null,
      });
    } else {
      // If one or more filters are selected, update sortAndFilterSubject
      this.sortAndFilterSubject.next(newRequest);
    }

    setTimeout(() => {
      this.getApplications(this.sortAndFilterSubject.value);
    }, 1500);
  }

  checkIfNearEndOfList(indexOfVisibleApp: number) {
    if (this.filteringCriteriaAltered) {
      setTimeout(() => {
        this.filteringCriteriaAltered = false;
      }, 2800);
    }

    const endThreshold = this.numAppsLoaded - 10;
    console.log(`scrolledIndexChange app index: ${indexOfVisibleApp}`);

    if (
      indexOfVisibleApp >= endThreshold &&
      this.canLoadMoreApps &&
      !this.loadingMoreApplications &&
      !this.filteringCriteriaAltered
    ) {
      this.loadingMoreApplications = true;
      let currentPage = parseInt(this.sortAndFilterSubject.value.page);
      const newPage = currentPage + 1;
      console.log(
        `reaching end of current list, incrementing page nr. to p.${newPage} and loading more applications`
      );

      const newRequest = {
        ...this.sortAndFilterSubject.value,
        page: newPage.toString(),
      };

      setTimeout(() => {
        this.getApplications(newRequest);
      }, 500);

      this.sortAndFilterSubject.next(newRequest);
    }
  }
}
