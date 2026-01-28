import { compatWrapper } from '@backstage/core-compat-api';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';
import { isPulumiAvailableEntityPredicate } from './entityPredicates';

/**
 * Entity Content Tab - Pulumi Activity
 *
 * Configurable via app-config.yaml:
 * - path: defaults to '/pulumi'
 * - title: defaults to 'Pulumi'
 * - filter: entity filter predicate
 *
 * @alpha
 */
export const entityPulumiContent: any = EntityContentBlueprint.make({
  name: 'activity',
  params: {
    path: '/pulumi',
    title: 'Pulumi',
    filter: isPulumiAvailableEntityPredicate,
    async loader() {
      const { PulumiComponent } = await import('../components/PulumiComponent');
      return compatWrapper(<PulumiComponent />);
    },
  },
});
