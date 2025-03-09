"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Corretores from "./corretores";
import Programacao from "./programacao";
import FormaPagamentos from "./formaPagamentos";
import Logs from "./logs";
import { useEffect } from "react";
import { getLocalStorage } from "@/lib/localStorage";

export default function Ajustes() {

    useEffect(() => {
        const token = getLocalStorage('token')
        if (!token) {
            window.location.href = '/'
        }
    }, [])

    return (
        <>
            <div className="my-4">
                <h2 className="text-2xl font-semibold tracking-tight">Ajustes</h2>
                <p className="text-sm text-muted-foreground">Aqui você pode realizar ajustes na aplicação.</p>
            </div>

            <Tabs defaultValue="corretores" className="w-full mt-2">
                <TabsList className="mb-6 grid w-full grid-cols-4">
                    <TabsTrigger value="corretores">Corretores</TabsTrigger>
                    <TabsTrigger value="programacao">Programação</TabsTrigger>
                    <TabsTrigger value="formas-pagamento">Formas de Pagamento</TabsTrigger>
                    <TabsTrigger value="logs">LOGs</TabsTrigger>
                </TabsList>
                <TabsContent value="corretores" className=""><Corretores /></TabsContent>
                <TabsContent value="programacao" className="space-y-2"><Programacao /></TabsContent>
                <TabsContent value="formas-pagamento" className="space-y-2"><FormaPagamentos /></TabsContent>
                <TabsContent value="logs" className="space-y-2"><Logs /></TabsContent>
            </Tabs>
        </>
    )
}