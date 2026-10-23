export const toKobo = (naira: number) => Math.round(naira * 100);
export const fromKobo = (kobo: number) => Math.round(kobo / 100);
export const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;