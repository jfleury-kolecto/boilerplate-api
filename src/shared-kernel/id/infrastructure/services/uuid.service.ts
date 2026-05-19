import { v7 } from "uuid";

import type { IdService } from "@/shared-kernel/id/domain/services/id.service";

export class UuidService implements IdService {
	public generateUuidV7(): string {
		return v7();
	}
}
