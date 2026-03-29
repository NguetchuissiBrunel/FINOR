/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GenericResponse_InvestmentCreateResponse_ } from '../models/GenericResponse_InvestmentCreateResponse_';
import type { GenericResponse_InvestmentRead_ } from '../models/GenericResponse_InvestmentRead_';
import type { GenericResponse_list_InvestmentRead__ } from '../models/GenericResponse_list_InvestmentRead__';
import type { InvestmentCreate } from '../models/InvestmentCreate';
import type { InvestmentReject } from '../models/InvestmentReject';
import type { InvestmentStatusEnum } from '../models/InvestmentStatusEnum';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InvestmentsService {
    /**
     * Declare Investment
     * @param requestBody
     * @returns GenericResponse_InvestmentCreateResponse_ Successful Response
     * @throws ApiError
     */
    public static declareInvestmentInvestmentsPost(
        requestBody: InvestmentCreate,
    ): CancelablePromise<GenericResponse_InvestmentCreateResponse_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/investments/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Investments
     * @param status
     * @returns GenericResponse_list_InvestmentRead__ Successful Response
     * @throws ApiError
     */
    public static listInvestmentsInvestmentsGet(
        status?: (InvestmentStatusEnum | null),
    ): CancelablePromise<GenericResponse_list_InvestmentRead__> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/investments/',
            query: {
                'status': status,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Investment
     * @param investmentId
     * @returns GenericResponse_InvestmentRead_ Successful Response
     * @throws ApiError
     */
    public static getInvestmentInvestmentsInvestmentIdGet(
        investmentId: string,
    ): CancelablePromise<GenericResponse_InvestmentRead_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/investments/{investment_id}',
            path: {
                'investment_id': investmentId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Validate Investment
     * @param investmentId
     * @returns GenericResponse_InvestmentRead_ Successful Response
     * @throws ApiError
     */
    public static validateInvestmentInvestmentsInvestmentIdValidatePatch(
        investmentId: string,
    ): CancelablePromise<GenericResponse_InvestmentRead_> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/investments/{investment_id}/validate',
            path: {
                'investment_id': investmentId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Reject Investment
     * @param investmentId
     * @param requestBody
     * @returns GenericResponse_InvestmentRead_ Successful Response
     * @throws ApiError
     */
    public static rejectInvestmentInvestmentsInvestmentIdRejectPatch(
        investmentId: string,
        requestBody: InvestmentReject,
    ): CancelablePromise<GenericResponse_InvestmentRead_> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/investments/{investment_id}/reject',
            path: {
                'investment_id': investmentId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
