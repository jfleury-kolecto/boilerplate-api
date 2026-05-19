import { All, applyDecorators, Delete, Get, Head, HttpCode, Options, Patch, Post, Put } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from "@nestjs/swagger";
import type { HttpStatus, Type } from "@nestjs/common";
import type { ApiBodyOptions, ApiParamOptions, ApiQueryOptions } from "@nestjs/swagger";

type TRouteMethod = "ALL" | "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";

interface IApiRouteError {
	description: string;
	status: HttpStatus;
}

interface IApiRouteOptions<TResponse> {
	body?: ApiBodyOptions | Type<unknown>;
	description: string;
	errors?: readonly IApiRouteError[];
	method: TRouteMethod;
	operationId: string;
	params?: readonly ApiParamOptions[];
	path?: string | string[];
	queries?: readonly ApiQueryOptions[];
	response?: Type<TResponse>;
	responseDescription: string;
	status: HttpStatus;
	summary: string;
}

const resolveHttpVerbDecorator = (method: TRouteMethod): ((path?: string | string[]) => MethodDecorator) => {
	switch (method) {
		case "ALL":
			return All;
		case "DELETE":
			return Delete;
		case "GET":
			return Get;
		case "HEAD":
			return Head;
		case "OPTIONS":
			return Options;
		case "PATCH":
			return Patch;
		case "POST":
			return Post;
		case "PUT":
			return Put;
	}
};

export const ApiRoute = <TResponse>(options: IApiRouteOptions<TResponse>): MethodDecorator & ClassDecorator => {
	const decorators: Array<ClassDecorator | MethodDecorator> = [
		resolveHttpVerbDecorator(options.method)(options.path),
		HttpCode(options.status),
		ApiOperation({
			description: options.description,
			operationId: options.operationId,
			summary: options.summary,
		}),
	];

	if (options.params) {
		for (const param of options.params) decorators.push(ApiParam(param));
	}
	if (options.queries) {
		for (const query of options.queries) decorators.push(ApiQuery(query));
	}
	if (options.body !== undefined) {
		decorators.push(ApiBody(typeof options.body === "function" ? { type: options.body } : options.body));
	}

	decorators.push(
		ApiResponse({
			description: options.responseDescription,
			status: options.status,
			...(options.response !== undefined && { type: options.response }),
		}),
	);

	if (options.errors) {
		for (const error of options.errors) {
			decorators.push(ApiResponse({ description: error.description, status: error.status }));
		}
	}

	return applyDecorators(...decorators);
};
