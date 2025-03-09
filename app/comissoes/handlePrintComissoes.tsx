import { toast } from "sonner";
import { ComissaoData } from "./page";

export const handlePrintComissoes = (comissoes: ComissaoData[], corretorSelecionado: string, dataInicioSearch: string, dataFimSearch: string) => {
    let somaValorComissao = 0;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
        printWindow.document.write('<html><head><title>Relatório de Comissões</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid black; padding: 2px; text-align: left; }
            th { background-color: #f2f2f2; }
        `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write('<h1>Controle de Comissões</h1>');
        
        if (corretorSelecionado !== 'todos') {
            printWindow.document.write(`<h2>Corretor: ${corretorSelecionado}</h2>`);
        } else {
            printWindow.document.write('<h2>Todos os Corretores</h2>');
        }
        
        printWindow.document.write(`<p>Período: ${dataInicioSearch} a ${dataFimSearch}</p>`);
        printWindow.document.write('<table>');
        printWindow.document.write('<tr><th>Corretor</th><th>Cliente</th><th>Programa</th><th style="text-align: center;">Data Pagamento</th><th style="text-align: right;">Valor Fatura</th><th style="text-align: center;">Comissão (%)</th><th style="text-align: right;">Valor Comissão</th></tr>');
        
        comissoes.forEach((comissao) => {
            printWindow.document.write(`
                <tr>
                    <td>${comissao.corretor}</td>
                    <td>${comissao.cliente}</td>
                    <td>${comissao.programa}</td>
                    <td style="text-align: center;">${comissao.dataPagamento}</td>
                    <td style="text-align: right;">${parseFloat(comissao.valor.toString()).toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</td>
                    <td style="text-align: center;">${comissao.comissao}%</td>
                    <td style="text-align: right;">${comissao.valorComissao.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
            `);
            somaValorComissao += comissao.valorComissao;
        });
        
        printWindow.document.write(`<tr><td colspan="6"><strong>Total</strong></td><td style="text-align: right;"><strong>${somaValorComissao.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</strong></td></tr>`);
        printWindow.document.write('</table>');
        
        if (corretorSelecionado !== 'todos') {
            printWindow.document.write(`<p style="margin-top: 30px;">Eu, <strong>${corretorSelecionado}</strong>, recebi da Radio Cultura AM Ltda. a quantia de <strong>${somaValorComissao.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</strong>, referente a comissão das faturas acima quitadas no período de ${dataInicioSearch} a ${dataFimSearch}.</p>`);
            printWindow.document.write('<div style="margin-top: 50px; text-align: center;">');
            printWindow.document.write('<div style="border-top: 1px solid black; display: inline-block; width: 250px; padding-top: 5px;">Assinatura do Corretor</div>');
            printWindow.document.write('</div>');
        }
        
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    } else {
        toast.error('Não foi possível abrir a janela de impressão.');
    }
}