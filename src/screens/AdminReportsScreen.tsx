import React, { useEffect, useState } from 'react';
import {
  api,
  loadSession,
  type ArrearsReport,
  type CashflowReport,
  type DailyTransactionsReport,
  type InstallmentReport,
  type LoanReport,
  type MemberDetailReport,
  type MemberReport,
  type MonthlyRecapReport,
  type SavingsReport,
  type SummaryReport,
} from '@/api';
import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useUiFeedback } from '@/components/ui/FeedbackProvider';
import { useData, getUserFacingError } from '@/context/DataContext';
import { exportRowsToCsv, openPrintReport } from '@/lib/reportExport';
import { formatDate, formatRupiah } from '@/lib/utils';
import {
  AlertTriangle,
  BarChart3,
  Download,
  FileSpreadsheet,
  Filter,
  Printer,
  RefreshCcw,
  Search,
  Wallet,
} from 'lucide-react';

type ReportTab =
  | 'ringkasan'
  | 'anggota'
  | 'simpanan'
  | 'pinjaman'
  | 'angsuran'
  | 'tunggakan'
  | 'kas'
  | 'transaksi_harian'
  | 'rekap_bulanan'
  | 'detail_anggota';

type ReportFilters = {
  startDate: string;
  endDate: string;
  query: string;
  memberStatus: 'Semua' | 'Aktif' | 'Nonaktif';
  loanStatus: 'Semua' | 'Ada Pinjaman' | 'Tanpa Pinjaman' | 'Lancar' | 'Menunggak' | 'Lunas';
  delinquencyStatus: 'Semua' | 'Lancar' | 'Menunggak' | 'Tanpa Pinjaman';
  savingsType: 'Semua' | 'Simpanan Pokok' | 'Simpanan Wajib' | 'Simpanan Sukarela';
  installmentStatus: 'Semua' | 'Berhasil' | 'Jatuh Tempo' | 'Menunggak';
  agingBucket: 'Semua' | '1–7 hari' | '8–30 hari' | 'Lebih dari 30 hari';
  cashCategory: 'Semua' | 'Simpanan Masuk' | 'Angsuran Masuk' | 'Pencairan Pinjaman' | 'Biaya Operasional';
  cashDirection: 'Semua' | 'Masuk' | 'Keluar';
  dailyDate: string;
  month: string;
  joinedFrom: string;
  joinedTo: string;
  selectedMemberCode: string;
  selectedLoanCode: string;
};

type ReportDataMap = {
  ringkasan?: SummaryReport;
  anggota?: MemberReport;
  simpanan?: SavingsReport;
  pinjaman?: LoanReport;
  angsuran?: InstallmentReport;
  tunggakan?: ArrearsReport;
  kas?: CashflowReport;
  transaksi_harian?: DailyTransactionsReport;
  rekap_bulanan?: MonthlyRecapReport;
  detail_anggota?: MemberDetailReport | null;
};

const reportTabs: Array<{ id: ReportTab; label: string }> = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'anggota', label: 'Anggota' },
  { id: 'simpanan', label: 'Simpanan' },
  { id: 'pinjaman', label: 'Pinjaman' },
  { id: 'angsuran', label: 'Angsuran' },
  { id: 'tunggakan', label: 'Tunggakan' },
  { id: 'kas', label: 'Kas' },
  { id: 'transaksi_harian', label: 'Harian' },
  { id: 'rekap_bulanan', label: 'Bulanan' },
  { id: 'detail_anggota', label: 'Detail Anggota' },
];

const toInputDate = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toMonthInput = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

const createDefaultFilters = (): ReportFilters => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    startDate: toInputDate(firstDay),
    endDate: toInputDate(now),
    query: '',
    memberStatus: 'Semua',
    loanStatus: 'Semua',
    delinquencyStatus: 'Semua',
    savingsType: 'Semua',
    installmentStatus: 'Semua',
    agingBucket: 'Semua',
    cashCategory: 'Semua',
    cashDirection: 'Semua',
    dailyDate: toInputDate(now),
    month: toMonthInput(now),
    joinedFrom: '',
    joinedTo: '',
    selectedMemberCode: '',
    selectedLoanCode: '',
  };
};

const toneToBadge = (value: string) => {
  if (value.includes('Menunggak')) return 'danger' as const;
  if (value.includes('Lunas') || value.includes('Aktif') || value.includes('Lancar')) return 'success' as const;
  if (value.includes('Jatuh Tempo')) return 'warning' as const;
  return 'default' as const;
};

const EmptyState: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <Card>
    <CardContent className="p-8 text-center">
      <BarChart3 size={28} className="mx-auto mb-3 text-gray-300" />
      <p className="font-medium text-gray-700">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </CardContent>
  </Card>
);

const LoadingState: React.FC = () => (
  <div className="space-y-3">
    {[0, 1, 2].map((item) => (
      <Card key={item}>
        <CardContent className="p-4">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-6 w-40 animate-pulse rounded bg-gray-100" />
          <div className="mt-4 h-16 animate-pulse rounded-xl bg-gray-50" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const StatCard: React.FC<{
  label: string;
  value: string;
  caption?: string;
}> = ({ label, value, caption }) => (
  <Card>
    <CardContent className="p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-gray-900">{value}</p>
      {caption && <p className="mt-1 text-xs text-gray-500">{caption}</p>}
    </CardContent>
  </Card>
);

const FilterSheet: React.FC<{
  open: boolean;
  activeReport: ReportTab;
  filters: ReportFilters;
  memberOptions: Array<{ id: string; name: string }>;
  onChange: (next: Partial<ReportFilters>) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}> = ({ open, activeReport, filters, memberOptions, onChange, onApply, onReset, onClose }) => {
  if (!open) return null;

  const showDateRange = ['ringkasan', 'simpanan', 'pinjaman', 'angsuran', 'kas'].includes(activeReport);

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/35 px-4 pb-6 pt-10 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-auto mt-auto w-full max-w-md rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Filter Laporan</h3>
          <p className="text-sm text-gray-500">Sesuaikan data yang ingin ditampilkan.</p>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
          {showDateRange && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Tanggal Mulai" type="date" value={filters.startDate} onChange={(event) => onChange({ startDate: event.target.value })} />
              <Input label="Tanggal Akhir" type="date" value={filters.endDate} onChange={(event) => onChange({ endDate: event.target.value })} />
            </div>
          )}

          {['anggota', 'pinjaman', 'angsuran', 'tunggakan'].includes(activeReport) && (
            <Input
              label="Cari Data"
              placeholder="Nama anggota, nomor anggota, atau nomor pinjaman"
              value={filters.query}
              onChange={(event) => onChange({ query: event.target.value })}
              leftIcon={<Search size={18} />}
            />
          )}

          {activeReport === 'anggota' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <select className="h-12 rounded-xl border border-gray-300 px-3 text-sm" value={filters.memberStatus} onChange={(event) => onChange({ memberStatus: event.target.value as ReportFilters['memberStatus'] })}>
                  <option value="Semua">Semua Status Anggota</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
                <select className="h-12 rounded-xl border border-gray-300 px-3 text-sm" value={filters.loanStatus} onChange={(event) => onChange({ loanStatus: event.target.value as ReportFilters['loanStatus'] })}>
                  <option value="Semua">Semua Pinjaman</option>
                  <option value="Ada Pinjaman">Ada Pinjaman</option>
                  <option value="Tanpa Pinjaman">Tanpa Pinjaman</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Gabung Dari" type="date" value={filters.joinedFrom} onChange={(event) => onChange({ joinedFrom: event.target.value })} />
                <Input label="Gabung Sampai" type="date" value={filters.joinedTo} onChange={(event) => onChange({ joinedTo: event.target.value })} />
              </div>
              <select className="h-12 w-full rounded-xl border border-gray-300 px-3 text-sm" value={filters.delinquencyStatus} onChange={(event) => onChange({ delinquencyStatus: event.target.value as ReportFilters['delinquencyStatus'] })}>
                <option value="Semua">Semua Status Tunggakan</option>
                <option value="Lancar">Lancar</option>
                <option value="Menunggak">Menunggak</option>
                <option value="Tanpa Pinjaman">Tanpa Pinjaman</option>
              </select>
            </>
          )}

          {activeReport === 'simpanan' && (
            <>
              <select className="h-12 w-full rounded-xl border border-gray-300 px-3 text-sm" value={filters.selectedMemberCode} onChange={(event) => onChange({ selectedMemberCode: event.target.value })}>
                <option value="">Semua Anggota</option>
                {memberOptions.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
              <select className="h-12 w-full rounded-xl border border-gray-300 px-3 text-sm" value={filters.savingsType} onChange={(event) => onChange({ savingsType: event.target.value as ReportFilters['savingsType'] })}>
                <option value="Semua">Semua Jenis Simpanan</option>
                <option value="Simpanan Pokok">Simpanan Pokok</option>
                <option value="Simpanan Wajib">Simpanan Wajib</option>
                <option value="Simpanan Sukarela">Simpanan Sukarela</option>
              </select>
            </>
          )}

          {activeReport === 'pinjaman' && (
            <select className="h-12 w-full rounded-xl border border-gray-300 px-3 text-sm" value={filters.loanStatus} onChange={(event) => onChange({ loanStatus: event.target.value as ReportFilters['loanStatus'] })}>
              <option value="Semua">Semua Status Pinjaman</option>
              <option value="Lancar">Lancar</option>
              <option value="Menunggak">Menunggak</option>
              <option value="Lunas">Lunas</option>
            </select>
          )}

          {activeReport === 'angsuran' && (
            <>
              <Input label="Nomor Pinjaman" placeholder="Contoh: PJ-2026-001" value={filters.selectedLoanCode} onChange={(event) => onChange({ selectedLoanCode: event.target.value })} />
              <select className="h-12 w-full rounded-xl border border-gray-300 px-3 text-sm" value={filters.installmentStatus} onChange={(event) => onChange({ installmentStatus: event.target.value as ReportFilters['installmentStatus'] })}>
                <option value="Semua">Semua Status</option>
                <option value="Berhasil">Berhasil</option>
                <option value="Jatuh Tempo">Jatuh Tempo</option>
                <option value="Menunggak">Menunggak</option>
              </select>
            </>
          )}

          {activeReport === 'tunggakan' && (
            <select className="h-12 w-full rounded-xl border border-gray-300 px-3 text-sm" value={filters.agingBucket} onChange={(event) => onChange({ agingBucket: event.target.value as ReportFilters['agingBucket'] })}>
              <option value="Semua">Semua Umur Tunggakan</option>
              <option value="1–7 hari">1–7 hari</option>
              <option value="8–30 hari">8–30 hari</option>
              <option value="Lebih dari 30 hari">Lebih dari 30 hari</option>
            </select>
          )}

          {activeReport === 'kas' && (
            <>
              <select className="h-12 w-full rounded-xl border border-gray-300 px-3 text-sm" value={filters.cashCategory} onChange={(event) => onChange({ cashCategory: event.target.value as ReportFilters['cashCategory'] })}>
                <option value="Semua">Semua Kategori Kas</option>
                <option value="Simpanan Masuk">Simpanan Masuk</option>
                <option value="Angsuran Masuk">Angsuran Masuk</option>
                <option value="Pencairan Pinjaman">Pencairan Pinjaman</option>
                <option value="Biaya Operasional">Biaya Operasional</option>
              </select>
              <select className="h-12 w-full rounded-xl border border-gray-300 px-3 text-sm" value={filters.cashDirection} onChange={(event) => onChange({ cashDirection: event.target.value as ReportFilters['cashDirection'] })}>
                <option value="Semua">Semua Arus Kas</option>
                <option value="Masuk">Masuk</option>
                <option value="Keluar">Keluar</option>
              </select>
            </>
          )}

          {activeReport === 'transaksi_harian' && (
            <Input label="Tanggal Laporan" type="date" value={filters.dailyDate} onChange={(event) => onChange({ dailyDate: event.target.value })} />
          )}

          {activeReport === 'rekap_bulanan' && (
            <Input label="Bulan Laporan" type="month" value={filters.month} onChange={(event) => onChange({ month: event.target.value })} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-5 py-4">
          <Button variant="outline" onClick={onReset}>Reset Filter</Button>
          <Button onClick={onApply}>Terapkan</Button>
        </div>
      </div>
    </div>
  );
};

export const AdminReportsScreen: React.FC = () => {
  const { currentData } = useData();
  const { notifyError, notifyInfo, notifySuccess } = useUiFeedback();
  const memberOptions =
    currentData && 'members' in currentData
      ? currentData.members.map((member) => ({ id: member.id, name: member.name }))
      : [];
  const [activeReport, setActiveReport] = useState<ReportTab>('ringkasan');
  const [reportData, setReportData] = useState<ReportDataMap>({});
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>(createDefaultFilters);
  const [draftFilters, setDraftFilters] = useState<ReportFilters>(createDefaultFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (activeReport === 'detail_anggota' && !appliedFilters.selectedMemberCode && memberOptions[0]) {
      setAppliedFilters((current) => ({ ...current, selectedMemberCode: memberOptions[0].id }));
      setDraftFilters((current) => ({ ...current, selectedMemberCode: memberOptions[0].id }));
    }
  }, [activeReport, appliedFilters.selectedMemberCode, memberOptions]);

  useEffect(() => {
    const session = loadSession();
    if (!session) return;

    const loadReport = async () => {
      setLoading(true);
      setError(null);

      try {
        switch (activeReport) {
          case 'ringkasan': {
            const data = await api.getSummaryReport(session.token, {
              startDate: appliedFilters.startDate,
              endDate: appliedFilters.endDate,
            });
            setReportData((current) => ({ ...current, ringkasan: data }));
            break;
          }
          case 'anggota': {
            const data = await api.getMembersReport(session.token, {
              query: appliedFilters.query || undefined,
              status: appliedFilters.memberStatus,
              joinedFrom: appliedFilters.joinedFrom || undefined,
              joinedTo: appliedFilters.joinedTo || undefined,
              loanStatus:
                appliedFilters.loanStatus === 'Lancar' ||
                appliedFilters.loanStatus === 'Menunggak' ||
                appliedFilters.loanStatus === 'Lunas'
                  ? 'Semua'
                  : appliedFilters.loanStatus,
              delinquencyStatus: appliedFilters.delinquencyStatus,
            });
            setReportData((current) => ({ ...current, anggota: data }));
            break;
          }
          case 'simpanan': {
            const data = await api.getSavingsReport(session.token, {
              startDate: appliedFilters.startDate,
              endDate: appliedFilters.endDate,
              memberCode: appliedFilters.selectedMemberCode || undefined,
              savingsType: appliedFilters.savingsType,
            });
            setReportData((current) => ({ ...current, simpanan: data }));
            break;
          }
          case 'pinjaman': {
            const data = await api.getLoansReport(session.token, {
              startDate: appliedFilters.startDate,
              endDate: appliedFilters.endDate,
              query: appliedFilters.query || undefined,
              status:
                appliedFilters.loanStatus === 'Ada Pinjaman' ||
                appliedFilters.loanStatus === 'Tanpa Pinjaman'
                  ? 'Semua'
                  : appliedFilters.loanStatus,
            });
            setReportData((current) => ({ ...current, pinjaman: data }));
            break;
          }
          case 'angsuran': {
            const data = await api.getInstallmentsReport(session.token, {
              startDate: appliedFilters.startDate,
              endDate: appliedFilters.endDate,
              query: appliedFilters.query || undefined,
              loanCode: appliedFilters.selectedLoanCode || undefined,
              status: appliedFilters.installmentStatus,
            });
            setReportData((current) => ({ ...current, angsuran: data }));
            break;
          }
          case 'tunggakan': {
            const data = await api.getArrearsReport(session.token, {
              query: appliedFilters.query || undefined,
              agingBucket: appliedFilters.agingBucket,
            });
            setReportData((current) => ({ ...current, tunggakan: data }));
            break;
          }
          case 'kas': {
            const data = await api.getCashflowReport(session.token, {
              startDate: appliedFilters.startDate,
              endDate: appliedFilters.endDate,
              category: appliedFilters.cashCategory,
              direction: appliedFilters.cashDirection,
            });
            setReportData((current) => ({ ...current, kas: data }));
            break;
          }
          case 'transaksi_harian': {
            const data = await api.getDailyTransactionsReport(session.token, {
              date: appliedFilters.dailyDate,
            });
            setReportData((current) => ({ ...current, transaksi_harian: data }));
            break;
          }
          case 'rekap_bulanan': {
            const data = await api.getMonthlyRecapReport(session.token, {
              month: appliedFilters.month,
            });
            setReportData((current) => ({ ...current, rekap_bulanan: data }));
            break;
          }
          case 'detail_anggota': {
            if (!appliedFilters.selectedMemberCode) {
              setReportData((current) => ({ ...current, detail_anggota: null }));
              break;
            }
            const data = await api.getMemberDetailReport(session.token, appliedFilters.selectedMemberCode);
            setReportData((current) => ({ ...current, detail_anggota: data }));
            break;
          }
        }
      } catch (reportError) {
        setError(getUserFacingError(reportError));
      } finally {
        setLoading(false);
      }
    };

    void loadReport();
  }, [activeReport, appliedFilters]);

  const activeData = reportData[activeReport];

  const filterSummary: string[] = [];
  if (['ringkasan', 'simpanan', 'pinjaman', 'angsuran', 'kas'].includes(activeReport)) {
    filterSummary.push(`${appliedFilters.startDate} s.d. ${appliedFilters.endDate}`);
  }
  if (activeReport === 'anggota' && appliedFilters.query) filterSummary.push(`Cari: ${appliedFilters.query}`);
  if (activeReport === 'pinjaman' && appliedFilters.loanStatus !== 'Semua') filterSummary.push(appliedFilters.loanStatus);
  if (activeReport === 'tunggakan' && appliedFilters.agingBucket !== 'Semua') filterSummary.push(appliedFilters.agingBucket);
  if (activeReport === 'kas' && appliedFilters.cashCategory !== 'Semua') filterSummary.push(appliedFilters.cashCategory);
  if (activeReport === 'transaksi_harian') filterSummary.push(appliedFilters.dailyDate);
  if (activeReport === 'rekap_bulanan') filterSummary.push(appliedFilters.month);
  if (activeReport === 'detail_anggota' && appliedFilters.selectedMemberCode) filterSummary.push(appliedFilters.selectedMemberCode);

  const resetFilters = () => {
    const defaults = createDefaultFilters();
    if (memberOptions[0]) {
      defaults.selectedMemberCode = memberOptions[0].id;
    }
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
  };

  const handleExportExcel = () => {
    if (!activeData) return;

    switch (activeReport) {
      case 'ringkasan':
        exportRowsToCsv({
          filename: 'laporan-ringkasan.csv',
          headers: ['Label', 'Nilai'],
          rows: Object.entries(activeData.metrics).map(([label, value]) => [label, String(value)]),
        });
        break;
      case 'anggota':
        exportRowsToCsv({
          filename: 'laporan-anggota.csv',
          headers: ['No. Anggota', 'Nama', 'Status', 'Tanggal Gabung', 'Total Simpanan', 'Status Tunggakan'],
          rows: activeData.items.map((item) => [item.memberCode, item.name, item.status, item.joinedDate, item.totalSavings, item.delinquencyStatus]),
        });
        break;
      case 'simpanan':
        exportRowsToCsv({
          filename: 'laporan-simpanan.csv',
          headers: ['Tanggal', 'Kode', 'Anggota', 'Jenis Simpanan', 'Nominal', 'Status'],
          rows: activeData.transactions.map((item) => [item.date, item.transactionCode, item.memberName, item.savingsType, item.amount, item.status]),
        });
        break;
      case 'pinjaman':
        exportRowsToCsv({
          filename: 'laporan-pinjaman.csv',
          headers: ['No. Pinjaman', 'Anggota', 'Tanggal Cair', 'Nominal', 'Sisa', 'Status'],
          rows: activeData.items.map((item) => [item.loanCode, item.memberName, item.dateDisbursed, item.principalAmount, item.remainingAmount, item.status]),
        });
        break;
      case 'angsuran':
        exportRowsToCsv({
          filename: 'laporan-angsuran.csv',
          headers: ['Tanggal Bayar', 'No. Pinjaman', 'Anggota', 'Nominal', 'Metode', 'Status'],
          rows: activeData.payments.map((item) => [item.paymentDate, item.loanCode, item.memberName, item.amount, item.method, item.status]),
        });
        break;
      case 'tunggakan':
        exportRowsToCsv({
          filename: 'laporan-tunggakan.csv',
          headers: ['No. Pinjaman', 'Anggota', 'Jatuh Tempo', 'Umur Tunggakan', 'Jumlah Tunggakan', 'Bucket'],
          rows: activeData.items.map((item) => [item.loanCode, item.memberName, item.nextDueDate, `${item.daysOverdue} hari`, item.amountDue, item.agingBucket]),
        });
        break;
      case 'kas':
        exportRowsToCsv({
          filename: 'laporan-kas.csv',
          headers: ['Tanggal', 'Kode', 'Kategori', 'Arus', 'Nominal', 'Keterangan'],
          rows: activeData.items.map((item) => [item.date, item.code, item.category, item.direction, item.amount, item.description]),
        });
        break;
      case 'transaksi_harian':
        exportRowsToCsv({
          filename: 'laporan-transaksi-harian.csv',
          headers: ['Jam', 'Kode', 'Jenis', 'Anggota', 'Nominal', 'Arus', 'Status'],
          rows: activeData.items.map((item) => [item.timeLabel, item.code, item.type, item.memberName, item.amount, item.direction, item.status]),
        });
        break;
      case 'rekap_bulanan':
        exportRowsToCsv({
          filename: 'laporan-rekap-bulanan.csv',
          headers: ['Label', 'Nilai'],
          rows: Object.entries(activeData.summary).map(([label, value]) => [label, String(value)]),
        });
        break;
      case 'detail_anggota':
        exportRowsToCsv({
          filename: `laporan-detail-${activeData.member.memberCode}.csv`,
          headers: ['Tanggal', 'Jenis', 'Nominal', 'Status'],
          rows: activeData.recentTransactions.map((item) => [item.date, item.type, item.amount, item.status]),
        });
        break;
    }

    notifySuccess('Unduh Excel berhasil', 'File CSV sudah diunduh dan bisa dibuka di Excel.');
  };

  const handlePrint = (mode: 'print' | 'pdf') => {
    if (!activeData) return;
    const title = reportTabs.find((item) => item.id === activeReport)?.label ?? 'Laporan';
    try {
      if (activeReport === 'anggota') {
        openPrintReport({
          title: `Laporan ${title}`,
          subtitle: 'Daftar anggota koperasi',
          headers: ['No. Anggota', 'Nama', 'Status', 'Tanggal Gabung', 'Total Simpanan', 'Status Tunggakan'],
          rows: activeData.items.map((item) => [item.memberCode, item.name, item.status, item.joinedDate, formatRupiah(item.totalSavings), item.delinquencyStatus]),
        });
      } else if (activeReport === 'pinjaman') {
        openPrintReport({
          title: `Laporan ${title}`,
          subtitle: 'Daftar pinjaman per periode',
          headers: ['No. Pinjaman', 'Anggota', 'Tanggal Cair', 'Nominal', 'Sisa', 'Status'],
          rows: activeData.items.map((item) => [item.loanCode, item.memberName, item.dateDisbursed, formatRupiah(item.principalAmount), formatRupiah(item.remainingAmount), item.status]),
        });
      } else if (activeReport === 'rekap_bulanan') {
        openPrintReport({
          title: `Laporan ${title}`,
          subtitle: `Periode ${activeData.month}`,
          headers: ['Label', 'Nilai'],
          rows: Object.entries(activeData.summary).map(([label, value]) => [label, String(value)]),
        });
      } else {
        openPrintReport({
          title: `Laporan ${title}`,
          subtitle: 'Gunakan opsi browser untuk menyimpan PDF atau mencetak.',
          headers: ['Keterangan', 'Nilai'],
          rows: [['Filter aktif', filterSummary.join(', ') || 'Standar']],
        });
      }

      if (mode === 'pdf') {
        notifyInfo('Dialog PDF dibuka', 'Pilih "Simpan sebagai PDF" pada dialog cetak browser.');
      }
    } catch (printError) {
      notifyError('Gagal membuka tampilan cetak', getUserFacingError(printError));
    }
  };

  const renderReportContent = () => {
    if (loading) return <LoadingState />;
    if (error) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle size={28} className="mx-auto mb-3 text-red-400" />
            <p className="font-medium text-gray-900">Gagal memuat laporan</p>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <Button className="mt-4" onClick={() => setAppliedFilters({ ...appliedFilters })}>Coba Lagi</Button>
          </CardContent>
        </Card>
      );
    }

    if (!activeData) {
      return <EmptyState title="Belum ada data" description="Silakan pilih laporan atau atur filter." />;
    }

    if (activeReport === 'ringkasan') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Anggota Aktif" value={`${activeData.metrics.totalActiveMembers}`} />
            <StatCard label="Total Simpanan" value={formatRupiah(activeData.metrics.totalSavings)} />
            <StatCard label="Pinjaman Aktif" value={formatRupiah(activeData.metrics.totalActiveLoans)} />
            <StatCard label="Angsuran Hari Ini" value={formatRupiah(activeData.metrics.totalInstallmentsToday)} />
            <StatCard label="Total Tunggakan" value={formatRupiah(activeData.metrics.totalArrears)} />
            <StatCard label="Saldo Kas" value={formatRupiah(activeData.metrics.cashBalance)} />
            <StatCard label="Pinjaman Cair Bulan Ini" value={formatRupiah(activeData.metrics.loansDisbursedThisMonth)} />
            <StatCard label="Simpanan Masuk Bulan Ini" value={formatRupiah(activeData.metrics.savingsInThisMonth)} />
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {[
                  `Pengajuan menunggu ${activeData.quickStats.pendingApplications}`,
                  `Jatuh tempo hari ini ${activeData.quickStats.dueToday}`,
                  `Pinjaman menunggak ${activeData.quickStats.delinquentLoans}`,
                  `Anggota nonaktif ${activeData.quickStats.inactiveMembers}`,
                ].map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeReport === 'anggota') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Anggota" value={`${activeData.summary.totalMembers}`} />
            <StatCard label="Anggota Aktif" value={`${activeData.summary.activeMembers}`} />
            <StatCard label="Anggota Nonaktif" value={`${activeData.summary.inactiveMembers}`} />
            <StatCard label="Anggota Menunggak" value={`${activeData.summary.membersInArrears}`} />
          </div>
          {activeData.items.length === 0 ? <EmptyState title="Data tidak ditemukan" description="Belum ada anggota yang sesuai dengan filter." /> : activeData.items.map((item) => (
            <Card key={item.memberCode}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.memberCode} • Bergabung {formatDate(item.joinedDate)}</p>
                  </div>
                  <Badge variant={toneToBadge(item.delinquencyStatus)}>{item.delinquencyStatus}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500">Status</p><p className="font-medium">{item.status}</p></div>
                  <div><p className="text-gray-500">Total Simpanan</p><p className="font-medium">{formatRupiah(item.totalSavings)}</p></div>
                  <div><p className="text-gray-500">Pinjaman Aktif</p><p className="font-medium">{item.activeLoanCount}</p></div>
                  <div><p className="text-gray-500">Nilai Pinjaman</p><p className="font-medium">{formatRupiah(item.activeLoanAmount)}</p></div>
                </div>
                <Button variant="outline" className="mt-4 w-full" onClick={() => { setActiveReport('detail_anggota'); setAppliedFilters((current) => ({ ...current, selectedMemberCode: item.memberCode })); setDraftFilters((current) => ({ ...current, selectedMemberCode: item.memberCode })); }}>Lihat Detail</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (activeReport === 'simpanan') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Simpanan Periode" value={formatRupiah(activeData.summary.periodTotal)} />
            <StatCard label="Jumlah Transaksi" value={`${activeData.summary.transactionCount}`} />
            <StatCard label="Total Pokok" value={formatRupiah(activeData.summary.totalPokok)} />
            <StatCard label="Total Wajib + Sukarela" value={formatRupiah(activeData.summary.totalWajib + activeData.summary.totalSukarela)} />
          </div>
          {activeData.transactions.length === 0 ? <EmptyState title="Belum ada transaksi simpanan" /> : activeData.transactions.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-sm font-medium text-gray-900">{item.memberName}</p><p className="text-xs text-gray-500">{item.transactionCode} • {formatDate(item.date)}</p></div>
                  <Badge>{item.savingsType}</Badge>
                </div>
                <p className="mt-3 font-semibold text-emerald-700">{formatRupiah(item.amount)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (activeReport === 'pinjaman') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Pinjaman Aktif" value={`${activeData.summary.activeCount}`} />
            <StatCard label="Pinjaman Lunas" value={`${activeData.summary.completedCount}`} />
            <StatCard label="Pencairan Periode" value={formatRupiah(activeData.summary.disbursedTotal)} />
            <StatCard label="Sisa Pinjaman" value={formatRupiah(activeData.summary.remainingTotal)} />
          </div>
          {activeData.items.length === 0 ? <EmptyState title="Belum ada data pinjaman" /> : activeData.items.map((item) => (
            <Card key={item.loanId}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-semibold text-gray-900">{item.memberName}</p><p className="text-xs text-gray-500">{item.loanCode} • Cair {formatDate(item.dateDisbursed)}</p></div>
                  <Badge variant={toneToBadge(item.status)}>{item.status}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500">Nominal</p><p className="font-medium">{formatRupiah(item.principalAmount)}</p></div>
                  <div><p className="text-gray-500">Sisa</p><p className="font-medium">{formatRupiah(item.remainingAmount)}</p></div>
                  <div><p className="text-gray-500">Angsuran</p><p className="font-medium">{formatRupiah(item.installmentAmount)}</p></div>
                  <div><p className="text-gray-500">Tenor</p><p className="font-medium">{item.paidMonths}/{item.tenor} bulan</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (activeReport === 'angsuran') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Angsuran Hari Ini" value={formatRupiah(activeData.summary.paymentsToday)} />
            <StatCard label="Angsuran Bulan Ini" value={formatRupiah(activeData.summary.paymentsThisMonth)} />
            <StatCard label="Pembayaran Masuk" value={`${activeData.summary.paymentCount}`} />
            <StatCard label="Jatuh Tempo/Tunggakan" value={`${activeData.summary.dueSoonCount}`} />
          </div>
          <Card><CardContent className="p-4"><p className="font-semibold text-gray-900">Pembayaran Angsuran</p><div className="mt-3 space-y-3">{activeData.payments.length === 0 && <p className="text-sm text-gray-500">Belum ada pembayaran angsuran.</p>}{activeData.payments.map((item) => (<div key={item.paymentId} className="rounded-xl border border-gray-100 px-3 py-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-gray-900">{item.memberName}</p><p className="text-xs text-gray-500">{item.loanCode} • {formatDate(item.paymentDate)}</p></div><Badge variant="success">{item.method}</Badge></div><p className="mt-3 font-semibold text-emerald-700">{formatRupiah(item.amount)}</p></div>))}</div></CardContent></Card>
          <Card><CardContent className="p-4"><p className="font-semibold text-gray-900">Jatuh Tempo dan Tunggakan</p><div className="mt-3 space-y-3">{activeData.dueItems.length === 0 && <p className="text-sm text-gray-500">Tidak ada pinjaman jatuh tempo.</p>}{activeData.dueItems.map((item) => (<div key={item.loanId} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-3"><div><p className="text-sm font-medium text-gray-900">{item.memberName}</p><p className="text-xs text-gray-500">{item.loanCode} • {formatDate(item.nextDueDate)}</p></div><Badge variant={toneToBadge(item.status)}>{item.status}</Badge></div>))}</div></CardContent></Card>
        </div>
      );
    }

    if (activeReport === 'tunggakan') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Pinjaman Menunggak" value={`${activeData.summary.totalLoans}`} />
            <StatCard label="Anggota Menunggak" value={`${activeData.summary.totalMembers}`} />
            <StatCard label="Bucket 1–7 Hari" value={`${activeData.summary.bucket1To7}`} />
            <StatCard label="Total Tunggakan" value={formatRupiah(activeData.summary.totalAmountDue)} />
          </div>
          {activeData.items.length === 0 ? <EmptyState title="Tidak ada tunggakan" description="Tidak ada pinjaman yang menunggak pada filter ini." /> : activeData.items.map((item) => (
            <Card key={item.loanId}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-semibold text-gray-900">{item.memberName}</p><p className="text-xs text-gray-500">{item.loanCode} • Jatuh tempo {formatDate(item.nextDueDate)}</p></div>
                  <Badge variant={toneToBadge(item.agingBucket)}>{item.agingBucket}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500">Umur Tunggakan</p><p className="font-medium">{item.daysOverdue} hari</p></div>
                  <div><p className="text-gray-500">Jumlah Tunggakan</p><p className="font-medium">{formatRupiah(item.amountDue)}</p></div>
                </div>
                <Button variant="outline" className="mt-4 w-full" onClick={() => { setActiveReport('detail_anggota'); setAppliedFilters((current) => ({ ...current, selectedMemberCode: item.memberCode })); setDraftFilters((current) => ({ ...current, selectedMemberCode: item.memberCode })); }}>Lihat Detail Anggota</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (activeReport === 'kas') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Saldo Awal" value={formatRupiah(activeData.summary.openingBalance)} />
            <StatCard label="Kas Masuk" value={formatRupiah(activeData.summary.cashIn)} />
            <StatCard label="Kas Keluar" value={formatRupiah(activeData.summary.cashOut)} />
            <StatCard label="Saldo Akhir" value={formatRupiah(activeData.summary.closingBalance)} />
          </div>
          {activeData.items.length === 0 ? <EmptyState title="Belum ada transaksi kas" /> : activeData.items.map((item) => (
            <Card key={`${item.code}-${item.date}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-semibold text-gray-900">{item.category}</p><p className="text-xs text-gray-500">{item.code} • {formatDate(item.date)}</p></div>
                  <Badge variant={item.direction === 'Masuk' ? 'success' : 'warning'}>{item.direction}</Badge>
                </div>
                <p className="mt-3 text-sm text-gray-600">{item.description}</p>
                <p className="mt-2 font-semibold text-gray-900">{formatRupiah(item.amount)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (activeReport === 'transaksi_harian') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Simpanan Masuk" value={formatRupiah(activeData.summary.savingsIn)} />
            <StatCard label="Angsuran Dibayar" value={formatRupiah(activeData.summary.installmentsPaid)} />
            <StatCard label="Kas Masuk" value={formatRupiah(activeData.summary.cashIn)} />
            <StatCard label="Kas Keluar" value={formatRupiah(activeData.summary.cashOut)} />
          </div>
          {activeData.items.length === 0 ? <EmptyState title="Belum ada transaksi harian" /> : activeData.items.map((item) => (
            <Card key={item.code}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-semibold text-gray-900">{item.type}</p><p className="text-xs text-gray-500">{item.memberName || '-'} • {item.timeLabel}</p></div>
                  <Badge variant={item.direction === 'Masuk' ? 'success' : 'warning'}>{item.direction}</Badge>
                </div>
                <p className="mt-3 font-semibold text-gray-900">{formatRupiah(item.amount)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (activeReport === 'rekap_bulanan') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Simpanan" value={formatRupiah(activeData.summary.totalSavings)} />
            <StatCard label="Pinjaman Cair" value={formatRupiah(activeData.summary.totalLoansDisbursed)} />
            <StatCard label="Total Angsuran" value={formatRupiah(activeData.summary.totalInstallments)} />
            <StatCard label="Tunggakan" value={formatRupiah(activeData.summary.totalArrears)} />
            <StatCard label="Kas Masuk" value={formatRupiah(activeData.summary.cashIn)} />
            <StatCard label="Kas Keluar" value={formatRupiah(activeData.summary.cashOut)} />
            <StatCard label="Anggota Baru" value={`${activeData.summary.newMembers}`} />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <select className="h-12 w-full rounded-xl border border-gray-300 px-3 text-sm" value={appliedFilters.selectedMemberCode} onChange={(event) => { setAppliedFilters((current) => ({ ...current, selectedMemberCode: event.target.value })); setDraftFilters((current) => ({ ...current, selectedMemberCode: event.target.value })); }}>
              {memberOptions.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
            <div className="mt-4"><p className="text-xs text-gray-500">Nomor Anggota</p><p className="font-semibold text-gray-900">{activeData.member.memberCode}</p></div>
            <div className="mt-3"><p className="text-xs text-gray-500">Kontak</p><p className="font-semibold text-gray-900">{activeData.member.phone}</p></div>
            <Badge className="mt-3" variant={toneToBadge(activeData.summary.delinquencyStatus)}>{activeData.summary.delinquencyStatus}</Badge>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total Simpanan" value={formatRupiah(activeData.summary.totalSavings)} />
          <StatCard label="Total Pinjaman" value={formatRupiah(activeData.summary.totalLoans)} />
          <StatCard label="Pinjaman Aktif" value={`${activeData.summary.activeLoanCount}`} />
          <StatCard label="Sisa Pinjaman" value={formatRupiah(activeData.summary.remainingLoan)} />
        </div>
        <Card><CardContent className="p-4"><p className="font-semibold text-gray-900">Ringkasan Simpanan</p><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><p className="text-gray-500">Pokok</p><p className="font-medium">{formatRupiah(activeData.savingsBreakdown.pokok)}</p></div><div><p className="text-gray-500">Wajib</p><p className="font-medium">{formatRupiah(activeData.savingsBreakdown.wajib)}</p></div><div><p className="text-gray-500">Sukarela</p><p className="font-medium">{formatRupiah(activeData.savingsBreakdown.sukarela)}</p></div><div><p className="text-gray-500">Total</p><p className="font-medium">{formatRupiah(activeData.savingsBreakdown.total)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><p className="font-semibold text-gray-900">Riwayat Angsuran</p><div className="mt-3 space-y-3">{activeData.paymentHistory.length === 0 && <p className="text-sm text-gray-500">Belum ada riwayat angsuran.</p>}{activeData.paymentHistory.map((item) => (<div key={item.paymentId} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-3"><div><p className="text-sm font-medium text-gray-900">{item.loanCode}</p><p className="text-xs text-gray-500">{formatDate(item.paymentDate)}</p></div><p className="font-semibold text-gray-900">{formatRupiah(item.amount)}</p></div>))}</div></CardContent></Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Laporan" />
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-4">
        <Card className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-lime-500 text-white border-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-emerald-100">Modul Laporan Koperasi</p>
                <h2 className="mt-1 text-xl font-bold">Pantau operasional dengan cepat</h2>
                <p className="mt-2 text-sm text-emerald-50">Ringkasan, anggota, simpanan, pinjaman, angsuran, tunggakan, kas, harian, bulanan, dan detail anggota.</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-3"><Wallet size={24} /></div>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2 overflow-x-auto pb-1">{reportTabs.map((tab) => (<button key={tab.id} onClick={() => setActiveReport(tab.id)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeReport === tab.id ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>{tab.label}</button>))}</div>
        <Card><CardContent className="p-4"><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => { setDraftFilters(appliedFilters); setFilterOpen(true); }}><Filter size={16} className="mr-2" />Filter</Button><Button variant="outline" size="sm" onClick={resetFilters}><RefreshCcw size={16} className="mr-2" />Reset</Button><Button variant="outline" size="sm" onClick={handleExportExcel}><FileSpreadsheet size={16} className="mr-2" />Unduh Excel</Button><Button variant="outline" size="sm" onClick={() => handlePrint('pdf')}><Download size={16} className="mr-2" />Unduh PDF</Button><Button variant="outline" size="sm" onClick={() => handlePrint('print')}><Printer size={16} className="mr-2" />Tampilan Cetak</Button></div>{filterSummary.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{filterSummary.map((item) => <Badge key={item}>{item}</Badge>)}</div>}</CardContent></Card>
        {renderReportContent()}
      </div>
      <FilterSheet
        open={filterOpen}
        activeReport={activeReport}
        filters={draftFilters}
        memberOptions={memberOptions}
        onChange={(next) => setDraftFilters((current) => ({ ...current, ...next }))}
        onApply={() => { setAppliedFilters(draftFilters); setFilterOpen(false); }}
        onReset={resetFilters}
        onClose={() => setFilterOpen(false)}
      />
    </div>
  );
};
