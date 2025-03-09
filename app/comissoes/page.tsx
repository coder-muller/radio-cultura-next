'use client'

import { Input } from "@/components/ui/input"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getLocalStorage } from "@/lib/localStorage"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { parseDate, sendGet } from "../functions"
import { Corretor, Contrato, Fatura } from "../types"
import IMask from "imask"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { handlePrintComissoes } from "./handlePrintComissoes"

export interface ComissaoData {
    id: number
    corretor: string
    cliente: string
    programa: string
    dataEmissao: string
    dataVencimento: string
    dataPagamento: string
    valor: number
    comissao: number
    valorComissao: number
}

export default function Comissoes() {
    const [dataInicioSearch, setDataInicioSearch] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('pt-BR'))
    const [dataFimSearch, setDataFimSearch] = useState(new Date().toLocaleDateString('pt-BR'))
    const [corretorSelecionado, setCorretorSelecionado] = useState<string>('todos')
    const [isLoading, setIsLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8

    const [corretores, setCorretores] = useState<Corretor[]>([])
    const [comissoes, setComissoes] = useState<ComissaoData[]>([])

    const dataInicioSearchRef = useRef<HTMLInputElement>(null)
    const dataFimSearchRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const applyMasks = () => {
            if (dataInicioSearchRef.current) {
                IMask(dataInicioSearchRef.current, {
                    mask: '00/00/0000',
                })
            }
            if (dataFimSearchRef.current) {
                IMask(dataFimSearchRef.current, {
                    mask: '00/00/0000',
                })
            }
        }
        const timer = setTimeout(applyMasks, 100)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        setCurrentPage(1)
    }, [corretorSelecionado, dataInicioSearch, dataFimSearch])

    async function fetchData() {
        const token = getLocalStorage('token')
        
        if (!token) {
            window.location.href = '/'
            return
        }

        setIsLoading(true)
        try {
            // Fetch all necessary data in parallel
            const [faturasData, contratosData, corretoresData] = await Promise.all([
                sendGet<Fatura[]>('/faturamento/' + token),
                sendGet<Contrato[]>('/contratos/' + token),
                sendGet<Corretor[]>('/corretores/' + token)
            ])

            setCorretores(corretoresData)

            processComissoes(faturasData, contratosData, corretoresData)
            setIsLoading(false)
        } catch (error) {
            console.error("Erro ao buscar dados:", error)
            toast.error("Erro ao buscar dados.")
            setIsLoading(false)
        }
    }

    function processComissoes(faturas: Fatura[], contratos: Contrato[], corretores: Corretor[]) {
        // Only process paid invoices
        const faturasPagas = faturas.filter(fatura => fatura.dataPagamento)

        const comissoesData: ComissaoData[] = faturasPagas.map(fatura => {
            // Find the related contract to get commission percentage
            const contrato = contratos.find(c => c.id === fatura.contratoId)
            const corretor = corretores.find(c => c.id === fatura.corretoresId)

            // Calculate commission amount
            const comissaoPercentual = contrato?.comissao || 0
            const valorComissao = fatura.valor ? (fatura.valor * comissaoPercentual) / 100 : 0

            return {
                id: fatura.id,
                corretor: corretor?.nome || 'Não atribuído',
                cliente: fatura.cliente?.nomeFantasia || 'Desconhecido',
                programa: fatura.programa?.programa || 'Desconhecido',
                dataEmissao: fatura.dataEmissao ? new Date(fatura.dataEmissao).toLocaleDateString('pt-BR') : '-',
                dataVencimento: fatura.dataVencimento ? new Date(fatura.dataVencimento).toLocaleDateString('pt-BR') : '-',
                dataPagamento: fatura.dataPagamento ? new Date(fatura.dataPagamento).toLocaleDateString('pt-BR') : '-',
                valor: fatura.valor || 0,
                comissao: comissaoPercentual,
                valorComissao: valorComissao
            }
        })

        setComissoes(comissoesData)
    }

    const filteredComissoes = comissoes.filter(comissao => {
        const dataPagamento = comissao.dataPagamento !== '-' ?
            new Date(comissao.dataPagamento.split('/').reverse().join('-')) : null

        const dataInicio = parseDate(dataInicioSearch) ?
            new Date(parseDate(dataInicioSearch)!) : null

        const dataFim = parseDate(dataFimSearch) ?
            new Date(parseDate(dataFimSearch)!) : null

        const dateInRange = dataPagamento && dataInicio && dataFim ?
            (dataPagamento >= dataInicio && dataPagamento <= dataFim) : true

        const corretorMatch = corretorSelecionado === 'todos' ||
            comissao.corretor === corretorSelecionado

        return dateInRange && corretorMatch
    })

    const paginatedComissoes = filteredComissoes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const totalPages = Math.max(1, Math.ceil(filteredComissoes.length / itemsPerPage))

    return (
        <>
            <div className="my-4">
                <h2 className="text-2xl font-semibold tracking-tight">Comissões</h2>
                <p className="text-sm text-muted-foreground">Aqui você pode ver todas as comissões geradas a partir de faturas pagas.</p>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center justify-center gap-2">
                    <Select
                        value={corretorSelecionado}
                        onValueChange={setCorretorSelecionado}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Selecione um corretor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos os corretores</SelectItem>
                            {corretores.map((corretor) => (
                                <SelectItem key={corretor.id} value={corretor.nome}>
                                    {corretor.nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder="Data Início"
                        type="text"
                        className="w-auto"
                        value={dataInicioSearch}
                        onChange={(e) => setDataInicioSearch(e.target.value)}
                        ref={dataInicioSearchRef}
                    />
                    <Input
                        placeholder="Data Final"
                        type="text"
                        className="w-auto"
                        value={dataFimSearch}
                        onChange={(e) => setDataFimSearch(e.target.value)}
                        ref={dataFimSearchRef}
                    />
                </div>
                <Button onClick={() => handlePrintComissoes(filteredComissoes, corretorSelecionado, dataInicioSearch, dataFimSearch)}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Relatório
                </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-22rem)] max-h-[calc(100vh-22rem)] mt-2">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Corretor</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Programa</TableHead>
                                <TableHead>Data Pagamento</TableHead>
                                <TableHead>Valor Fatura</TableHead>
                                <TableHead>Comissão (%)</TableHead>
                                <TableHead>Valor Comissão</TableHead>
                                <TableHead className="w-[100px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedComissoes.length > 0 ? (
                                paginatedComissoes.map((comissao) => (
                                    <TableRow key={comissao.id}>
                                        <TableCell className="font-medium">{comissao.corretor}</TableCell>
                                        <TableCell>{comissao.cliente}</TableCell>
                                        <TableCell>{comissao.programa}</TableCell>
                                        <TableCell>{comissao.dataPagamento}</TableCell>
                                        <TableCell>{parseFloat(comissao.valor.toString()).toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</TableCell>
                                        <TableCell>{comissao.comissao}%</TableCell>
                                        <TableCell>{comissao.valorComissao.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</TableCell>
                                        <TableCell>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => {
                                                                handlePrintComissoes([comissao], comissao.corretor, dataInicioSearch, dataFimSearch)
                                                            }}
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                            <span className="sr-only">Imprimir Comissões</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Imprimir Comissões</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-4">
                                        {isLoading ? 'Carregando comissões...' : 'Nenhuma comissão encontrada'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </ScrollArea>

            <div className="flex items-center justify-center space-x-2 w-full mt-4">
                <Pagination>
                    <PaginationContent className="flex items-center justify-between w-full">
                        <PaginationItem>
                            <span className="flex h-9 items-center justify-center px-3">
                                Página {currentPage} de {totalPages}
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
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    aria-disabled={currentPage === totalPages}
                                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>
                        </div>
                    </PaginationContent>
                </Pagination>
            </div>
        </>
    )
}