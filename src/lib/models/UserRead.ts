/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoleEnum } from './RoleEnum';
export type UserRead = {
    id: string;
    name: string;
    phone?: (string | null);
    role: RoleEnum;
    access_code: (string | null);
    created_at: string;
};

