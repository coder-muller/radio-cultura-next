import { Fatura } from "../types";
import CulturaLogo from "@/public/culturaLogo.png"
import { toast } from "sonner";

export const handlePrintAllFaturas = async (faturas: Fatura[]) => {

    const getBase64Image = async (): Promise<string> => {
        const response = await fetch(CulturaLogo.src);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    };

    const base64Logo = await getBase64Image();

    let boletoHtml = `
            <html>
                <head>
                    <title>Boleto</title>
                <head>
                <style>
                    html, body, div, span, applet, object, iframe,
                    h1, h2, h3, h4, h5, h6, p, blockquote, pre,
                    a, abbr, acronym, address, big, cite, code,
                    del, dfn, em, img, ins, kbd, q, s, samp,
                    small, strike, strong, sub, sup, tt, var,
                    b, u, i, center,
                    dl, dt, dd, ol, ul, li,
                    fieldset, form, label, legend,
                    table, caption, tbody, tfoot, thead, tr, th, td,
                    article, aside, canvas, details, embed, 
                    figure, figcaption, footer, header, hgroup, 
                    menu, nav, output, ruby, section, summary,
                    time, mark, audio, video {
                        margin: 0;
                        padding: 0;
                        border: 0;
                        font-size: 100%;
                        font: inherit;
                        vertical-align: baseline;
                    }
                    /* HTML5 display-role reset for older browsers */
                    article, aside, details, figcaption, figure, 
                    footer, header, hgroup, menu, nav, section {
                        display: block;
                    }
                    body {
                        line-height: 1;
                    }
                    ol, ul {
                        list-style: none;
                    }
                    blockquote, q {
                        quotes: none;
                    }
                    blockquote:before, blockquote:after,
                    q:before, q:after {
                        content: '';
                        content: none;
                    }
                    table {
                        border-collapse: collapse;
                        border-spacing: 0;
                    }
                    h1{
                        font-size: 14px;
                    }
                    p{
                        font-size: 12px;
                    }
                    .boleto {
                        page-break-after: always; /* Garante que cada boleto esteja em uma nova página */
                        margin-bottom: 20px;
                    }
                </style>
                <body>
        `
    for (const fatura of faturas) {
        const nomeCliente = fatura.cliente.nomeFantasia
        const nomePrograma = fatura.programa.programa
        const descritivoContrato = fatura.contrato.descritivo ? fatura.contrato.descritivo : 'Sem descrição'
        const nomeCorretor = fatura.corretores?.nome

        boletoHtml += `
           <div style="font-family: Arial, sans-serif; padding: 20px;" class="boleto">
                <div style='width: 100%; display: flex; justify-content: space-between; align-items: flex-end;'>
                    <img src="${base64Logo}" alt="Rádio Cultura Logo" style="max-width: 200px;" /> 
                    <div style='display: flex; flex-direction: column; align-items: flex-end; gap: 5px;'>
                        <h1 style="font-weight: bold;">Rádio Cultura Canguçu Ltda</h1>
                        <p>Rua Professor André Puente, 203</p>
                        <p>CEP: 96600-000 - Canguçu, Rio Grande do Sul, Brasil</p>
                        <p>CNPJ: 25.043.065/0001-45</p>
                        <p>Telefone: (53) 3252-1144 || (53) 9 9952-1144</p>
                        <p>E-mail: culturaam1030@gmail.com</p>
                    </div> 
                </div>
                <hr style="border: 1px solid black; width: 100%;" />
                <div style="display: flex; justify-content: center; align-items: center;">
                    <div style="width: 50%; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;">
                        <div>
                            <p>Cliente:</p>
                            <h1 style="font-weight: bold;">${nomeCliente}</h1>
                        </div>
                        <div>
                            <p>Endereço:</p>
                            <h1 style="font-weight: bold;">${fatura.cliente?.endereco}</h1>
                        </div>
                        <div>
                            <p>Município:</p>
                            <h1 style="font-weight: bold;">${fatura.cliente?.cidade}</h1>
                        </div>
                        <div>
                            <p>CNPJ:</p>
                            <h1 style="font-weight: bold;">${fatura.cliente?.cnpj}</h1>
                        </div>
                    </div>
                    <div style="width: 50%; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;">
                        <div>
                            <p>Fone:</p>
                            <h1 style="font-weight: bold;">${fatura.cliente?.fone}</h1>
                        </div>
                        <div>
                            <p>CEP:</p>
                            <h1 style="font-weight: bold;">${fatura.cliente?.cep}</h1>
                        </div>
                        <div>
                            <p>Estado:</p>
                            <h1 style="font-weight: bold;">${fatura.cliente?.estado}</h1>
                        </div>
                        <div>
                            <p>Divulgação:</p>
                            <h1 style="font-weight: bold;">${nomePrograma}</h1>
                        </div>
                    </div>
                </div>
                <hr style="border: 1px solid black; width: 100%;" />
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p>Data de Emissão:</p>
                        <h1 style="font-weight: bold;">${fatura.dataEmissao ? new Date(fatura.dataEmissao).toLocaleDateString('pt-br') : ''}</h1>
                    </div>
                    <div>
                    <p>Data de Vencimento:</p>
                    <h1 style="font-weight: bold;">${fatura.dataVencimento ? new Date(fatura.dataVencimento).toLocaleDateString('pt-br'): ''}</h1>
                    </div>
                    <div>
                        <p>Fatura N°:</p>
                        <h1 style="font-weight: bold;">${fatura.id}</h1>
                    </div>
                    <div>
                        <p>Valor:</p>
                        <h1 style="font-weight: bold;">${fatura.valor ? parseFloat(fatura.valor.toString()).toLocaleString('pt-br', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</h1>
                    </div>
                </div>
                <hr style="border: 1px solid black; width: 100%;" />
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p>Corretor:</p>
                        <h1 style="font-weight: bold;">${nomeCorretor}</h1>
                    </div>
                    <div>
                        <p>Descrição:</p>
                        <h1 style="font-weight: bold;">${descritivoContrato}</h1>
                    </div>
                </div>
                <hr style="border: 1px solid black; width: 100%;" />
                <p>Reconheço(emos) a exatidão desta Duplicata de Prestação de Serviço na importância acima que pagarei(emos) à Rádio Cultura Canguçu Ltda. no vencimento acima indicado.</p>
                <div style="display: flex; justify-content: center; align-items: center; gap: 200px; margin-top: 80px;">
                    <p style="border-top: 1px solid gray; padding: 5px 40px;">Assinatura do Emitente</p>
                    <p style="border-top: 1px solid gray; padding: 5px 40px;">Assinatura do Sacado</p>
                </div>
                <hr style="border: 3px dotted black; width: 100%; margin-top: 30px;" />
                <div style='width: 100%; display: flex; justify-content: space-between; align-items: flex-end;'>
                    <div id="logoContainer"></div> 
                    <div style='display: flex; flex-direction: column; align-items: flex-end; gap: 5px;'>
                        <h1 style="font-weight: bold;">Rádio Cultura Canguçu Ltda</h1>
                        <p>Rua Professor André Puente, 203</p>
                        <p>CEP: 96600-000 - Canguçu, Rio Grande do Sul, Brasil</p>
                        <p>CNPJ: 25.043.065/0001-45</p>
                        <p>Telefone: (53) 3252-1144 || (53) 9 9952-1144</p>
                        <p>E-mail: culturaam1030@gmail.com</p>
                    </div> 
                </div>
                <hr style="border: 1px solid black; width: 100%;" />
                <div style="display: flex; justify-content: center; align-items: center;">
                    <div style="width: 50%; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;">
                        <div>
                            <p>Cliente:</p>
                            <h1 style="font-weight: bold;">${nomeCliente}</h1>
                        </div>
                        <div>
                            <p>Endereço:</p>
                            <h1 style="font-weight: bold;">${fatura.cliente?.endereco}</h1>
                        </div>
                        <div>
                            <p>Município:</p>
                            <h1 style="font-weight: bold;">${fatura.cliente?.cidade}</h1>
                        </div>
                        <div>
                            <p>CNPJ:</p>
                            <h1 style="font-weight: bold;">${fatura.cliente?.cnpj}</h1>
                        </div>
                    </div>
                    <div style="width: 50%; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;">
                        <div>
                            <p>Fone:</p>
                            <h1 style="font-weight: bold;">${fatura.cliente?.fone}</h1>
                        </div>
                        <div>
                            <p>CEP:</p>
                            <h1 style="font-weight: bold;">${fatura.cliente?.cep}</h1>
                        </div>
                        <div>
                            <p>Estado:</p>
                            <h1 style="font-weight: bold;">${fatura.cliente?.estado}</h1>
                        </div>
                        <div>
                            <p>Divulgação:</p>
                            <h1 style="font-weight: bold;">${nomePrograma}</h1>
                        </div>
                    </div>
                </div>
                <hr style="border: 1px solid black; width: 100%;" />
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p>Data de Emissão:</p>
                        <h1 style="font-weight: bold;">${ fatura.dataEmissao && new Date(fatura.dataEmissao).toLocaleDateString('pt-br')}</h1>
                    </div>
                    <div>
                        <p>Data de Vencimento:</p>
                        <h1 style="font-weight: bold;">${ fatura.dataVencimento && new Date(fatura.dataVencimento).toLocaleDateString('pt-br')}</h1>
                    </div>
                    <div>
                        <p>Fatura N°:</p>
                        <h1 style="font-weight: bold;">${fatura.id}</h1>
                    </div>
                    <div>
                        <p>Valor:</p>
                        <h1 style="font-weight: bold;">${fatura.valor && parseFloat(fatura.valor.toString()).toLocaleString('pt-br', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h1>
                    </div>
                </div>
                <hr style="border: 1px solid black; width: 100%;" />
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p>Corretor:</p>
                        <h1 style="font-weight: bold;">${nomeCorretor}</h1>
                    </div>
                    <div>
                        <p>Descrição:</p>
                        <h1 style="font-weight: bold;">${descritivoContrato}</h1>
                    </div>
                </div>
                <hr style="border: 1px solid black; width: 100%;" />
            </div>
           `
    }

    boletoHtml += `
                </body>
            </html>
        `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
        printWindow.document.write(boletoHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    } else {
        toast.error('Não foi possível abrir a janela de impressão.')
    }

}