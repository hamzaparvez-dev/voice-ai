'use client';

import { format, subDays } from 'date-fns';
import { Calendar, Download, FileText } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  getPreferencesApiV1OrganizationsPreferencesGet,
  getWorkflowOptionsApiV1OrganizationsReportsWorkflowsGet,
} from '@/client/sdk.gen';
import { BRAND } from '@/constants/branding';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';

import { EscalationTrendChart } from './components/EscalationTrendChart';
import { ExecutiveDurationChart } from './components/ExecutiveDurationChart';
import { ExecutiveKpiCards } from './components/ExecutiveKpiCards';
import { IntentChart } from './components/IntentChart';
import { SentimentChart } from './components/SentimentChart';
import { downloadExecutiveCsv } from './lib/exportCsv';
import { downloadExecutivePdf, printExecutivePdf } from './lib/exportPdf';
import { fetchExecutiveReport } from './lib/fetchExecutiveReport';
import type { ExecutiveReport } from './lib/types';

interface WorkflowOption {
  id: number;
  name: string;
}

export default function ExecutiveDashboardPage() {
  const auth = useAuth();

  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 6));
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all');
  const [workflows, setWorkflows] = useState<WorkflowOption[]>([]);
  const [timezone, setTimezone] = useState('Asia/Tokyo');
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    const loadMeta = async () => {
      if (!auth.isAuthenticated) return;

      try {
        const [wfRes, prefRes] = await Promise.all([
          getWorkflowOptionsApiV1OrganizationsReportsWorkflowsGet({}),
          getPreferencesApiV1OrganizationsPreferencesGet(),
        ]);
        if (wfRes.data) setWorkflows(wfRes.data);
        if (prefRes.data?.timezone) setTimezone(prefRes.data.timezone);
      } catch (err) {
        console.error('Failed to load executive dashboard metadata:', err);
      }
    };
    loadMeta();
  }, [auth.isAuthenticated]);

  const loadReport = useCallback(async () => {
    if (!auth.isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchExecutiveReport({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        timezone,
        workflowId:
          selectedWorkflow === 'all' ? undefined : parseInt(selectedWorkflow, 10),
      });
      setReport(data);
    } catch (err) {
      console.error('Executive report fetch failed:', err);
      setError('Failed to load executive KPI data');
    } finally {
      setLoading(false);
    }
  }, [auth.isAuthenticated, startDate, endDate, timezone, selectedWorkflow]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportCsv = () => {
    if (!report) return;
    downloadExecutiveCsv(report);
  };

  const handleExportPdf = async () => {
    if (!report) return;
    setExportingPdf(true);
    try {
      await downloadExecutivePdf(report);
    } catch {
      try {
        printExecutivePdf(report);
      } catch (printErr) {
        console.error('PDF export failed:', printErr);
        alert('PDF export failed. Try allowing popups or use CSV export.');
      }
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Executive Insights</h1>
          <p className="text-muted-foreground text-sm">
            {BRAND.name} portfolio KPIs — sentiment, escalations, intents, and durations
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All workflows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workflows</SelectItem>
              {workflows.map((wf) => (
                <SelectItem key={wf.id} value={wf.id.toString()}>
                  {wf.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[140px]">
                <Calendar className="mr-2 h-4 w-4" />
                {format(startDate, 'MMM dd')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarPicker
                mode="single"
                selected={startDate}
                onSelect={(d) => d && setStartDate(d)}
                disabled={(d) => d > endDate || d > new Date()}
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground text-sm hidden sm:inline">to</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[140px]">
                <Calendar className="mr-2 h-4 w-4" />
                {format(endDate, 'MMM dd, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarPicker
                mode="single"
                selected={endDate}
                onSelect={(d) => d && setEndDate(d)}
                disabled={(d) => d < startDate || d > new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <p className="text-sm text-muted-foreground">
          {format(startDate, 'yyyy-MM-dd')} — {format(endDate, 'yyyy-MM-dd')} · {timezone}
        </p>

        {report && report.metrics.total_calls > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exportingPdf}
            >
              <FileText className="h-4 w-4 mr-2" />
              {exportingPdf ? 'Exporting…' : 'Export PDF'}
            </Button>
          </div>
        )}
      </div>

      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[340px]" />
            <Skeleton className="h-[340px]" />
          </div>
        </div>
      )}

      {error && !loading && (
        <Card className="p-6">
          <p className="text-center text-red-500">{error}</p>
        </Card>
      )}

      {report && !loading && !error && (
        <>
          <ExecutiveKpiCards metrics={report.metrics} />

          <EscalationTrendChart data={report.daily_volume} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SentimentChart data={report.sentiment_distribution} />
            <IntentChart data={report.intent_distribution} />
          </div>

          <ExecutiveDurationChart data={report.duration_distribution} />

          {report.metrics.total_calls === 0 && (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                No calls in this period. Run TBIS or ICMG workflows to populate executive KPIs.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
