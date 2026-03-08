import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DollarSign, TrendingUp, TrendingDown, Receipt, Download, Printer,
  CalendarIcon, Building2, CreditCard, AlertTriangle, BarChart3, PieChart as PieChartIcon,
  LineChart as LineChartIcon, TableIcon, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToCSV } from '@/lib/exportReport';
import {
  useFinancialSummary, useRevenueByLocation, useRevenueByMethod,
  useDefaulters, useCashFlow, useRefunds, useCustomReport,
  useLocationsForFilter, type FinancialFilters, type GroupBy
} from '@/hooks/useFinancialReports';

const COLORS = [
  'hsl(173, 58%, 39%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)', 'hsl(210, 100%, 50%)', 'hsl(280, 65%, 55%)',
  'hsl(330, 80%, 50%)', 'hsl(60, 80%, 45%)',
];

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'card', label: 'Cartão' },
  { value: 'manual', label: 'Manual' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// ── Shared Filter Bar ──
function FilterBar({
  filters,
  onFiltersChange,
  locations,
}: {
  filters: FinancialFilters;
  onFiltersChange: (f: FinancialFilters) => void;
  locations: { id: string; name: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date From */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="w-3.5 h-3.5" />
            De: {format(filters.dateFrom, 'dd/MM/yy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.dateFrom}
            onSelect={(d) => d && onFiltersChange({ ...filters, dateFrom: d })}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Date To */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="w-3.5 h-3.5" />
            Até: {format(filters.dateTo, 'dd/MM/yy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.dateTo}
            onSelect={(d) => d && onFiltersChange({ ...filters, dateTo: d })}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Location */}
      <Select
        value={filters.locationId || 'all'}
        onValueChange={(v) => onFiltersChange({ ...filters, locationId: v === 'all' ? undefined : v })}
      >
        <SelectTrigger className="w-44 h-9 text-sm">
          <Building2 className="w-3.5 h-3.5 mr-1.5" />
          <SelectValue placeholder="Todos os locais" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os locais</SelectItem>
          {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Payment Method */}
      <Select
        value={filters.paymentMethod || 'all'}
        onValueChange={(v) => onFiltersChange({ ...filters, paymentMethod: v === 'all' ? undefined : v })}
      >
        <SelectTrigger className="w-36 h-9 text-sm">
          <CreditCard className="w-3.5 h-3.5 mr-1.5" />
          <SelectValue placeholder="Método" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Quick periods */}
      <div className="flex gap-1 ml-auto">
        {[{ label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '90d', days: 90 }, { label: '1a', days: 365 }].map(p => (
          <Button
            key={p.days}
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={() => onFiltersChange({ ...filters, dateFrom: subDays(new Date(), p.days), dateTo: new Date() })}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ── Summary Cards ──
function SummaryCards({ filters }: { filters: FinancialFilters }) {
  const { data, isLoading } = useFinancialSummary(filters);
  if (isLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;
  if (!data) return null;

  const cards = [
    { label: 'Receita Total', value: formatCurrency(data.totalRevenue), icon: DollarSign, color: 'text-primary' },
    { label: 'Recebido', value: formatCurrency(data.received), icon: TrendingUp, color: 'text-success' },
    { label: 'Pendente', value: formatCurrency(data.pending), icon: TrendingDown, color: 'text-warning' },
    { label: 'Ticket Médio', value: formatCurrency(data.avgTicket), icon: Receipt, color: 'text-primary' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(c => (
        <Card key={c.label} className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-muted")}>
              <c.icon className={cn("w-5 h-5", c.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{c.label}</p>
              <p className="text-lg font-bold truncate">{c.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Tab: Summary ──
function SummaryTab({ filters }: { filters: FinancialFilters }) {
  const { data: cashflow, isLoading } = useCashFlow(filters);
  const { data: summary } = useFinancialSummary(filters);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Fluxo de Receitas</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashflow}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={v => `R$${v}`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="valor" stroke="hsl(173, 58%, 39%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      {summary && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Inadimplência</p>
            <p className="text-xl font-bold text-destructive">{summary.defaultRate.toFixed(1)}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Pagamentos Realizados</p>
            <p className="text-xl font-bold">{summary.paidCount} / {summary.totalPayments}</p>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Tab: By Location ──
function ByLocationTab({ filters }: { filters: FinancialFilters }) {
  const { data, isLoading } = useRevenueByLocation(filters);

  const handleExport = () => {
    if (!data) return;
    exportToCSV(data as any[], [
      { key: 'name', label: 'Local' },
      { key: 'received', label: 'Recebido' },
      { key: 'pending', label: 'Pendente' },
      { key: 'total', label: 'Total' },
    ], 'receita-por-local');
  };

  if (isLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="w-3.5 h-3.5" /> CSV
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={11} tickFormatter={v => `R$${v}`} />
                <YAxis type="category" dataKey="name" fontSize={11} width={120} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="received" name="Recebido" fill="hsl(173, 58%, 39%)" stackId="a" />
                <Bar dataKey="pending" name="Pendente" fill="hsl(38, 92%, 50%)" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map(r => (
                <TableRow key={r.name}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right text-success">{formatCurrency(r.received)}</TableCell>
                  <TableCell className="text-right text-warning">{formatCurrency(r.pending)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(r.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: By Method ──
function ByMethodTab({ filters }: { filters: FinancialFilters }) {
  const { data, isLoading } = useRevenueByMethod(filters);
  if (isLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                {data?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Tab: Defaulters ──
function DefaultersTab({ filters }: { filters: FinancialFilters }) {
  const { data, isLoading } = useDefaulters(filters);

  const handleExport = () => {
    if (!data) return;
    exportToCSV(data as any[], [
      { key: 'userName', label: 'Nome' },
      { key: 'userEmail', label: 'Email' },
      { key: 'amount', label: 'Valor' },
      { key: 'reservationDate', label: 'Data Reserva' },
      { key: 'location', label: 'Local' },
    ], 'inadimplencia');
  };

  if (isLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;

  const total = data?.reduce((s, d) => s + d.amount, 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-sm font-medium">{data?.length || 0} pagamentos pendentes</span>
          <Badge variant="destructive">{formatCurrency(total)}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="w-3.5 h-3.5" /> CSV
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Data Reserva</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map(d => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{d.userName}</p>
                      <p className="text-xs text-muted-foreground">{d.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>{d.location}</TableCell>
                  <TableCell>{d.reservationDate ? format(new Date(d.reservationDate), 'dd/MM/yyyy') : '-'}</TableCell>
                  <TableCell className="text-right font-semibold text-destructive">{formatCurrency(d.amount)}</TableCell>
                </TableRow>
              ))}
              {(!data || data.length === 0) && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum pagamento pendente</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Cash Flow ──
function CashFlowTab({ filters }: { filters: FinancialFilters }) {
  const { data, isLoading } = useCashFlow(filters);

  const handleExport = () => {
    if (!data) return;
    exportToCSV(data as any[], [
      { key: 'date', label: 'Data' },
      { key: 'valor', label: 'Valor (R$)' },
    ], 'fluxo-caixa');
  };

  if (isLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="w-3.5 h-3.5" /> CSV
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="valor" name="Entradas" fill="hsl(173, 58%, 39%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Refunds ──
function RefundsTab({ filters }: { filters: FinancialFilters }) {
  const { data, isLoading } = useRefunds(filters);
  if (isLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;

  const total = data?.reduce((s, d) => s + d.amount, 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{data?.length || 0} estornos</span>
        <Badge variant="secondary">{formatCurrency(total)}</Badge>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.userName}</TableCell>
                  <TableCell>{d.location}</TableCell>
                  <TableCell className="max-w-48 truncate text-xs">{d.notes}</TableCell>
                  <TableCell>{format(new Date(d.createdAt), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(d.amount)}</TableCell>
                </TableRow>
              ))}
              {(!data || data.length === 0) && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum estorno encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Custom Report Builder ──
type VisualizationType = 'table' | 'bar' | 'line' | 'pie';

const METRICS = [
  { id: 'totalRevenue', label: 'Receita Total' },
  { id: 'received', label: 'Recebido' },
  { id: 'pending', label: 'Pendente' },
  { id: 'count', label: 'Qtd Pagamentos' },
];

function CustomReportBuilder({ filters }: { filters: FinancialFilters }) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['totalRevenue', 'received']);
  const [groupBy, setGroupBy] = useState<GroupBy>('month');
  const [visualization, setVisualization] = useState<VisualizationType>('bar');
  const [generated, setGenerated] = useState(false);

  const { data, isLoading } = useCustomReport(filters, groupBy, generated);

  const toggleMetric = (id: string) => {
    setSelectedMetrics(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    if (!data) return;
    const cols = [
      { key: 'label', label: 'Agrupamento' },
      ...selectedMetrics.map(m => ({ key: m, label: METRICS.find(mt => mt.id === m)?.label || m })),
    ];
    exportToCSV(data as any[], cols, 'relatorio-personalizado');
  };

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map(d => ({
      name: d.label,
      ...selectedMetrics.reduce((acc, m) => ({ ...acc, [m]: (d as any)[m] || 0 }), {}),
    }));
  }, [data, selectedMetrics]);

  return (
    <div className="space-y-6">
      {/* Metrics selection */}
      <Card>
        <CardHeader><CardTitle className="text-base">Métricas</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {METRICS.map(m => (
              <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={selectedMetrics.includes(m.id)} onCheckedChange={() => toggleMetric(m.id)} />
                <span className="text-sm">{m.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <Select value={groupBy} onValueChange={(v) => { setGroupBy(v as GroupBy); setGenerated(false); }}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Por Dia</SelectItem>
              <SelectItem value="week">Por Semana</SelectItem>
              <SelectItem value="month">Por Mês</SelectItem>
              <SelectItem value="location">Por Local</SelectItem>
              <SelectItem value="method">Por Método</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 border rounded-md p-0.5">
          {([
            { value: 'table', icon: TableIcon },
            { value: 'bar', icon: BarChart3 },
            { value: 'line', icon: LineChartIcon },
            { value: 'pie', icon: PieChartIcon },
          ] as { value: VisualizationType; icon: typeof TableIcon }[]).map(v => (
            <Button
              key={v.value}
              variant={visualization === v.value ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setVisualization(v.value)}
            >
              <v.icon className="w-3.5 h-3.5" />
            </Button>
          ))}
        </div>

        <Button onClick={() => setGenerated(true)} disabled={selectedMetrics.length === 0} className="gap-2">
          Gerar Relatório
        </Button>

        {generated && data && (
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 ml-auto">
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
        )}
      </div>

      {/* Results */}
      {generated && (
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-8"><LoadingSpinner /></div>
            ) : !data || data.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum dado encontrado para os filtros selecionados</p>
            ) : visualization === 'table' ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agrupamento</TableHead>
                    {selectedMetrics.map(m => (
                      <TableHead key={m} className="text-right">{METRICS.find(mt => mt.id === m)?.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      {selectedMetrics.map(m => (
                        <TableCell key={m} className="text-right">
                          {m === 'count' ? (row as any)[m] : formatCurrency((row as any)[m] || 0)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : visualization === 'pie' ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey={selectedMetrics[0] || 'totalRevenue'}
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                      {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  {visualization === 'line' ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={v => `R$${v}`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      {selectedMetrics.map((m, i) => (
                        <Line key={m} type="monotone" dataKey={m} name={METRICS.find(mt => mt.id === m)?.label} stroke={COLORS[i]} strokeWidth={2} />
                      ))}
                    </LineChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={v => `R$${v}`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      {selectedMetrics.map((m, i) => (
                        <Bar key={m} dataKey={m} name={METRICS.find(mt => mt.id === m)?.label} fill={COLORS[i]} radius={[4, 4, 0, 0]} />
                      ))}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Main Component ──
export function AdminFinancialReportsContent() {
  const [filters, setFilters] = useState<FinancialFilters>({
    dateFrom: subDays(new Date(), 30),
    dateTo: new Date(),
  });
  const [activeReport, setActiveReport] = useState('summary');
  const { data: locations = [] } = useLocationsForFilter();

  return (
    <>
      <PageHeader
        title="Relatórios Financeiros"
        description="Prestação de contas e análises financeiras"
        action={
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Imprimir
          </Button>
        }
      />

      <div className="space-y-4">
        <Tabs defaultValue="ready">
          <TabsList>
            <TabsTrigger value="ready">Relatórios Prontos</TabsTrigger>
            <TabsTrigger value="custom">Montador Personalizado</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <FilterBar filters={filters} onFiltersChange={setFilters} locations={locations} />
          </div>

          <TabsContent value="ready" className="space-y-4 mt-4">
            <SummaryCards filters={filters} />

            {/* Sub-report tabs */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'summary', label: 'Resumo' },
                { id: 'location', label: 'Por Local' },
                { id: 'method', label: 'Por Método' },
                { id: 'defaulters', label: 'Inadimplência' },
                { id: 'cashflow', label: 'Fluxo de Caixa' },
                { id: 'refunds', label: 'Estornos' },
              ].map(r => (
                <Button
                  key={r.id}
                  variant={activeReport === r.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveReport(r.id)}
                >
                  {r.label}
                </Button>
              ))}
            </div>

            {activeReport === 'summary' && <SummaryTab filters={filters} />}
            {activeReport === 'location' && <ByLocationTab filters={filters} />}
            {activeReport === 'method' && <ByMethodTab filters={filters} />}
            {activeReport === 'defaulters' && <DefaultersTab filters={filters} />}
            {activeReport === 'cashflow' && <CashFlowTab filters={filters} />}
            {activeReport === 'refunds' && <RefundsTab filters={filters} />}
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <CustomReportBuilder filters={filters} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default function AdminFinancialReports() {
  return <AppLayout><AdminFinancialReportsContent /></AppLayout>;
}
