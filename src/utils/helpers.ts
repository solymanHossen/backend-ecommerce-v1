export const escapeRegex = (text: string): string => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};
