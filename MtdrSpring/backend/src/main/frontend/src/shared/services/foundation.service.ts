import type { ApiResult } from '../dtos/api-result.dto';
import type { SelectOption } from '../models/select-option.model';
import type { UserSummaryDto } from '../dtos/user-summary.dto';
import type { TagDto } from '../dtos/tag.dto';
import type { TeamSummaryDto } from '../dtos/team-summary.dto';
import { apiClient } from './api-client';
import { mockTags } from '../mock/tags.mock';
import { mockTeams } from '../mock/teams.mock';

// ─── Sprint DTO for UI consumption ──────────────────────────────
export interface SprintDto {
    sprintId: string;
    name: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}

export const foundationService = {
    /** Fetch real users from backend /appusers endpoint */
    async getUsers(): Promise<ApiResult<UserSummaryDto[]>> {
        const result = await apiClient.get<UserSummaryDto[]>('/appusers');
        if (!result.success) {
            return { success: false, data: [], message: result.message };
        }
        // Backend already returns camelCase thanks to SQL aliases
        return { success: true, data: result.data };
    },

    /** Fetch real sprints from backend /sprints endpoint */
    async getSprints(): Promise<ApiResult<SprintDto[]>> {
        const result = await apiClient.get<SprintDto[]>('/sprints');
        if (!result.success) {
            return { success: false, data: [], message: result.message };
        }
        return { success: true, data: result.data };
    },

    /** Tags are not stored in the backend yet — still local */
    async getTags(): Promise<ApiResult<TagDto[]>> {
        return { success: true, data: structuredClone(mockTags) };
    },

    /** Teams are not stored in the backend yet — still local */
    async getTeams(): Promise<ApiResult<TeamSummaryDto[]>> {
        return { success: true, data: structuredClone(mockTeams) };
    },

    async getUserOptions(): Promise<ApiResult<SelectOption[]>> {
        const usersResult = await this.getUsers();
        if (!usersResult.success) {
            return { success: false, data: [], message: usersResult.message };
        }
        const options: SelectOption[] = usersResult.data.map((user) => ({
            value: user.id,
            label: user.name,
        }));
        return { success: true, data: options };
    },

    async getTagOptions(): Promise<ApiResult<SelectOption[]>> {
        const options: SelectOption[] = mockTags.map((tag) => ({
            value: tag.id,
            label: tag.name,
        }));
        return { success: true, data: options };
    },

    async getTeamOptions(): Promise<ApiResult<SelectOption[]>> {
        const options: SelectOption[] = mockTeams.map((team) => ({
            value: team.id,
            label: team.name,
        }));
        return { success: true, data: options };
    },
};