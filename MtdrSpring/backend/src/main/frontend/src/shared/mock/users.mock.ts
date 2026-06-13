import type { UserSummaryDto } from '../dtos/user-summary.dto'

export const mockUsers: UserSummaryDto[] = [
    {
        id: 'usr-001',
        name: 'Bernardo Manager',
        email: 'bernardo.manager@demo.com',
        telegramUserId: 'tg_bernardo_manager'
    },
    {
        id: 'usr-002',
        name: 'Ana Developer',
        email: 'ana.dev@demo.com',
        telegramUserId: 'tg_ana_dev'
    },
    {
        id: 'usr-003',
        name: 'Luis Developer',
        email: 'luis.dev@demo.com',
        telegramUserId: 'tg_luis_dev'
    }
]