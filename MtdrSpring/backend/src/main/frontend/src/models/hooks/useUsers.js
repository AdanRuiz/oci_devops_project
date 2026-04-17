import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../api/usersApi';

export const useUsers = () => useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
});