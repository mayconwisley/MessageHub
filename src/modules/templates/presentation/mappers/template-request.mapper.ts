import {
  TemplateComponentDefinition,
  TemplateDefinition,
} from '../../application/ports/template-provider.interface';
import { CreateTemplateRequestDto } from '../dto/create-template-request.dto';
import { TemplateComponentRequestDto } from '../dto/template-component-request.dto';
import { UpdateTemplateRequestDto } from '../dto/update-template-request.dto';

export class TemplateRequestMapper {
  static toCreateDefinition(dto: CreateTemplateRequestDto): TemplateDefinition {
    return {
      name: dto.name,
      language: dto.language,
      category: dto.category,
      components: dto.components.map((component) => this.toComponent(component)),
      parameterFormat: dto.parameterFormat,
    };
  }

  static toUpdateDefinition(
    dto: UpdateTemplateRequestDto,
  ): Omit<TemplateDefinition, 'name' | 'language'> {
    return {
      category: dto.category,
      components: dto.components.map((component) => this.toComponent(component)),
      parameterFormat: dto.parameterFormat,
    };
  }

  private static toComponent(component: TemplateComponentRequestDto): TemplateComponentDefinition {
    return {
      type: component.type,
      format: component.format,
      text: component.text,
      buttons: component.buttons,
      location: component.location,
      example: component.example
        ? {
            headerText: component.example.headerText,
            bodyText: component.example.bodyText?.map((row) => row.values),
          }
        : undefined,
    };
  }
}
