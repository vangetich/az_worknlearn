import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  RefreshCw,
  Zap,
  AlertTriangle,
  Gauge,
  CheckCircle2,
  TrendingUp,
  Clock,
  Radio,
} from 'lucide-react';
import {
  postgresBackendService,
  EndpointTelemetryPoint,
  EndpointSummaryMetrics,
  MonitoredEndpointPath,
} from '../services/postgresBackendService';

export type TelemetryMetricFilter = 'all' | 'latency' | 'error_rate';

interface BackendTelemetryLineChartProps {
  className?: string;
  onProbeQuizSubmit?: () => Promise<void>;
  onProbePaymentWebhook?: () => Promise<void>;
  onInjectError?: (endpoint: MonitoredEndpointPath) => Promise<void>;
}

export const BackendTelemetryLineChart: React.FC<BackendTelemetryLineChartProps> = ({
  className = '',
  onProbeQuizSubmit,
  onProbePaymentWebhook,
  onInjectError,
}) => {
  const [telemetryData, setTelemetryData] = useState<EndpointTelemetryPoint[]>(() => {
    return postgresBackendService.getEndpointTelemetrySnapshot().series;
  });
  const [summaries, setSummaries] = useState<
    Record<MonitoredEndpointPath, EndpointSummaryMetrics>
  >(() => postgresBackendService.getEndpointTelemetrySnapshot().summaries);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAutoPolling, setIsAutoPolling] = useState<boolean>(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date>(() => new Date());
  const [metricFilter, setMetricFilter] = useState<TelemetryMetricFilter>('all');
  const [isProbing, setIsProbing] = useState<boolean>(false);

  // Fetch recent telemetry from backend API /api/telemetry (with service fallback)
  const fetchRecentTelemetry = useCallback(async () => {
    setIsLoading(true);
    try {
      const snapshot = await postgresBackendService.fetchBackendTelemetry();
      if (snapshot.series && snapshot.series.length > 0) {
        setTelemetryData(snapshot.series);
      }
      if (snapshot.summaries) {
        setSummaries(snapshot.summaries);
      }
      setLastFetchedAt(new Date());
    } catch (err) {
      console.warn('Failed to fetch recent telemetry from backend, using local snapshot:', err);
      const fallback = postgresBackendService.getEndpointTelemetrySnapshot();
      setTelemetryData(fallback.series);
      setSummaries(fallback.summaries);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and real-time polling
  useEffect(() => {
    fetchRecentTelemetry();

    const handleCustomEvent = () => {
      const snap = postgresBackendService.getEndpointTelemetrySnapshot();
      setTelemetryData(snap.series);
      setSummaries(snap.summaries);
      setLastFetchedAt(new Date());
    };

    window.addEventListener('az900-telemetry-updated', handleCustomEvent);

    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (isAutoPolling) {
      intervalId = setInterval(() => {
        fetchRecentTelemetry();
      }, 3000);
    }

    return () => {
      window.removeEventListener('az900-telemetry-updated', handleCustomEvent);
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchRecentTelemetry, isAutoPolling]);

  const quizSummary = summaries['/api/quiz/submit'];
  const webhookSummary = summaries['/api/payments/webhook'];

  // Trigger live ping to /api/quiz/submit
  const handlePingQuiz = async () => {
    setIsProbing(true);
    try {
      if (onProbeQuizSubmit) {
        await onProbeQuizSubmit();
      } else {
        await postgresBackendService.submitQuizAnswer({
          userId: 'usr-default-learner',
          questionId: 'az900-m1-q1',
          selectedAnswer: 'B',
          recordSession: false,
        });
      }
      await fetchRecentTelemetry();
    } catch {
      // telemetry recorded in service
    } finally {
      setIsProbing(false);
    }
  };

  // Trigger live ping to /api/payments/webhook
  const handlePingWebhook = async () => {
    setIsProbing(true);
    try {
      if (onProbePaymentWebhook) {
        await onProbePaymentWebhook();
      } else {
        await postgresBackendService.triggerPaymentWebhook({
          Body: {
            stkCallback: {
              MerchantRequestID: `m-${Date.now()}`,
              CheckoutRequestID: `ws_CO_${Date.now()}`,
              ResultCode: 0,
              ResultDesc: 'Success',
              CallbackMetadata: {
                Item: [{ Name: 'MpesaReceiptNumber', Value: 'SJK8492019Z' }],
              },
            },
          },
        });
      }
      await fetchRecentTelemetry();
    } catch {
      // telemetry recorded in service
    } finally {
      setIsProbing(false);
    }
  };

  // Trigger test error
  const handleSimulateError = async (endpoint: MonitoredEndpointPath) => {
    setIsProbing(true);
    try {
      if (onInjectError) {
        await onInjectError(endpoint);
      } else {
        const start = Date.now();
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const elapsed = Math.max(2, Date.now() - start);
        postgresBackendService.recordEndpointSample(endpoint, elapsed, res.status || 400);
      }
      await fetchRecentTelemetry();
    } catch {
      postgresBackendService.recordEndpointSample(endpoint, 10, 500);
    } finally {
      setIsProbing(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 p-4 sm:p-5 space-y-4 shadow-xl ${className}`}
    >
      {/* Header bar with Status, Controls & Metric Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 border border-sky-400/30 text-sky-400">
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                Backend Request Telemetry Line Chart
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-300">
                <Radio
                  className={`w-2.5 h-2.5 ${
                    isAutoPolling ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
                  }`}
                />
                <span>{isAutoPolling ? 'AUTO-POLLING 3S' : 'PAUSED'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Visualizing request latency (ms) and error rates (%) for{' '}
              <code className="text-sky-300 font-mono font-bold">/api/quiz/submit</code> and{' '}
              <code className="text-emerald-300 font-mono font-bold">/api/payments/webhook</code>
            </p>
          </div>
        </div>

        {/* Action Controls: Fetch Now, Polling Toggle & Probe Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={fetchRecentTelemetry}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
            title="Fetch recent backend request telemetry from /api/telemetry"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Fetching...' : 'Fetch Telemetry'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAutoPolling((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
              isAutoPolling
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isAutoPolling ? 'Polling: ON' : 'Polling: OFF'}
          </button>

          <button
            type="button"
            disabled={isProbing}
            onClick={handlePingQuiz}
            className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
            title="Ping POST /api/quiz/submit"
          >
            <Zap className="w-3 h-3 text-sky-400" />
            <span>Ping Quiz</span>
          </button>

          <button
            type="button"
            disabled={isProbing}
            onClick={handlePingWebhook}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
            title="Ping POST /api/payments/webhook"
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Ping Webhook</span>
          </button>

          <button
            type="button"
            disabled={isProbing}
            onClick={() => handleSimulateError('/api/quiz/submit')}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
            title="Simulate 400 validation error on /api/quiz/submit"
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Simulate Error</span>
          </button>
        </div>
      </div>

      {/* Metric Mode Filter Tabs & Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-1 text-[11px] font-bold">
          <span className="text-slate-400 mr-1">Metric View:</span>
          <button
            type="button"
            onClick={() => setMetricFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              metricFilter === 'all'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Combined Line Chart (Dual Axis)
          </button>
          <button
            type="button"
            onClick={() => setMetricFilter('latency')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              metricFilter === 'latency'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Latency Trends Only (ms)
          </button>
          <button
            type="button"
            onClick={() => setMetricFilter('error_rate')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              metricFilter === 'error_rate'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Error Rates Only (%)
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Last fetched: {lastFetchedAt.toLocaleTimeString()}</span>
          <span>•</span>
          <span>{telemetryData.length} data points</span>
        </div>
      </div>

      {/* Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* /api/quiz/submit Summary Card */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <code className="text-xs font-mono font-black text-sky-300">
                POST /api/quiz/submit
              </code>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs font-mono tabular-nums">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Avg Latency</span>
                <span className="text-sm font-black text-white">{quizSummary?.avgLatencyMs ?? 0} ms</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">P95 Latency</span>
                <span className="text-sm font-black text-sky-300">{quizSummary?.p95LatencyMs ?? 0} ms</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Error Rate</span>
                <span
                  className={`text-sm font-black ${
                    (quizSummary?.errorRatePercent ?? 0) > 2
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {quizSummary?.errorRatePercent ?? 0}%
                </span>
              </div>
            </div>
          </div>
          <div className="text-right font-mono tabular-nums">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black ${
                (quizSummary?.lastStatus ?? 200) >= 400
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              HTTP {quizSummary?.lastStatus ?? 200}
            </span>
            <span className="block text-[11px] text-slate-400 mt-1">
              {quizSummary?.totalRequests ?? 0} reqs
            </span>
          </div>
        </div>

        {/* /api/payments/webhook Summary Card */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <code className="text-xs font-mono font-black text-emerald-300">
                POST /api/payments/webhook
              </code>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs font-mono tabular-nums">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Avg Latency</span>
                <span className="text-sm font-black text-white">{webhookSummary?.avgLatencyMs ?? 0} ms</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">P95 Latency</span>
                <span className="text-sm font-black text-emerald-300">{webhookSummary?.p95LatencyMs ?? 0} ms</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Error Rate</span>
                <span
                  className={`text-sm font-black ${
                    (webhookSummary?.errorRatePercent ?? 0) > 2
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {webhookSummary?.errorRatePercent ?? 0}%
                </span>
              </div>
            </div>
          </div>
          <div className="text-right font-mono tabular-nums">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black ${
                (webhookSummary?.lastStatus ?? 200) >= 400
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              HTTP {webhookSummary?.lastStatus ?? 200}
            </span>
            <span className="block text-[11px] text-slate-400 mt-1">
              {webhookSummary?.totalRequests ?? 0} reqs
            </span>
          </div>
        </div>
      </div>

      {/* Main Recharts LineChart Visualization */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            <span>
              {metricFilter === 'all' && 'Telemetry Line Chart: Latency (ms) & Error Rate (%)'}
              {metricFilter === 'latency' && 'Telemetry Line Chart: Request Latency Trends (ms)'}
              {metricFilter === 'error_rate' && 'Telemetry Line Chart: HTTP Error Rates (%)'}
            </span>
          </span>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            {metricFilter !== 'error_rate' && (
              <span className="text-amber-400">SLA: &lt;100ms</span>
            )}
            {metricFilter !== 'latency' && (
              <span className="text-rose-400">Err Alert: &gt;5%</span>
            )}
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={telemetryData}
              margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                dataKey="timestamp"
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                stroke="#334155"
              />

              {/* Left Y-Axis for Latency (ms) */}
              {(metricFilter === 'all' || metricFilter === 'latency') && (
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                  stroke="#334155"
                  unit="ms"
                  domain={[0, 'auto']}
                />
              )}

              {/* Right Y-Axis for Error Rate (%) */}
              {metricFilter === 'all' && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#F87171', fontSize: 10 }}
                  stroke="#7F1D1D"
                  unit="%"
                  domain={[0, 15]}
                />
              )}

              {metricFilter === 'error_rate' && (
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#F87171', fontSize: 10 }}
                  stroke="#7F1D1D"
                  unit="%"
                  domain={[0, 'auto']}
                />
              )}

              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B132B',
                  borderColor: '#334155',
                  borderRadius: '10px',
                  fontSize: '11px',
                  color: '#F8FAFC',
                }}
                formatter={(value: any, name: any) => {
                  if (typeof value === 'number') {
                    if (String(name).includes('Err %') || String(name).includes('Error')) {
                      return [`${value}%`, name];
                    }
                    return [`${value} ms`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />

              {/* SLA and Threshold Reference Lines */}
              {(metricFilter === 'all' || metricFilter === 'latency') && (
                <ReferenceLine
                  yAxisId="left"
                  y={100}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  label={{
                    value: '100ms SLA',
                    fill: '#F59E0B',
                    fontSize: 9,
                    position: 'insideTopRight',
                  }}
                />
              )}

              {(metricFilter === 'all' || metricFilter === 'error_rate') && (
                <ReferenceLine
                  yAxisId={metricFilter === 'all' ? 'right' : 'left'}
                  y={5}
                  stroke="#F43F5E"
                  strokeDasharray="4 4"
                  label={{
                    value: '5% Alert',
                    fill: '#F43F5E',
                    fontSize: 9,
                    position: 'insideTopLeft',
                  }}
                />
              )}

              {/* Lines for /api/quiz/submit and /api/payments/webhook latency */}
              {(metricFilter === 'all' || metricFilter === 'latency') && (
                <>
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="quizSubmitLatencyMs"
                    name="/api/quiz/submit (ms)"
                    stroke="#38BDF8"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: '#38BDF8' }}
                    activeDot={{ r: 5, fill: '#38BDF8' }}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="paymentsWebhookLatencyMs"
                    name="/api/payments/webhook (ms)"
                    stroke="#34D399"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: '#34D399' }}
                    activeDot={{ r: 5, fill: '#34D399' }}
                    isAnimationActive={false}
                  />
                </>
              )}

              {/* Lines for /api/quiz/submit and /api/payments/webhook error rates */}
              {metricFilter === 'all' && (
                <>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="quizSubmitErrorRate"
                    name="/api/quiz/submit Err %"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={{ r: 2, fill: '#F59E0B' }}
                    activeDot={{ r: 4, fill: '#F59E0B' }}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="paymentsWebhookErrorRate"
                    name="/api/payments/webhook Err %"
                    stroke="#F43F5E"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={{ r: 2, fill: '#F43F5E' }}
                    activeDot={{ r: 4, fill: '#F43F5E' }}
                    isAnimationActive={false}
                  />
                </>
              )}

              {metricFilter === 'error_rate' && (
                <>
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="quizSubmitErrorRate"
                    name="/api/quiz/submit Err %"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#F59E0B' }}
                    activeDot={{ r: 5, fill: '#F59E0B' }}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="paymentsWebhookErrorRate"
                    name="/api/payments/webhook Err %"
                    stroke="#F43F5E"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#F43F5E' }}
                    activeDot={{ r: 5, fill: '#F43F5E' }}
                    isAnimationActive={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
