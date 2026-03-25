import { request } from "./_base";

export interface DashboardStats {
  openTickets: number;
  overdueTickets: number;
  openCallbacks: number;
}

export const dashboard = {
  getStats: () => request<DashboardStats>("/api/v1/tanss-dashboard/stats"),
};
