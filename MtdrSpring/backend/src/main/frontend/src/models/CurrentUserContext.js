import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from 'react-oidc-context';
import { fetchMe } from './api/usersApi';

const CurrentUserContext = createContext(null);

export function CurrentUserProvider({ children }) {
  const auth = useAuth();

  const {
    data: currentUser,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: fetchMe,
    enabled: auth.isAuthenticated,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return (
    <CurrentUserContext.Provider value={{ currentUser: currentUser ?? null, isLoading, error }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
