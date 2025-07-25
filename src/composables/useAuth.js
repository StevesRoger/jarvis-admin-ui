export const useAuthHandler = (router, redirect) => {
    const handleUnauthorize = (error) => {
        const status = error?.status;
        const code = error?.response?.data?.code || 'NA';
        if (status === 401 && code === 'A401') {
            setTimeout(() => {
                router?.push({ path: '/auth/login', query: { redirect: redirect || '/' } });
            }, 2000);
        }
    };
    return { handleUnauthorize };
};
