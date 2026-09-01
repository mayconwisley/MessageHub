import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

/** Documenta corretamente o envelope `{items, total, page, pageSize}` retornado pelas listagens paginadas. */
export function ApiPaginatedResponse<TModel extends Type>(model: TModel) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        properties: {
          items: { type: 'array', items: { $ref: getSchemaPath(model) } },
          total: { type: 'number' },
          page: { type: 'number' },
          pageSize: { type: 'number' },
        },
      },
    }),
  );
}
