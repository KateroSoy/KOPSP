import React, { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUiFeedback } from '@/components/ui/FeedbackProvider';
import { formatRupiah, formatDate } from '@/lib/utils';
import { getUserFacingError, useData } from '@/context/DataContext';
import { CreditCard, PiggyBank, Plus, Wallet, Camera, X, Image as ImageIcon, Eye, Printer, FileText } from 'lucide-react';

export const AdminTransaksiScreen: React.FC = () => {
  const { currentData: mockData, addSavingsDeposit } = useData();
  const { notifyError, notifySuccess, notifyWarning } = useUiFeedback();
  const { transactions, members, masterData } = mockData as any;
  const [filter, setFilter] = useState<'semua' | 'simpanan' | 'pinjaman'>('semua');
  const [formOpen, setFormOpen] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [savingsProductId, setSavingsProductId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [proof, setProof] = useState<string | null>(null);
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);
  const [viewReceiptTrx, setViewReceiptTrx] = useState<any | null>(null);
  const activeMembers = (members || []).filter((member: any) => member.status === 'Aktif');
  const savingsProducts = masterData?.jenisSimpanan || [];

  const filteredTransactions = transactions?.filter((trx: any) => 
    filter === 'semua' ? true : trx.category === filter
  ) || [];

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = event.target.value.replace(/\D/g, '');
    setAmount(numericValue ? formatRupiah(parseInt(numericValue, 10)).replace('Rp', '').trim() : '');
  };

  const resetForm = () => {
    setMemberId('');
    setSavingsProductId('');
    setAmount('');
    setNote('');
    setProof(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProof(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitSavings = async (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0;

    if (!memberId) {
      notifyWarning('Pilih anggota terlebih dahulu');
      return;
    }
    if (!savingsProductId) {
      notifyWarning('Pilih jenis simpanan');
      return;
    }
    if (numericAmount <= 0) {
      notifyWarning('Nominal simpanan harus lebih dari 0');
      return;
    }

    try {
      await addSavingsDeposit({ memberId, savingsProductId, amount: numericAmount, note: note || null, proof: proof || undefined });
      const member = activeMembers.find((item: any) => item.id === memberId);
      notifySuccess('Simpanan berhasil ditambahkan', `Setoran ${member?.name || 'anggota'} sudah tercatat.`);
      resetForm();
      setFormOpen(false);
      setFilter('simpanan');
    } catch (error) {
      notifyError('Gagal menambahkan simpanan', getUserFacingError(error));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Semua Transaksi" />

      <div className="p-4 md:p-8 max-w-md md:max-w-7xl mx-auto space-y-4 md:space-y-6">
        <Button fullWidth onClick={() => setFormOpen((current) => !current)}>
          <Plus size={18} className="mr-2" />
          Tambah Simpanan
        </Button>

        {formOpen && (
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSubmitSavings} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Anggota</label>
                  <select
                    value={memberId}
                    onChange={(event) => setMemberId(event.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Pilih anggota</option>
                    {activeMembers.map((member: any) => (
                      <option key={member.id} value={member.id}>
                        {member.name} - {member.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Jenis Simpanan</label>
                  <select
                    value={savingsProductId}
                    onChange={(event) => setSavingsProductId(event.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Pilih jenis simpanan</option>
                    {savingsProducts.map((product: any) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Nominal Setoran</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-gray-900">Rp</span>
                    <input
                      type="text"
                      value={amount}
                      onChange={handleAmountChange}
                      className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-base font-semibold text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <Input
                  label="Catatan (Opsional)"
                  placeholder="Contoh: Setoran tunai loket"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Bukti (Opsional)</label>
                  {!proof ? (
                    <div 
                      onClick={() => document.getElementById('proof-upload-trx')?.click()}
                      className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <Camera size={24} className="text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Pilih Gambar</span>
                      <input 
                        id="proof-upload-trx" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange} 
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img src={proof} alt="Bukti" className="w-full h-32 object-cover" />
                      <button 
                        type="button"
                        onClick={() => setProof(null)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button type="button" variant="outline" onClick={() => { resetForm(); setFormOpen(false); }}>
                    Batal
                  </Button>
                  <Button type="submit">
                    Simpan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {['semua', 'simpanan', 'pinjaman'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <Card className="overflow-hidden">
          {/* Mobile View */}
          <div className="divide-y divide-gray-100 md:hidden">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((trx: any) => (
                <div key={trx.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${trx.category === 'simpanan' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      {trx.category === 'simpanan' ? <Wallet size={20} /> : <CreditCard size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gray-900">{trx.type}</p>
                        {trx.proofUrl && (
                          <button 
                            onClick={() => setViewProofUrl(trx.proofUrl)}
                            className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-100"
                            title="Lihat Bukti Foto"
                          >
                            <ImageIcon size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => setViewReceiptTrx(trx)}
                          className="w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-100"
                          title="Cetak Struk"
                        >
                          <Printer size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">{trx.memberName} • {formatDate(trx.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium text-sm ${trx.category === 'simpanan' ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {trx.category === 'simpanan' ? '+' : '-'}{formatRupiah(trx.amount)}
                    </p>
                    <Badge variant="success" className="mt-1 scale-90 origin-right">{trx.status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                Belum ada transaksi
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="p-4 font-medium">Tanggal</th>
                  <th className="p-4 font-medium">Anggota</th>
                  <th className="p-4 font-medium">Jenis Transaksi</th>
                  <th className="p-4 font-medium">Kategori</th>
                  <th className="p-4 font-medium">Nominal</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((trx: any) => (
                    <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-500">{formatDate(trx.date)}</td>
                      <td className="p-4 font-medium text-gray-900">{trx.memberName}</td>
                      <td className="p-4 font-medium text-gray-900">{trx.type}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trx.category === 'simpanan' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                          {trx.category.charAt(0).toUpperCase() + trx.category.slice(1)}
                        </span>
                      </td>
                      <td className={`p-4 font-medium ${trx.category === 'simpanan' ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {trx.category === 'simpanan' ? '+' : '-'}{formatRupiah(trx.amount)}
                      </td>
                      <td className="p-4">
                        <Badge variant="success">{trx.status}</Badge>
                      </td>
                      <td className="p-4 flex items-center justify-end space-x-2">
                        {trx.proofUrl && (
                          <button 
                            onClick={() => setViewProofUrl(trx.proofUrl)}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                            title="Lihat Bukti Foto"
                          >
                            <ImageIcon size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => setViewReceiptTrx(trx)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Cetak Struk"
                        >
                          <Printer size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      Belum ada transaksi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Proof Modal */}
        {viewProofUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
            <div className="relative max-w-sm w-full bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <h3 className="font-bold text-gray-900">Bukti Transaksi</h3>
                <button 
                  onClick={() => setViewProofUrl(null)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="p-4 bg-gray-50 max-h-[70vh] overflow-y-auto">
                <img src={viewProofUrl} alt="Bukti Transaksi" className="w-full h-auto rounded-lg shadow-sm" />
              </div>
              <div className="p-4 border-t border-gray-100 bg-white">
                <Button fullWidth onClick={() => setViewProofUrl(null)}>Tutup</Button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {viewReceiptTrx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 print:p-0 print:bg-white">
            <div className="relative max-w-sm w-full bg-white rounded-2xl overflow-hidden shadow-2xl print:shadow-none print:rounded-none animate-in zoom-in-95 duration-200">
              {/* Receipt Header (Modal Only) */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white print:hidden">
                <h3 className="font-bold text-gray-900">Struk Transaksi</h3>
                <button 
                  onClick={() => setViewReceiptTrx(null)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Receipt Content */}
              <div id="receipt-print-area" className="p-8 bg-white text-gray-900 font-mono text-sm leading-relaxed">
                {/* Logo & Header */}
                <div className="text-center mb-6 space-y-1">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center">
                      <PiggyBank size={28} />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold uppercase tracking-tight">Koperasi Simpan Pinjam</h2>
                  <p className="text-[10px] text-gray-500 italic">Jalan Raya Karawang No. 123, Jawa Barat</p>
                  <div className="border-b-2 border-dashed border-gray-300 pt-2"></div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between">
                    <span className="text-gray-500 uppercase text-[10px]">No. Transaksi</span>
                    <span className="font-bold">{viewReceiptTrx.id.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 uppercase text-[10px]">Tanggal</span>
                    <span>{formatDate(viewReceiptTrx.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 uppercase text-[10px]">Anggota</span>
                    <span className="font-bold">{viewReceiptTrx.memberName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 uppercase text-[10px]">Jenis</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded font-bold">{viewReceiptTrx.type}</span>
                  </div>
                  
                  <div className="border-b border-dashed border-gray-200 py-1"></div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-500 uppercase text-xs">Nominal</span>
                    <span className="text-lg font-black text-emerald-700">{formatRupiah(viewReceiptTrx.amount)}</span>
                  </div>

                  {viewReceiptTrx.note && (
                    <div className="bg-gray-50 p-2 rounded text-[10px] italic">
                      <span className="text-gray-400 block uppercase not-italic font-bold mb-0.5">Catatan:</span>
                      {viewReceiptTrx.note}
                    </div>
                  )}
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 text-center pt-4 border-t-2 border-dashed border-gray-300">
                  <div className="space-y-10">
                    <span className="text-[10px] text-gray-500 uppercase">Anggota</span>
                    <div className="text-xs font-bold border-t border-gray-300 pt-1">{viewReceiptTrx.memberName}</div>
                  </div>
                  <div className="space-y-10">
                    <span className="text-[10px] text-gray-500 uppercase">Petugas</span>
                    <div className="text-xs font-bold border-t border-gray-300 pt-1">Admin Koperasi</div>
                  </div>
                </div>

                <div className="text-center mt-10 space-y-1">
                  <p className="text-[10px] font-bold">Terima kasih atas kepercayaannya.</p>
                  <p className="text-[8px] text-gray-400 italic">Dicetak secara otomatis oleh sistem.</p>
                </div>
              </div>

              {/* Actions (Modal Only) */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 print:hidden">
                <Button variant="outline" className="flex-1" onClick={() => setViewReceiptTrx(null)}>Tutup</Button>
                <Button className="flex-1 gap-2" onClick={() => window.print()}>
                  <Printer size={18} /> Cetak Struk
                </Button>
              </div>
            </div>

            {/* Print CSS */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * {
                  visibility: hidden;
                }
                #receipt-print-area, #receipt-print-area * {
                  visibility: visible;
                }
                #receipt-print-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  padding: 0;
                  margin: 0;
                }
              }
            ` }} />
          </div>
        )}
      </div>
    </div>
  );
};
