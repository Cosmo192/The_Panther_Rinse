export type Machine = {
  id: string;
  type: 'washer' | 'dryer';
  status: 'free' | 'in_use';
  in_use_since: string | null;
  created_at: string;
};

export type MachineWithToken = Machine & {
  qr_token: string;
};
