import { inject } from '@angular/core';
import {
  withCallStatus,
  withEntitiesLoadingCall,
  withEntitiesRemoteFilter,
  withEntitiesRemoteScrollPagination,
  withLogger,
} from '@ngrx-traits/signals';
import { signalStore, type } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { lastValueFrom } from 'rxjs';

import { Branch } from '../../../../models';
import { BranchService } from '../../../../services/branch.service';

const entity = type<Branch>();
export const ProductsBranchStore = signalStore(
  withEntities({
    entity,
  }),
  withCallStatus({ initialValue: 'loading' }),
  withEntitiesRemoteFilter({
    entity,
    defaultFilter: { search: '' },
  }),
  withEntitiesRemoteScrollPagination({
    pageSize: 10,
    entity,
  }),
  withEntitiesLoadingCall({
    fetchEntities: async ({ entitiesPagedRequest, entitiesFilter }) => {
      const res = await lastValueFrom(
        inject(BranchService).getBranches({
          search: entitiesFilter().search,
          skip: entitiesPagedRequest().startIndex,
          take: entitiesPagedRequest().size,
        }),
      );
      return { entities: res.resultList, total: res.total };
    },
  }),
  withLogger('branchStore'),
);