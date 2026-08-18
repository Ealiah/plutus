export interface ChartPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

export interface TooltipProps {
  active?: boolean;
  payload?: ChartPayloadItem[];
  label?: string;
}
