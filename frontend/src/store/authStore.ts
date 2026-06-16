let user: { id: string; name: string } | null = null;

export const authStore = {
  getUser: () => user,
  setUser: (next: { id: string; name: string } | null) => {
    user = next;
  },
  isAuthenticated: () => user !== null,
};
