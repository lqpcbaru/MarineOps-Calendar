export interface JupemRawTidePoint {
  tarikh: string;
  masa: string;
  ketinggian: number;
  jenis: string;
}

export interface JupemRawTideDay {
  tarikh: string;
  pasangSurut: JupemRawTidePoint[];
  ramalan: string;
}

export interface JupemRawTideResponse {
  status: string;
  stesen: string;
  kawasan: string;
  data: JupemRawTideDay[];
  metadata?: {
    dijanaPada: string;
    sahSehingga: string;
    sumber: string;
  };
}
