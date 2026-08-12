import { Entity, UniqueId } from '@shared/domain';
import { TemplateStatus } from '../enums/template-status.enum';
import { TemplateComponentDefinition } from '../../application/ports/template-provider.interface';

export interface TemplateProps {
  tenantId: UniqueId;
  whatsAppAccountId: UniqueId;
  metaTemplateId: string | null;
  name: string;
  language: string;
  category: string;
  components: TemplateComponentDefinition[];
  parameterFormat: string | null;
  status: TemplateStatus;
  rejectedReason: string | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Template extends Entity<TemplateProps> {
  private constructor(props: TemplateProps, id?: UniqueId) {
    super(props, id);
  }

  static create(
    params: Omit<
      TemplateProps,
      'metaTemplateId' | 'status' | 'rejectedReason' | 'lastError' | 'createdAt' | 'updatedAt'
    >,
    id?: UniqueId,
  ): Template {
    const now = new Date();
    return new Template(
      {
        ...params,
        metaTemplateId: null,
        status: TemplateStatus.DRAFT,
        rejectedReason: null,
        lastError: null,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  static reconstitute(props: TemplateProps, id: UniqueId): Template {
    return new Template(props, id);
  }

  get tenantId(): UniqueId {
    return this.props.tenantId;
  }
  get whatsAppAccountId(): UniqueId {
    return this.props.whatsAppAccountId;
  }
  get metaTemplateId(): string | null {
    return this.props.metaTemplateId;
  }
  get name(): string {
    return this.props.name;
  }
  get language(): string {
    return this.props.language;
  }
  get category(): string {
    return this.props.category;
  }
  get components(): TemplateComponentDefinition[] {
    return this.props.components;
  }
  get parameterFormat(): string | null {
    return this.props.parameterFormat;
  }
  get status(): TemplateStatus {
    return this.props.status;
  }
  get rejectedReason(): string | null {
    return this.props.rejectedReason;
  }
  get lastError(): string | null {
    return this.props.lastError;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateDraft(
    category: string,
    components: TemplateComponentDefinition[],
    parameterFormat?: string,
  ): void {
    this.props.category = category;
    this.props.components = components;
    this.props.parameterFormat = parameterFormat?.trim() || null;
    this.props.lastError = null;
    this.touch();
  }

  applyPublished(metaTemplateId: string, status: string, category?: string): void {
    this.props.metaTemplateId = metaTemplateId;
    this.props.status = Template.toStatus(status);
    this.props.category = category?.trim() || this.props.category;
    this.props.lastError = null;
    this.props.rejectedReason = null;
    this.touch();
  }

  applyMetaSnapshot(snapshot: {
    id: string;
    status: string;
    category: string;
    components: TemplateComponentDefinition[];
    rejectedReason?: string;
  }): void {
    this.props.metaTemplateId = snapshot.id;
    this.props.status = Template.toStatus(snapshot.status);
    this.props.category = snapshot.category;
    this.props.components = snapshot.components;
    this.props.rejectedReason = snapshot.rejectedReason?.trim() || null;
    this.props.lastError = null;
    this.touch();
  }

  applyMetaEdit(
    category: string,
    components: TemplateComponentDefinition[],
    parameterFormat?: string,
  ): void {
    this.updateDraft(category, components, parameterFormat);
    this.props.status = TemplateStatus.PENDING;
  }

  registerPublishFailure(message: string): void {
    this.props.lastError = message;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
  private static toStatus(value: string): TemplateStatus {
    return Object.values(TemplateStatus).includes(value.toUpperCase() as TemplateStatus)
      ? (value.toUpperCase() as TemplateStatus)
      : TemplateStatus.DRAFT;
  }
}
