'use client'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getLocalStorage } from "@/lib/localStorage"
import IMask from 'imask'
import { BadgeDollarSign, ChartGantt, Printer, Search, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { parseDate, sendDelete, sendGet, sendPut } from "../functions"
import { Fatura, FormaPagamento } from "../types"
import { handlePrintAllFaturas } from "./handlePrintAllFaturas"
import { handlePrintRelatorio } from "./handlePrintRelatorio"

export default function Faturas() {

    const [faturas, setFaturas] = useState<Fatura[]>([])
    const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([])

    const [faturaSearch, setFaturaSearch] = useState("")
    const [statusSearch, setStatusSearch] = useState("todas")
    const [dataInicioSearch, setDataInicioSearch] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('pt-BR'))
    const [dataFinalSearch, setDataFinalSearch] = useState(new Date().toLocaleDateString('pt-BR'))
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null)
    const [dataPagamento, setDataPagamento] = useState(new Date().toLocaleDateString('pt-BR'))
    const [metodoPagamento, setMetodoPagamento] = useState("")

    const dataInicioSearchRef = useRef<HTMLInputElement>(null)
    const dataFimSearchRef = useRef<HTMLInputElement>(null)
    const dataPagamentoRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchFaturas()
        fetchFormasPagamento()
    }, [])

    useEffect(() => {
        const applyMasks = () => {
            if (dataInicioSearchRef.current) {
                IMask(dataInicioSearchRef.current, {
                    mask: '00/00/0000',
                });
            }
            if (dataFimSearchRef.current) {
                IMask(dataFimSearchRef.current, {
                    mask: '00/00/0000',
                });
            }
            if (dataPagamentoRef.current) {
                IMask(dataPagamentoRef.current, {
                    mask: '00/00/0000',
                });
            }
        };
        const timer = setTimeout(applyMasks, 100);
        return () => clearTimeout(timer);
    }, [isDialogOpen])

    useEffect(() => {
        setCurrentPage(1)
    }, [faturaSearch, statusSearch, dataInicioSearch, dataFinalSearch])

    async function fetchFaturas() {
        const token = getLocalStorage("token")
        
        if (!token) {
            window.location.href = '/'
            return
        }

        try {
            const faturas: Fatura[] = await sendGet("/faturamento/" + token)
            setFaturas(faturas)
        } catch (error) {
            console.log(error)
            toast.error('Erro ao carregar as faturas!')
        }
    }

    async function fetchFormasPagamento() {
        const token = getLocalStorage("token")
        if (!token) return
        try {
            const formasPagamento: FormaPagamento[] = await sendGet("/forma-pagamento/" + token)
            setFormasPagamento(formasPagamento)
        } catch (error) {
            console.log(error)
            toast.error('Erro ao carregar as formas de pagamento!')
        }
    }

    async function handlePayment(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault()

        if (!selectedFatura) return

        const token = getLocalStorage("token")
        if (!token) return

        try {
            // Parse the payment date
            const parsedDate = parseDate(dataPagamento)

            if (!parsedDate) {
                toast.error('Data de pagamento inválida!')
                return
            }

            // Send payment data to API
            await sendPut(`/faturamento/${selectedFatura.id}/pagamento`, {
                dataPagamento: parsedDate,
                formaPagamentoId: metodoPagamento,
            })

            fetchFaturas()
            setIsDialogOpen(false)
            setSelectedFatura(null)
            toast.success('Fatura paga com sucesso!')
        } catch (error) {
            console.error('Erro ao registrar pagamento:', error)
            toast.error('Erro ao registrar pagamento!')
        }
    }

    async function handleDelete(id: string) {
        try {
            const token = getLocalStorage("token")
            if (!token) return

            await sendDelete('/faturamento/' + id)
            fetchFaturas()
            toast.success('Fatura excluída com sucesso!')
        } catch (error) {
            console.error('Erro ao excluir fatura:', error)
            toast.error('Erro ao excluir fatura!')
        }
    }

    // Função para filtrar as faturas com base nos critérios de busca
    const filteredFaturas = faturas
        .filter(fatura => {
            // Filtro por texto (cliente ou contrato)
            const searchMatch =
                fatura.cliente?.nomeFantasia?.toLowerCase().includes(faturaSearch.toLowerCase()) ||
                fatura.contrato?.descritivo?.toLowerCase().includes(faturaSearch.toLowerCase()) ||
                false;

            // Filtro por status
            let statusMatch = true;
            if (statusSearch === 'pendentes') {
                statusMatch = !fatura.dataPagamento;
            } else if (statusSearch === 'pagas') {
                statusMatch = !!fatura.dataPagamento;
            }

            // Filtro por data
            let dataMatch = true;
            if (dataInicioSearch && dataFinalSearch) {
                const dataInicio = new Date(dataInicioSearch.split('/').reverse().join('-'));
                const dataFinal = new Date(dataFinalSearch.split('/').reverse().join('-'));
                const dataVencimento = fatura.dataVencimento ? new Date(fatura.dataVencimento) : null;

                if (dataVencimento) {
                    dataMatch = dataVencimento >= dataInicio && dataVencimento <= dataFinal;
                }
            }

            return searchMatch && statusMatch && dataMatch;
        });

    return (
        <>
            <div className="my-4">
                <h2 className="text-2xl font-semibold tracking-tight">Faturas</h2>
                <p className="text-sm text-muted-foreground">Aqui você pode ver e gerenciar todas as faturas geradas.</p>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center justify-center gap-1">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Buscar contrato..." className="pl-8" value={faturaSearch} onChange={(e) => setFaturaSearch(e.target.value)} />
                    </div>
                    <Select value={statusSearch} onValueChange={setStatusSearch}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecione um Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todas">Todas</SelectItem>
                            <SelectItem value="pendentes">Pendentes</SelectItem>
                            <SelectItem value="pagas">Pagas</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input placeholder="Data Início" type="text" className="w-auto" value={dataInicioSearch} onChange={(e) => setDataInicioSearch(e.target.value)} ref={dataInicioSearchRef} />
                    <Input placeholder="Data Final" type="text" className="w-auto" value={dataFinalSearch} onChange={(e) => setDataFinalSearch(e.target.value)} ref={dataFimSearchRef} />
                </div>
                <div className="flex items-center justify-center gap-1">
                    <Button variant={"secondary"} onClick={() => { handlePrintRelatorio(filteredFaturas) }}>
                        <ChartGantt className="mr-2 h-4 w-4" />
                        Imprimir Relatório
                    </Button>

                    <Button variant={"default"} onClick={() => {
                        handlePrintAllFaturas(filteredFaturas)
                    }}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Faturas
                    </Button>
                </div>
            </div>

            <ScrollArea className="h-[calc(100vh-18rem)] max-h-[calc(100vh-18rem)] mt-2">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Data Emissão</TableHead>
                                <TableHead>Data Vencimento</TableHead>
                                <TableHead>Data Pagamento</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredFaturas.length > 0 ? (
                                filteredFaturas
                                    .sort((a, b) => {
                                        const nomeFantasiaA = a.cliente?.nomeFantasia?.toLowerCase() || '';
                                        const nomeFantasiaB = b.cliente?.nomeFantasia?.toLowerCase() || '';
                                        return nomeFantasiaA.localeCompare(nomeFantasiaB);
                                    })
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((fatura) => (
                                        <TableRow key={fatura.id}>
                                            <TableCell className="font-medium">{fatura.cliente?.nomeFantasia}</TableCell>
                                            <TableCell>{fatura.dataEmissao ? new Date(fatura.dataEmissao).toLocaleDateString('pt-BR') : '-'}</TableCell>
                                            <TableCell>{fatura.dataVencimento ? new Date(fatura.dataVencimento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                                            <TableCell>{fatura.dataPagamento ? new Date(fatura.dataPagamento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                                            <TableCell>{fatura.valor ? `${parseFloat(fatura.valor.toString()).toLocaleString('pt-br', { currency: 'BRL', style: 'currency' })}` : '-'}</TableCell>
                                            <TableCell>{fatura.dataPagamento ? 'Paga' : 'Pendente'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end space-x-2">
                                                    {!fatura.dataPagamento && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={() => {
                                                                            setSelectedFatura(fatura)
                                                                            setDataPagamento(new Date().toLocaleDateString('pt-BR'))
                                                                            setMetodoPagamento(formasPagamento[0]?.id.toString() || "")
                                                                            setIsDialogOpen(true)
                                                                        }}
                                                                    >
                                                                        <BadgeDollarSign className="h-4 w-4" />
                                                                        <span className="sr-only">Pagar Fatura</span>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Pagar Fatura</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => {
                                                                        handlePrintAllFaturas([fatura])
                                                                    }}
                                                                >
                                                                    <Printer className="h-4 w-4" />
                                                                    <span className="sr-only">Imprimir</span>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Imprimir Fatura Individual</p>
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
                                                                    <div className="text-destructive font-semibold mb-2">ATENÇÃO! Esta é uma ação irreversível!</div>
                                                                    <p>Excluir este fatura afetará <strong>permanentemente</strong> os registros do sistema.</p>
                                                                    <p className="mt-2">Após a exclusão, estes dados não poderão ser recuperados.</p>
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => {
                                                                    handleDelete(fatura.id.toString())
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
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        Nenhuma fatura encontrada.
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
                                Página {currentPage} de {Math.max(1, Math.ceil(filteredFaturas.length / itemsPerPage))}
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
                                        Math.min(Math.ceil(filteredFaturas.length / itemsPerPage), prev + 1)
                                    )}
                                    aria-disabled={currentPage === Math.ceil(filteredFaturas.length / itemsPerPage)}
                                    className={currentPage === Math.ceil(filteredFaturas.length / itemsPerPage) ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>
                        </div>
                    </PaginationContent>
                </Pagination>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar pagamento de fatura</DialogTitle>
                    </DialogHeader>
                    <form action="" className="flex flex-col">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs text-muted-foreground">Data de pagamento</Label>
                                <Input placeholder="Data de pagamento" type="text" ref={dataPagamentoRef} value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Forma de Pagamento</Label>
                                <Select onValueChange={(value) => setMetodoPagamento(value)} value={metodoPagamento}>
                                    <SelectTrigger>
                                        <SelectValue placeholder='Forma de Pagamento'></SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {formasPagamento.map((formas) => (
                                            <SelectItem key={formas.id} value={formas.id.toString()}>{formas.formaPagamento}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <DialogClose asChild>
                                <Button variant={"outline"}>Cancelar</Button>
                            </DialogClose>
                            <Button onClick={handlePayment}>Salvar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}