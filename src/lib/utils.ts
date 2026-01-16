export const formatCurrency = (amount: number): string => {
    let displayAmount = amount;

    // Auto-convertir si el monto parece ser USD (menor a 5000)
    // Tasa: 3693 COP
    if (amount > 0 && amount < 5000) {
        displayAmount = amount * 3693;
    }

    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(displayAmount);
};
