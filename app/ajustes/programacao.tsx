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
import IMask from "imask"
import { Edit, Loader2, Plus, Search, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { sendDelete, sendGet, sendPost, sendPut } from "../functions"
import { Programa } from "../types"

const programaSchema = z.object({
    programa: z.string().min(1, { message: 'Programa é obrigatório' }),
    horaInicio: z.string().optional(),
    horaFim: z.string().optional(),
    apresentador: z.string().optional(),
    diasApresentacao: z.string().optional(),
    valorPatrocinio: z.string().optional().refine((value) => !value || !value.includes('.'), {
        message: 'Use vírgula ao invés de ponto.'
    }),
    estilo: z.string().optional()
})

export default function Programacao() {

    const formPrograma = useForm<z.infer<typeof programaSchema>>({
        resolver: zodResolver(programaSchema)
    })

    const horaInicioRef = useRef(null)
    const horaFimRef = useRef(null)

    const [programas, setProgramas] = useState<Programa[]>([])
    const [programaSearch, setProgramaSearch] = useState<string>("")
    const [selectedPrograma, setSelectedPrograma] = useState<Programa | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const itemsPerPage = 7

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
    }, [programaSearch])

    useEffect(() => {
        if (isDialogOpen) {
            const applyMasks = () => {
                if (horaInicioRef.current) {
                    IMask(horaInicioRef.current, {
                        mask: '00:00',
                    });
                }
                if (horaFimRef.current) {
                    IMask(horaFimRef.current, {
                        mask: '00:00',
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
            const programas: Programa[] = await sendGet('/programacao/' + token)
            setProgramas(programas)
        } catch (error) {
            console.error("Erro ao buscar dados da API:", error);
            toast.error("Erro ao buscar dados.");
        }
    }

    async function onSubmit(data: z.infer<typeof programaSchema>) {
        const token = getLocalStorage('token')
        if (!token) return

        setIsLoading(true)
        if (selectedPrograma) {
            try {
                await sendPut('/programacao/' + selectedPrograma.id, {
                    ...data,
                    valorPatrocinio: data.valorPatrocinio ? parseFloat(data.valorPatrocinio.replace(',', '.')) : null,
                    chave: token
                })
                fetchData()
                setIsDialogOpen(false)
                setIsLoading(false)
                toast.success("Programa atualizado com sucesso!")
            } catch (error) {
                console.error("Erro ao atualizar dados da API:", error);
                toast.error("Erro ao atualizar dados.");
                setIsLoading(false)
            }
        } else {
            try {
                await sendPost('/programacao', {
                    ...data,
                    valorPatrocinio: data.valorPatrocinio ? parseFloat(data.valorPatrocinio) : 0,
                    chave: token
                })
                fetchData()
                setIsDialogOpen(false)
                setIsLoading(false)
                toast.success("Programa cadastrado com sucesso!")
            } catch (error) {
                console.error("Erro ao cadastrar dados da API:", error);
                toast.error("Erro ao cadastrar dados.");
                setIsLoading(false)
            }
        }
    }

    async function handleDelete(id: string) {
        try {
            await sendDelete('/programacao/' + id)
            fetchData()
            toast.success("Programa excluído com sucesso!")
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
                    <Input type="search" placeholder="Buscar programa..." className="pl-8" value={programaSearch} onChange={(e) => setProgramaSearch(e.target.value)} />
                </div>
                <Button onClick={() => {
                    formPrograma.reset({
                        programa: "",
                        horaInicio: "",
                        horaFim: "",
                        apresentador: "",
                        diasApresentacao: "",
                        valorPatrocinio: "",
                        estilo: ""
                    })
                    setSelectedPrograma(null)
                    setIsDialogOpen(true)
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Programa
                </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-22rem)] max-h-[calc(100vh-22rem)] mt-2">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Programa</TableHead>
                                <TableHead>Horário</TableHead>
                                <TableHead>Apresentador</TableHead>
                                <TableHead>Dias</TableHead>
                                <TableHead className="w-[100px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {programas.length > 0 && programas
                                .filter((programa) => {
                                    return programa.programa?.toLowerCase().includes(programaSearch.toLowerCase()) ?? false
                                })
                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                .map((programa) => (
                                    <TableRow key={programa.id}>
                                        <TableCell className="font-medium">{programa.programa}</TableCell>
                                        <TableCell>{programa.horaInicio} - {programa.horaFim}</TableCell>
                                        <TableCell>{programa.apresentador}</TableCell>
                                        <TableCell>{programa.diasApresentacao}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center space-x-2">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                                                setSelectedPrograma(programa)
                                                                formPrograma.reset({
                                                                    programa: programa.programa ? programa.programa : '',
                                                                    horaInicio: programa.horaInicio ? programa.horaInicio : '',
                                                                    horaFim: programa.horaFim ? programa.horaFim : '',
                                                                    apresentador: programa.apresentador ? programa.apresentador : '',
                                                                    diasApresentacao: programa.diasApresentacao ? programa.diasApresentacao : '',
                                                                    valorPatrocinio: programa.valorPatrocinio ? parseFloat(programa.valorPatrocinio.toString()).toFixed(2).toString().replace('.', ',') : '',
                                                                    estilo: programa.estilo ? programa.estilo : ''
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
                                                                o programa do sistema.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => {
                                                                handleDelete(programa.id.toString())
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
                                Página {currentPage} de {Math.max(1, Math.ceil(programas.filter(programa =>
                                    programa.programa?.toLowerCase().includes(programaSearch.toLowerCase()) ?? false
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
                                        Math.min(Math.ceil(programas.filter(programa =>
                                            programa.programa?.toLowerCase().includes(programaSearch.toLowerCase()) ?? false
                                        ).length / itemsPerPage), prev + 1)
                                    )}
                                    aria-disabled={currentPage === Math.ceil(programas.filter(programa =>
                                        programa.programa?.toLowerCase().includes(programaSearch.toLowerCase()) ?? false
                                    ).length / itemsPerPage)}
                                    className={currentPage === Math.ceil(programas.filter(programa =>
                                        programa.programa?.toLowerCase().includes(programaSearch.toLowerCase()) ?? false
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
                        <DialogTitle>{selectedPrograma ? 'Editar Programa' : 'Novo Programa'}</DialogTitle>
                        <DialogDescription>{selectedPrograma ? 'Edite os dados de um programa existente.' : 'Cadastre um novo programa.'}</DialogDescription>
                    </DialogHeader>
                    <Form {...formPrograma}>
                        <form onSubmit={formPrograma.handleSubmit(onSubmit)} className="space-y-1.5">
                            <FormField
                                control={formPrograma.control}
                                name="programa"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Programa</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Nome do programa" autoComplete="off" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={formPrograma.control}
                                name="apresentador"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Apresentador</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Nome do apresentador" autoComplete="off" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <FormField
                                    control={formPrograma.control}
                                    name="horaInicio"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hora Início</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Hora de início" ref={horaInicioRef} autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formPrograma.control}
                                    name="horaFim"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hora Fim</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Hora de fim" ref={horaFimRef} autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={formPrograma.control}
                                name="diasApresentacao"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dias de Apresentação</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Dias de apresentação" autoComplete="off" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <FormField
                                    control={formPrograma.control}
                                    name="valorPatrocinio"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valor Patrocínio</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Valor do patrocínio" type="text" autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formPrograma.control}
                                    name="estilo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estilo</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Estilo do programa" autoComplete="off" />
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
            </Dialog>
        </>
    )
}