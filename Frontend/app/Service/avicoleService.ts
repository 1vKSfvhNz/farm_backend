import { LotAvicoleResponse, ControlePonteResponse, ControlePonteCreate } from '../interfaces/Elevage/avicole';
import { TypeProductionAvicoleEnum } from '../enums/Elevage/avicole';
import { FetchGET, FetchPOST } from '../constants/constantsFetch';

export const getLotsAvicoles = async (authToken: string, typeProduction?: TypeProductionAvicoleEnum): Promise<LotAvicoleResponse[]> => {
  const response = await FetchGET(authToken, 'api/elevage/avicole/lots', { type_production : typeProduction });
  const data = await response.json();
  return data;
};

export const getControlesPonte = async (
  authToken: string,
  lotId: number,
  startDate?: string,
  endDate?: string
): Promise<ControlePonteResponse[]> => {
  const response = await FetchGET(authToken, 'api/elevage/avicole/controles-ponte', { lot_id : lotId });
  const data = await response.json();
  return data;
};

export const createControlePonte = async (authToken: string, dt: ControlePonteCreate): Promise<ControlePonteResponse> => {
  const response = await FetchPOST(authToken, 'api/elevage/avicole/controles-ponte', dt);
  const data = await response.json();
  return data;
};