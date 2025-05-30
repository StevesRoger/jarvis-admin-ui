export const camelToSnake = (str) => {
    if (!str) return str;
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
};
