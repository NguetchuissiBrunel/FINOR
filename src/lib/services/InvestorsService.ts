/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GenericResponse_list_InvestmentRead__ } from '../models/GenericResponse_list_InvestmentRead__';
import type { GenericResponse_list_InvestorImpactItem__ } from '../models/GenericResponse_list_InvestorImpactItem__';
import type { GenericResponse_list_UserRead__ } from '../models/GenericResponse_list_UserRead__';
import type { GenericResponse_UserRead_ } from '../models/GenericResponse_UserRead_';
import type { UserUpdate } from '../models/UserUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InvestorsService {
    /**
     * List Investors
     * Allow treasurer to see all investors with their codes.
     * @returns GenericResponse_list_UserRead__ Successful Response
     * @throws ApiError
     */
    public static listInvestorsInvestorsGet(): CancelablePromise<GenericResponse_list_UserRead__> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/investors/',
        });
    }
    /**
     * Get My History
     * @param accessCode Your personal INV-XXXX code
     * @returns GenericResponse_list_InvestmentRead__ Successful Response
     * @throws ApiError
     */
    public static getMyHistoryInvestorsMeHistoryGet(
        accessCode: string,
    ): CancelablePromise<GenericResponse_list_InvestmentRead__> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/investors/me/history',
            query: {
                'access_code': accessCode,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get My Impact
     * @param accessCode Your personal INV-XXXX code
     * @returns GenericResponse_list_InvestorImpactItem__ Successful Response
     * @throws ApiError
     */
    public static getMyImpactInvestorsMeImpactGet(
        accessCode: string,
    ): CancelablePromise<GenericResponse_list_InvestorImpactItem__> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/investors/me/impact',
            query: {
                'access_code': accessCode,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update My Profile
     * Allow investor to update their personal info (except access_code).
     * @param accessCode Your personal INV-XXXX code
     * @param requestBody
     * @returns GenericResponse_UserRead_ Successful Response
     * @throws ApiError
     */
    public static updateMyProfileInvestorsMePatch(
        accessCode: string,
        requestBody: UserUpdate,
    ): CancelablePromise<GenericResponse_UserRead_> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/investors/me',
            query: {
                'access_code': accessCode,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
