export const cleanText = (text: string) => {
    if (!text) return "";
    return text
        .replace(/\*/g, '')
        .replace(/#/g, '')
        .replace(/^Título:\s*/i, '')
        .replace(/^Resumen:\s*/i, '')
        .trim();
};
