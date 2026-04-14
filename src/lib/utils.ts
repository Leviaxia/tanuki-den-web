export const formatCurrency = (amount: number): string => {
    let displayAmount = amount;

    // Auto-convertir si el monto parece ser USD (menor a 5000)
    // Tasa: 3693 COP
    if (amount > 0 && amount < 5000) {
        displayAmount = amount * 3693;
    }

    return new Intl.NumberFormat('es-CO', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(displayAmount);
};

export const toSlug = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
};
