import { useState } from 'react';
import { X, Check, Ruler, Sparkles, HelpCircle } from 'lucide-react';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

export interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGarment?: 'blouse' | 'chudi' | 'pant';
  onApplySize?: (garment: 'blouse' | 'chudi' | 'pant', sizeValues: Record<string, string>) => void;
}

export interface SizeRow {
  size: string;
  label: string;
  chestOrBust: number;
  waist: number;
  hipOrSeat?: number;
  shoulder: number;
  length: number;
  sleeveLength?: number;
  sleeveRound?: number;
  armRound?: number;
  values: Record<string, string>;
}

export const BLOUSE_SIZE_DATA: SizeRow[] = [
  {
    size: 'XS',
    label: 'Size 32',
    chestOrBust: 32,
    waist: 26,
    shoulder: 13.5,
    length: 13.5,
    sleeveLength: 9.5,
    sleeveRound: 10.5,
    armRound: 14,
    values: {
      height: '13.5',
      upperChest: '31',
      centerChest: '32',
      waistRound: '26',
      sleeveLength: '9.5',
      sleeveRound: '10.5',
      midHand: '11',
      armRound: '14',
      frontNeck: '6.5',
      backNeck: '8',
      fullShoulder: '13.5',
      shoulderWidth: '2.5',
      centerDot: '9.5',
    },
  },
  {
    size: 'S',
    label: 'Size 34',
    chestOrBust: 34,
    waist: 28,
    shoulder: 14,
    length: 14,
    sleeveLength: 10,
    sleeveRound: 11,
    armRound: 15,
    values: {
      height: '14',
      upperChest: '33',
      centerChest: '34',
      waistRound: '28',
      sleeveLength: '10',
      sleeveRound: '11',
      midHand: '11.5',
      armRound: '15',
      frontNeck: '6.5',
      backNeck: '8.5',
      fullShoulder: '14',
      shoulderWidth: '2.75',
      centerDot: '10',
    },
  },
  {
    size: 'M',
    label: 'Size 36',
    chestOrBust: 36,
    waist: 30,
    shoulder: 14.5,
    length: 14.5,
    sleeveLength: 10.5,
    sleeveRound: 11.5,
    armRound: 16,
    values: {
      height: '14.5',
      upperChest: '35',
      centerChest: '36',
      waistRound: '30',
      sleeveLength: '10.5',
      sleeveRound: '11.5',
      midHand: '12',
      armRound: '16',
      frontNeck: '7',
      backNeck: '9',
      fullShoulder: '14.5',
      shoulderWidth: '3',
      centerDot: '10.5',
    },
  },
  {
    size: 'L',
    label: 'Size 38',
    chestOrBust: 38,
    waist: 32,
    shoulder: 15,
    length: 15,
    sleeveLength: 11,
    sleeveRound: 12,
    armRound: 17,
    values: {
      height: '15',
      upperChest: '37',
      centerChest: '38',
      waistRound: '32',
      sleeveLength: '11',
      sleeveRound: '12',
      midHand: '12.5',
      armRound: '17',
      frontNeck: '7',
      backNeck: '9.5',
      fullShoulder: '15',
      shoulderWidth: '3',
      centerDot: '11',
    },
  },
  {
    size: 'XL',
    label: 'Size 40',
    chestOrBust: 40,
    waist: 34,
    shoulder: 15.5,
    length: 15.5,
    sleeveLength: 11.5,
    sleeveRound: 12.5,
    armRound: 18,
    values: {
      height: '15.5',
      upperChest: '39',
      centerChest: '40',
      waistRound: '34',
      sleeveLength: '11.5',
      sleeveRound: '12.5',
      midHand: '13',
      armRound: '18',
      frontNeck: '7.5',
      backNeck: '10',
      fullShoulder: '15.5',
      shoulderWidth: '3.25',
      centerDot: '11.5',
    },
  },
  {
    size: 'XXL',
    label: 'Size 42',
    chestOrBust: 42,
    waist: 36,
    shoulder: 16,
    length: 16,
    sleeveLength: 12,
    sleeveRound: 13,
    armRound: 19,
    values: {
      height: '16',
      upperChest: '41',
      centerChest: '42',
      waistRound: '36',
      sleeveLength: '12',
      sleeveRound: '13',
      midHand: '13.5',
      armRound: '19',
      frontNeck: '7.5',
      backNeck: '10',
      fullShoulder: '16',
      shoulderWidth: '3.5',
      centerDot: '12',
    },
  },
  {
    size: '3XL',
    label: 'Size 44',
    chestOrBust: 44,
    waist: 38,
    shoulder: 16.5,
    length: 16.5,
    sleeveLength: 12.5,
    sleeveRound: 13.5,
    armRound: 20,
    values: {
      height: '16.5',
      upperChest: '43',
      centerChest: '44',
      waistRound: '38',
      sleeveLength: '12.5',
      sleeveRound: '13.5',
      midHand: '14',
      armRound: '20',
      frontNeck: '8',
      backNeck: '10.5',
      fullShoulder: '16.5',
      shoulderWidth: '3.5',
      centerDot: '12.5',
    },
  },
];

export const CHUDI_SIZE_DATA: SizeRow[] = [
  {
    size: 'XS',
    label: 'Size 32',
    chestOrBust: 32,
    waist: 28,
    hipOrSeat: 36,
    shoulder: 13.5,
    length: 42,
    sleeveLength: 16,
    sleeveRound: 10,
    armRound: 14,
    values: {
      height: '42',
      chest: '32',
      waistHeight: '14',
      waistRound: '28',
      sleeveLength: '16',
      sleeveRound: '10',
      midHand: '10.5',
      armRound: '14',
      frontNeck: '6',
      backNeck: '5',
      fullShoulder: '13.5',
      shoulderWidth: '2.5',
      seatLoose: '36',
      slitOpenFTop: '19',
    },
  },
  {
    size: 'S',
    label: 'Size 34',
    chestOrBust: 34,
    waist: 30,
    hipOrSeat: 38,
    shoulder: 14,
    length: 43,
    sleeveLength: 16.5,
    sleeveRound: 10.5,
    armRound: 15,
    values: {
      height: '43',
      chest: '34',
      waistHeight: '14.5',
      waistRound: '30',
      sleeveLength: '16.5',
      sleeveRound: '10.5',
      midHand: '11',
      armRound: '15',
      frontNeck: '6.5',
      backNeck: '5.5',
      fullShoulder: '14',
      shoulderWidth: '2.75',
      seatLoose: '38',
      slitOpenFTop: '19.5',
    },
  },
  {
    size: 'M',
    label: 'Size 36',
    chestOrBust: 36,
    waist: 32,
    hipOrSeat: 40,
    shoulder: 14.5,
    length: 44,
    sleeveLength: 17,
    sleeveRound: 11,
    armRound: 16,
    values: {
      height: '44',
      chest: '36',
      waistHeight: '15',
      waistRound: '32',
      sleeveLength: '17',
      sleeveRound: '11',
      midHand: '11.5',
      armRound: '16',
      frontNeck: '6.5',
      backNeck: '6',
      fullShoulder: '14.5',
      shoulderWidth: '3',
      seatLoose: '40',
      slitOpenFTop: '20',
    },
  },
  {
    size: 'L',
    label: 'Size 38',
    chestOrBust: 38,
    waist: 34,
    hipOrSeat: 42,
    shoulder: 15,
    length: 44.5,
    sleeveLength: 17.5,
    sleeveRound: 11.5,
    armRound: 17,
    values: {
      height: '44.5',
      chest: '38',
      waistHeight: '15.5',
      waistRound: '34',
      sleeveLength: '17.5',
      sleeveRound: '11.5',
      midHand: '12',
      armRound: '17',
      frontNeck: '7',
      backNeck: '6',
      fullShoulder: '15',
      shoulderWidth: '3',
      seatLoose: '42',
      slitOpenFTop: '20.5',
    },
  },
  {
    size: 'XL',
    label: 'Size 40',
    chestOrBust: 40,
    waist: 36,
    hipOrSeat: 44,
    shoulder: 15.5,
    length: 45,
    sleeveLength: 18,
    sleeveRound: 12,
    armRound: 18,
    values: {
      height: '45',
      chest: '40',
      waistHeight: '16',
      waistRound: '36',
      sleeveLength: '18',
      sleeveRound: '12',
      midHand: '12.5',
      armRound: '18',
      frontNeck: '7',
      backNeck: '6.5',
      fullShoulder: '15.5',
      shoulderWidth: '3.25',
      seatLoose: '44',
      slitOpenFTop: '21',
    },
  },
  {
    size: 'XXL',
    label: 'Size 42',
    chestOrBust: 42,
    waist: 38,
    hipOrSeat: 46,
    shoulder: 16,
    length: 45.5,
    sleeveLength: 18.5,
    sleeveRound: 12.5,
    armRound: 19,
    values: {
      height: '45.5',
      chest: '42',
      waistHeight: '16.5',
      waistRound: '38',
      sleeveLength: '18.5',
      sleeveRound: '12.5',
      midHand: '13',
      armRound: '19',
      frontNeck: '7.5',
      backNeck: '6.5',
      fullShoulder: '16',
      shoulderWidth: '3.5',
      seatLoose: '46',
      slitOpenFTop: '21.5',
    },
  },
  {
    size: '3XL',
    label: 'Size 44',
    chestOrBust: 44,
    waist: 40,
    hipOrSeat: 48,
    shoulder: 16.5,
    length: 46,
    sleeveLength: 19,
    sleeveRound: 13,
    armRound: 20,
    values: {
      height: '46',
      chest: '44',
      waistHeight: '17',
      waistRound: '40',
      sleeveLength: '19',
      sleeveRound: '13',
      midHand: '13.5',
      armRound: '20',
      frontNeck: '7.5',
      backNeck: '7',
      fullShoulder: '16.5',
      shoulderWidth: '3.5',
      seatLoose: '48',
      slitOpenFTop: '22',
    },
  },
];

export const PANT_SIZE_DATA: SizeRow[] = [
  {
    size: 'XS',
    label: 'Waist 26',
    chestOrBust: 26, // used for waist
    waist: 26,
    hipOrSeat: 34,
    shoulder: 0,
    length: 36,
    values: {
      height: '36',
      hipRound: '34',
      seatRound: '36',
      kneeRound: '15',
      thighRound: '20',
      legRound: '11',
      croch: '10.5',
    },
  },
  {
    size: 'S',
    label: 'Waist 28',
    chestOrBust: 28,
    waist: 28,
    hipOrSeat: 36,
    shoulder: 0,
    length: 37,
    values: {
      height: '37',
      hipRound: '36',
      seatRound: '38',
      kneeRound: '16',
      thighRound: '21',
      legRound: '11.5',
      croch: '11',
    },
  },
  {
    size: 'M',
    label: 'Waist 30',
    chestOrBust: 30,
    waist: 30,
    hipOrSeat: 38,
    shoulder: 0,
    length: 38,
    values: {
      height: '38',
      hipRound: '38',
      seatRound: '40',
      kneeRound: '17',
      thighRound: '22',
      legRound: '12',
      croch: '11.5',
    },
  },
  {
    size: 'L',
    label: 'Waist 32',
    chestOrBust: 32,
    waist: 32,
    hipOrSeat: 40,
    shoulder: 0,
    length: 38.5,
    values: {
      height: '38.5',
      hipRound: '40',
      seatRound: '42',
      kneeRound: '18',
      thighRound: '23.5',
      legRound: '12.5',
      croch: '12',
    },
  },
  {
    size: 'XL',
    label: 'Waist 34',
    chestOrBust: 34,
    waist: 34,
    hipOrSeat: 42,
    shoulder: 0,
    length: 39,
    values: {
      height: '39',
      hipRound: '42',
      seatRound: '44',
      kneeRound: '19',
      thighRound: '25',
      legRound: '13',
      croch: '12.5',
    },
  },
  {
    size: 'XXL',
    label: 'Waist 36',
    chestOrBust: 36,
    waist: 36,
    hipOrSeat: 44,
    shoulder: 0,
    length: 39.5,
    values: {
      height: '39.5',
      hipRound: '44',
      seatRound: '46',
      kneeRound: '20',
      thighRound: '26.5',
      legRound: '13.5',
      croch: '13',
    },
  },
  {
    size: '3XL',
    label: 'Waist 38',
    chestOrBust: 38,
    waist: 38,
    hipOrSeat: 46,
    shoulder: 0,
    length: 40,
    values: {
      height: '40',
      hipRound: '46',
      seatRound: '48',
      kneeRound: '21',
      thighRound: '28',
      legRound: '14',
      croch: '13.5',
    },
  },
];

export default function SizeChartModal({
  isOpen,
  onClose,
  initialGarment = 'blouse',
  onApplySize,
}: SizeChartModalProps) {
  const [activeGarment, setActiveGarment] = useState<'blouse' | 'chudi' | 'pant'>(initialGarment);
  const [unit, setUnit] = useState<'in' | 'cm'>('in');
  const [appliedSize, setAppliedSize] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatVal = (val: number | undefined) => {
    if (val === undefined || val === 0) return '—';
    if (unit === 'in') return `${val}"`;
    return `${Math.round(val * 2.54)} cm`;
  };

  const getDataset = (): SizeRow[] => {
    if (activeGarment === 'blouse') return BLOUSE_SIZE_DATA;
    if (activeGarment === 'chudi') return CHUDI_SIZE_DATA;
    return PANT_SIZE_DATA;
  };

  const dataset = getDataset();

  const handleApply = (row: SizeRow) => {
    if (onApplySize) {
      onApplySize(activeGarment, row.values);
      setAppliedSize(`${row.size} (${row.label})`);
      setTimeout(() => setAppliedSize(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-[#5C1A32]/20 my-auto flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#FAF7F2] border-b border-[#5C1A32]/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#5C1A32] text-white flex items-center justify-center shadow-xs">
              <Ruler className="h-4 w-4 text-[#B8935A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#B8935A]">
                  ATELIER MEASUREMENT REFERENCE
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#1B1512]" style={serif}>
                Couture Standard Size Chart &amp; Fit Guide
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Unit Toggle */}
            <div className="inline-flex rounded-lg border border-[#5C1A32]/20 p-0.5 bg-white text-xs font-semibold">
              <button
                type="button"
                onClick={() => setUnit('in')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  unit === 'in'
                    ? 'bg-[#5C1A32] text-white shadow-xs'
                    : 'text-[#544B45] hover:text-[#1B1512]'
                }`}
              >
                Inches (in)
              </button>
              <button
                type="button"
                onClick={() => setUnit('cm')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  unit === 'cm'
                    ? 'bg-[#5C1A32] text-white shadow-xs'
                    : 'text-[#544B45] hover:text-[#1B1512]'
                }`}
              >
                Centimeters (cm)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Close Size Chart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Applied Size Toast inside Modal */}
        {appliedSize && (
          <div className="bg-emerald-50 text-emerald-800 border-b border-emerald-200 px-4 py-2.5 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>
                Standard <strong>{appliedSize}</strong> applied directly to your{' '}
                {activeGarment.toUpperCase()} measurement form!
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 uppercase tracking-wider">
              Ready to Save / Fine-Tune
            </span>
          </div>
        )}

        {/* Garment Tabs */}
        <div className="px-4 sm:px-6 pt-4 border-b border-[#5C1A32]/10 bg-white shrink-0">
          <div className="grid grid-cols-3 gap-1 bg-[#1B1512]/5 p-1 rounded-xl max-w-md">
            <button
              type="button"
              onClick={() => setActiveGarment('blouse')}
              className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeGarment === 'blouse'
                  ? 'bg-white text-[#5C1A32] shadow-xs'
                  : 'text-[#544B45] hover:text-[#1B1512]'
              }`}
            >
              <span>Blouse</span>
              <span className="text-[10px] opacity-75">(Saree / Lehenga)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGarment('chudi')}
              className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeGarment === 'chudi'
                  ? 'bg-white text-[#5C1A32] shadow-xs'
                  : 'text-[#544B45] hover:text-[#1B1512]'
              }`}
            >
              <span>Chudi</span>
              <span className="text-[10px] opacity-75">(Kurti / Suit)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGarment('pant')}
              className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeGarment === 'pant'
                  ? 'bg-white text-[#5C1A32] shadow-xs'
                  : 'text-[#544B45] hover:text-[#1B1512]'
              }`}
            >
              <span>Pant</span>
              <span className="text-[10px] opacity-75">(Salwar / Trouser)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Sizing Chart Table with Horizontal Scroll Protection */}
          <div className="bg-white border border-[#5C1A32]/15 rounded-xl shadow-xs overflow-hidden">
            <div className="p-3.5 bg-[#FAF7F2] border-b border-[#5C1A32]/10 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#1B1512] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#B8935A]" />
                {activeGarment === 'blouse' &&
                  'Blouse Sizing Grid (Indian Standard Bust 32" - 44")'}
                {activeGarment === 'chudi' && 'Chudidhar / Kurti Sizing Grid (Chest 32" - 44")'}
                {activeGarment === 'pant' && 'Pant / Salwar Sizing Grid (Waist 26" - 38")'}
              </span>
              <span className="text-[11px] text-[#8A7968]">
                Click "Apply Size" to pre-fill your form with one click
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[580px]">
                <thead>
                  <tr className="bg-[#FAF7F2]/60 border-b border-[#5C1A32]/10 text-[10px] font-bold text-[#8A7968] uppercase tracking-wider">
                    <th className="p-3 text-center w-14">Size</th>
                    <th className="p-3">Reference Label</th>
                    <th className="p-3">{activeGarment === 'pant' ? 'Waist' : 'Bust / Chest'}</th>
                    <th className="p-3">
                      {activeGarment === 'pant' ? 'Hip / Seat' : 'Waist Round'}
                    </th>
                    {activeGarment !== 'pant' && <th className="p-3">Shoulder</th>}
                    <th className="p-3">
                      {activeGarment === 'blouse'
                        ? 'Blouse Length'
                        : activeGarment === 'chudi'
                          ? 'Kurti Length'
                          : 'Pant Length'}
                    </th>
                    {activeGarment !== 'pant' && <th className="p-3">Sleeve</th>}
                    {onApplySize && <th className="p-3 text-right">Instant Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#5C1A32]/8">
                  {dataset.map((row) => (
                    <tr key={row.size} className="hover:bg-[#FAF7F2]/50 transition-colors">
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded font-bold font-mono text-xs bg-[#5C1A32]/10 text-[#5C1A32]">
                          {row.size}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-[#1B1512]">{row.label}</td>
                      <td className="p-3 font-mono font-bold text-[#5C1A32]">
                        {formatVal(activeGarment === 'pant' ? row.waist : row.chestOrBust)}
                      </td>
                      <td className="p-3 font-mono">
                        {formatVal(activeGarment === 'pant' ? row.hipOrSeat : row.waist)}
                      </td>
                      {activeGarment !== 'pant' && (
                        <td className="p-3 font-mono">{formatVal(row.shoulder)}</td>
                      )}
                      <td className="p-3 font-mono">{formatVal(row.length)}</td>
                      {activeGarment !== 'pant' && (
                        <td className="p-3 font-mono">
                          {formatVal(row.sleeveLength)}
                          {row.sleeveRound ? ` (Round: ${formatVal(row.sleeveRound)})` : ''}
                        </td>
                      )}
                      {onApplySize && (
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleApply(row)}
                            className="px-3 py-1 bg-[#5C1A32] hover:bg-[#431224] text-white text-[11px] font-semibold rounded shadow-2xs transition-colors cursor-pointer"
                          >
                            Apply {row.size}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Measuring Instructions & Fit Guidance */}
          <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-xl border border-[#5C1A32]/12 space-y-3">
            <div className="flex items-center gap-2 text-[#5C1A32] font-bold text-xs uppercase tracking-wider">
              <HelpCircle className="h-4 w-4 text-[#B8935A]" />
              <span>How To Measure Your Body at Home (Artisan Tips)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-[#544B45]">
              {activeGarment === 'blouse' && (
                <>
                  <div className="bg-white p-3 rounded-lg border border-[#5C1A32]/10 space-y-1">
                    <span className="font-bold text-[#1B1512] block">1. Bust / Center Chest</span>
                    <p className="leading-relaxed text-[11px]">
                      Wrap tape around the fullest part of your bust while wearing your regular bra.
                      Keep tape parallel to the floor.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-[#5C1A32]/10 space-y-1">
                    <span className="font-bold text-[#1B1512] block">2. Blouse Waist</span>
                    <p className="leading-relaxed text-[11px]">
                      Measure around your rib cage directly under your bust where the bottom hem of
                      the blouse will sit.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-[#5C1A32]/10 space-y-1">
                    <span className="font-bold text-[#1B1512] block">
                      3. Blouse Height / Length
                    </span>
                    <p className="leading-relaxed text-[11px]">
                      Measure from the top of your shoulder straight down over the bust apex to your
                      desired blouse hem (usually 14"–15").
                    </p>
                  </div>
                </>
              )}

              {activeGarment === 'chudi' && (
                <>
                  <div className="bg-white p-3 rounded-lg border border-[#5C1A32]/10 space-y-1">
                    <span className="font-bold text-[#1B1512] block">1. Chest &amp; Bust</span>
                    <p className="leading-relaxed text-[11px]">
                      Measure around the fullest part of the chest. Allow 1–2 fingers ease inside
                      the tape for comfortable breathing.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-[#5C1A32]/10 space-y-1">
                    <span className="font-bold text-[#1B1512] block">2. Natural Waist</span>
                    <p className="leading-relaxed text-[11px]">
                      Measure around the narrowest part of your torso, typically 1 inch above the
                      belly button.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-[#5C1A32]/10 space-y-1">
                    <span className="font-bold text-[#1B1512] block">
                      3. Kurti Length &amp; Slit
                    </span>
                    <p className="leading-relaxed text-[11px]">
                      From shoulder to below knee (standard 42"–45"). Slit open is measured from
                      shoulder to where the side slit begins.
                    </p>
                  </div>
                </>
              )}

              {activeGarment === 'pant' && (
                <>
                  <div className="bg-white p-3 rounded-lg border border-[#5C1A32]/10 space-y-1">
                    <span className="font-bold text-[#1B1512] block">1. Pant Waist</span>
                    <p className="leading-relaxed text-[11px]">
                      Measure around where you normally wear your pants/salwar (navel level or
                      slightly lower).
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-[#5C1A32]/10 space-y-1">
                    <span className="font-bold text-[#1B1512] block">2. Hip &amp; Seat Round</span>
                    <p className="leading-relaxed text-[11px]">
                      Stand with feet together and measure around the fullest circumference of your
                      hips and seat.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-[#5C1A32]/10 space-y-1">
                    <span className="font-bold text-[#1B1512] block">3. Pant Length &amp; Hem</span>
                    <p className="leading-relaxed text-[11px]">
                      From waistline down the outside of your leg to ankle bone (standard 37"–39").
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#5C1A32]/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-[#8A7968]">
            * All measurements in our atelier are custom hand-drafted. You can fine-tune any field
            after applying a standard size.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#1B1512] hover:bg-[#5C1A32] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Done &amp; Close Chart
          </button>
        </div>
      </div>
    </div>
  );
}
