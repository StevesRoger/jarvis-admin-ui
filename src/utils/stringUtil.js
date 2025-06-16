export const camelToSnake = (str) => {
    if (!str) return str;
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
};

export const UrlUtil = {
    isValidUrl(url) {
        if (!/^(https?:)/.test(url)) {
            return true;
        } else {
            return false;
        }
    }
};
