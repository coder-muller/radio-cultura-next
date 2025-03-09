'use client'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getLocalStorage } from "@/lib/localStorage"
import { zodResolver } from "@hookform/resolvers/zod"
import { Edit, Loader2, Plus, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { sendDelete, sendGet, sendPost, sendPut } from "../functions"
import { FormaPagamento } from "../types"

const formaPagamentoSchema = z.object({
    formaPagamento: z.string().min(1, { message: 'A forma de Pagamento não pode ser nula!' })
})

export default function FormaPagamentos() {
    const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([])
    const [formaPagamentoSearch, setFormaPagamentoSearch] = useState<string>('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedFormaPagamento, setSelectedFormaPagamento] = useState<FormaPagamento | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 7

    const formFormaPagamento = useForm<z.infer<typeof formaPagamentoSchema>>({
        resolver: zodResolver(formaPagamentoSchema)
    })

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
    }, [formaPagamentoSearch])

    async function fetchData() {
        const token = getLocalStorage('token')
        if (!token) return

        try {
            const formasPagamento: FormaPagamento[] = await sendGet('/forma-pagamento/' + token)
            setFormasPagamento(formasPagamento)
        } catch (error) {
            console.error("Erro ao buscar dados da API:", error);
            toast.error("Erro ao buscar dados.");
        }
    }

    async function onSubmit(data: z.infer<typeof formaPagamentoSchema>) {
        const token = getLocalStorage('token')
        if (!token) return

        setIsLoading(true)
        if (selectedFormaPagamento) {
            try {
                await sendPut('/forma-pagamento/' + selectedFormaPagamento.id, { ...data, chave: token })
                fetchData()
                setIsDialogOpen(false)
                setIsLoading(false)
                toast.success("Forma de pagamento atualizada com sucesso!")
            } catch (error) {
                console.error("Erro ao atualizar dados da API:", error);
                toast.error("Erro ao atualizar dados.");
                setIsLoading(false)
            }
        } else {
            try {
                await sendPost('/forma-pagamento', { ...data, chave: token })
                fetchData()
                setIsDialogOpen(false)
                setIsLoading(false)
                toast.success("Forma de pagamento cadastrada com sucesso!")
            } catch (error) {
                console.error("Erro ao cadastrar dados da API:", error);
                toast.error("Erro ao cadastrar dados.");
                setIsLoading(false)
            }
        }
    }

    async function handleDelete(id: string) {
        try {
            await sendDelete('/forma-pagamento/' + id)
            fetchData()
            toast.success("Forma de pagamento excluída com sucesso!")
        } catch (error) {
            console.error("Erro ao excluir dados da API:", error);
            toast.error("Erro ao excluir dados.");
        }
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Buscar forma de pagamento..." className="pl-8" value={formaPagamentoSearch} onChange={(e) => setFormaPagamentoSearch(e.target.value)} />
                </div>
                <Button onClick={() => {
                    formFormaPagamento.reset({
                        formaPagamento: ''
                    })
                    setSelectedFormaPagamento(null)
                    setIsDialogOpen(true)
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Forma de Pagamento
                </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-22rem)] max-h-[calc(100vh-22rem)] mt-2">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Forma de Pagamento</TableHead>
                                <TableHead className="w-[100px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {formasPagamento.length > 0 && formasPagamento
                                .filter((formaPagamento) => {
                                    return formaPagamento.formaPagamento?.toLowerCase().includes(formaPagamentoSearch.toLowerCase()) ?? false
                                })
                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                .map((formaPagamento) => (
                                    <TableRow key={formaPagamento.id}>
                                        <TableCell className="font-medium">{formaPagamento.formaPagamento}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center space-x-2">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                                                setSelectedFormaPagamento(formaPagamento)
                                                                formFormaPagamento.reset({
                                                                    formaPagamento: formaPagamento.formaPagamento ? formaPagamento.formaPagamento : ''
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
                                                                Esta ação não pode ser desfeita. Isso excluirá permanentemente
                                                                a forma de pagamento do sistema.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => {
                                                                handleDelete(formaPagamento.id.toString())
                                                            }}>Continuar</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </div>
            </ScrollArea>

            <div className="flex items-center justify-center space-x-2 w-full">
                <Pagination>
                    <PaginationContent className="flex items-center justify-between w-full">
                        <PaginationItem>
                            <span className="flex h-9 items-center justify-center px-3">
                                Página {currentPage} de {Math.max(1, Math.ceil(formasPagamento.filter(formaPagamento =>
                                    formaPagamento.formaPagamento?.toLowerCase().includes(formaPagamentoSearch.toLowerCase()) ?? false
                                ).length / itemsPerPage))}
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
                                        Math.min(Math.ceil(formasPagamento.filter(formaPagamento =>
                                            formaPagamento.formaPagamento?.toLowerCase().includes(formaPagamentoSearch.toLowerCase()) ?? false
                                        ).length / itemsPerPage), prev + 1)
                                    )}
                                    aria-disabled={currentPage === Math.ceil(formasPagamento.filter(formaPagamento =>
                                        formaPagamento.formaPagamento?.toLowerCase().includes(formaPagamentoSearch.toLowerCase()) ?? false
                                    ).length / itemsPerPage)}
                                    className={currentPage === Math.ceil(formasPagamento.filter(formaPagamento =>
                                        formaPagamento.formaPagamento?.toLowerCase().includes(formaPagamentoSearch.toLowerCase()) ?? false
                                    ).length / itemsPerPage) ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>
                        </div>
                    </PaginationContent>
                </Pagination>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedFormaPagamento ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}</DialogTitle>
                        <DialogDescription>{selectedFormaPagamento ? 'Edite os dados de uma forma de pagamento existente.' : 'Cadastre uma nova forma de pagamento.'}</DialogDescription>
                    </DialogHeader>
                    <Form {...formFormaPagamento}>
                        <form onSubmit={formFormaPagamento.handleSubmit(onSubmit)} className="space-y-1.5">
                            <FormField
                                control={formFormaPagamento.control}
                                name="formaPagamento"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Forma de Pagamento</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Nome da forma de pagamento" autoComplete="off" />
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
                                <DialogClose asChild>
                                    <Button type="reset" variant={"outline"}>Fechar</Button>
                                </DialogClose>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    )
}