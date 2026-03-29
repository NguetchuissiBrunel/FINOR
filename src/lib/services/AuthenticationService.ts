/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GenericResponse_InvestorLoginResponse_ } from '../models/GenericResponse_InvestorLoginResponse_';
import type { GenericResponse_TokenResponse_ } from '../models/GenericResponse_TokenResponse_';
import type { GenericResponse_UserRead_ } from '../models/GenericResponse_UserRead_';
import type { InvestorLoginRequest } from '../models/InvestorLoginRequest';
import type { TreasurerLoginRequest } from '../models/TreasurerLoginRequest';
import type { UserUpdate } from '../models/UserUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * Treasurer Login
     * @param requestBody
     * @returns GenericResponse_TokenResponse_ Successful Response
     * @throws ApiError
     */
    public static treasurerLoginAuthTreasurerLoginPost(
        requestBody: TreasurerLoginRequest,
    ): CancelablePromise<GenericResponse_TokenResponse_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/treasurer/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Investor Login
     * @param requestBody
     * @returns GenericResponse_InvestorLoginResponse_ Successful Response
     * @throws ApiError
     */
    public static investorLoginAuthInvestorLoginPost(
        requestBody: InvestorLoginRequest,
    ): CancelablePromise<GenericResponse_InvestorLoginResponse_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/investor/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update My Profile
     * @param requestBody
     * @returns GenericResponse_UserRead_ Successful Response
     * @throws ApiError
     */
    public static updateMyProfileAuthMePatch(
        requestBody: UserUpdate,
    ): CancelablePromise<GenericResponse_UserRead_> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/auth/me',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
