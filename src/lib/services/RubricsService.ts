/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GenericResponse } from '../models/GenericResponse';
import type { GenericResponse_list_RubricRead__ } from '../models/GenericResponse_list_RubricRead__';
import type { GenericResponse_RubricBalance_ } from '../models/GenericResponse_RubricBalance_';
import type { GenericResponse_RubricRead_ } from '../models/GenericResponse_RubricRead_';
import type { RubricCreate } from '../models/RubricCreate';
import type { RubricUpdate } from '../models/RubricUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RubricsService {
    /**
     * List Rubrics
     * @returns GenericResponse_list_RubricRead__ Successful Response
     * @throws ApiError
     */
    public static listRubricsRubricsGet(): CancelablePromise<GenericResponse_list_RubricRead__> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/rubrics/',
        });
    }
    /**
     * Create Rubric
     * @param requestBody
     * @returns GenericResponse_RubricRead_ Successful Response
     * @throws ApiError
     */
    public static createRubricRubricsPost(
        requestBody: RubricCreate,
    ): CancelablePromise<GenericResponse_RubricRead_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/rubrics/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Rubric
     * @param rubricId
     * @returns GenericResponse_RubricRead_ Successful Response
     * @throws ApiError
     */
    public static getRubricRubricsRubricIdGet(
        rubricId: string,
    ): CancelablePromise<GenericResponse_RubricRead_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/rubrics/{rubric_id}',
            path: {
                'rubric_id': rubricId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Rubric
     * @param rubricId
     * @param requestBody
     * @returns GenericResponse_RubricRead_ Successful Response
     * @throws ApiError
     */
    public static updateRubricRubricsRubricIdPatch(
        rubricId: string,
        requestBody: RubricUpdate,
    ): CancelablePromise<GenericResponse_RubricRead_> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/rubrics/{rubric_id}',
            path: {
                'rubric_id': rubricId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Rubric
     * @param rubricId
     * @returns GenericResponse Successful Response
     * @throws ApiError
     */
    public static deleteRubricRubricsRubricIdDelete(
        rubricId: string,
    ): CancelablePromise<GenericResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/rubrics/{rubric_id}',
            path: {
                'rubric_id': rubricId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Rubric Balance
     * @param rubricId
     * @returns GenericResponse_RubricBalance_ Successful Response
     * @throws ApiError
     */
    public static getRubricBalanceRubricsRubricIdBalanceGet(
        rubricId: string,
    ): CancelablePromise<GenericResponse_RubricBalance_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/rubrics/{rubric_id}/balance',
            path: {
                'rubric_id': rubricId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
