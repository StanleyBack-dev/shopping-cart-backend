import { HttpStatus } from '@nestjs/common';

export interface AppErrorDefinition<TParams = never> {
  readonly code: string;
  readonly httpStatus: HttpStatus;
  readonly message: string | ((params: TParams) => string);
}
