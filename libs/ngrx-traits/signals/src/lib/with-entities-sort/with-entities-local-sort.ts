import { effect, Signal, untracked } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  SignalStoreFeature,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  EntityState,
  NamedEntityState,
  setAllEntities,
} from '@ngrx/signals/entities';
import {
  EntitySignals,
  NamedEntitySignals,
} from '@ngrx/signals/entities/src/models';
import type { StateSignal } from '@ngrx/signals/src/state-signal';

import { getWithEntitiesKeys } from '../util';
import { getWithCallStatusKeys } from '../with-call-status/with-call-status.util';
import {
  broadcast,
  withEventHandler,
} from '../with-event-handler/with-event-handler';
import {
  EntitiesSortMethods,
  EntitiesSortState,
  NamedEntitiesSortMethods,
  NamedEntitiesSortState,
  Sort,
} from './with-entities-local-sort.model';
import {
  getWithEntitiesLocalSortEvents,
  sortData,
} from './with-entities-local-sort.util';
import { getWithEntitiesSortKeys } from './with-entities-sort.util';

/**
 * Generates necessary state, computed and methods for sorting locally entities in the store.
 *
 * Requires withEntities to be present before this function
 * @param config
 * @param config.defaultSort - The default sort to be applied to the entities
 * @param config.entity - The type entity to be used
 * @param config.collection - The name of the collection for which will be sorted
 *
 * @example
 * const entity = type<Product>();
 * const collection = 'products';
 * export const store = signalStore(
 *   { providedIn: 'root' },
 *   withEntities({ entity, collection }),
 *   withEntitiesLocalSort({
 *     entity,
 *     collection,
 *     defaultSort: { field: 'name', direction: 'asc' },
 *   }),
 * );
 * // generates the following signals
 * store.productsSort - the current sort applied to the products
 * // generates the following methods
 * store.sortProductsEntities({ sort: { field: 'name', direction: 'asc' } }) - sorts the products entities
 */
export function withEntitiesLocalSort<
  Entity extends { id: string | number },
>(config: {
  defaultSort: Sort<Entity>;
  entity: Entity;
}): SignalStoreFeature<
  {
    state: EntityState<Entity>;
    signals: EntitySignals<Entity>;
    methods: {};
  },
  {
    state: EntitiesSortState<Entity>;
    signals: {};
    methods: EntitiesSortMethods<Entity>;
  }
>;
/**
 * Generates necessary state, computed and methods for sorting locally entities in the store.
 *
 * Requires withEntities to be present before this function
 * @param config
 * @param config.defaultSort - The default sort to be applied to the entities
 * @param config.entity - The type entity to be used
 * @param config.collection - The name of the collection for which will be sorted
 *
 * @example
 * const entity = type<Product>();
 * const collection = 'products';
 * export const store = signalStore(
 *   { providedIn: 'root' },
 *   withEntities({ entity, collection }),
 *   withEntitiesLocalSort({
 *     entity,
 *     collection,
 *     defaultSort: { field: 'name', direction: 'asc' },
 *   }),
 * );
 * // generates the following signals
 * store.productsSort - the current sort applied to the products
 * // generates the following methods
 * store.sortProductsEntities({ sort: { field: 'name', direction: 'asc' } }) - sorts the products entities
 */
export function withEntitiesLocalSort<
  Entity extends { id: string | number },
  Collection extends string,
>(config: {
  defaultSort: Sort<Entity>;
  entity: Entity;
  collection?: Collection;
}): SignalStoreFeature<
  // TODO: we have a problem  with the state property, when set to any
  // it works but is it has a Collection, some methods are not generated, it seems
  // to only be accessible using store['filterEntities']
  // the workaround doesn't cause any issues, because the signals prop does work and still
  // gives the right error requiring withEntities to be used
  {
    state: NamedEntityState<Entity, any>;
    signals: NamedEntitySignals<Entity, Collection>;
    methods: {};
  },
  {
    state: NamedEntitiesSortState<Entity, Collection>;
    signals: {};
    methods: NamedEntitiesSortMethods<Collection, Collection>;
  }
>;
export function withEntitiesLocalSort<
  Entity extends { id: string | number },
  Collection extends string,
>({
  defaultSort,
  ...config
}: {
  defaultSort: Sort<Entity>;
  entity: Entity;
  collection?: Collection;
}): SignalStoreFeature<any, any> {
  const { entitiesKey } = getWithEntitiesKeys(config);
  const { sortEntitiesKey, sortKey } = getWithEntitiesSortKeys(config);
  const { entitiesLocalSortChanged } = getWithEntitiesLocalSortEvents(config);

  return signalStoreFeature(
    withState({ [sortKey]: defaultSort }),
    withEventHandler(),
    withMethods((state: Record<string, Signal<unknown>>) => {
      return {
        [sortEntitiesKey]: ({
          sort: newSort,
        }: { sort?: Sort<Entity> } = {}) => {
          const sort = newSort ?? defaultSort;
          patchState(
            state as StateSignal<object>,
            {
              [sortKey]: sort,
            },
            config.collection
              ? setAllEntities(
                  sortData(state[entitiesKey]() as Entity[], sort),
                  {
                    collection: config.collection,
                  },
                )
              : setAllEntities(
                  sortData(state[entitiesKey]() as Entity[], sort),
                ),
          );
          broadcast(state, entitiesLocalSortChanged({ sort }));
        },
      };
    }),
    withHooks((state: Record<string, unknown>) => {
      const { loadedKey } = getWithCallStatusKeys({ prop: config?.collection });
      const loaded = state[loadedKey] as Signal<boolean> | undefined;
      return {
        onInit: () => {
          if (loaded) {
            const sortEntities = state[sortEntitiesKey] as () => void;
            effect(() => {
              if (loaded()) {
                untracked(() => {
                  sortEntities();
                });
              }
            });
          }
        },
      };
    }),
  );
}
