import React from 'react';
import { ManHours } from '../types';

const ManHoursBar: React.FC<{ manHours: ManHours }> = ({ manHours }) => {
  const { actual, budget } = manHours;
  const total = Math.max(actual, budget);
  const actualPercent = total > 0 ? (actual / total) * 100 : 0;
  const budgetPercent = total > 0 ? (budget / total) * 100 : 0;
  const overBudget = actual > budget;
  const remaining = budget - actual;

  return (
    <div className="flex items-center gap-2 w-full">
        <div className="h-2 flex-grow bg-gray-200 rounded-full flex overflow-hidden">
            {overBudget ? (
            <>
                <div className="h-full bg-blue-400" style={{ width: `${budgetPercent}%` }} title={`Budget: ${budget}h`}></div>
                <div className="h-full bg-red-500" style={{ width: `${actualPercent - budgetPercent}%` }} title={`Over Budget: ${actual - budget}h`}></div>
            </>
            ) : (
            <>
                <div className="h-full bg-blue-600" style={{ width: `${actualPercent}%` }} title={`Actual: ${actual}h`}></div>
                <div className="h-full bg-blue-200" style={{ width: `${budgetPercent - actualPercent}%` }} title={`Remaining: ${remaining}h`}></div>
            </>
            )}
        </div>
        <div className="text-xs text-gray-500 text-right w-[70px] flex-shrink-0">
            {actual}h / {budget}h
        </div>
    </div>
  );
};

export default ManHoursBar;