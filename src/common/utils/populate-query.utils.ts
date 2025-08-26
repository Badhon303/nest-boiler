export function getRelations(
  populate: string | string[] | undefined,
  allowedRelations: string[],
): string[] {
  let relationsToPopulate: string[] = [];

  if (!populate) {
    return relationsToPopulate;
  }

  if (typeof populate === 'string' && populate === '*') {
    relationsToPopulate = allowedRelations;
  } else if (Array.isArray(populate)) {
    relationsToPopulate = populate.filter((rel) =>
      allowedRelations.includes(rel),
    );
  } else if (typeof populate === 'string') {
    if (allowedRelations.includes(populate)) {
      relationsToPopulate = [populate];
    }
  }

  return relationsToPopulate;
}
