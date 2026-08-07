export interface MarineRawForecastItem {
  tarikh: string;
  hari: string;
  cuaca: string;
  arahAngin: string;
  kelajuanAngin: string;
  ketinggianOmbak: string;
  tempohOmbak: number | null;
  amaran: string | null;
}

export interface MarineRawForecastResponse {
  status: string;
  kawasan: string;
  data: MarineRawForecastItem[];
  metadata?: {
    dijanaPada: string;
    sahSehingga: string;
  };
}
