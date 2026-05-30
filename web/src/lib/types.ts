export type Customer = {
  MA_KHANG: string;
  TEN_KHANG: string;
  DIA_CHI: string;
  [k: string]: unknown;
};

export type DayRow = {
  ngay: string;       // "dd/MM"
  ngayFull: string;   // "dd/MM/yyyy"
  TD: string | number;
  BT: string | number;
  CD: string | number;
  Tong: string | number;
  tong_p_giao?: string;
  tong_q_giao?: string;
};

export type DayResp = {
  state: 'success' | string;
  alert?: string;
  data: {
    sanluong_tungngay?: DayRow[];
    sanluong_tong?: { Tong_format?: string; Tong?: number };
  };
};

export type HourRow = {
  gio?: string;
  thoidiem?: string;
  loai?: 'td' | 'bt' | 'cd' | string;
  sanluong?: string | number;
  SAN_LUONG?: string | number;
};

export type HourResp = {
  state: 'success' | string;
  alert?: string;
  data: HourRow[];
  tong?: { SAN_LUONG_FORMAT?: string; SAN_LUONG?: number };
};

export type BillingRow = {
  ky?: string;
  thang?: string;
  kyhoadon?: string;
  tieude?: string;
  tungay?: string;
  denngay?: string;
  sanluong?: string | number;
  SAN_LUONG?: string | number;
  Tong?: string | number;
};

export type BillingResp = {
  state: 'success' | string;
  alert?: string;
  data: {
    sanluong_hoadon?: BillingRow[];
    tong?: { SAN_LUONG_FORMAT?: string; SAN_LUONG?: number };
  };
};

export type MeResp = { ok: true; listPE: Customer[] };
