/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExpenseCreate } from '../models/ExpenseCreate';
import type { GenericResponse_ExpenseRead_ } from '../models/GenericResponse_ExpenseRead_';
import type { GenericResponse_list_ExpenseRead__ } from '../models/GenericResponse_list_ExpenseRead__';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ExpensesService {
    /**
     * Create Expense
     * @param requestBody
     * @returns GenericResponse_ExpenseRead_ Successful Response
     * @throws ApiError
     */
    public static createExpenseExpensesPost(
        requestBody: ExpenseCreate,
    ): CancelablePromise<GenericResponse_ExpenseRead_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/expenses/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Expenses
     * @param rubricId
     * @returns GenericResponse_list_ExpenseRead__ Successful Response
     * @throws ApiError
     */
    public static listExpensesExpensesGet(
        rubricId?: (string | null),
    ): CancelablePromise<GenericResponse_list_ExpenseRead__> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/expenses/',
            query: {
                'rubric_id': rubricId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Expense
     * @param expenseId
     * @returns GenericResponse_ExpenseRead_ Successful Response
     * @throws ApiError
     */
    public static getExpenseExpensesExpenseIdGet(
        expenseId: string,
    ): CancelablePromise<GenericResponse_ExpenseRead_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/expenses/{expense_id}',
            path: {
                'expense_id': expenseId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
