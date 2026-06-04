import { openApiSpec } from '../src/docs/openapi.js';
import { pathToFileURL } from 'node:url';

const httpMethods = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);

function extractPathParameterNames(path) {
  return [...path.matchAll(/{([^}]+)}/g)].map((match) => match[1]);
}

function resolveParameter(parameter, spec) {
  if (!parameter?.$ref) {
    return parameter;
  }

  const prefix = '#/components/parameters/';
  if (!parameter.$ref.startsWith(prefix)) {
    return parameter;
  }

  const name = parameter.$ref.slice(prefix.length);
  return spec.components?.parameters?.[name] || parameter;
}

function declaredPathParameterNames(parameters = [], spec) {
  return new Set(
    parameters
      .map((parameter) => resolveParameter(parameter, spec))
      .filter((parameter) => parameter?.in === 'path')
      .map((parameter) => parameter.name)
  );
}

export function validateOpenApiPathParameters(spec) {
  const errors = [];

  if (!/^3\.0\.\d+$/.test(spec.openapi || '')) {
    errors.push(`Unsupported or missing OpenAPI version: ${spec.openapi || 'N/A'}`);
  }

  Object.entries(spec.paths || {}).forEach(([path, pathItem]) => {
    const pathVariables = extractPathParameterNames(path);
    if (pathVariables.length === 0) {
      return;
    }

    const pathLevelNames = declaredPathParameterNames(pathItem.parameters || [], spec);

    Object.entries(pathItem).forEach(([method, operation]) => {
      if (!httpMethods.has(method)) {
        return;
      }

      const operationNames = declaredPathParameterNames(operation.parameters || [], spec);
      pathVariables.forEach((variableName) => {
        if (!pathLevelNames.has(variableName) && !operationNames.has(variableName)) {
          errors.push(`${method.toUpperCase()} ${path}: missing path parameter "${variableName}"`);
        }
      });
    });
  });

  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = validateOpenApiPathParameters(openApiSpec);

  if (errors.length > 0) {
    console.error('OpenAPI validation failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log('OpenAPI path parameter validation passed.');
}
