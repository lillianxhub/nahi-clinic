export const formatLocalDate = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const dd = date.getDate().toString().padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

export const getLocalTime = (date: Date) => {
    return {
        hour: date.getHours().toString().padStart(2, "0"),
        minute: date.getMinutes().toString().padStart(2, "0"),
    };
};
