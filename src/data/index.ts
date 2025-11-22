
import { Task, Status, Priority, Impact, BudgetLineItem } from '../types';

export const MOCK_TASKS: Task[] = [
  {
    id: 1,
    name: 'Project Alpha Kick-off',
    status: Status.Planned,
    assignees: [
      { id: 1, name: 'John Doe', initials: 'JD', avatarColor: 'bg-blue-500' },
      { id: 2, name: 'Jane Smith', initials: 'JS', avatarColor: 'bg-pink-500' },
    ],
    startDate: '01/08/2024',
    dueDate: '10/08/2024',
    isExpanded: true,
    priority: Priority.High,
    impact: Impact.High,
    progress: { percentage: 10, history: [0, 5, 10] },
    health: [
        { name: 'Budget', status: 'complete', details: 'Budget approved.'},
        { name: 'Resources', status: 'at_risk', details: 'Lead developer on vacation until 05/08.'},
    ],
    children: [
      {
        id: 2,
        name: 'Requirement Gathering',
        status: Status.InProgress,
        assignees: [{ id: 2, name: 'Jane Smith', initials: 'JS', avatarColor: 'bg-pink-500' }],
        startDate: '02/08/2024',
        dueDate: '08/08/2024',
        priority: Priority.Urgent,
        impact: Impact.High,
        progress: { percentage: 40, history: [10, 20, 30, 40] },
      },
      {
        id: 3,
        name: 'Design Mockups',
        status: Status.New,
        assignees: [{ id: 3, name: 'Peter Jones', initials: 'PJ', avatarColor: 'bg-green-500' }],
        startDate: '05/08/2024',
        dueDate: '10/08/2024',
        isExpanded: false,
        priority: Priority.Medium,
        impact: Impact.Medium,
        children: [
           {
            id: 4,
            name: 'Low-fidelity wireframes',
            status: Status.New,
            assignees: [{ id: 3, name: 'Peter Jones', initials: 'PJ', avatarColor: 'bg-green-500' }],
            startDate: '05/08/2024',
            dueDate: '07/08/2024',
            priority: Priority.Medium,
           }
        ]
      },
    ],
  },
  {
    id: 5,
    name: 'Q3 Marketing Campaign',
    status: Status.Completed,
    assignees: [{ id: 4, name: 'Susan Lee', initials: 'SL', avatarColor: 'bg-purple-500' }],
    startDate: '15/07/2024',
    dueDate: '30/07/2024',
    priority: Priority.High,
    impact: Impact.High,
    progress: { percentage: 100, history: [20, 50, 80, 100] },
  },
  {
    id: 6,
    name: 'API Development',
    status: Status.InReview,
    assignees: [{ id: 1, name: 'John Doe', initials: 'JD', avatarColor: 'bg-blue-500' }],
    startDate: '20/07/2024',
    dueDate: '15/08/2024',
    priority: Priority.Low,
    impact: Impact.Low,
    progress: { percentage: 85, history: [10, 30, 60, 85] },
    health: [
        { name: 'Dependencies', status: 'complete', details: 'All dependencies are resolved.'},
        { name: 'Testing', status: 'blocked', details: 'Staging environment is down.'},
    ],
  },
];

export const MOCK_BUDGET_DATA: BudgetLineItem[] = [
  { id: '1', sNo: 1, costCode: '01 89 00', name: 'Site Construction Performance Req...', divisionCode: '01', divisionName: 'General Requirements', type: 'Original Bid', quantity: 1000, unit: 'sq', effortHours: 36, calcType: 'AU', totalBudget: 115000.00, labor: 10000.00, equipment: 10000.00, subcontractor: 15000.00, material: 10000.00, others: 20000.00 },
  { id: '2', sNo: 2, costCode: '31 10 00', name: 'Site Clearing', divisionCode: '31', divisionName: 'Earthwork', type: 'Original Bid', quantity: 1000, unit: 'sq', effortHours: 120, calcType: 'AU', totalBudget: 107000.00, labor: 15000.00, equipment: 10000.00, subcontractor: 15000.00, material: 12000.00, others: 10000.00 },
  { id: '3', sNo: 3, costCode: '31 00 00', name: 'Earthwork', divisionCode: '31', divisionName: 'Earthwork', type: 'Original Bid', quantity: 800, unit: 'sq', effortHours: 35928, calcType: 'AU', totalBudget: 119000.00, labor: 15000.00, equipment: 10000.00, subcontractor: 12000.00, material: 10000.00, others: 12000.00 },
  { id: '4', sNo: 4, costCode: '04 00 00', name: 'Masonry', divisionCode: '04', divisionName: 'Masonry', type: 'Original Bid', quantity: 800, unit: 'sq', effortHours: 435, calcType: 'AU', totalBudget: 115000.00, labor: 20000.00, equipment: 10000.00, subcontractor: 10000.00, material: 18000.00, others: 20000.00 },
  { id: '5', sNo: 5, costCode: '26 00 00', name: 'Electrical', divisionCode: '26', divisionName: 'Electrical', type: 'Original Bid', quantity: 1000, unit: 'l', effortHours: 470, calcType: 'AU', totalBudget: 100000.00, labor: 10000.00, equipment: 12000.00, subcontractor: 15000.00, material: 10000.00, others: 15000.00 },
  { id: '6', sNo: 6, costCode: '3060', name: 'Windows and Doors', divisionCode: '30', divisionName: 'Windows and Doors', type: 'Original Bid', quantity: 1200, unit: 'Nos', effortHours: 680, calcType: 'AU', totalBudget: 127000.00, labor: 13000.00, equipment: 12000.00, subcontractor: 10000.00, material: 15000.00, others: 12000.00 },
  { id: '7', sNo: 7, costCode: '22 00 00', name: 'Plumbing', divisionCode: '22', divisionName: 'Plumbing', type: 'Original Bid', quantity: 700, unit: 'Nos', effortHours: 387, calcType: 'AU', totalBudget: 114000.00, labor: 15000.00, equipment: 10000.00, subcontractor: 12000.00, material: 20000.00, others: 22000.00 },
  { id: '8', sNo: 8, costCode: '23 00 00', name: 'Heating, Ventilating, and Air Con...', divisionCode: '23', divisionName: 'Heating, Ventilating, An...', type: 'Original Bid', quantity: 1000, unit: 'Tons', effortHours: 616, calcType: 'AU', totalBudget: 111000.00, labor: 10000.00, equipment: 12000.00, subcontractor: 15000.00, material: 17000.00, others: 15000.00 },
  { id: '9', sNo: 9, costCode: '5010', name: 'Interior Finishes', divisionCode: '50', divisionName: 'Interior Finishes', type: 'Original Bid', quantity: 600, unit: 'Nos', effortHours: 780, calcType: 'AU', totalBudget: 113000.00, labor: 15000.00, equipment: 10000.00, subcontractor: 12000.00, material: 14000.00, others: 20000.00 },
  { id: '10', sNo: 10, costCode: '10 70 00', name: 'Exterior Specialties', divisionCode: '10', divisionName: 'Specialties', type: 'Original Bid', quantity: 500, unit: 'Nos', effortHours: 380, calcType: 'AU', totalBudget: 123000.00, labor: 13000.00, equipment: 15000.00, subcontractor: 20000.00, material: 16000.00, others: 4000.00 },
  { id: '11', sNo: 11, costCode: '48 70 00', name: 'Electrical Power Generation Testi...', divisionCode: '48', divisionName: 'Electrical Power Gener...', type: 'Original Bid', quantity: 400, unit: 'Nos', effortHours: 30, calcType: 'AU', totalBudget: 98000.00, labor: 12000.00, equipment: 11000.00, subcontractor: 10000.00, material: 14000.00, others: 15000.00 },
  { id: '12', sNo: 12, costCode: '23 05 93', name: 'Testing, Adjusting, and Balancing ...', divisionCode: '23', divisionName: 'Heating, Ventilating, An...', type: 'Original Bid', quantity: 300, unit: 'Tons', effortHours: 80, calcType: 'AU', totalBudget: 82000.00, labor: 10000.00, equipment: 15000.00, subcontractor: 10000.00, material: 7000.00, others: 5000.00 },
  { id: '13', sNo: 13, costCode: '22 08 00', name: 'Commissioning of Plumbing', divisionCode: '22', divisionName: 'Plumbing', type: 'Original Bid', quantity: 400, unit: 'Nos', effortHours: 50, calcType: 'AU', totalBudget: 70000.00, labor: 10000.00, equipment: 5000.00, subcontractor: 5000.00, material: 10000.00, others: 15000.00 },
  { id: '14', sNo: 14, costCode: '', name: 'Concrete 1', divisionCode: '', divisionName: '', type: 'Upcoming CO', quantity: null, unit: '', effortHours: null, calcType: '', totalBudget: 4740.00, labor: null, equipment: null, subcontractor: null, material: null, others: null, hasWarning: true },
];
