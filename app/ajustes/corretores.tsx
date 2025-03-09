'use client'

import { AlertDialogHeader, AlertDialogFooter } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "@/components/ui/pagination"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Edit, Loader2, Plus, Search, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { formatPhone, parseDate, sendDelete, sendGet, sendPost, sendPut } from "../functions"
import { toast } from "sonner"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { getLocalStorage } from "@/lib/localStorage"
import IMask from "imask"
import { Corretor } from "../types"

const corretorSchema = z.object({
    nome: z.string().min(1, { message: "Nome é obrigatório" }),
    email: z.string().optional(),
    endereco: z.string().optional(),
    fone: z.string().optional(),
    dataAdmissao: z.string().optional(),
})

export default function Corretores() {

    const formCorretor = useForm({
        resolver: zodResolver(corretorSchema),
    })

    const [corretores, setCorretores] = useState<Corretor[]>([])
    const [selectedCorretor, setSelectedCorretor] = useState<Corretor | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [corretorSearch, setCorretorSearch] = useState('')
    const dataAdmissaoRef = useRef<HTMLInputElement>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 7

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (isDialogOpen) {
            const applyMasks = () => {

                if (dataAdmissaoRef.current) {
                    IMask(dataAdmissaoRef.current, {
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

        if (!token) return

        try {
            const corretores: Corretor[] = await sendGet('/corretores/' + token)
            setCorretores(corretores)
        } catch (error) {
            console.error("Erro ao buscar dados da API:", error);
            toast.error("Erro ao buscar dados.");
        }
    }

    async function onSubmit(data: z.infer<typeof corretorSchema>) {
        const token = getLocalStorage('token')
        if (!token) return

        const parsedDate = data.dataAdmissao ? parseDate(data.dataAdmissao) : ''

        if (!parsedDate && data.dataAdmissao) return

        setIsLoading(true)
        if (selectedCorretor) {
            try {
                await sendPut('/corretores/' + selectedCorretor.id, { ...data, dataAdmissao: data.dataAdmissao && parsedDate ? new Date(parsedDate) : '', chave: token })
                fetchData()
                setIsDialogOpen(false)
                setIsLoading(false)
                toast.success("Corretor atualizado com sucesso!")
            } catch (error) {
                console.error("Erro ao atualizar dados da API:", error);
                toast.error("Erro ao atualizar dados.");
            }
        } else {
            try {
                await sendPost('/corretores', { ...data, dataAdmissao: data.dataAdmissao && parsedDate ? new Date(parsedDate) : '', chave: token })
                fetchData()
                setIsDialogOpen(false)
                setIsLoading(false)
                toast.success("Corretor cadastrado com sucesso!")
            } catch (error) {
                console.error("Erro ao cadastrar dados da API:", error);
                toast.error("Erro ao cadastrar dados.");
            }
        }
    }

    async function handleDelete(id: string) {
        try {
            await sendDelete('/corretores/' + id)
            fetchData()
            toast.success("Corretor excluído com sucesso!")
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
                    <Input type="search" placeholder="Buscar corretor..." className="pl-8" value={corretorSearch} onChange={(e) => setCorretorSearch(e.target.value)} />
                </div>
                <Button onClick={() => {
                    formCorretor.reset({
                        nome: '',
                        email: '',
                        endereco: '',
                        fone: '',
                        dataAdmissao: '',
                    })
                    setSelectedCorretor(null)
                    setIsDialogOpen(true)
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Corretor
                </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-22rem)] max-h-[calc(100vh-22rem)] mt-2">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead>Data Admissão</TableHead>
                                <TableHead className="w-[100px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {corretores.length > 1 && corretores
                                .filter((corretor) => {
                                    return corretor.nome?.toLowerCase().includes(corretorSearch.toLowerCase()) ?? false
                                })
                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                .map((corretor) => (
                                    <TableRow key={corretor.id}>
                                        <TableCell className="font-medium">{corretor.nome}</TableCell>
                                        <TableCell>{corretor.email}</TableCell>
                                        <TableCell>{corretor.fone ? formatPhone(corretor.fone) : ''}</TableCell>
                                        <TableCell>{corretor.dataAdmissao ? new Date(corretor.dataAdmissao).toLocaleDateString('pt-br') : ''}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center space-x-2">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                                                setSelectedCorretor(corretor)
                                                                formCorretor.reset({
                                                                    nome: corretor.nome ? corretor.nome : '',
                                                                    email: corretor.email ? corretor.email : '',
                                                                    endereco: corretor.endereco ? corretor.endereco : '',
                                                                    fone: corretor.fone ? corretor.fone : '',
                                                                    dataAdmissao: corretor.dataAdmissao ? new Date(corretor.dataAdmissao).toLocaleDateString('pt-br') : '',
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
                                                                o corretor do sistema.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => {
                                                                handleDelete(corretor.id.toString())
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
                                Página {currentPage} de {Math.max(1, Math.ceil(corretores.filter(corretor =>
                                    corretor.nome?.toLowerCase().includes(corretorSearch.toLowerCase()) ?? false
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
                                        Math.min(Math.ceil(corretores.filter(corretor =>
                                            corretor.nome?.toLowerCase().includes(corretorSearch.toLowerCase()) ?? false
                                        ).length / itemsPerPage), prev + 1)
                                    )}
                                    aria-disabled={currentPage === Math.ceil(corretores.filter(corretor =>
                                        corretor.nome?.toLowerCase().includes(corretorSearch.toLowerCase()) ?? false
                                    ).length / itemsPerPage)}
                                    className={currentPage === Math.ceil(corretores.filter(corretor =>
                                        corretor.nome?.toLowerCase().includes(corretorSearch.toLowerCase()) ?? false
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
                        <DialogTitle>{selectedCorretor ? 'Editar Corretor' : 'Novo Corretor'}</DialogTitle>
                        <DialogDescription>{selectedCorretor ? 'Edite os dados de um corretor existente.' : 'Cadastre um novo corretor.'}</DialogDescription>
                    </DialogHeader>
                    <Form {...formCorretor}>
                        <form onSubmit={formCorretor.handleSubmit(onSubmit)} className="space-y-1.5">
                            <FormField
                                control={formCorretor.control}
                                name="nome"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Nome" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={formCorretor.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Email" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={formCorretor.control}
                                name="endereco"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Endereço</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Endereço" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <FormField
                                    control={formCorretor.control}
                                    name="fone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fone</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Fone" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formCorretor.control}
                                    name="dataAdmissao"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data Admissão</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Data Admissão" ref={dataAdmissaoRef} />
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
            </Dialog >
        </>
    )
}