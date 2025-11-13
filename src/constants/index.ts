import { Column, Status, Priority, ColumnId, FilterOperator } from '../types';

export const DEFAULT_COLUMNS: Column[] = [
  { id: 'name', label: 'Task Name', width: '300px', visible: true, minWidth: 200 },
  { id: 'status', label: 'Status', width: '150px', visible: true, minWidth: 120 },
  { id: 'assignee', label: 'Assignee', width: '150px', visible: true, minWidth: 120 },
  { id: 'dates', label: 'Dates', width: '220px', visible: true, minWidth: 180 },
  { id: 'progress', label: 'Progress', width: '200px', visible: true, minWidth: 150 },
  { id: 'details', label: '', width: '60px', visible: true, minWidth: 60 },
];

export const FILTERABLE_COLUMNS: { id: ColumnId, label: string, type: 'text' | 'enum' }[] = [
    { id: 'name', label: 'Task Name', type: 'text' },
    { id: 'status', label: 'Status', type: 'enum' },
    { id: 'priority', label: 'Priority', type: 'enum' },
];

export const TEXT_OPERATORS: { id: FilterOperator, label: string }[] = [
    { id: 'contains', label: 'contains' },
    { id: 'not_contains', label: 'does not contain' },
    { id: 'is', label: 'is' },
    { id: 'is_not', label: 'is not' },
    { id: 'is_empty', label: 'is empty' },
    { id: 'is_not_empty', label: 'is not empty' },
];

export const ENUM_OPERATORS: { id: FilterOperator, label: string }[] = [
    { id: 'is_any_of', label: 'is any of' },
    { id: 'is_none_of', label: 'is none of' },
    { id: 'is_empty', label: 'is empty' },
    { id: 'is_not_empty', label: 'is not empty' },
];

export const getEnumOptions = (columnId: ColumnId): { id: string, label: string }[] => {
    switch (columnId) {
        case 'status':
            return Object.values(Status).map(s => ({ id: s, label: s }));
        case 'priority':
            return Object.values(Priority).map(p => ({ id: p, label: p }));
        default:
            return [];
    }
};