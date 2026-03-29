/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InvestmentStatusEnum } from './InvestmentStatusEnum';
export type InvestmentRead = {
    id: string;
    investor_id: string;
    rubric_id: string;
    amount: number;
    bank_receipt_code: string;
    status: InvestmentStatusEnum;
    validation_date: (string | null);
    rejection_reason: (string | null);
    created_at: string;
};

