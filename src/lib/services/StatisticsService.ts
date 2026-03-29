/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GenericResponse_GlobalStats_ } from '../models/GenericResponse_GlobalStats_';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StatisticsService {
    /**
     * Get Global Stats
     * @returns GenericResponse_GlobalStats_ Successful Response
     * @throws ApiError
     */
    public static getGlobalStatsStatsGlobalGet(): CancelablePromise<GenericResponse_GlobalStats_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/stats/global',
        });
    }
}
