/**
 * Ước tính tiền điện sinh hoạt theo 6 bậc.
 *
 * Đơn giá tham chiếu từ Thông báo tiền điện EVNHCMC kỳ 4/2026:
 *   Bậc 1 (0–50):    1 984 đ/kWh
 *   Bậc 2 (51–100):  2 050 đ/kWh
 *   Bậc 3 (101–200): 2 380 đ/kWh
 *   Bậc 4 (201–300): 2 998 đ/kWh
 *   Bậc 5 (301–400): 3 350 đ/kWh
 *   Bậc 6 (>400):    3 460 đ/kWh
 *   VAT: 8%
 *
 * Định mức bậc được prorate theo số ngày của kỳ ghi điện
 * (chuẩn = 30 ngày). Số tiền VAT và tổng cộng được làm tròn
 * đến đồng theo cách EVN làm trên hóa đơn.
 *
 * NOTE: Đây là ước tính tham khảo. Số tiền thực tế còn phụ thuộc
 * số hộ dùng chung, đơn giá khác (kinh doanh, sản xuất, hành chính sự nghiệp),
 * định mức đặc thù, các điều chỉnh giá trong kỳ, v.v.
 */

export type Tier = { upTo: number | null; price: number };

export const TIERS: Tier[] = [
  { upTo: 50, price: 1984 },
  { upTo: 100, price: 2050 },
  { upTo: 200, price: 2380 },
  { upTo: 300, price: 2998 },
  { upTo: 400, price: 3350 },
  { upTo: null, price: 3460 },
];

export const VAT_RATE = 0.08;
export const STANDARD_PERIOD_DAYS = 30;

export type BillBreakdownRow = {
  tier: number;
  from: number;
  to: number;
  kWh: number;
  price: number;
  amount: number;
};

export type BillEstimate = {
  kWh: number;
  days: number;
  preVat: number;
  vat: number;
  total: number;
  breakdown: BillBreakdownRow[];
};

export function estimateBill(kWh: number, days = STANDARD_PERIOD_DAYS): BillEstimate {
  const k = Math.max(0, Number(kWh) || 0);
  const d = Math.max(1, Math.round(days));
  const factor = d / STANDARD_PERIOD_DAYS;

  let remaining = k;
  let cursor = 0;
  let preVat = 0;
  const breakdown: BillBreakdownRow[] = [];

  TIERS.forEach((t, i) => {
    const limit = t.upTo === null ? Infinity : t.upTo * factor;
    const cap = limit - cursor;
    const used = Math.min(remaining, Math.max(0, cap));
    if (used > 0) {
      const amount = used * t.price;
      preVat += amount;
      breakdown.push({
        tier: i + 1,
        from: cursor,
        to: cursor + used,
        kWh: used,
        price: t.price,
        amount,
      });
      remaining -= used;
      cursor += used;
    } else if (remaining <= 0 && breakdown.length === 0) {
      // ensure at least one row when 0 kWh
    }
  });

  const vat = preVat * VAT_RATE;
  return {
    kWh: k,
    days: d,
    preVat: Math.round(preVat),
    vat: Math.round(vat),
    total: Math.round(preVat + vat),
    breakdown,
  };
}
