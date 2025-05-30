import { formatDateWithTime } from './DateUtil';
export const converter = (dataType, value) => {
    if (dataType === 'number') {
        return Number(value);
    } else if (dataType === 'boolean') {
        return Boolean(value);
    } else if (dataType === 'date') {
        return formatDateWithTime(value);
    }
    return value;
};

export const isValidNumber = (str) => {
    return !isNaN(str) && isFinite(parseFloat(str));
};
