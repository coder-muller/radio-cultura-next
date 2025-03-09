import { toast } from "sonner";
import { Fatura } from "../types";

export const handlePrintRelatorio = (faturas: Fatura[]) => {
    let somaValor = 0;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Relatório de Faturas</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
                body { font-family: Arial, sans-serif; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid black; padding: 2px; text-align: left; }
                th { background-color: #f2f2f2; }
            `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write('<h2>Relatório de Faturas</h2>');
        printWindow.document.write('<table>');
        printWindow.document.write('<tr><th>Cliente</th><th style="text-aling: center;">Vencimento</th><th style="text-aling: center;">Pagamento</th><th style="text-aling: right;">Valor</th></tr>');
        faturas.forEach((fatura: Fatura) => {
            const cliente = fatura.cliente.nomeFantasia
            const valorFatura = fatura.valor ? parseFloat(fatura.valor.toString()).toLocaleString('pt-br', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''

            printWindow.document.write(`
                    <tr>
                        <td>${cliente}</td>
                        <td style="text-aling: center;">${fatura.dataVencimento ? new Date(fatura.dataVencimento).toLocaleDateString('pt-BR') : ''}</td>
                        <td style="text-aling: center;">${fatura.dataPagamento ? new Date(fatura.dataPagamento).toLocaleDateString('pt-BR') : 'Pendente'}</td>
                        <td style="text-aling: right;">${valorFatura}</td>
                    </tr>
                `);
            somaValor += parseFloat(fatura.valor ? fatura.valor.toString() : '0');
        });
        printWindow.document.write(`<tr><td><span>Total</span></td><td></td><td></td><td>${somaValor.toLocaleString('pt-br', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`);
        printWindow.document.write('</table>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    } else {
        toast.error('Não foi possível abrir a janela de impressão.');
    }
}