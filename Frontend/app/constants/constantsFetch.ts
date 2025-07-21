import { t } from "i18next";
import { showErrorToast } from "./shows";
import { IP } from "./network";

const buildHeaders = (
  authToken?: string | null,
  isFormData?: boolean | null
): HeadersInit_ => {
  return {
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
  };
};

export const FetchCREATE = async (
  authToken: string | null,
  link: string,
  data: any
) => {
  const isFormData = data instanceof FormData;  
  try {
    const response = await fetch(`${IP}/${link}`, {
      method: 'POST',
      headers: buildHeaders(authToken, isFormData),
      body: isFormData ? data : JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: t('general.server_error') }));
      const errorMessage = t(errorData.detail) || t('general.server_error');
      showErrorToast(errorData);
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(t('general.network_error'));
  }
};

export const FetchPOST = FetchCREATE;

export const FetchGET = async (
  authToken: string | null,
  link: string,
  queryParams?: Record<string, any> // pour skip, limit, type_production...
) => {
  try {
    const queryString = queryParams
      ? '?' + new URLSearchParams(queryParams).toString()
      : '';

    const response = await fetch(`${IP}/${link}${queryString}`, {
      method: 'GET',
      headers: buildHeaders(authToken),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = t(errorData.detail) || t('general.server_error');
      console.log(`${IP}/${link}`);
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(t('general.network_error'));
  }
};

export const FetchUPDATE = async (
  authToken: string | null,
  link: string,
  id: number,
  data: any
) => {
  const isFormData = data instanceof FormData;
  let url = id >= 1 ? `${IP}/${link}/${id}` : `${IP}/${link}`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: buildHeaders(authToken, isFormData),
      body: isFormData ? data : JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: t('general.server_error') }));
      const errorMessage = t(errorData.detail) || t('general.server_error');
      showErrorToast(errorData+'++++++++');
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(t('general.network_error'));
  }
};

export const FetchDELETE = async ( 
  authToken: string | null, 
  link: string, 
  id: number
) => {
  try {
    const response = await fetch(`${IP}/${link}/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(authToken),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: t('general.server_error') }));
      const errorMessage = t(errorData.detail) || t('general.server_error');
      showErrorToast(errorData);
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(t('general.network_error'));
  }
};