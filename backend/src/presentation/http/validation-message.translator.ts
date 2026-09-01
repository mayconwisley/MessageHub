import { ValidationError } from '@nestjs/common';

type ConstraintTranslator = (property: string, defaultMessage: string) => string;

function firstNumber(text: string): string {
  const match = text.match(/-?\d+(\.\d+)?/);
  return match ? match[0] : '';
}

/** Traduz para pt-BR as mensagens padrao (em ingles) do class-validator sem depender de `message` customizado em cada decorator. */
const CONSTRAINT_TRANSLATORS: Record<string, ConstraintTranslator> = {
  isDefined: (property) => `${property} deve ser informado.`,
  isNotEmpty: (property) => `${property} não deve estar vazio.`,
  isNotEmptyObject: (property) => `${property} não deve ser um objeto vazio.`,
  isString: (property) => `${property} deve ser um texto.`,
  isBoolean: (property) => `${property} deve ser um valor booleano.`,
  isNumber: (property) => `${property} deve ser um número.`,
  isInt: (property) => `${property} deve ser um número inteiro.`,
  isPositive: (property) => `${property} deve ser um número positivo.`,
  isArray: (property) => `${property} deve ser uma lista.`,
  isObject: (property) => `${property} deve ser um objeto.`,
  isEmail: (property) => `${property} deve ser um e-mail válido.`,
  isUuid: (property) => `${property} deve ser um UUID válido.`,
  isUrl: (property) => `${property} deve ser uma URL válida.`,
  isDateString: (property) => `${property} deve ser uma data válida (ISO 8601).`,
  isEnum: (property) => `${property} deve ser um valor válido.`,
  min: (property, message) => `${property} deve ser maior ou igual a ${firstNumber(message)}.`,
  max: (property, message) => `${property} deve ser menor ou igual a ${firstNumber(message)}.`,
  minLength: (property, message) =>
    `${property} deve ter pelo menos ${firstNumber(message)} caractere(s).`,
  maxLength: (property, message) =>
    `${property} deve ter no máximo ${firstNumber(message)} caractere(s).`,
  arrayMinSize: (property, message) =>
    `${property} deve conter pelo menos ${firstNumber(message)} item(ns).`,
  arrayMaxSize: (property, message) =>
    `${property} deve conter no máximo ${firstNumber(message)} item(ns).`,
};

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

/** Traduz erros do class-validator em detalhes estruturados por campo, prontos para um formulário mapear. */
export function translateValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): ValidationErrorDetail[] {
  const details: ValidationErrorDetail[] = [];
  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    if (error.constraints) {
      for (const [constraint, defaultMessage] of Object.entries(error.constraints)) {
        const translate = CONSTRAINT_TRANSLATORS[constraint];
        details.push({
          field: path,
          message: translate ? translate(path, defaultMessage) : defaultMessage,
        });
      }
    }
    if (error.children?.length) {
      details.push(...translateValidationErrors(error.children, path));
    }
  }
  return details;
}
