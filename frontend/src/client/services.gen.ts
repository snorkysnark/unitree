// This file is auto-generated by @hey-api/openapi-ts

import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';
import type { GetTreeApiTreeGetData, GetTreeApiTreeGetResponse, InsertTreeApiTreePostData, InsertTreeApiTreePostResponse, GetCountApiTreeCountGetResponse, DeleteNodeApiNodeNodeIdDeleteData, DeleteNodeApiNodeNodeIdDeleteResponse, UpdateNodeApiNodeNodeIdPutData, UpdateNodeApiNodeNodeIdPutResponse } from './types.gen';

/**
 * Get Tree
 * @param data The data for the request.
 * @param data.limit
 * @param data.offset
 * @param data.minDepth
 * @param data.maxDepth
 * @returns NodeOut Successful Response
 * @throws ApiError
 */
export const getTreeApiTreeGet = (data: GetTreeApiTreeGetData): CancelablePromise<GetTreeApiTreeGetResponse> => { return __request(OpenAPI, {
    method: 'GET',
    url: '/api/tree',
    query: {
        limit: data.limit,
        offset: data.offset,
        minDepth: data.minDepth,
        maxDepth: data.maxDepth
    },
    errors: {
        422: 'Validation Error'
    }
}); };

/**
 * Insert Tree
 * @param data The data for the request.
 * @param data.requestBody
 * @param data.insertBefore
 * @returns unknown Successful Response
 * @throws ApiError
 */
export const insertTreeApiTreePost = (data: InsertTreeApiTreePostData): CancelablePromise<InsertTreeApiTreePostResponse> => { return __request(OpenAPI, {
    method: 'POST',
    url: '/api/tree',
    query: {
        insert_before: data.insertBefore
    },
    body: data.requestBody,
    mediaType: 'application/json',
    errors: {
        422: 'Validation Error'
    }
}); };

/**
 * Get Count
 * @returns number Successful Response
 * @throws ApiError
 */
export const getCountApiTreeCountGet = (): CancelablePromise<GetCountApiTreeCountGetResponse> => { return __request(OpenAPI, {
    method: 'GET',
    url: '/api/tree/count'
}); };

/**
 * Delete Node
 * @param data The data for the request.
 * @param data.nodeId
 * @returns unknown Successful Response
 * @throws ApiError
 */
export const deleteNodeApiNodeNodeIdDelete = (data: DeleteNodeApiNodeNodeIdDeleteData): CancelablePromise<DeleteNodeApiNodeNodeIdDeleteResponse> => { return __request(OpenAPI, {
    method: 'DELETE',
    url: '/api/node/{node_id}',
    path: {
        node_id: data.nodeId
    },
    errors: {
        422: 'Validation Error'
    }
}); };

/**
 * Update Node
 * @param data The data for the request.
 * @param data.nodeId
 * @param data.moveBefore
 * @returns unknown Successful Response
 * @throws ApiError
 */
export const updateNodeApiNodeNodeIdPut = (data: UpdateNodeApiNodeNodeIdPutData): CancelablePromise<UpdateNodeApiNodeNodeIdPutResponse> => { return __request(OpenAPI, {
    method: 'PUT',
    url: '/api/node/{node_id}',
    path: {
        node_id: data.nodeId
    },
    query: {
        move_before: data.moveBefore
    },
    errors: {
        422: 'Validation Error'
    }
}); };