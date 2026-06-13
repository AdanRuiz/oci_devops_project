import type { WorkItemDetailDto } from '../dtos/work-item-detail.dto';

export const mockWorkItems: WorkItemDetailDto[] = [
    {
        id: 'wrk-001',
        sprintId: 'spr-001',
        title: 'Build work item board UI',
        description: 'Create the first kanban-style board for visualizing work items.',
        type: 'FEATURE',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        externalLink: 'https://example.com/specs/board-ui',
        estimatedMinutes: 720,
        totalLoggedMinutes: 360,
        dueDate: '2026-04-25',
        createdAt: '2026-04-10T09:00:00Z',
        updatedAt: '2026-04-15T16:30:00Z',
        createdBy: {
            id: 'usr-001',
            name: 'Bernardo Manager',
            email: 'bernardo.manager@demo.com',
            telegramUserId: 'tg_bernardo_manager'
        },
        assignees: [
            {
                id: 'asg-001',
                user: {
                    id: 'usr-002',
                    name: 'Ana Developer',
                    email: 'ana.dev@demo.com',
                    telegramUserId: 'tg_ana_dev'
                },
                role: 'OWNER',
                assignedAt: '2026-04-10T10:00:00Z'
            }
        ],
        tags: [
            {
                id: 'tag-001',
                name: 'Frontend',
                color: '#3B82F6',
                description: 'UI and client-side work'
            }
        ],
        featureDetails: {
            businessValue: 'Allows managers and developers to quickly visualize sprint progress.',
            acceptanceCriteria: 'Board must show grouped work items by status and support filtering.'
        }
    },
    {
        id: 'wrk-002',
        sprintId: 'spr-001',
        title: 'Telegram task list command fails on empty response',
        description: 'Investigate why the bot returns no visible output when the task list is empty.',
        type: 'BUG',
        status: 'TODO',
        priority: 'CRITICAL',
        estimatedMinutes: 180,
        totalLoggedMinutes: 0,
        dueDate: '2026-04-18',
        createdAt: '2026-04-14T11:00:00Z',
        updatedAt: '2026-04-14T11:00:00Z',
        createdBy: {
            id: 'usr-001',
            name: 'Bernardo Manager',
            email: 'bernardo.manager@demo.com',
            telegramUserId: 'tg_bernardo_manager'
        },
        assignees: [
            {
                id: 'asg-002',
                user: {
                    id: 'usr-003',
                    name: 'Luis Developer',
                    email: 'luis.dev@demo.com',
                    telegramUserId: 'tg_luis_dev'
                },
                role: 'OWNER',
                assignedAt: '2026-04-14T12:00:00Z'
            }
        ],
        tags: [
            {
                id: 'tag-003',
                name: 'Bug',
                color: '#EF4444',
                description: 'Defect or error'
            },
            {
                id: 'tag-004',
                name: 'High Priority',
                color: '#F59E0B',
                description: 'Needs quick attention'
            }
        ],
        bugDetails: {
            severity: 'HIGH',
            environment: 'Telegram Bot / Dev',
            isReproducible: true,
            steps: 'Run /todo for a user with zero active tasks.'
        }
    },
    {
        id: 'wrk-003',
        title: 'Document assignee filtering behavior',
        description: 'Clarify how assignee filters should behave across board and table views.',
        type: 'ISSUE',
        status: 'BLOCKED',
        priority: 'MEDIUM',
        estimatedMinutes: 90,
        totalLoggedMinutes: 45,
        dueDate: '2026-04-20',
        createdAt: '2026-04-12T08:30:00Z',
        updatedAt: '2026-04-15T13:15:00Z',
        createdBy: {
            id: 'usr-002',
            name: 'Ana Developer',
            email: 'ana.dev@demo.com',
            telegramUserId: 'tg_ana_dev'
        },
        assignees: [
            {
                id: 'asg-003',
                user: {
                    id: 'usr-002',
                    name: 'Ana Developer',
                    email: 'ana.dev@demo.com',
                    telegramUserId: 'tg_ana_dev'
                },
                role: 'OWNER',
                assignedAt: '2026-04-12T09:00:00Z'
            }
        ],
        tags: [
            {
                id: 'tag-002',
                name: 'Backend',
                color: '#10B981',
                description: 'API and service work'
            }
        ],
        issueDetails: {
            environment: 'Web Portal / Requirements',
            reproductionSteps: 'Compare board filtering and list filtering expected behavior.'
        }
    },
    {
        id: 'wrk-004',
        sprintId: 'spr-001',
        title: 'Set up CI pipeline for frontend builds',
        description: 'Configure GitHub Actions workflow to lint, test, and build the React app on each push.',
        type: 'TASK',
        status: 'DONE',
        priority: 'HIGH',
        estimatedMinutes: 240,
        totalLoggedMinutes: 210,
        dueDate: '2026-04-12',
        createdAt: '2026-04-08T10:00:00Z',
        updatedAt: '2026-04-12T15:00:00Z',
        completedAt: '2026-04-12T15:00:00Z',
        createdBy: {
            id: 'usr-001',
            name: 'Bernardo Manager',
            email: 'bernardo.manager@demo.com',
            telegramUserId: 'tg_bernardo_manager'
        },
        assignees: [
            {
                id: 'asg-004',
                user: {
                    id: 'usr-003',
                    name: 'Luis Developer',
                    email: 'luis.dev@demo.com',
                    telegramUserId: 'tg_luis_dev'
                },
                role: 'OWNER',
                assignedAt: '2026-04-08T11:00:00Z'
            }
        ],
        tags: [
            {
                id: 'tag-001',
                name: 'Frontend',
                color: '#3B82F6',
                description: 'UI and client-side work'
            }
        ]
    },
    {
        id: 'wrk-005',
        sprintId: 'spr-001',
        title: 'Design shared component library tokens',
        description: 'Define color, spacing, and typography tokens used across the design system.',
        type: 'FEATURE',
        status: 'DONE',
        priority: 'MEDIUM',
        estimatedMinutes: 300,
        totalLoggedMinutes: 300,
        dueDate: '2026-04-14',
        createdAt: '2026-04-09T08:00:00Z',
        updatedAt: '2026-04-14T12:00:00Z',
        completedAt: '2026-04-14T12:00:00Z',
        createdBy: {
            id: 'usr-002',
            name: 'Ana Developer',
            email: 'ana.dev@demo.com',
            telegramUserId: 'tg_ana_dev'
        },
        assignees: [
            {
                id: 'asg-005',
                user: {
                    id: 'usr-002',
                    name: 'Ana Developer',
                    email: 'ana.dev@demo.com',
                    telegramUserId: 'tg_ana_dev'
                },
                role: 'OWNER',
                assignedAt: '2026-04-09T08:30:00Z'
            }
        ],
        tags: [
            {
                id: 'tag-001',
                name: 'Frontend',
                color: '#3B82F6',
                description: 'UI and client-side work'
            }
        ],
        featureDetails: {
            businessValue: 'Ensures visual consistency across all UI components.',
            acceptanceCriteria: 'Tokens documented and applied in at least 3 shared components.'
        }
    },
    {
        id: 'wrk-006',
        sprintId: 'spr-002',
        title: 'Implement sprint progress API endpoint',
        description: 'Expose a REST endpoint returning current sprint completion percentage and item breakdown.',
        type: 'FEATURE',
        status: 'TODO',
        priority: 'HIGH',
        estimatedMinutes: 480,
        totalLoggedMinutes: 0,
        dueDate: '2026-04-30',
        createdAt: '2026-04-15T09:00:00Z',
        updatedAt: '2026-04-15T09:00:00Z',
        createdBy: {
            id: 'usr-001',
            name: 'Bernardo Manager',
            email: 'bernardo.manager@demo.com',
            telegramUserId: 'tg_bernardo_manager'
        },
        assignees: [
            {
                id: 'asg-006',
                user: {
                    id: 'usr-003',
                    name: 'Luis Developer',
                    email: 'luis.dev@demo.com',
                    telegramUserId: 'tg_luis_dev'
                },
                role: 'ASSIGNEE',
                assignedAt: '2026-04-15T09:30:00Z'
            }
        ],
        tags: [
            {
                id: 'tag-002',
                name: 'Backend',
                color: '#10B981',
                description: 'API and service work'
            }
        ],
        featureDetails: {
            businessValue: 'Enables real-time sprint dashboards for managers.',
            acceptanceCriteria: 'Endpoint returns 200 with correct data shape. Validated with integration tests.'
        }
    },
    {
        id: 'wrk-007',
        sprintId: 'spr-002',
        title: 'Fix date timezone offset in due date display',
        description: 'Due dates appear one day off when the user is in UTC-5 or earlier timezones.',
        type: 'BUG',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        estimatedMinutes: 120,
        totalLoggedMinutes: 60,
        dueDate: '2026-04-17',
        createdAt: '2026-04-13T14:00:00Z',
        updatedAt: '2026-04-15T11:00:00Z',
        createdBy: {
            id: 'usr-003',
            name: 'Luis Developer',
            email: 'luis.dev@demo.com',
            telegramUserId: 'tg_luis_dev'
        },
        assignees: [
            {
                id: 'asg-007',
                user: {
                    id: 'usr-002',
                    name: 'Ana Developer',
                    email: 'ana.dev@demo.com',
                    telegramUserId: 'tg_ana_dev'
                },
                role: 'OWNER',
                assignedAt: '2026-04-13T15:00:00Z'
            }
        ],
        tags: [
            {
                id: 'tag-003',
                name: 'Bug',
                color: '#EF4444',
                description: 'Defect or error'
            },
            {
                id: 'tag-001',
                name: 'Frontend',
                color: '#3B82F6',
                description: 'UI and client-side work'
            }
        ],
        bugDetails: {
            severity: 'MEDIUM',
            environment: 'Web Portal / Production',
            isReproducible: true,
            steps: 'Set browser timezone to UTC-5. Open any task with a due date. Observe offset.'
        }
    },
    {
        id: 'wrk-008',
        sprintId: 'spr-001',
        title: 'Write onboarding documentation for new developers',
        description: 'Create a concise getting-started guide covering setup, conventions, and key workflows.',
        type: 'TASK',
        status: 'TODO',
        priority: 'LOW',
        estimatedMinutes: 150,
        totalLoggedMinutes: 0,
        dueDate: '2026-05-01',
        createdAt: '2026-04-15T10:00:00Z',
        updatedAt: '2026-04-15T10:00:00Z',
        createdBy: {
            id: 'usr-001',
            name: 'Bernardo Manager',
            email: 'bernardo.manager@demo.com',
            telegramUserId: 'tg_bernardo_manager'
        },
        assignees: [],
        tags: [
            {
                id: 'tag-002',
                name: 'Backend',
                color: '#10B981',
                description: 'API and service work'
            }
        ]
    }
];