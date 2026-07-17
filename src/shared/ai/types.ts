export type RouteStep = {
  instruction: string;
  duration: string;
  icon?: string;
};

export type RouteOption = {
  id: string;
  duration: string;
  cost: string;
  transfers: number;
  steps: RouteStep[];
  modes: string[];
};

export type PlaceResult = {
  id: string;
  name: string;
  rating?: number;
  address?: string;
  distance?: string;
  type?: string;
  phone?: string;
  lat?: number;
  lng?: number;
};

export type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
};

export type ChatRequest = {
  message: string;
  history: ChatHistoryItem[];
};

export type ChatHistoryItem = {
  role: 'user' | 'assistant';
  text: string;
  routes?: RouteOption[];
  places?: PlaceResult[];
};

export type ChatResponse = {
  text: string;
  routes?: RouteOption[];
  places?: PlaceResult[];
};
