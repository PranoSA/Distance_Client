export interface WalkingTrip {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  paths: WalkingPath[];
}

export interface WalkingPath {
  lat: number;
  long: number;
}
