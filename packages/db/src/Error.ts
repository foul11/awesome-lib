export class ErrorModule extends Error {}

export class ErrorDB extends ErrorModule {}

export class ErrorMigration extends ErrorDB {}
export class ErrorSchema extends ErrorDB {}
export class ErrorQuery extends ErrorDB {}
export class ErrorUnknown extends ErrorDB {}

export class ErrorFlag extends ErrorUnknown {}
export class ErrorFlagPack extends ErrorFlag {}
export class ErrorFlagUnpack extends ErrorFlag {}
export class ErrorFlagInvalid extends ErrorFlag {}