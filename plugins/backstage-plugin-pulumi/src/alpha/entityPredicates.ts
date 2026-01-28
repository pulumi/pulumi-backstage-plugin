import { EntityPredicate } from '@backstage/plugin-catalog-react/alpha';
import {
  PULUMI_PROJECT_SLUG_ANNOTATION,
  PULUMI_ORGA_SLUG_ANNOTATION,
} from '../components/constants';

/**
 * Entity predicate for checking if Pulumi plugin is applicable.
 * Matches entities that have either the project-slug or organization-slug annotation.
 *
 * @alpha
 */
export const isPulumiAvailableEntityPredicate: EntityPredicate = {
  $any: [
    {
      [`metadata.annotations.${PULUMI_PROJECT_SLUG_ANNOTATION}`]: {
        $exists: true,
      },
    },
    {
      [`metadata.annotations.${PULUMI_ORGA_SLUG_ANNOTATION}`]: {
        $exists: true,
      },
    },
  ],
};
