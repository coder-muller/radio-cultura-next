'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { sendGet } from '../functions'
import { Fatura, Contrato, Cliente } from '../types'
import { getLocalStorage } from '@/lib/localStorage'
import { 
  CircleDollarSign, 
  TrendingUp, 
  Users, 
  Wallet, 
  CalendarClock, 
  AlertCircle, 
  Clock, 
  Percent 
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  ChartContainer, 
  ChartTooltip 
} from '@/components/ui/chart'
import { 
  Bar, 
  BarChart, 
  Line, 
  LineChart, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  XAxis, 
  YAxis
} from 'recharts'

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  })
}

// Helper function to format percentage
const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`
}

// Define specific dashboard metrics type
interface DashboardMetrics {
  rbm: number
  rlm: number
  ticketMedio: number
  growthMoM: number
  mrr: number
  newClients: number
  activeClients: number
  acv: number
  paidOnTimePercent: number
  clientsWithOverdue: number
  agingValues: {
    '0-30': number
    '31-60': number
    '60+': number
  }
  totalCommission: number
  // Monthly history data for charts
  monthlyRevenue: Array<{name: string, value: number}>
  monthlyGrowth: Array<{name: string, value: number}>
  clientDistribution: Array<{name: string, value: number}>
}

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear())
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    rbm: 0,
    rlm: 0,
    ticketMedio: 0,
    growthMoM: 0,
    mrr: 0,
    newClients: 0,
    activeClients: 0,
    acv: 0,
    paidOnTimePercent: 0,
    clientsWithOverdue: 0,
    agingValues: {
      '0-30': 0,
      '31-60': 0,
      '60+': 0
    },
    totalCommission: 0,
    monthlyRevenue: [],
    monthlyGrowth: [],
    clientDistribution: []
  })
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const token = getLocalStorage('token')

        if (!token) {
          toast.error('Token não encontrado')
          return
        }
        
        // Fetch faturas
        const faturas: Fatura[] = await sendGet('/faturamento/' + token)
        
        // Fetch contratos
        const contratos: Contrato[] = await sendGet('/contratos/' + token)
        
        // Fetch clientes
        const clientes: Cliente[] = await sendGet('/clientes/' + token)
        
        // Calculate metrics
        calculateMetrics(faturas, contratos, clientes)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentMonth, currentYear])

  const calculateMetrics = (faturas: Fatura[], contratos: Contrato[], clientes: Cliente[]) => {
    // Helper to check if a date is in the current month
    const isInCurrentMonth = (dateStr: string | null | undefined) => {
      if (!dateStr) return false
      const date = new Date(dateStr)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    }

    // Helper to check if a date is in the previous month
    const isInPreviousMonth = (dateStr: string | null | undefined) => {
      if (!dateStr) return false
      const date = new Date(dateStr)
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear
    }

    // Filter paid invoices for current month
    const paidInvoicesCurrentMonth = faturas.filter(
      f => f.dataPagamento && isInCurrentMonth(f.dataPagamento)
    )

    // Filter paid invoices for previous month
    const paidInvoicesPrevMonth = faturas.filter(
      f => f.dataPagamento && isInPreviousMonth(f.dataPagamento)
    )

    // 1. Receita Bruta Mensal (RBM)
    const rbm = paidInvoicesCurrentMonth.reduce((sum, fatura) => 
      sum + (parseFloat(fatura.valor?.toString() || '0') || 0), 0)

    // Get unique client IDs with paid invoices this month
    const clientsWithPaidInvoices = [...new Set(
      paidInvoicesCurrentMonth.map(f => f.clienteId)
    )]

    // 2. Comissão Total Paga
    const totalCommission = paidInvoicesCurrentMonth.reduce((sum, fatura) => {
      const contrato = contratos.find(c => c.id === fatura.contratoId)
      return sum + (parseFloat(contrato?.comissao?.toString() || '0') || 0)
    }, 0)

    // 3. Receita Líquida Mensal (RLM)
    const rlm = rbm - totalCommission

    // Calculate RLM for previous month
    const rlmPrevMonth = paidInvoicesPrevMonth.reduce((sum, fatura) => 
      sum + (parseFloat(fatura.valor?.toString() || '0') || 0), 0) - paidInvoicesPrevMonth.reduce((sum, fatura) => {
        const contrato = contratos.find(c => c.id === fatura.contratoId)
        return sum + (parseFloat(contrato?.comissao?.toString() || '0') || 0)
      }, 0)

    // 4. Ticket Médio por Cliente
    const ticketMedio = clientsWithPaidInvoices.length > 0 
      ? rlm / clientsWithPaidInvoices.length 
      : 0

    // 5. Growth MoM
    const growthMoM = rlmPrevMonth > 0 
      ? ((rlm - rlmPrevMonth) / rlmPrevMonth) * 100 
      : 0

    // Check if a contract is active
    const isActiveContract = (contract: Contrato) => {
      const vencimento = new Date(contract.dataVencimento)
      const now = new Date()
      return vencimento >= now
    }

    // 6. Active contracts
    const activeContracts = contratos.filter(isActiveContract)

    // 7. MRR (Monthly Recurring Revenue)
    const mrr = activeContracts.reduce((sum, contrato) => {
      // If contract has monthly installments, add it to MRR
      // Assuming contracts with dataVencimento in the future are active
      return sum + (parseFloat(contrato.valor?.toString() || '0') || 0) / 12 // Assuming annual contracts divided by 12
    }, 0)

    // 8. Novos Clientes no Mês
    const newClients = clientes.filter(cliente => {
      // Using createdAt from contrato as a proxy since Cliente doesn't have createdAt
      const clientContracts = contratos.filter(c => c.clienteId === cliente.id)
      const clientFirstContract = clientContracts.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[0]
      
      return clientFirstContract && isInCurrentMonth(clientFirstContract.createdAt)
    }).length

    // 9. Clientes Ativos
    const activeClients = [...new Set(
      activeContracts.map(c => c.clienteId)
    )].length

    // 10. Valor Médio de Contrato (ACV)
    const acv = activeContracts.length > 0
      ? activeContracts.reduce((sum, contrato) => sum + (parseFloat(contrato.valor?.toString() || '0') || 0), 0) / activeContracts.length
      : 0

    // 11. % de Faturas Pagas no Vencimento
    const allInvoicesThisMonth = faturas.filter(f => isInCurrentMonth(f.dataEmissao))
    const paidOnTime = faturas.filter(f => {
      if (!f.dataPagamento || !f.dataVencimento) return false
      return new Date(f.dataPagamento) <= new Date(f.dataVencimento) && isInCurrentMonth(f.dataPagamento)
    })
    
    const paidOnTimePercent = allInvoicesThisMonth.length > 0
      ? (paidOnTime.length / allInvoicesThisMonth.length) * 100
      : 0

    // 12. Clientes com Faturas Atrasadas
    const now = new Date()
    const clientsWithOverdue = [...new Set(
      faturas.filter(f => {
        if (!f.dataVencimento || f.dataPagamento) return false
        return new Date(f.dataVencimento) < now
      }).map(f => f.clienteId)
    )].length

    // 13. Valor em Aberto (Aging)
    const overdueInvoices = faturas.filter(f => {
      if (!f.dataVencimento || f.dataPagamento) return false
      return new Date(f.dataVencimento) < now
    })

    const agingValues = {
      '0-30': 0,
      '31-60': 0,
      '60+': 0
    }

    overdueInvoices.forEach(invoice => {
      if (!invoice.dataVencimento || !invoice.valor) return
      
      const dueDate = new Date(invoice.dataVencimento)
      const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff <= 30) {
        agingValues['0-30'] += parseFloat(invoice.valor?.toString() || '0')
      } else if (daysDiff <= 60) {
        agingValues['31-60'] += parseFloat(invoice.valor?.toString() || '0')
      } else {
        agingValues['60+'] += parseFloat(invoice.valor?.toString() || '0')
      }
    })

    // Generate chart data

    // Last 6 months revenue data for chart
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(currentYear, currentMonth - i, 1)
      return {
        month: date.getMonth(),
        year: date.getFullYear(),
        name: `${getMonthName(date.getMonth()).substring(0, 3)}/${date.getFullYear().toString().substring(2)}`
      }
    }).reverse()

    // Monthly revenue data for chart
    const monthlyRevenue = last6Months.map(monthData => {
      const monthFaturas = faturas.filter(f => {
        if (!f.dataPagamento) return false
        const date = new Date(f.dataPagamento)
        return date.getMonth() === monthData.month && date.getFullYear() === monthData.year
      })
      
      const total = monthFaturas.reduce((sum, fatura) => 
        sum + (parseFloat(fatura.valor?.toString() || '0') || 0), 0)
      
      return {
        name: monthData.name,
        value: total
      }
    })

    // Monthly growth data
    const monthlyGrowth = monthlyRevenue.map((current, index) => {
      if (index === 0 || monthlyRevenue[index - 1].value === 0) {
        return { name: current.name, value: 0 }
      }
      const previous = monthlyRevenue[index - 1].value
      const growthPercent = ((current.value - previous) / previous) * 100
      return {
        name: current.name,
        value: growthPercent
      }
    })

    // Prepare aging data for pie chart
    const agingDistribution = [
      { name: '0-30 dias', value: agingValues['0-30'] },
      { name: '31-60 dias', value: agingValues['31-60'] },
      { name: '60+ dias', value: agingValues['60+'] }
    ]

    setMetrics({
      rbm,
      rlm,
      ticketMedio,
      growthMoM,
      mrr,
      newClients,
      activeClients,
      acv,
      paidOnTimePercent,
      clientsWithOverdue,
      agingValues,
      totalCommission,
      monthlyRevenue,
      monthlyGrowth,
      clientDistribution: agingDistribution
    })
  }

  const getMonthName = (month: number): string => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months[month]
  }

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Chart configurations
  const chartConfig = {
    receita: {
      label: "Receita",
      theme: {
        light: "hsl(215 100% 50%)",
        dark: "hsl(215 100% 60%)"
      }
    },
    crescimento: {
      label: "Crescimento",
      theme: {
        light: "hsl(142 72% 29%)",
        dark: "hsl(142 72% 50%)"
      }
    },
    aging30: {
      label: "0-30 dias",
      theme: {
        light: "hsl(142 70% 45%)",
        dark: "hsl(142 70% 50%)"
      }
    },
    aging60: {
      label: "31-60 dias",
      theme: {
        light: "hsl(48 96% 53%)",
        dark: "hsl(48 96% 53%)"
      }
    },
    aging90: {
      label: "60+ dias",
      theme: {
        light: "hsl(0 84% 60%)",
        dark: "hsl(0 84% 60%)"
      }
    }
  }

  const COLORS = ['#0088FE', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={handlePreviousMonth}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            &lt;
          </button>
          <span className="font-medium min-w-32 text-center">
            {getMonthName(currentMonth)} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            &gt;
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          <Tabs defaultValue="receita" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto">
              <TabsTrigger value="receita">Receita</TabsTrigger>
              <TabsTrigger value="clientes">Clientes</TabsTrigger>
              <TabsTrigger value="contratos">Contratos</TabsTrigger>
              <TabsTrigger value="faturas">Faturas</TabsTrigger>
            </TabsList>

            {/* Receita Tab */}
            <TabsContent value="receita" className="space-y-6">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard 
                  title="Receita Bruta Mensal" 
                  value={formatCurrency(metrics.rbm)}
                  description="Total faturado no período"
                  icon={<CircleDollarSign className="h-6 w-6" />}
                />
                <MetricCard 
                  title="Receita Líquida Mensal" 
                  value={formatCurrency(metrics.rlm)}
                  description="RBM - Total de comissões"
                  icon={<Wallet className="h-6 w-6" />}
                />
                <MetricCard 
                  title="Crescimento MoM" 
                  value={formatPercent(metrics.growthMoM)}
                  description="Variação mensal da receita"
                  icon={<TrendingUp className="h-6 w-6" />}
                  trend={metrics.growthMoM > 0 ? 'up' : metrics.growthMoM < 0 ? 'down' : 'neutral'}
                />
                <MetricCard 
                  title="MRR" 
                  value={formatCurrency(metrics.mrr)}
                  description="Receita recorrente mensal"
                  icon={<CalendarClock className="h-6 w-6" />}
                />
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <MetricCard 
                  title="Ticket Médio por Cliente" 
                  value={formatCurrency(metrics.ticketMedio)}
                  description="Valor médio gerado por cliente"
                  icon={<Users className="h-6 w-6" />}
                />
                <MetricCard 
                  title="Comissão Total Paga" 
                  value={formatCurrency(metrics.totalCommission)}
                  description="Soma de comissões em faturas pagas"
                  icon={<CircleDollarSign className="h-6 w-6" />}
                />
              </div>

              {/* Revenue History Chart */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Histórico de Receita (6 meses)</h3>
                  <div className="h-80">
                    <ChartContainer config={chartConfig}>
                      <BarChart data={metrics.monthlyRevenue}>
                        <XAxis dataKey="name" />
                        <YAxis 
                          tickFormatter={(value) => 
                            `R$ ${(value / 1000).toFixed(0)}k`
                          } 
                        />
                        <ChartTooltip 
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">
                                      {payload[0].payload.name}
                                    </span>
                                    <span className="font-bold">
                                      {formatCurrency(payload[0].value as number)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="value" fill="var(--color-receita)" />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </Card>

                {/* Growth Chart */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Crescimento Mensal (%)</h3>
                  <div className="h-80">
                    <ChartContainer config={chartConfig}>
                      <LineChart data={metrics.monthlyGrowth}>
                        <XAxis dataKey="name" />
                        <YAxis 
                          tickFormatter={(value) => `${value.toFixed(0)}%`} 
                        />
                        <ChartTooltip 
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">
                                      {payload[0].payload.name}
                                    </span>
                                    <span className="font-bold">
                                      {formatPercent(payload[0].value as number)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="var(--color-crescimento)" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ChartContainer>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Clientes Tab */}
            <TabsContent value="clientes" className="space-y-6">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard 
                  title="Novos Clientes" 
                  value={metrics.newClients.toString()}
                  description="Clientes criados no mês"
                  icon={<Users className="h-6 w-6" />}
                />
                <MetricCard 
                  title="Clientes Ativos" 
                  value={metrics.activeClients.toString()}
                  description="Com contrato ativo"
                  icon={<Users className="h-6 w-6" />}
                />
                <MetricCard 
                  title="Clientes com Atraso" 
                  value={metrics.clientsWithOverdue.toString()}
                  description="Com faturas vencidas"
                  icon={<AlertCircle className="h-6 w-6" />}
                />
              </div>
            </TabsContent>

            {/* Contratos Tab */}
            <TabsContent value="contratos" className="space-y-6">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <MetricCard 
                  title="Valor Médio de Contrato (ACV)" 
                  value={formatCurrency(metrics.acv)}
                  description="Média por contrato ativo"
                  icon={<CircleDollarSign className="h-6 w-6" />}
                />
              </div>
            </TabsContent>

            {/* Faturas Tab */}
            <TabsContent value="faturas" className="space-y-6">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard 
                  title="Faturas Pagas no Vencimento" 
                  value={formatPercent(metrics.paidOnTimePercent)}
                  description="% do total de faturas"
                  icon={<Percent className="h-6 w-6" />}
                />
                <MetricCard 
                  title="Faturas Atrasadas (0-30 dias)" 
                  value={formatCurrency(metrics.agingValues['0-30'])}
                  description="Valor em atraso"
                  icon={<Clock className="h-6 w-6" />}
                />
                <MetricCard 
                  title="Faturas Atrasadas (31-60 dias)" 
                  value={formatCurrency(metrics.agingValues['31-60'])}
                  description="Valor em atraso"
                  icon={<Clock className="h-6 w-6" />}
                />
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <MetricCard 
                  title="Faturas Atrasadas (60+ dias)" 
                  value={formatCurrency(metrics.agingValues['60+'])}
                  description="Valor em atraso"
                  icon={<AlertCircle className="h-6 w-6" />}
                />
              </div>

              {/* Aging distribution pie chart */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Distribuição de Faturas em Atraso</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.clientDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {metrics.clientDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">
                                  {payload[0].name}
                                </span>
                                <span className="font-bold">
                                  {formatCurrency(payload[0].value as number)}
                                </span>
                              </div>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

type MetricCardProps = {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

function MetricCard({ title, value, description, icon, trend }: MetricCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between space-x-4">
        <div className="flex flex-col">
          <p className="text-sm font-medium leading-none text-muted-foreground">{title}</p>
          <div className="flex items-center">
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            {trend && (
              <span className={`ml-2 ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : ''}`}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="p-2 bg-primary/10 rounded-full">
          {icon}
        </div>
      </div>
    </Card>
  )
}