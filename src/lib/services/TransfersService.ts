/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GenericResponse_list_TransferRead__ } from '../models/GenericResponse_list_TransferRead__';
import type { GenericResponse_TransferRead_ } from '../models/GenericResponse_TransferRead_';
import type { TransferCreate } from '../models/TransferCreate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TransfersService {
    /**
     * List Transfers
     * @returns GenericResponse_list_TransferRead__ Successful Response
     * @throws ApiError
     */
    public static listTransfersTransfersGet(): CancelablePromise<GenericResponse_list_TransferRead__> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/transfers/',
        });
    }
    /**
     * Create Transfer
     * @param requestBody
     * @returns GenericResponse_TransferRead_ Successful Response
     * @throws ApiError
     */
    public static createTransferTransfersPost(
        requestBody: TransferCreate,
    ): CancelablePromise<GenericResponse_TransferRead_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/transfers/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Transfer
     * @param transferId
     * @returns GenericResponse_TransferRead_ Successful Response
     * @throws ApiError
     */
    public static getTransferTransfersTransferIdGet(
        transferId: string,
    ): CancelablePromise<GenericResponse_TransferRead_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/transfers/{transfer_id}',
            path: {
                'transfer_id': transferId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Mark Transfer Repaid
     * @param transferId
     * @returns GenericResponse_TransferRead_ Successful Response
     * @throws ApiError
     */
    public static markTransferRepaidTransfersTransferIdRepaidPatch(
        transferId: string,
    ): CancelablePromise<GenericResponse_TransferRead_> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/transfers/{transfer_id}/repaid',
            path: {
                'transfer_id': transferId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
