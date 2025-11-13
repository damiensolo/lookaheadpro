import { Task, Status, Priority, Impact } from '../types';

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