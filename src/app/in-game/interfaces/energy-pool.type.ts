import { EnergyType } from './energy-type.type';

export type EnergyPool = {
  [key in EnergyType]?: number;
};
