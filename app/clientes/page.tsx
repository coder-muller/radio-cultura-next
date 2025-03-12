'use client'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getLocalStorage } from "@/lib/localStorage";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogClose } from "@radix-ui/react-dialog";
import IMask from 'imask';
import { Edit, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { formatPhone, sendDelete, sendGet, sendPost, sendPut } from "../functions";
import { Cliente } from "../types";

const formSchema = z.object({
    razaoSocial: z.string().optional(),
    nomeFantasia: z.string().min(1, 'Nome Fantasia é obrigatório'),
    contato: z.string().optional(),
    cpf: z.string().optional(),
    cnpj: z.string().optional(),
    endereco: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    cep: z.string().optional(),
    inscMunicipal: z.string().optional(),
    atividade: z.string().optional(),
    email: z.string().optional(),
    fone: z.string().optional(),
})

export default function Clientes() {
    const [isFetching, setIsFetching] = useState(false)
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [clienteSearch, setClienteSearch] = useState<string>('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8
    const [sortColumn, setSortColumn] = useState<string | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)

    const cpfRef = useRef<HTMLInputElement>(null)
    const cnpjRef = useRef<HTMLInputElement>(null)
    const cepRef = useRef<HTMLInputElement>(null)

    const formCliente = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    })

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (isDialogOpen) {
            const applyMasks = () => {
                if (cpfRef.current) {
                    IMask(cpfRef.current, {
                        mask: '000.000.000-00',
                    })
                }

                if (cnpjRef.current) {
                    IMask(cnpjRef.current, {
                        mask: '00.000.000/0000-00',
                    })
                }

                if (cepRef.current) {
                    IMask(cepRef.current, {
                        mask: '00000-000',
                    })
                }
            }
            const timer = setTimeout(applyMasks, 100);
            return () => clearTimeout(timer);
        }
    }, [isDialogOpen])

    useEffect(() => {
        setCurrentPage(1)
    }, [clienteSearch])

    async function fetchData() {
        setIsFetching(true)
        const token = getLocalStorage('token')

        if (!token) {
            window.location.href = '/'
            setIsFetching(false)
            return
        }

        try {
            const clientes: Cliente[] = await sendGet('/clientes/' + token)
            setClientes(clientes)
        } catch (error) {
            console.error(error)
        } finally {
            setIsFetching(false)
        }
    }

    async function onSubmit(data: z.infer<typeof formSchema>) {
        setIsLoading(true)

        const token = getLocalStorage('token')
        if (!token) return

        if (selectedCliente) {
            try {
                await sendPut('/clientes/' + selectedCliente.id, { ...data, chave: token })
                toast.success('Cliente atualizado com sucesso!')
                setIsDialogOpen(false)
                setIsLoading(false)
                formCliente.reset()
                fetchData()
            } catch (error) {
                console.error(error)
                toast.error('Erro ao atualizar cliente!')
                setIsLoading(false)
            }
        } else {

            let hasDuplicate = false
            for (const cliente of clientes) {
                if (cliente.cnpj === data.cnpj && data.cnpj.length > 1) {
                    toast.error('CNPJ já cadastrado!')
                    setIsLoading(false)
                    hasDuplicate = true
                    break
                }

                if (cliente.cpf === data.cpf && data.cpf.length > 1) {
                    toast.error('CPF já cadastrado!')
                    setIsLoading(false)
                    hasDuplicate = true
                    break
                }
            }

            if (hasDuplicate) return

            try {
                await sendPost('/clientes', { ...data, chave: token })
                toast.success('Cliente cadastrado com sucesso!')
                setIsDialogOpen(false)
                setIsLoading(false)
                formCliente.reset()
                fetchData()
            } catch (error) {
                console.error(error)
                toast.error('Erro ao cadastrar cliente!')
                setIsLoading(false)
            }
        }
    }

    async function handleDelete(id: string) {
        try {
            await sendDelete('/clientes/' + id)
            toast.success('Cliente excluído com sucesso!')
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao excluir cliente!')
        }
    }

    // Função para alternar ordenação
    const toggleSort = (column: string) => {
        if (sortColumn === column) {
            // Se a coluna já está selecionada, alterna a direção
            if (sortDirection === 'asc') {
                setSortDirection('desc')
            } else if (sortDirection === 'desc') {
                // Se já está em ordem descendente, remove a ordenação
                setSortColumn(null)
                setSortDirection(null)
            } else {
                // Se não tiver direção, começa com ascendente
                setSortDirection('asc')
            }
        } else {
            // Se for uma nova coluna, define a coluna e direção ascendente
            setSortColumn(column)
            setSortDirection('asc')
        }
    }

    // Função para ordenar os clientes
    const sortedClientes = () => {
        // Se não houver coluna de ordenação, retorna a lista original filtrada
        if (!sortColumn || !sortDirection) {
            return clientes
                .filter((cliente) => {
                    return cliente.nomeFantasia?.toLowerCase().includes(clienteSearch.toLowerCase()) ?? false
                })
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        }

        // Cria uma cópia da lista para não modificar a original
        return [...clientes]
            .filter((cliente) => {
                return cliente.nomeFantasia?.toLowerCase().includes(clienteSearch.toLowerCase()) ?? false
            })
            .sort((a, b) => {
                // Verifica a coluna selecionada e ordena de acordo
                if (sortColumn === 'nomeFantasia') {
                    const valA = a.nomeFantasia?.toLowerCase() || '';
                    const valB = b.nomeFantasia?.toLowerCase() || '';
                    return sortDirection === 'asc' 
                        ? valA.localeCompare(valB)
                        : valB.localeCompare(valA);
                }
                
                if (sortColumn === 'atividade') {
                    const valA = a.atividade?.toLowerCase() || '';
                    const valB = b.atividade?.toLowerCase() || '';
                    return sortDirection === 'asc'
                        ? valA.localeCompare(valB)
                        : valB.localeCompare(valA);
                }
                
                if (sortColumn === 'documento') {
                    const valA = a.cnpj || a.cpf || '';
                    const valB = b.cnpj || b.cpf || '';
                    return sortDirection === 'asc'
                        ? valA.localeCompare(valB)
                        : valB.localeCompare(valA);
                }
                
                if (sortColumn === 'email') {
                    const valA = a.email?.toLowerCase() || '';
                    const valB = b.email?.toLowerCase() || '';
                    return sortDirection === 'asc'
                        ? valA.localeCompare(valB)
                        : valB.localeCompare(valA);
                }
                
                if (sortColumn === 'fone') {
                    const valA = a.fone || '';
                    const valB = b.fone || '';
                    return sortDirection === 'asc'
                        ? valA.localeCompare(valB)
                        : valB.localeCompare(valA);
                }
                
                return 0;
            })
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }

    return (
        <>
            <div className="my-4">
                <h2 className="text-2xl font-semibold tracking-tight">Clientes</h2>
                <p className="text-sm text-muted-foreground">Aqui você pode ver e gerenciar todos os clientes cadastrados.</p>
            </div>

            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Buscar cliente..." className="pl-8" value={clienteSearch} onChange={(e) => setClienteSearch(e.target.value)} />
                </div>
                <Button onClick={() => {
                    formCliente.reset({
                        razaoSocial: '',
                        nomeFantasia: '',
                        contato: '',
                        cpf: '',
                        cnpj: '',
                        endereco: '',
                        numero: '',
                        bairro: '',
                        cidade: '',
                        estado: '',
                        cep: '',
                        inscMunicipal: '',
                        atividade: '',
                        email: '',
                        fone: '',
                    })
                    setSelectedCliente(null)
                    setIsDialogOpen(true)
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Cliente
                </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-18rem)] max-h-[calc(100vh-18rem)] mt-2">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortColumn === 'nomeFantasia' ? sortDirection : null}
                                    onClick={() => toggleSort('nomeFantasia')}
                                >
                                    Nome Fantasia
                                </TableHead>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortColumn === 'atividade' ? sortDirection : null}
                                    onClick={() => toggleSort('atividade')}
                                >
                                    Atividade
                                </TableHead>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortColumn === 'documento' ? sortDirection : null}
                                    onClick={() => toggleSort('documento')}
                                >
                                    CNPJ / CPF
                                </TableHead>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortColumn === 'email' ? sortDirection : null}
                                    onClick={() => toggleSort('email')}
                                >
                                    Email
                                </TableHead>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortColumn === 'fone' ? sortDirection : null}
                                    onClick={() => toggleSort('fone')}
                                >
                                    Telefone
                                </TableHead>
                                <TableHead className="w-[100px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isFetching ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="animate-spin" />
                                            Carregando...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clientes.length > 1 && sortedClientes().map((cliente) => (
                                    <TableRow key={cliente.id}>
                                        <TableCell className="font-medium">{cliente.nomeFantasia}</TableCell>
                                        <TableCell>{cliente.atividade}</TableCell>
                                        <TableCell>{cliente.cnpj ? cliente.cnpj : cliente.cpf ? cliente.cpf : ''}</TableCell>
                                        <TableCell>{cliente.email}</TableCell>
                                        <TableCell>{formatPhone(cliente.fone)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center space-x-2">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                                                setSelectedCliente(cliente)
                                                                formCliente.reset({
                                                                    razaoSocial: cliente.razaoSocial ? cliente.nomeFantasia : '',
                                                                    nomeFantasia: cliente.nomeFantasia,
                                                                    contato: cliente.contato ? cliente.contato : '',
                                                                    cpf: cliente.cpf ? cliente.cpf : '',
                                                                    cnpj: cliente.cnpj ? cliente.cnpj : '',
                                                                    endereco: cliente.endereco ? cliente.endereco : '',
                                                                    numero: cliente.numero ? cliente.numero : '',
                                                                    bairro: cliente.bairro ? cliente.bairro : '',
                                                                    cidade: cliente.cidade ? cliente.cidade : '',
                                                                    estado: cliente.estado ? cliente.estado : '',
                                                                    cep: cliente.cep ? cliente.cep : '',
                                                                    inscMunicipal: cliente.inscMunicipal ? cliente.inscMunicipal : '',
                                                                    atividade: cliente.atividade ? cliente.atividade : '',
                                                                    email: cliente.email ? cliente.email : '',
                                                                    fone: cliente.fone ? cliente.fone : '',
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
                                                                <div className="text-destructive font-semibold mb-2">ATENÇÃO! Esta é uma ação irreversível!</div>
                                                                <p>Excluir este cliente afetará <strong>permanentemente</strong>:</p>
                                                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                                                    <li>Todos os contratos vinculados a este cliente</li>
                                                                    <li>Todas as faturas (incluindo as já pagas)</li>
                                                                    <li>Comissões geradas por este cliente</li>
                                                                </ul>
                                                                <p className="mt-2">Após a exclusão, estes dados não poderão ser recuperados.</p>
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => {
                                                                handleDelete(cliente.id.toString())
                                                            }}>Continuar</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )))}
                        </TableBody>
                    </Table>
                </div>
            </ScrollArea>

            <div className="flex items-center justify-center space-x-2 w-full">
                <Pagination>
                    <PaginationContent className="flex items-center justify-between w-full">
                        <PaginationItem>
                            <span className="flex h-9 items-center justify-center px-3">
                                Página {currentPage} de {Math.max(1, Math.ceil(clientes.filter(cliente =>
                                    cliente.nomeFantasia?.toLowerCase().includes(clienteSearch.toLowerCase()) ?? false
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
                                        Math.min(Math.ceil(clientes.filter(cliente =>
                                            cliente.nomeFantasia?.toLowerCase().includes(clienteSearch.toLowerCase()) ?? false
                                        ).length / itemsPerPage), prev + 1)
                                    )}
                                    aria-disabled={currentPage === Math.ceil(clientes.filter(cliente =>
                                        cliente.nomeFantasia?.toLowerCase().includes(clienteSearch.toLowerCase()) ?? false
                                    ).length / itemsPerPage)}
                                    className={currentPage === Math.ceil(clientes.filter(cliente =>
                                        cliente.nomeFantasia?.toLowerCase().includes(clienteSearch.toLowerCase()) ?? false
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
                        <DialogTitle>{selectedCliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
                        <DialogDescription>{selectedCliente ? 'Edite os dados de um cliente existente.' : 'Cadastre um novo cliente.'}</DialogDescription>
                    </DialogHeader>
                    <Form {...formCliente}>
                        <form onSubmit={formCliente.handleSubmit(onSubmit)} className="space-y-1.5">
                            <FormField
                                control={formCliente.control}
                                name="razaoSocial"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Razão Social</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Razão Social" autoComplete="off" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={formCliente.control}
                                name="nomeFantasia"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome Fantasia</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Nome Fantasia" autoComplete="off" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <FormField
                                    control={formCliente.control}
                                    name="contato"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contato</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Contato" autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formCliente.control}
                                    name="inscMunicipal"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Inscrição Municipal</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Inscrição Municipal" autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <FormField
                                    control={formCliente.control}
                                    name="cpf"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CPF</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="CPF" ref={cpfRef} autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formCliente.control}
                                    name="cnpj"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CNPJ</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="CNPJ" ref={cnpjRef} autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                                <div className="col-span-4">
                                    <FormField
                                        control={formCliente.control}
                                        name="endereco"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Endereço</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Endereço" autoComplete="off" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={formCliente.control}
                                    name="numero"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>N°</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="N°" autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <FormField
                                    control={formCliente.control}
                                    name="bairro"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bairro</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Bairro" autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formCliente.control}
                                    name="cidade"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cidade</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Cidade" autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-6 gap-2">
                                <div className="col-span-1">
                                    <FormField
                                        control={formCliente.control}
                                        name="estado"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Estado</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Estado" autoComplete="off" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <FormField
                                        control={formCliente.control}
                                        name="cep"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>CEP</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="CEP" ref={cepRef} autoComplete="off" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-3">
                                    <FormField
                                        control={formCliente.control}
                                        name="fone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fone</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Fone" autoComplete="off" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                            <FormField
                                control={formCliente.control}
                                name="atividade"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Atividade</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Atividade" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={formCliente.control}
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