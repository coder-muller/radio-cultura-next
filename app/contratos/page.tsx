'use client'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getLocalStorage } from "@/lib/localStorage"
import { zodResolver } from "@hookform/resolvers/zod"
import IMask from "imask"
import { Edit, Loader2, Plus, ScrollText, Search, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { parseDate, sendDelete, sendGet, sendPost, sendPut } from "../functions"
import { Cliente, Contrato, Corretor, Fatura, FormaPagamento, Programa } from "../types"

const contratoSchema = z.object({
    clienteId: z.string().min(1, { message: "Cliente é obrigatório" }),
    programaId: z.string().min(1, { message: "Programa é obrigatório" }),
    dataEmissao: z.string().refine((data) => { const parsedDate = parseDate(data); return parsedDate !== null; }, { message: "Data de emissão inválida" }),
    dataVencimento: z.string().refine((data) => { const parsedDate = parseDate(data); return parsedDate !== null; }, { message: "Data de vencimento inválida" }),
    numInsercoes: z.string().refine((data) => { const parsedValue = parseInt(data); return !isNaN(parsedValue) && parsedValue >= 0; }, { message: "Número de inserções inválido" }),
    valor: z.string().refine((data) => { const parsedValue = parseFloat(data.replace(',', '.')); return !isNaN(parsedValue) && parsedValue >= 0; }, { message: "Valor inválido" }).refine((value) => !value || !value.includes('.'), { message: "Valor não pode conter pontos" }),
    diaVencimento: z.string().refine((data) => { const parsedValue = parseInt(data); return !isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 30; }, { message: "Dia de vencimento inválido" }),
    formaPagamentoId: z.string().min(1, { message: "Forma de pagamento é obrigatória" }),
    comissao: z.string().refine((data) => { const parsedValue = parseFloat(data.replace(',', '.')); return !isNaN(parsedValue) && parsedValue >= 0; }, { message: "Comissão inválida" }).refine((value) => !value || !value.includes('.'), { message: "Comissão não pode conter pontos" }),
    status: z.string().min(1, { message: "Status é obrigatório" }),
    corretorId: z.string().min(1, { message: "Corretor é obrigatório" }),
    descritivo: z.string().optional()
})

const configSchema = z.object({
    mes: z.string().min(1, { message: "Mês é obrigatório" }),
    ano: z.string().min(1, { message: "Ano é obrigatório" }).refine((data) => { const parsedValue = parseInt(data); return !isNaN(parsedValue) && parsedValue >= new Date().getFullYear(); }, { message: "Ano inválido" }),
})

export default function Contratos() {

    const formContrato = useForm<z.infer<typeof contratoSchema>>({
        resolver: zodResolver(contratoSchema),
    })

    const formConfig = useForm<z.infer<typeof configSchema>>({
        resolver: zodResolver(configSchema),
    })

    const [contratos, setContratos] = useState<Contrato[]>([])
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [programas, setProgramas] = useState<Programa[]>([])
    const [corretores, setCorretores] = useState<Corretor[]>([])
    const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([])

    const [contratoSearch, setContratoSearch] = useState('')
    const [statusSearch, setStatusSearch] = useState('ativos')

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDialogGerarOpen, setIsDialogGerarOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8

    const dataEmissaoRef = useRef<HTMLInputElement>(null)
    const dataVencimentoRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchData()
        fetchClientes()
        fetchProgramas()
        fetchCorretores()
        fetchFormasPagamento()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
    }, [contratoSearch, statusSearch])

    useEffect(() => {
        if (isDialogOpen) {
            const applyMasks = () => {
                if (dataEmissaoRef.current) {
                    IMask(dataEmissaoRef.current, {
                        mask: '00/00/0000',
                    });
                }
                if (dataVencimentoRef.current) {
                    IMask(dataVencimentoRef.current, {
                        mask: '00/00/0000',
                    });
                }
            };
            const timer = setTimeout(applyMasks, 100);
            return () => clearTimeout(timer);
        }
    }, [isDialogOpen]);

    async function fetchData() {
        const token = getLocalStorage('token')

        if (!token) {
            window.location.href = '/'
            return
        }

        try {
            const contratos: Contrato[] = await sendGet('/contratos/' + token)
            setContratos(contratos)
        } catch (error) {
            console.error("Erro ao buscar contratos:", error);
            toast.error("Erro ao buscar contratos.");
        }
    }

    async function fetchClientes() {
        const token = getLocalStorage('token')
        if (!token) return

        try {
            const clientes: Cliente[] = await sendGet('/clientes/' + token)
            setClientes(clientes)
        } catch (error) {
            console.error("Erro ao buscar clientes:", error);
        }
    }

    async function fetchProgramas() {
        const token = getLocalStorage('token')
        if (!token) return

        try {
            const programas: Programa[] = await sendGet('/programacao/' + token)
            setProgramas(programas)
        } catch (error) {
            console.error("Erro ao buscar programas:", error);
        }
    }

    async function fetchCorretores() {
        const token = getLocalStorage('token')
        if (!token) return

        try {
            const corretores: Corretor[] = await sendGet('/corretores/' + token)
            setCorretores(corretores)
        } catch (error) {
            console.error("Erro ao buscar corretores:", error);
            toast.error("Erro ao buscar corretores, mas continuando a execução.");
            // Continua a execução mesmo com erro
        }
    }

    async function fetchFormasPagamento() {
        const token = getLocalStorage('token')
        if (!token) return

        try {
            const formasPagamento: FormaPagamento[] = await sendGet('/forma-pagamento/' + token)
            setFormasPagamento(formasPagamento)
        } catch (error) {
            console.error("Erro ao buscar formas de pagamento:", error);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function gerarFaturasEntreDatas(dataInicio: Date, dataFim: Date, diaVencimento: number, contrato: any) {
        const token = getLocalStorage('token')
        if (!token) return

        const dataInicioAjustada = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate())
        const dataFimAjustada = new Date(dataFim.getFullYear(), dataFim.getMonth(), 1)

        const datasVencimento = []

        let dataAtual = new Date(dataInicioAjustada)
        let isFirstMonth = true

        while (dataAtual <= dataFimAjustada) {
            const dataVencimento = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), diaVencimento)

            if (!isFirstMonth || dataInicio.getDate() <= diaVencimento) {
                datasVencimento.push(dataVencimento)
            }

            dataAtual = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 1)
            isFirstMonth = false
        }

        for (const dataVencimento of datasVencimento) {
            const parsedData = {
                chave: token,
                clienteId: contrato.clienteId,
                contratoId: contrato.id,
                programaId: contrato.programaId,
                corretoresId: contrato.corretorId,
                dataEmissao: new Date(),
                dataVencimento: dataVencimento,
                dataPagamento: null,
                valor: contrato.valor,
                formaPagamentoId: contrato.formaPagamentoId,
                descritivo: contrato.descritivo,
            }

            try {
                await sendPost('/faturamento', parsedData)
            } catch (error) {
                console.error("Erro ao gerar fatura:", error)
                toast.error("Erro ao gerar algumas faturas.")
            }
        }

    }

    async function onSubmit(data: z.infer<typeof contratoSchema>) {
        const token = getLocalStorage('token')
        if (!token) return

        console.log(data)

        setIsLoading(true)

        const dataEmissaoParsed = data.dataEmissao ? parseDate(data.dataEmissao) : null
        const dataVencimentoParsed = data.dataVencimento ? parseDate(data.dataVencimento) : null

        if (!dataEmissaoParsed || !dataVencimentoParsed) {
            toast.error("Data de emissão ou vencimento inválida.")
            setIsLoading(false)
            return
        }

        const parsedData = {
            ...data,
            clienteId: parseInt(data.clienteId),
            programaId: parseInt(data.programaId),
            dataEmissao: dataEmissaoParsed,
            dataVencimento: dataVencimentoParsed,
            numInsercoes: data.numInsercoes ? parseInt(data.numInsercoes) : null,
            valor: data.valor ? parseFloat(data.valor.replace(',', '.')) : null,
            diaVencimento: data.diaVencimento ? parseInt(data.diaVencimento) : null,
            formaPagamentoId: data.formaPagamentoId ? parseInt(data.formaPagamentoId) : null,
            comissao: data.comissao ? parseFloat(data.comissao.replace(',', '.')) : null,
            corretorId: data.corretorId ? parseInt(data.corretorId) : null,
            chave: token
        }

        if (selectedContrato) {
            try {
                await sendPut('/contratos/' + selectedContrato.id, parsedData)

                const pendingInvoices: Fatura[] = await sendGet('/faturamento/' + token + '/' + selectedContrato.id + '/pendentes')

                if (pendingInvoices && pendingInvoices.length > 0) {
                    for (const invoice of pendingInvoices) {
                        const updatedInvoiceData = {
                            ...invoice,
                            valor: parsedData.valor,
                            formaPagamentoId: parsedData.formaPagamentoId,
                            descritivo: parsedData.descritivo,
                            corretoresId: parsedData.corretorId,
                            comissao: parsedData.comissao,
                            chave: token
                        }
                        await sendPut('/faturamento/' + invoice.id, updatedInvoiceData)
                    }
                }

                fetchData()
                setIsDialogOpen(false)
                setIsLoading(false)
                toast.success("Contrato e faturas pendentes atualizados com sucesso!")
            } catch (error) {
                console.error("Erro ao atualizar contrato:", error)
                toast.error("Erro ao atualizar contrato.")
                setIsLoading(false)
            }
        } else {
            try {
                const novoContrato = await sendPost('/contratos', parsedData)

                if (novoContrato && parsedData.diaVencimento) {
                    await gerarFaturasEntreDatas(
                        new Date(dataEmissaoParsed),
                        new Date(dataVencimentoParsed),
                        parsedData.diaVencimento,
                        novoContrato
                    )
                }

                fetchData()
                setIsDialogOpen(false)
                setIsLoading(false)
                toast.success("Contrato e faturas cadastrados com sucesso!")
            } catch (error) {
                console.error("Erro ao cadastrar contrato:", error)
                toast.error("Erro ao cadastrar contrato.")
                setIsLoading(false)
            }
        }
    }

    async function handleDelete(id: string) {
        try {
            await sendDelete('/contratos/' + id)
            fetchData()
            toast.success("Contrato excluído com sucesso!")
        } catch (error) {
            console.error("Erro ao excluir contrato:", error);
            toast.error("Erro ao excluir contrato.");
        }
    }

    const filteredContratos = contratos
        .filter(contrato => {
            const searchMatch = contrato.cliente?.nomeFantasia?.toLowerCase().includes(contratoSearch.toLowerCase()) ||
                contrato.programacao?.programa?.toLowerCase().includes(contratoSearch.toLowerCase()) ||
                false;
            if (statusSearch === 'todos') return searchMatch;
            if (statusSearch === 'ativos' && contrato.status === 'ativo') return searchMatch;
            if (statusSearch === 'inativos' && contrato.status === 'inativo') return searchMatch;
            if (statusSearch === 'cancelados' && contrato.status === 'cancelado') return searchMatch;

            return false;
        });

    async function geraFaturaIndividual(data: z.infer<typeof configSchema>) {
        setIsLoading(true)

        const token = getLocalStorage('token')

        if (!token) return
        if (!selectedContrato) return

        const dataVencimento = selectedContrato.diaVencimento ? new Date(parseInt(data.ano), parseInt(data.mes) - 1, parseInt(selectedContrato.diaVencimento.toString())) : null

        if (!dataVencimento) {
            toast.error("Data de vencimento inválida.");
            setIsLoading(false)
            return;
        }

        const parsedData = {
            chave: token,
            clienteId: selectedContrato.clienteId,
            contratoId: selectedContrato.id,
            programaId: selectedContrato.programaId,
            corretoresId: selectedContrato.corretorId,
            dataEmissao: new Date(),
            dataVencimento: dataVencimento,
            dataPagamento: null,
            valor: selectedContrato.valor,
            formaPagamentoId: selectedContrato.formaPagamentoId,
            descritivo: selectedContrato.descritivo,
        }

        try {
            await sendPost('/faturamento', parsedData)
            toast.success("Fatura gerada com sucesso!")
            setSelectedContrato(null)
            setIsDialogGerarOpen(false)
            setIsLoading(false)
        } catch (error) {
            console.error("Erro ao gerar fatura:", error);
            toast.error("Erro ao gerar fatura.");
            setIsLoading(false)
        }
    }

    async function handleCancelarContrato() {
        const token = getLocalStorage('token')
        if (!selectedContrato) return
        try {

            const faturasPendentes: Fatura[] = await sendGet('/faturamento/' + token + '/' + selectedContrato.id + '/pendentes')

            if (faturasPendentes.length > 0) {
                for (const fatura of faturasPendentes) {
                    await sendDelete('/faturamento/' + fatura.id)
                }
            }

            await sendPut('/contratos/' + selectedContrato.id, {
                ...selectedContrato,
                status: 'cancelado'
            })

            fetchData()
            toast.success("Contrato cancelado com sucesso!")
            setIsDialogOpen(false)
            setSelectedContrato(null)
            fetchData()
        } catch (error) {
            console.error("Erro ao cancelar contrato:", error);
            toast.error("Erro ao cancelar contrato.");
        }
    }

    return (
        <>
            <div className="my-4">
                <h2 className="text-2xl font-semibold tracking-tight">Contratos</h2>
                <p className="text-sm text-muted-foreground">Aqui você pode ver e gerenciar todos os contratos feitos.</p>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center justify-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Buscar contrato..." className="pl-8" value={contratoSearch} onChange={(e) => setContratoSearch(e.target.value)} />
                    </div>
                    <Select value={statusSearch} onValueChange={setStatusSearch}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecione um Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="ativos">Ativos</SelectItem>
                            <SelectItem value="inativos">Inativos</SelectItem>
                            <SelectItem value="cancelados">Cancelados</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={() => {
                    formContrato.reset({
                        clienteId: '',
                        programaId: '',
                        dataEmissao: new Date().toLocaleDateString('pt-br'),
                        dataVencimento: '',
                        numInsercoes: '',
                        valor: '',
                        diaVencimento: '',
                        formaPagamentoId: '',
                        comissao: '',
                        status: 'ativo',
                        corretorId: '',
                        descritivo: ''
                    })
                    setSelectedContrato(null)
                    setIsDialogOpen(true)
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Contrato
                </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-18rem)] max-h-[calc(100vh-18rem)] mt-2">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Programa</TableHead>
                                <TableHead>Data Emissão</TableHead>
                                <TableHead>Dia Pagamento</TableHead>
                                <TableHead>Data Vencimento</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredContratos.length > 0 ? (
                                filteredContratos
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((contrato) => (
                                        <TableRow key={contrato.id}>
                                            <TableCell className="font-medium">{contrato.cliente?.nomeFantasia}</TableCell>
                                            <TableCell>{contrato.programacao?.programa}</TableCell>
                                            <TableCell>{contrato.dataEmissao ? new Date(contrato.dataEmissao).toLocaleDateString('pt-BR') : '-'}</TableCell>
                                            <TableCell>{contrato.diaVencimento ? parseInt(contrato.diaVencimento.toString()) : ''}</TableCell>
                                            <TableCell>{contrato.dataVencimento ? new Date(contrato.dataVencimento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                                            <TableCell>{contrato.valor ? `${parseFloat(contrato.valor.toString()).toLocaleString('pt-br', { currency: 'BRL', style: 'currency' })}` : '-'}</TableCell>
                                            <TableCell>{contrato.status}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center space-x-2">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                                                    setSelectedContrato(contrato)
                                                                    formConfig.reset({
                                                                        mes: (new Date().getMonth() + 2).toString(),
                                                                        ano: new Date().getFullYear().toString(),
                                                                    })
                                                                    setIsDialogGerarOpen(true)
                                                                }}>
                                                                    <ScrollText className="h-4 w-4" />
                                                                    <span className="sr-only">Gerar Fatura Individual</span>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Gerar Fatura Individual</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                                                    setSelectedContrato(contrato)
                                                                    formContrato.reset({
                                                                        clienteId: contrato.clienteId.toString(),
                                                                        programaId: contrato.programaId.toString(),
                                                                        dataEmissao: contrato.dataEmissao ? new Date(contrato.dataEmissao).toLocaleDateString('pt-BR') : '',
                                                                        dataVencimento: contrato.dataVencimento ? new Date(contrato.dataVencimento).toLocaleDateString('pt-BR') : '',
                                                                        numInsercoes: contrato.numInsercoes ? contrato.numInsercoes.toString() : '',
                                                                        valor: contrato.valor ? parseFloat(contrato.valor.toString()).toFixed(2).replace('.', ',') : '',
                                                                        diaVencimento: contrato.diaVencimento ? contrato.diaVencimento.toString() : '',
                                                                        formaPagamentoId: contrato.formaPagamentoId ? contrato.formaPagamentoId.toString() : '',
                                                                        comissao: contrato.comissao ? contrato.comissao.toFixed(2).replace('.', ',') : '',
                                                                        status: contrato.status || 'Ativo',
                                                                        corretorId: contrato.corretorId ? contrato.corretorId.toString() : '',
                                                                        descritivo: contrato.descritivo || ''
                                                                    })
                                                                    setIsDialogOpen(true)
                                                                }}>
                                                                    <Edit className="h-4 w-4" />
                                                                    <span className="sr-only">Editar</span>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Editar</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <AlertDialog>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                                            <Trash2 className="h-4 w-4" />
                                                                            <span className="sr-only">Excluir</span>
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Excluir</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    <AlertDialogDescription>
                                                                        <div className="text-destructive font-semibold mb-2">ATENÇÃO! Esta é uma ação irreversível!</div>
                                                                        <p>Excluir este contrato afetará <strong>permanentemente</strong>:</p>
                                                                        <ul className="list-disc pl-5 mt-2 space-y-1">
                                                                            <li>Todas as faturas vinculadas (incluindo as já pagas)</li>
                                                                            <li>Todos os registros de comissões geradas por estas faturas</li>
                                                                            <li>Relatórios financeiros que incluem este contrato</li>
                                                                        </ul>
                                                                        <p className="mt-2">Após a exclusão, estes dados não poderão ser recuperados.</p>
                                                                    </AlertDialogDescription>
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => {
                                                                    handleDelete(contrato.id.toString())
                                                                }}>Continuar</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center">Nenhum contrato encontrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </ScrollArea>

            <div className="flex items-center justify-center space-x-2 w-full">
                <Pagination>
                    <PaginationContent className="flex items-center justify-between w-full">
                        <PaginationItem>
                            <span className="flex h-9 items-center justify-center px-3">
                                Página {currentPage} de {Math.max(1, Math.ceil(filteredContratos.length / itemsPerPage))}
                            </span>
                        </PaginationItem>
                        <div className="flex items-center justify-center gap-2">
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    aria-disabled={currentPage === 1}
                                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setCurrentPage(prev =>
                                        Math.min(Math.ceil(filteredContratos.length / itemsPerPage), prev + 1)
                                    )}
                                    aria-disabled={currentPage === Math.ceil(filteredContratos.length / itemsPerPage)}
                                    className={currentPage === Math.ceil(filteredContratos.length / itemsPerPage) ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>
                        </div>
                    </PaginationContent>
                </Pagination>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedContrato ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
                        <DialogDescription>{selectedContrato ? 'Edite os dados de um contrato existente.' : 'Cadastre um novo contrato.'}</DialogDescription>
                    </DialogHeader>
                    <Form {...formContrato}>
                        <form onSubmit={formContrato.handleSubmit(onSubmit)} className="space-y-1.5 w-full">
                            <FormField
                                control={formContrato.control}
                                name="clienteId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cliente</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um cliente" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {clientes.map((cliente) => (
                                                    <SelectItem key={cliente.id} value={cliente.id.toString()}>
                                                        {cliente.nomeFantasia}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={formContrato.control}
                                name="programaId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Programa</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um programa" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {programas.map((programa) => (
                                                    <SelectItem key={programa.id} value={programa.id.toString()}>
                                                        {programa.programa}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-3 gap-2">
                                <FormField
                                    control={formContrato.control}
                                    name="dataEmissao"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data Emissão</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Data de emissão" ref={dataEmissaoRef} autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formContrato.control}
                                    name="dataVencimento"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data Vencimento</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Data de vencimento" ref={dataVencimentoRef} autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formContrato.control}
                                    name="numInsercoes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Número de Inserções</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Número de inserções" autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <FormField
                                    control={formContrato.control}
                                    name="valor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valor</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Valor" autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formContrato.control}
                                    name="diaVencimento"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dia do Vencimento</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Dia do vencimento" autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formContrato.control}
                                    name="formaPagamentoId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Forma de Pagamento</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {formasPagamento.map((formaPagamento) => (
                                                        <SelectItem key={formaPagamento.id} value={formaPagamento.id.toString()}>
                                                            {formaPagamento.formaPagamento}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <FormField
                                    control={formContrato.control}
                                    name="comissao"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Comissão (%)</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Comissão" autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formContrato.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione um status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ativo">Ativo</SelectItem>
                                                    <SelectItem value="inativo">Inativo</SelectItem>
                                                    <SelectItem value="cancelado">Cancelado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={formContrato.control}
                                name="corretorId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Corretor</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um corretor" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {corretores.map((corretor) => (
                                                    <SelectItem key={corretor.id} value={corretor.id.toString()}>
                                                        {corretor.nome}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={formContrato.control}
                                name="descritivo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Descrição" autoComplete="off" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="mt-4">
                                {isLoading ? (
                                    <Button variant={"default"} disabled>
                                        <Loader2 className="animate-spin" />
                                        Salvando...
                                    </Button>
                                ) : (
                                    <Button variant={"default"} type="submit">Salvar</Button>
                                )}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        {selectedContrato && (
                                            <Button variant={"secondary"}>Cancelar Contrato</Button>
                                        )}
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação não pode ser desfeita. O contrato será cancelado e as
                                                faturas futuras associadas a ele serão apagadas.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleCancelarContrato}>Continuar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <DialogClose asChild>
                                    <Button variant={"outline"} type="reset">Voltar</Button>
                                </DialogClose>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDialogGerarOpen} onOpenChange={setIsDialogGerarOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gerar Nova Fatura</DialogTitle>
                        <DialogDescription>Preencha as informações para gerar uma nova fatura.</DialogDescription>
                    </DialogHeader>

                    <Form {...formConfig}>
                        <form onSubmit={formConfig.handleSubmit(geraFaturaIndividual)}>
                            <div className="grid grid-cols-2 gap-2">
                                <FormField
                                    control={formConfig.control}
                                    name="mes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mês</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder='Mês'></SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectItem value="1" >Janeiro</SelectItem>
                                                            <SelectItem value="2">Fevereiro</SelectItem>
                                                            <SelectItem value="3">Março</SelectItem>
                                                            <SelectItem value="4">Abril</SelectItem>
                                                            <SelectItem value="5">Maio</SelectItem>
                                                            <SelectItem value="6">Junho</SelectItem>
                                                            <SelectItem value="7">Julho</SelectItem>
                                                            <SelectItem value="8">Agosto</SelectItem>
                                                            <SelectItem value="9">Setembro</SelectItem>
                                                            <SelectItem value="10">Outubro</SelectItem>
                                                            <SelectItem value="11">Novembro</SelectItem>
                                                            <SelectItem value="12">Dezembro</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formConfig.control}
                                    name="ano"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ano</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Ano" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <DialogFooter className="mt-4">
                                {isLoading ? (
                                    <Button variant={"default"} disabled>
                                        <Loader2 className="animate-spin" />
                                        Gerando...
                                    </Button>
                                ) : (
                                    <Button variant={"default"} type="submit">Gerar</Button>
                                )}
                                <DialogClose asChild>
                                    <Button variant={"outline"} type="reset">Voltar</Button>
                                </DialogClose>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    )
}