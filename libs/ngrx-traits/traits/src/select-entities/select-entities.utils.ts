import { SelectEntitiesState } from './select-entities.model';
import { LoadEntitiesState } from '../load-entities';

export function multiDeselect<S extends SelectEntitiesState>(
  id: number | string,
  state: S
): S {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [id]: _value, ...selectedIds } = state.selectedIds;
  return {
    ...state,
    selectedIds: selectedIds,
  };
}

export function multiSelect<S extends SelectEntitiesState>(
  id: number | string,
  state: S
): S {
  return {
    ...state,
    selectedIds: { ...state.selectedIds, [id]: true },
  };
}

export function multiToggleSelect<S extends SelectEntitiesState>(
  id: number | string,
  state: S
): S {
  const selected = state.selectedIds[id];
  if (selected) {
    return multiDeselect(id, state);
  } else {
    return multiSelect(id, state);
  }
}
export function multiClearSelection<S extends SelectEntitiesState>(
  state: S
): S {
  return { ...state, selectedIds: {} };
}

export function selectTotalSelectedEntities<
  Entity,
  S extends LoadEntitiesState<Entity> & SelectEntitiesState
>(state: S): number {
  return Object.keys(state.selectedIds).length;
}