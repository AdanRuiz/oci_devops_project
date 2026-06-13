import type { TagDto } from '../dtos/tag.dto'

export const mockTags: TagDto[] = [
    {
        id: 'tag-001',
        name: 'Frontend',
        color: '#3B82F6',
        description: 'UI and client-side work'
    },
    {
        id: 'tag-002',
        name: 'Backend',
        color: '#10B981',
        description: 'API and service work'
    },
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
]