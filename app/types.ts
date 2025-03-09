export type Cliente = {
    id: number
    chave: string
    razaoSocial: string
    nomeFantasia: string
    contato: string
    cpf: string
    cnpj: string
    endereco: string
    numero: string
    bairro: string
    cidade: string
    estado: string
    cep: string
    inscMunicipal: string
    atividade: string
    email: string
    fone: string
}

export type Corretor = {
    id: number,
    chave: string,
    nome: string,
    email: string,
    endereco: string,
    fone: string,
    dataAdmissao: string,
}

export type Programa = {
    id: number
    chave: string
    programa: string
    horaInicio: string
    horaFim: string
    apresentador: string
    diasApresentacao: string
    valorPatrocinio: number
    estilo: string
}

export type FormaPagamento = {
    id: number
    chave: string
    formaPagamento: string
}

export type Contrato = {
    id: number
    chave: string
    clienteId: number
    dataEmissao: string | null
    dataVencimento: string
    programaId: number
    numInsercoes: number | null
    valor: number | null
    corretorId: number | null
    comissao: number | null
    diaVencimento: number | null
    formaPagamentoId: number | null
    status: string | null
    descritivo: string | null
    createdAt: string
    updatedAt: string
    cliente: Cliente
    programacao: Programa
    formaPagamento: FormaPagamento | null
    faturamento: Fatura[]
}

export type Fatura = {
    id: number
    chave: string
    clienteId: number
    contratoId: number
    programaId: number
    corretoresId: number | null
    dataEmissao: string | null
    dataVencimento: string | null
    dataPagamento: string | null
    valor: number | null
    formaPagamentoId: number | null
    descritivo: string | null

    cliente: Cliente
    contrato: Contrato
    programa: Programa
    corretores: Corretor | null
}

export type LOGs = {
    id: number
    chave: string
    tipo: string
    tabela: string
    mensagem: string
    createdAt: string
    updatedAt: string
}