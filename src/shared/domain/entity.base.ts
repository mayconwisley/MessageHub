import { UniqueId } from './unique-id';

export abstract class Entity<TProps> {
  protected readonly _id: UniqueId;
  protected props: TProps;

  protected constructor(props: TProps, id?: UniqueId) {
    this._id = id ?? UniqueId.create();
    this.props = props;
  }

  get id(): UniqueId {
    return this._id;
  }

  equals(other?: Entity<TProps>): boolean {
    if (!other) return false;
    if (this === other) return true;
    return this._id.equals(other._id);
  }
}
