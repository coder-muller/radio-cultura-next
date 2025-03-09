'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getLocalStorage } from "@/lib/localStorage"
import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { sendGet } from "../functions"
import { LOGs } from "../types"

export default function Logs() {
    const [logs, setLogs] = useState<LOGs[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [logSearch, setLogSearch] = useState('')
    const [selectedTable, setSelectedTable] = useState<string>('all')
    const [selectedType, setSelectedType] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 7

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        const token = getLocalStorage('token')

        if (!token) return

        setIsLoading(true)
        try {
            const logs: LOGs[] = await sendGet('/logs/' + token)
            setLogs(logs)
            setIsLoading(false)
        } catch (error) {
            console.error("Erro ao buscar logs da API:", error)
            toast.error("Erro ao buscar logs.")
            setIsLoading(false)
        }
    }

    // Get unique table names for the filter dropdown
    const uniqueTables = ['all', ...new Set(logs.map(log => log.tabela))]

    // Get unique log types for the filter dropdown
    const uniqueTypes = ['all', ...new Set(logs.map(log => log.tipo))]

    // Filter logs based on search, table selection, and type selection
    const filteredLogs = logs.filter((log) => {
        // Text search filter
        const matchesSearch = log.mensagem.toLowerCase().includes(logSearch.toLowerCase()) ||
            log.tabela.toLowerCase().includes(logSearch.toLowerCase())

        // Table filter
        const matchesTable = selectedTable === 'all' || log.tabela === selectedTable

        // Type filter
        const matchesType = selectedType === 'all' || log.tipo === selectedType

        return matchesSearch && matchesTable && matchesType
    })

    // Calculate pagination
    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage))
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [logSearch, selectedTable, selectedType])

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="relative flex items-center justify-baseline gap-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar logs..."
                        className="pl-8"
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                    />
                    <div className="w-[180px]">
                        <Select
                            value={selectedTable}
                            onValueChange={setSelectedTable}
                        >
                            <SelectTrigger id="table-filter" className="w-[180px]">
                                <SelectValue placeholder="Todas as tabelas" />
                            </SelectTrigger>
                            <SelectContent>
                                {uniqueTables.map((table) => (
                                    <SelectItem key={table} value={table}>
                                        {table === 'all' ? 'Todas as tabelas' : `${table.slice(0, 1).toUpperCase()}${table.slice(1).toLowerCase()}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-[180px]">
                        <Select
                            value={selectedType}
                            onValueChange={setSelectedType}
                        >
                            <SelectTrigger id="type-filter" className="w-[180px]">
                                <SelectValue placeholder="Todos os tipos" />
                            </SelectTrigger>
                            <SelectContent>
                                {uniqueTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type === 'all' ? 'Todos os tipos' : `${type.slice(0, 1).toUpperCase()}${type.slice(1).toLowerCase()}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button onClick={fetchData} disabled={isLoading}>
                    {isLoading ? 'Carregando...' : 'Atualizar'}
                </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-22rem)] max-h-[calc(100vh-22rem)] mt-2">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Tabela</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Mensagem</TableHead>
                                <TableHead>Data</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedLogs.length > 0 ? (
                                paginatedLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">{log.id}</TableCell>
                                        <TableCell>{log.tabela}</TableCell>
                                        <TableCell>{log.tipo}</TableCell>
                                        <TableCell>{log.mensagem}</TableCell>
                                        <TableCell>{new Date(log.createdAt).toLocaleDateString('pt-BR')} às {new Date(log.createdAt).toLocaleTimeString('pt-BR')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">
                                        {isLoading ? 'Carregando logs...' : 'Nenhum log encontrado'}
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