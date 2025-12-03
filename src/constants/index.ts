

import { Column, Status, Priority, ColumnId, FilterOperator, SpreadsheetColumn } from '../types';

export const DEFAULT_COLUMNS: Column[] = [
  { id: 'details', label: '', width: '60px', visible: true, minWidth: 60 },
  { id: 'name', label: 'Task Name', width: '300px', visible: true, minWidth: 200 },
  { id: 'status', label: 'Status', width: '150px', visible: true, minWidth: 120 },
  { id: 'assignee', label: 'Assignee', width: '150px', visible: true, minWidth: 120 },
  { id: 'dates', label: 'Start Date', width: '140px', visible: true, minWidth: 100 },
  { id: 'progress', label: 'Progress', width: '200px', visible: true, minWidth: 150 },
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

export const SPREADSHEET_DEFAULT_COLUMNS: SpreadsheetColumn[] = [
    { id: 'costCode', label: 'Cost Code', width: 120 },
    { id: 'name', label: 'Name', width: 250 },
    { id: 'divisionCode', label: 'Division Code', width: 130 },
    { id: 'divisionName', label: 'Division Name', width: 200 },
    { id: 'type', label: 'Type', width: 130 },
    { id: 'quantity', label: 'Quantity', width: 100, align: 'right' },
    { id: 'unit', label: 'Quantity Unit', width: 110 },
    { id: 'effortHours', label: 'Effort hours', width: 110, align: 'right', isTotal: true },
    { id: 'calcType', label: 'Type of Calculation', width: 160 },
    { id: 'totalBudget', label: 'Total Budget Amount', width: 160, align: 'right', isTotal: true },
    { id: 'labor', label: 'Labor', width: 130, align: 'right', isTotal: true },
    { id: 'equipment', label: 'Equipment', width: 130, align: 'right', isTotal: true },
    { id: 'subcontractor', label: 'Subcontractor', width: 130, align: 'right', isTotal: true },
    { id: 'material', label: 'Material', width: 130, align: 'right', isTotal: true },
    { id: 'others', label: 'Others', width: 130, align: 'right', isTotal: true },
];