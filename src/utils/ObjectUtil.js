import { formatDateWithTime } from './dateUtil';
export const converter = (dataType, value) => {
    if (dataType === 'number') {
        return isValidNumber(value) ? Number(value) : 0;
    } else if (dataType === 'boolean') {
        return value === 'true' || value === 'false' ? Boolean(value) : value;
    } else if (dataType === 'date') {
        return formatDateWithTime(value);
    }
    return value;
};

export const isValidNumber = (str) => {
    return !isNaN(str) && isFinite(parseFloat(str));
};
