import { Protegido } from '../entities/Protegido';
import { ProfileResult, ProtegidoRepository } from '../repositories/ProtegidoRepository';

/** E1-02: el guardián solo ve los menores vinculados a su cuenta (RLS). */
export class ListMyProtegidos {
  constructor(private readonly repository: ProtegidoRepository) {}

  execute(): Promise<ProfileResult<Protegido[]>> {
    return this.repository.listMine();
  }
}
