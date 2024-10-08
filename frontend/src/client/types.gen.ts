// This file is auto-generated by @hey-api/openapi-ts

export type HTTPValidationError = {
    detail?: Array<ValidationError>;
};

export type NodeIn = {
    title: string;
    children: Array<NodeIn>;
};

export type NodeOut = {
    id: number;
    rank: string;
    depth: number;
    title: string | null;
    has_children: boolean;
};

export type ValidationError = {
    loc: Array<(string | number)>;
    msg: string;
    type: string;
};

export type ChildrenOfApiChildrenNodeIdGetData = {
    nodeId: number | 'root';
};

export type ChildrenOfApiChildrenNodeIdGetResponse = Array<NodeOut>;

export type InsertTreeApiTreePostData = {
    insertBefore?: number | 'random' | null;
    requestBody: NodeIn;
};

export type InsertTreeApiTreePostResponse = unknown;

export type $OpenApiTs = {
    '/api/children/{node_id}': {
        get: {
            req: ChildrenOfApiChildrenNodeIdGetData;
            res: {
                /**
                 * Successful Response
                 */
                200: Array<NodeOut>;
                /**
                 * Validation Error
                 */
                422: HTTPValidationError;
            };
        };
    };
    '/api/tree': {
        post: {
            req: InsertTreeApiTreePostData;
            res: {
                /**
                 * Successful Response
                 */
                200: unknown;
                /**
                 * Validation Error
                 */
                422: HTTPValidationError;
            };
        };
    };
};