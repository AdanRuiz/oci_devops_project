import type { ApiResult } from '../dtos/api-result.dto';
import type { SelectOption } from '../models/select-option.model';
import type { UserSummaryDto } from '../dtos/user-summary.dto';
import type { TagDto } from '../dtos/tag.dto';
import type { TeamSummaryDto } from '../dtos/team-summary.dto';
import { mockApi } from './mock-api';
import { mockUsers } from '../mock/users.mock';
import { mockTags } from '../mock/tags.mock';
import { mockTeams } from '../mock/teams.mock';

export const foundationService = {
    async getUsers(): Promise<ApiResult<UserSummaryDto[]>> {
        return mockApi(mockUsers);
    },

    async getTags(): Promise<ApiResult<TagDto[]>> {
        return mockApi(mockTags);
    },

    async getTeams(): Promise<ApiResult<TeamSummaryDto[]>> {
        return mockApi(mockTeams);
    },

    async getUserOptions(): Promise<ApiResult<SelectOption[]>> {
        const options: SelectOption[] = mockUsers.map((user) => ({
            value: user.id,
            label: user.name
        }));

        return mockApi(options);
    },

    async getTagOptions(): Promise<ApiResult<SelectOption[]>> {
        const options: SelectOption[] = mockTags.map((tag) => ({
            value: tag.id,
            label: tag.name
        }))

        return mockApi(options);
    },

    async getTeamOptions(): Promise<ApiResult<SelectOption[]>> {
        const options: SelectOption[] = mockTeams.map((team) => ({
            value: team.id,
            label: team.name
        }))

        return mockApi(options);
    }
}