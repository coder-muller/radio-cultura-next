'use client'

import { sendGet, sendPost } from "@/app/functions"
import { Contrato } from "@/app/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getLocalStorage, removeLocalStorage, setLocalStorage } from "@/lib/localStorage"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ModeToggle } from "./toggleTheme"

export default function Header() {
    const pathname = usePathname();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [importando, setImportando] = useState<boolean>(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    useEffect(() => {
        const token = getLocalStorage("token");
        setIsAuthenticated(!!token);
    }, []);

    const navItems = [
        { name: "Clientes", href: "/clientes" },
        { name: "Contratos", href: "/contratos" },
        { name: "Faturas", href: "/faturas" },
        { name: "Comissões", href: "/comissoes" },
        { name: "Ajustes", href: "/ajustes" },
    ];

    async function importXmlToApi(xmlString: string, endpoint: string) {
        setImportando(true);

        let newEndpoint = endpoint

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");

        const rows = xmlDoc.getElementsByTagName("row");
        const totalRows = rows.length;
        const dataArray = [];

        if (totalRows === 0) return;


        for (let i = 0; i < totalRows; i++) {
            const row = rows[i];
            const record: Record<string, string | null> = {};
            const columns = row.getElementsByTagName("column");

            for (const column of Array.from(columns)) {
                const name = column.getAttribute("name");
                const value = column.textContent?.trim() || null;
                if (name) record[name] = value;
            }
            dataArray.push(record);
        }

        for (const data of dataArray) {

            let body = {};

            if (endpoint === 'contratos') {

                newEndpoint = 'dev/' + endpoint;

                body = {
                    ...data,
                    clienteId: data.id_cliente,
                    programaId: data.id_programa,
                    corretorId: data.id_corretor,
                    formaPagamentoId: data.id_formaPagamento,
                }
            } else if (endpoint === 'faturamento') {

                try {
                    const contrato: Contrato = await sendGet('/contratos/' + data.chave + '/' + data.id_contrato)
                    if (!contrato) {
                        toast.error("Contrato não encontrado.");
                        setImportando(false);
                        continue;
                    }

                    body = {
                        ...data,
                        clienteId: data.id_cliente,
                        contratoId: data.id_contrato,
                        programaId: data.id_programa,
                        corretoresId: contrato.corretorId,
                        formaPagamentoId: data.id_formaPagamento,
                        comissao: contrato.comissao,
                        descritivo: contrato.descritivo,
                    }
                } catch (error) {
                    console.error("Erro ao enviar dados para a API:", error);
                    toast.error("Erro ao importar dados.");
                    continue;
                }
            } else {

                newEndpoint = 'dev/' + endpoint;

                body = data;
            }

            try {
                await sendPost(`/${newEndpoint}`, body)
            } catch (error) {
                console.error("Erro ao enviar dados para a API:", error);
                toast.error("Erro ao importar dados.");
                setImportando(false);
                return;
            }
        }

        setImportando(false);
        console.log("Dados cadastrados:", dataArray);
        toast.success("Dados importados com sucesso!");
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const fileName = file.name;
        const endpoint = fileName.toLowerCase().replace(/\.xml$/i, '');

        const reader = new FileReader();
        reader.onload = async (e) => {
            const xmlContent = e.target?.result as string;
            await importXmlToApi(xmlContent, endpoint);
        };
        reader.readAsText(file);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <header className="relative w-full flex items-center justify-between border-b px-8 py-5">
                <h1 className="text-xl font-semibold">Rádio Cultura</h1>

                <nav className="hidden md:flex items-center space-x-6 absolute left-1/2 -translate-x-1/2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`text-sm font-medium transition-colors hover:text-primary ${pathname === item.href ? "text-primary border-b-2 border-primary pb-2" : "text-muted-foreground"
                                }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center justify-center gap-2">
                    {importando ? (
                        <Button variant="outline" disabled>
                            <Loader2 className="animate-spin" />
                            Importando...
                        </Button>
                    ) : (
                        <Button variant="outline" className="hidden" onClick={handleImportClick}>
                            Importar XML
                        </Button>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".xml"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <ModeToggle />
                    {isAuthenticated ? (
                        <Button variant="outline" onClick={() => {
                            removeLocalStorage('token');
                            setIsAuthenticated(false);
                            window.location.reload();
                        }}>Sair</Button>
                    ) : (
                        <Button onClick={() => setIsPasswordDialogOpen(true)}>Entrar</Button>
                    )}
                </div>
            </header>

            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Segurança</DialogTitle>
                        <DialogDescription>
                            Você precisa de uma senha para ter acesso a todas as funcionalidades do App!
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="password">Senha</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Digite sua senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handlePasswordSubmit();
                                        }
                                    }}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">
                                        {showPassword ? "Esconder senha" : "Mostrar senha"}
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handlePasswordSubmit}>Confirmar</Button>
                        <Button variant="outline" onClick={() => {
                            setPassword('');
                            setIsPasswordDialogOpen(false);
                        }}>
                            Cancelar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );

    function handlePasswordSubmit() {
        if (password === "radio123") {
            setLocalStorage('token', '25043065000145');
            setIsAuthenticated(true);
            setPassword('');
            setIsPasswordDialogOpen(false);
            window.location.reload();
        } else {
            toast.error("Senha incorreta!");
            setPassword('');
        }
    }
}
